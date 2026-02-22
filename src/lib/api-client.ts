import { supabase } from "@/lib/supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Request failed" };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || "Network error" };
    }
  }

  private async uploadRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Upload failed" };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || "Network error" };
    }
  }

  // Auth endpoints
  async register(name: string, email: string, password: string) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  // Garage endpoints
  async getGarages() {
    const apiResult = await this.request<any[]>("/garages");
    if (!apiResult.error && Array.isArray(apiResult.data)) {
      return { data: apiResult.data };
    }

    const { data: supabaseData, error: supabaseError } = await supabase
      .from("garages")
      .select("*")
      .order("created_at", { ascending: false });

    if (!supabaseError && Array.isArray(supabaseData)) {
      return { data: supabaseData };
    }

    return apiResult.error ? apiResult : { data: apiResult.data ?? [] };
  }

  async getGarage(id: string) {
    const apiResult = await this.request<any>(`/garages/${id}`);
    if (!apiResult.error && apiResult.data) {
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
      name: "name",
      logoUrl: "logo_url",
      openTime: "open_time",
      contactPhone: "contact_phone",
      addressCountry: "address_country",
      addressState: "address_state",
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
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "tracking_id, name, email, phone, vehicle, service_date, time, total, status, created_at, user_id"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return { error: error.message || "Failed to fetch bookings" };
    }

    return { data: data || [] };
  }

  async updateBookingStatus(trackingId: string, status: string) {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("tracking_id", trackingId)
      .select()
      .maybeSingle();

    if (error) {
      return { error: error.message || "Failed to update booking status" };
    }

    return { data };
  }

  async updateGarageWithFallback(id: string, garageData: Record<string, unknown>) {
    const apiResult = await this.updateGarage(id, garageData);
    if (!apiResult.error) {
      return apiResult;
    }

    const columnMap: Record<string, string> = {
      name: "name",
      openTime: "open_time",
      contactPhone: "contact_phone",
      addressCountry: "address_country",
      addressState: "address_state",
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
    let query = supabase
      .from("bookings")
      .select("tracking_id, name, email, phone, vehicle, service_date, time, total, status, created_at")
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return { error: error.message || "Failed to fetch bookings" };
    }

    return { data: (data || []) as any[] };
  }

  async getGarageAnalytics(garageId: string) {
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("total, status, created_at")
      .order("created_at", { ascending: false });

    if (bookingError) {
      return { error: bookingError.message || "Failed to fetch analytics" };
    }

    const bookings = (bookingData || []) as any[];
    const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
    const completedCount = bookings.filter((b) => b.status === "completed").length;
    const pendingCount = bookings.filter((b) => b.status === "pending").length;

    return {
      data: {
        totalRevenue,
        totalBookings: bookings.length,
        completedBookings: completedCount,
        pendingBookings: pendingCount,
        cancellations: bookings.filter((b) => b.status === "cancelled").length,
        averageOrderValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
      },
    };
  }
}

export const api = new ApiClient(API_URL);
