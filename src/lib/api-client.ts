import { getDefaultUserForCredentials } from "@/lib/defaultCredentials";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import {
  getProfile,
  createProfile,
  getGaragesList,
  getGarageById,
  getGarageByOwnerId,
  createGarage as createGarageFirestore,
  updateGarage as updateGarageFirestore,
  deleteGarageFirestore,
  toFirestoreGarage,
  uploadGarageImage,
} from "@/lib/firebase-db";

const resolveApiUrl = () => {
  const configured = (import.meta.env.VITE_API_URL || "").trim();
  if (!configured) {
    if (typeof window !== "undefined") {
      const isFrontendLocal = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
      if (isFrontendLocal) {
        return "/api";
      }
    }
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
const SIGNUP_COOLDOWN_KEY = "firebase_signup_cooldown_until";

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

  private async uploadGarageLogo(logoFile: File, userId: string): Promise<string | null> {
    try {
      return await uploadGarageImage(logoFile, userId);
    } catch (err) {
      console.warn("Direct Firebase Storage upload failed (CORS?), skipping logo upload.", err);
      return null;
    }
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

    // Try backend API first if available
    if (this.hasBackendApi && this.backendApiAvailable) {
      const apiResult = await this.request<{ user?: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      if (!apiResult.error) return apiResult;

      const status = Number(apiResult.status || 0);
      const message = String(apiResult.error || "").toLowerCase();
      const isClientValidationError = status >= 400 && status < 500;
      const isKnownRegistrationValidation =
        message.includes("already") ||
        message.includes("exists") ||
        message.includes("registered") ||
        message.includes("invalid") ||
        message.includes("password") ||
        message.includes("email") ||
        message.includes("rate limit") ||
        message.includes("too many requests");

      // Do not double-attempt Firebase Auth for expected backend validation failures.
      if (isClientValidationError || isKnownRegistrationValidation) {
        return apiResult;
      }
    }

    // Firebase Auth fallback (direct client-side)
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const fallbackName = (name || "").trim() || "User";
      await createProfile(userCred.user.uid, { role: "customer", name: fallbackName, full_name: fallbackName });
      return {
        data: {
          user: {
            id: userCred.user.uid,
            email: userCred.user.email || email,
            name: fallbackName,
            role: "customer",
          },
        },
      };
    } catch (err: any) {
      const msg = err?.message || "Registration failed";
      if (/rate limit|too many requests/i.test(msg) && typeof window !== "undefined") {
        localStorage.setItem(SIGNUP_COOLDOWN_KEY, String(Date.now() + 10 * 60 * 1000));
      }
      return { error: msg };
    }
  }

  async login(email: string, password: string, rememberMe = true) {
    const defaultUser = getDefaultUserForCredentials(email, password);
    if (defaultUser) {
      return { data: { user: defaultUser } };
    }

    // Firebase Auth: sign in client-side, then optionally notify backend
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getProfile(userCred.user.uid);
      const role = normalizeRole(profile?.role);
      const name =
        profile?.full_name || profile?.name || (userCred.user.displayName as string) || "User";

      // If backend is available, also create a JWT session cookie
      if (this.hasBackendApi && this.backendApiAvailable) {
        const idToken = await userCred.user.getIdToken();
        await this.request("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, idToken, rememberMe }),
        }).catch(() => { /* non-critical */ });
      }

      return {
        data: {
          user: {
            id: userCred.user.uid,
            email: userCred.user.email || email,
            name,
            role,
          },
        },
      };
    } catch (err: any) {
      return { error: err?.message || "Invalid email or password" };
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch { /* ignore */ }

    if (this.hasBackendApi && this.backendApiAvailable) {
      await this.request("/auth/logout", { method: "POST" }).catch(() => {});
    }

    return { data: { message: "Logged out successfully" } };
  }

  async forgotPassword(email: string) {
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      await sendPasswordResetEmail(auth, email, { url: redirectTo });
      return { data: { success: true } };
    } catch (err: any) {
      return { error: err?.message || "Failed to send reset email" };
    }
  }

  async resetPassword(newPassword: string) {
    const user = auth.currentUser;
    if (!user) {
      return { error: "Not signed in. Sign in again and try resetting password." };
    }
    try {
      await updatePassword(user, newPassword);
      return { data: { success: true } };
    } catch (err: any) {
      return { error: err?.message || "Failed to reset password" };
    }
  }

  async getCurrentUser() {
    const user = auth.currentUser;
    if (!user) {
      return { data: { user: null } };
    }
    const profile = await getProfile(user.uid);
    const role = normalizeRole(profile?.role);
    const name = profile?.full_name || profile?.name || (user.displayName as string) || "User";
    return {
      data: {
        user: {
          id: user.uid,
          email: user.email || "",
          name,
          role,
        },
      },
    };
  }

  async updateProfileApi(data: { name?: string; phone?: string }) {
    return this.request("/auth/update-profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Garage endpoints
  async getGarages() {
    // Try backend API first
    if (this.hasBackendApi && this.backendApiAvailable) {
      const apiResult = await this.request<any[]>("/garages");
      if (!apiResult.error && Array.isArray(apiResult.data)) {
        return { data: apiResult.data };
      }
    }

    // Firestore fallback
    try {
      const list = await getGaragesList();
      return { data: list };
    } catch {
      return { data: [] };
    }
  }

  async getGarage(id: string) {
    if (this.hasBackendApi && this.backendApiAvailable) {
      const apiResult = await this.request<any>(`/garages/${id}`);
      if (!apiResult.error && apiResult.data) {
        return apiResult;
      }
    }

    try {
      const garage = await getGarageById(id);
      return garage ? { data: garage } : { error: "Garage not found" };
    } catch {
      return { error: "Failed to load garage" };
    }
  }

  async getMyGarageApi() {
    const user = auth.currentUser;
    if (!user) return { data: null };

    if (this.hasBackendApi && this.backendApiAvailable) {
      const apiResult = await this.request<any>("/garages/my-garage");
      if (!apiResult.error) return apiResult;
    }

    try {
      const garage = await getGarageByOwnerId(user.uid);
      return { data: garage };
    } catch {
      return { data: null };
    }
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

    // Map camelCase to snake_case for backend

    // Only send the backend-expected fields, mapped from camelCase
    const backendFields: Record<string, string> = {
      name: "garage_name",
      contactPhone: "contact_phone",
      openTime: "open_time",
      description: "description",
      location: "location",
      ownerId: "ownerId"
    };

    Object.entries(backendFields).forEach(([frontendKey, backendKey]) => {
      const value = garageData[frontendKey];
      if (value !== null && value !== undefined) {
        formData.append(backendKey, value.toString());
      }
    });

    return this.uploadRequest("/garages", formData);
  }

  async createGarageWithFallback(
    garageData: Record<string, unknown>,
    logoFile?: File
  ): Promise<ApiResponse<any>> {
    // Try backend API first
    if (this.hasBackendApi && this.backendApiAvailable) {
      const apiResult = await this.createGarage(garageData, logoFile);
      if (!apiResult.error) return apiResult;
    }

    // Firestore fallback
    const user = auth.currentUser;
    if (!user) return { error: "Not signed in" };
    try {
      const payload = toFirestoreGarage({ ...garageData, ownerId: user.uid });
      if (logoFile) {
        const logoUrl = await this.uploadGarageLogo(logoFile, user.uid);
        if (logoUrl) payload.logoUrl = logoUrl;
      }
      const { id } = await createGarageFirestore(payload);
      return { data: { id, ...payload } };
    } catch (err: any) {
      return { error: err?.message || "Failed to create garage" };
    }
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
    // Try backend API first
    if (this.hasBackendApi && this.backendApiAvailable) {
      const apiResult = await this.updateGarage(id, garageData);
      if (!apiResult.error) return apiResult;
    }

    // Firestore fallback
    try {
      const payload = toFirestoreGarage(garageData);
      await updateGarageFirestore(id, payload);
      return { data: { id, ...payload } };
    } catch (err: any) {
      return { error: err?.message || "Failed to update garage" };
    }
  }

  async deleteGarageWithFallback(id: string) {
    // Try backend API first
    if (this.hasBackendApi && this.backendApiAvailable) {
      const apiResult = await this.deleteGarage(id);
      if (!apiResult.error) return apiResult;
    }

    // Firestore fallback
    try {
      await deleteGarageFirestore(id);
      return { data: { id } };
    } catch (err: any) {
      return { error: err?.message || "Failed to delete garage" };
    }
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
