import { supabase } from "@/lib/supabaseClient";
import { getDefaultUserForCredentials } from "@/lib/defaultCredentials";

const resolveApiUrl = () => {
  const configured = (import.meta.env.VITE_API_URL || "").trim();
  if (!configured) {
    return "";
  }

  const normalized = configured.replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const isFrontendLocal = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    const isDirectLocalBackend = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/api)?$/i.test(normalized);

    if (isFrontendLocal && isDirectLocalBackend) {
      return "/api";
    }
  }

  return normalized;
};

const API_URL = resolveApiUrl();
const SIGNUP_COOLDOWN_KEY = "supabase_signup_cooldown_until";

const normalizeRole = (value?: string | null) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "manager") return "manager";
  if (normalized === "staff") return "staff";
  if (normalized === "customer") return "customer";
  if (normalized === "mechanic") return "staff";
  if (normalized === "user") return "customer";
  return "customer";
};

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}

type RegisterOptions = {
  autoLogin?: boolean;
};

class ApiClient {
  private baseUrl: string;
  private hasBackendApi: boolean;
  private backendApiAvailable: boolean;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.hasBackendApi = Boolean(baseUrl);
    this.backendApiAvailable = Boolean(baseUrl);
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (!this.hasBackendApi || !this.backendApiAvailable) {
      return {
        status: 503,
        error: "Backend API is not configured. Set VITE_API_URL to enable server routes.",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const raw = await response.text();
      let data: any = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { message: raw };
        }
      }

      if (!response.ok) {
        if (response.status === 503 || response.status === 502) {
          this.backendApiAvailable = false;
        }

        return {
          status: response.status,
          error:
            data.error ||
            data.message ||
            `Request failed (${response.status})`,
        };
      }

      return { data, status: response.status };
    } catch (error: any) {
      this.backendApiAvailable = false;
      return { error: error.message || "Network error" };
    }
  }

  private isNetworkFailure(error?: string) {
    const message = String(error || "").toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("network error") ||
      message.includes("load failed")
    );
  }

  private shouldUseSupabaseFallback(result: ApiResponse<any>) {
    if (!result.error) return false;
    if (result.status === 502 || result.status === 503) return true;
    return this.isNetworkFailure(result.error);
  }

  private async uploadRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    if (!this.hasBackendApi || !this.backendApiAvailable) {
      return {
        status: 503,
        error: "Backend API is not configured. Set VITE_API_URL to enable server routes.",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 503 || response.status === 502) {
          this.backendApiAvailable = false;
        }
        return { error: data.error || "Upload failed" };
      }

      return { data };
    } catch (error: any) {
      this.backendApiAvailable = false;
      return { error: error.message || "Network error" };
    }
  }

  private async uploadGarageLogoToSupabase(logoFile: File, userId: string): Promise<string | null> {
    const safeName = logoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("garage-images")
      .upload(filePath, logoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return null;
    }

    const { data } = supabase.storage.from("garage-images").getPublicUrl(filePath);
    return data?.publicUrl || null;
  }

  // Auth endpoints
  async register(name: string, email: string, password: string, options: RegisterOptions = {}) {
    const shouldAutoLogin = options.autoLogin !== false;
    const cooldownUntil =
      typeof window !== "undefined"
        ? Number(localStorage.getItem(SIGNUP_COOLDOWN_KEY) || "0")
        : 0;

    if (cooldownUntil > Date.now()) {
      return {
        error: "Signup is temporarily paused due to rate limit. Please try again in a few minutes.",
      };
    }

    const { data: previousSessionData } = await supabase.auth.getSession();
    const previousSession = previousSessionData.session;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (signUpError || !signUpData.user) {
      const errorMessage = (signUpError?.message || "").toLowerCase();
      const statusCode = String((signUpError as { status?: number } | null)?.status || "");
      const isRateLimited =
        errorMessage.includes("rate limit") ||
        errorMessage.includes("too many requests") ||
        statusCode === "429";

      if (isRateLimited && typeof window !== "undefined") {
        const cooldownMs = 10 * 60 * 1000;
        localStorage.setItem(SIGNUP_COOLDOWN_KEY, String(Date.now() + cooldownMs));
      }

      if (
        isRateLimited ||
        errorMessage.includes("user already registered") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("password")
      ) {
        return { error: signUpError?.message || "Registration failed" };
      }

      if (!shouldAutoLogin) {
        return { error: signUpError?.message || "Registration failed" };
      }

      const apiResult = await this.request<{ user?: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      return apiResult.error
        ? { error: signUpError?.message || apiResult.error || "Registration failed" }
        : apiResult;
    }

    const fallbackName = (name || signUpData.user.user_metadata?.name || "User").trim() || "User";
    const fallbackRole = "customer";

    await supabase.from("profiles").upsert(
      {
        id: signUpData.user.id,
        role: fallbackRole,
        name: fallbackName,
        full_name: fallbackName,
      },
      { onConflict: "id" }
    );

    if (!shouldAutoLogin) {
      if (previousSession?.access_token && previousSession?.refresh_token) {
        await supabase.auth.setSession({
          access_token: previousSession.access_token,
          refresh_token: previousSession.refresh_token,
        });
      } else {
        await supabase.auth.signOut();
      }
    } else if (!signUpData.session) {
      await supabase.auth.signInWithPassword({ email, password });
    }

    return {
      data: {
        user: {
          id: signUpData.user.id,
          email: signUpData.user.email || email,
          name: fallbackName,
          role: fallbackRole,
        },
      },
    };
  }

  async login(email: string, password: string, rememberMe = true) {
    const defaultUser = getDefaultUserForCredentials(email, password);
    if (defaultUser) {
      return {
        data: {
          user: defaultUser,
        },
      };
    }

    if (!this.hasBackendApi) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return { error: authError?.message || "Invalid email or password" };
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name, full_name")
        .eq("id", authData.user.id)
        .maybeSingle();

      const role = normalizeRole(profile?.role);
      const name =
        (profile?.full_name as string | undefined) ||
        (profile?.name as string | undefined) ||
        (authData.user.user_metadata?.name as string | undefined) ||
        "User";

      return {
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email || email,
            name,
            role,
          },
        },
      };
    }

    const apiResult = await this.request<{ user?: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (!apiResult.error) {
      return apiResult;
    }

    const shouldTryDirectSupabase =
      this.isNetworkFailure(apiResult.error) || apiResult.status === 503;

    if (!shouldTryDirectSupabase) {
      return apiResult;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { error: apiResult.error || authError?.message || "Invalid email or password" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, name, full_name")
      .eq("id", authData.user.id)
      .maybeSingle();

    const role = normalizeRole(profile?.role);
    const name =
      (profile?.full_name as string | undefined) ||
      (profile?.name as string | undefined) ||
      (authData.user.user_metadata?.name as string | undefined) ||
      "User";

    return {
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email || email,
          name,
          role,
        },
      },
    };
  }

  async logout() {
    if (!this.hasBackendApi) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message || "Logout failed" };
      }
      return { data: { message: "Logged out successfully" } };
    }

    const apiResult = await this.request("/auth/logout", { method: "POST" });

    if (!apiResult.error || !this.isNetworkFailure(apiResult.error)) {
      return apiResult;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message || apiResult.error || "Logout failed" };
    }

    return { data: { message: "Logged out successfully" } };
  }

  async forgotPassword(email: string) {
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return { error: error.message || "Failed to send reset email" };
    }

    return { data: { success: true } };
  }

  async resetPassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error: error.message || "Failed to reset password" };
    }

    return { data: { success: true } };
  }

  async getCurrentUser() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!sessionError) {
      if (!session?.user) {
        return { data: { user: null } };
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name, full_name")
        .eq("id", session.user.id)
        .maybeSingle();

      const role = normalizeRole(profile?.role);
      const name =
        (profile?.full_name as string | undefined) ||
        (profile?.name as string | undefined) ||
        (session.user.user_metadata?.name as string | undefined) ||
        "User";

      return {
        data: {
          user: {
            id: session.user.id,
            email: session.user.email || "",
            name,
            role,
          },
        },
      };
    }

    const apiResult = await this.request<{ user?: any }>("/auth/me");

    if (!apiResult.error || !this.isNetworkFailure(apiResult.error)) {
      return apiResult;
    }

    if (!session?.user) {
      return { data: { user: null } };
    }

    return { data: { user: null } };
  }

  async updateProfileApi(data: { name?: string; phone?: string }) {
    return this.request("/auth/update-profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Garage endpoints
  async getGarages() {
    const apiResult = await this.request<any[]>("/garages");
    if (!apiResult.error && Array.isArray(apiResult.data)) {
      return { data: apiResult.data };
    }

    if (!this.shouldUseSupabaseFallback(apiResult)) {
      return apiResult;
    }

    const { data: supabaseData, error: supabaseError } = await supabase
      .from("garages")
      .select("*")
      .order("created_at", { ascending: false });

    if (!supabaseError && Array.isArray(supabaseData)) {
      return { data: supabaseData };
    }

    return apiResult.error ? apiResult : { data: [] };
  }

  async getGarage(id: string) {
    const apiResult = await this.request<any>(`/garages/${id}`);
    if (!apiResult.error && apiResult.data) {
      return apiResult;
    }

    if (!this.shouldUseSupabaseFallback(apiResult)) {
      return apiResult;
    }

    const { data: supabaseData, error: supabaseError } = await supabase
      .from("garages")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!supabaseError && supabaseData) {
      return { data: supabaseData };
    }

    return apiResult;
  }

  async getMyGarageApi() {
    const loadFromSupabase = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        return { data: null };
      }

      const { data, error } = await supabase
        .from("garages")
        .select("*")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (error) {
        return { error: error.message || "Failed to load garage" };
      }

      return { data };
    };

    const supabaseResult = await loadFromSupabase();
    if (!supabaseResult.error) {
      return supabaseResult;
    }

    if (!this.hasBackendApi || !this.backendApiAvailable) {
      return supabaseResult;
    }

    const apiResult = await this.request<any>("/garages/my-garage");
    return apiResult.error ? supabaseResult : apiResult;
  }

  async addGarageStaffApi(userId: string, garageId: string) {
    return this.request("/staff/garage-staff", {
      method: "POST",
      body: JSON.stringify({ userId, garageId }),
    });
  }

  async removeGarageStaffApi(userId: string, garageId: string) {
    const encodedUserId = encodeURIComponent(userId);
    const encodedGarageId = encodeURIComponent(garageId);
    return this.request(`/staff/garage-staff/${encodedUserId}?garageId=${encodedGarageId}`, {
      method: "DELETE",
    });
  }

  async getGarageStaffApi(garageId: string) {
    return this.request<any[]>(`/staff/garage-staff/${garageId}`);
  }

  async createGarage(garageData: any, logoFile?: File) {
    const formData = new FormData();

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    // Add all other fields to formData
    Object.entries(garageData).forEach(([key, value]: [string, any]) => {
      if (value !== null && value !== undefined && key !== "logoFile") {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.uploadRequest("/garages", formData);
  }

  async createGarageWithFallback(
    garageData: Record<string, unknown>,
    logoFile?: File
  ): Promise<ApiResponse<any>> {
    const apiResult = await this.createGarage(garageData, logoFile);
    if (!apiResult.error) {
      return apiResult;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return apiResult;
    }

    const columnMap: Record<string, string> = {
      ownerId: "owner_id",
      name: "garage_name",
      garage_name: "garage_name",
      operatorEmail: "email_id",
      operatorPassword: "password",
      logoUrl: "logo_url",
      openTime: "open_time",
      contactPhone: "contact_phone",
      addressCountry: "address_country",
      addressState: "location",
      location: "location",
      addressStreet: "address_street",
      services: "services",
      mechanicsCount: "mechanics_count",
      serviceImageUrl: "service_image_url",
      mapUrl: "map_url",
      carRepairTypes: "car_repair_types",
      sinceYear: "since_year",
      sellsSecondHand: "sells_second_hand",
      problemsSolvedCount: "problems_solved_count",
      paymentMethods: "payment_methods",
      description: "description",
    };

    const insertPayload = Object.entries(garageData).reduce<Record<string, unknown>>((acc, [key, value]) => {
      const mappedKey = columnMap[key];
      if (mappedKey !== undefined && value !== undefined) {
        acc[mappedKey] = value;
      }
      return acc;
    }, {});

    insertPayload.owner_id = session.user.id;

    if (logoFile) {
      const logoPublicUrl = await this.uploadGarageLogoToSupabase(logoFile, session.user.id);
      if (logoPublicUrl) {
        insertPayload.logo_url = logoPublicUrl;
      }
    }

    const { data, error } = await supabase
      .from("garages")
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if (error) {
      return { error: apiResult.error || error.message || "Failed to create garage" };
    }

    return { data };
  }

  async updateGarage(id: string, garageData: any, logoFile?: File) {
    const formData = new FormData();

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    Object.entries(garageData).forEach(([key, value]: [string, any]) => {
      if (value !== null && value !== undefined && key !== "logoFile") {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    try {
      const response = await fetch(`${this.baseUrl}/garages/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Update failed" };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || "Network error" };
    }
  }

  async deleteGarage(id: string) {
    return this.request(`/garages/${id}`, { method: "DELETE" });
  }

  async getAdminBookings() {
    return this.request<any[]>("/bookings/admin");
  }

  async updateBookingStatus(trackingId: string, status: string) {
    return this.request(`/bookings/status/${trackingId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async updateGarageWithFallback(id: string, garageData: Record<string, unknown>) {
    const apiResult = await this.updateGarage(id, garageData);
    if (!apiResult.error) {
      return apiResult;
    }

    const columnMap: Record<string, string> = {
      name: "garage_name",
      garage_name: "garage_name",
      operatorEmail: "email_id",
      operatorPassword: "password",
      openTime: "open_time",
      contactPhone: "contact_phone",
      addressCountry: "address_country",
      addressState: "location",
      location: "location",
      addressStreet: "address_street",
      mechanicsCount: "mechanics_count",
      serviceImageUrl: "service_image_url",
      mapUrl: "map_url",
      sinceYear: "since_year",
      sellsSecondHand: "sells_second_hand",
      problemsSolvedCount: "problems_solved_count",
      description: "description",
    };

    const updatePayload = Object.entries(garageData).reduce<Record<string, unknown>>((acc, [key, value]) => {
      const mappedKey = columnMap[key];
      if (mappedKey !== undefined) {
        acc[mappedKey] = value;
      }
      return acc;
    }, {});

    if (Object.keys(updatePayload).length === 0) {
      return { error: apiResult.error || "No updatable fields provided" };
    }

    const { data, error } = await supabase
      .from("garages")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return { error: apiResult.error || error.message || "Failed to update garage" };
    }

    return { data };
  }

  async deleteGarageWithFallback(id: string) {
    const apiResult = await this.deleteGarage(id);
    if (!apiResult.error) {
      return apiResult;
    }

    const { error } = await supabase.from("garages").delete().eq("id", id);

    if (error) {
      return { error: apiResult.error || error.message || "Failed to delete garage" };
    }

    return { data: { id } };
  }

  async getGarageBookings(garageId?: string) {
    // For now, reuse regular bookings or if we have a specific endpoint /bookings/garage/:id
    return this.request<any[]>("/bookings/admin");
  }

  async getGarageAnalytics(garageId: string) {
    const result = await this.getAdminBookings();

    if (result.error || !result.data) {
      return { error: result.error || "Failed to fetch analytics" };
    }

    const bookings = result.data;
    const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (Number(b.total) || 0), 0);
    const completedCount = bookings.filter((b: any) => b.status === "completed").length;
    const pendingCount = bookings.filter((b: any) => b.status === "pending").length;

    return {
      data: {
        totalRevenue,
        totalBookings: bookings.length,
        completedBookings: completedCount,
        pendingBookings: pendingCount,
        cancellations: bookings.filter((b: any) => b.status === "cancelled").length,
        averageOrderValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
      },
    };
  }

  // New Booking API methods
  async createBookingApi(input: any) {
    return this.request("/bookings", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getBookingByTrackingIdApi(trackingId: string) {
    return this.request(`/bookings/track/${trackingId}`);
  }

  async getMyBookingsApi() {
    return this.request<any[]>("/bookings/my-bookings");
  }

  async getAdminBookingsApi() {
    return this.request<any[]>("/bookings/admin");
  }

  async getUsersApi() {
    return this.request<any[]>("/auth/users");
  }

  async updateUserRoleApi(id: string, role: string) {
    return this.request(`/auth/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  }

  async createWorkOrderApi(data: any) {
    return this.request("/staff/work-orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getWorkOrdersApi(includeAll = true) {
    const suffix = includeAll ? "?all=1" : "";
    return this.request<any[]>(`/staff/work-orders${suffix}`);
  }

  async updateBookingStatusApi(trackingId: string, status: string) {
    return this.request(`/bookings/status/${trackingId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
}

export const api = new ApiClient(API_URL);
