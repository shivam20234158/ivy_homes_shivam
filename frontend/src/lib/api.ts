// Client-side API service communicating via Next.js proxy

export interface User {
  email: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_url: string;
  user: User;
}

export interface Listing {
  listing_id: string;
  listing_url: string;
  website: string;
  city_id: number;
  apartment_name: string;
  locality: string;
  property_type: string;
  bedroom: number;
  bathroom: number;
  balcony: number;
  floor: number;
  total_floors: number;
  furnishing: string;
  facing_direction: string;
  covered_parking: number;
  price: number;
  carpet_area: number;
  super_built_up_area?: number;
  latitude: number;
  longitude: number;
  posted_by: string;
  posted_by_name: string;
  posted_by_contact: string;
  project_id?: string | null;
  description: string;
  posted_at: string;
  is_verified: boolean;
  is_live: boolean;
}

export interface Rental {
  listing_id: string;
  listing_url: string;
  website: string;
  city_id: number;
  title?: string;
  apartment_name: string;
  locality: string;
  property_type: string;
  bedroom: number;
  bathroom: number;
  floor: number;
  total_floors: number;
  furnishing: string;
  facing_direction: string;
  price: number;
  deposit: number;
  maintenance?: number;
  carpet_area: number;
  super_builtup_area?: number;
  latitude: number;
  longitude: number;
  posted_by: string;
  posted_by_name: string;
  posted_by_contact: string;
  description: string;
  posted_at: string;
}

export interface Project {
  project_id: string;
  project_url: string;
  city_id: number;
  apartment_name: string;
  developer_name: string;
  locality: string;
  project_status: string;
  total_units: number;
  total_towers: number;
  total_floors: number;
  launch_date: string;
  possession_date: string;
  rera_number: string;
  min_area_sqft: number;
  max_area_sqft: number;
  total_listings: number;
  price_min: number;
  price_max: number;
  amenities: string[];
  latitude: number;
  longitude: number;
}

export interface PaginatedResponse<T> {
  limit: number;
  offset: number;
  count: number;
  total: number;
  has_more: boolean;
  results: T[];
}

const TOKEN_KEY = "ivy_access_token";
const REFRESH_TOKEN_KEY = "ivy_refresh_token";
const EXPIRY_KEY = "ivy_token_expiry";
const USER_KEY = "ivy_user";

class ApiService {
  private refreshPromise: Promise<string | null> | null = null;

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const str = localStorage.getItem(USER_KEY);
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  setSession(data: AuthResponse) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    const expiresAt = Date.now() + (data.expires_in - 60) * 1000;
    localStorage.setItem(EXPIRY_KEY, expiresAt.toString());
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isTokenExpired(): boolean {
    if (typeof window === "undefined") return true;
    const expiryStr = localStorage.getItem(EXPIRY_KEY);
    if (!expiryStr) return true;
    return Date.now() > parseInt(expiryStr, 10);
  }

  async ensureValidToken(): Promise<string | null> {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    if (!token || !refreshToken) return null;

    if (!this.isTokenExpired()) {
      return token;
    }

    // Deduplicate refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch("/api/proxy/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) {
          this.clearSession();
          return null;
        }

        const data: AuthResponse = await res.json();
        this.setSession(data);
        return data.access_token;
      } catch {
        this.clearSession();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.ensureValidToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let res = await fetch(url, { ...options, headers });

    // Handle 401: try refreshing token once
    if (res.status === 401 && this.getRefreshToken()) {
      const refreshedToken = await this.refreshTokenManual();
      if (refreshedToken) {
        headers.set("Authorization", `Bearer ${refreshedToken}`);
        res = await fetch(url, { ...options, headers });
      }
    }

    return res;
  }

  private async refreshTokenManual(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch("/api/proxy/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        this.clearSession();
        return null;
      }

      const data: AuthResponse = await res.json();
      this.setSession(data);
      return data.access_token;
    } catch {
      this.clearSession();
      return null;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch("/api/proxy/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }

    const data: AuthResponse = await res.json();
    this.setSession(data);
    return data;
  }

  async logout(): Promise<void> {
    const token = this.getAccessToken();
    if (token) {
      try {
        await fetch("/api/proxy/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Stateless logout, ignore network error
      }
    }
    this.clearSession();
  }

  // Listings API
  async getListings(params: {
    offset?: number;
    limit?: number;
    locality?: string;
    bhk?: number | string;
    property_type?: string;
    sort_by?: string;
    order?: string;
  }): Promise<PaginatedResponse<Listing>> {
    const query = new URLSearchParams();
    if (params.offset !== undefined) query.set("offset", params.offset.toString());
    if (params.limit !== undefined) query.set("limit", params.limit.toString());
    if (params.locality) query.set("locality", params.locality);
    if (params.bhk) query.set("bhk", params.bhk.toString());
    if (params.property_type) query.set("property_type", params.property_type);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.order) query.set("order", params.order);

    const res = await this.fetchWithAuth(`/api/proxy/v1/listings?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to fetch listings" }));
      throw new Error(err.detail || "Failed to fetch listings");
    }
    return res.json();
  }

  async getListingDetail(id: string): Promise<Listing> {
    const res = await this.fetchWithAuth(`/api/proxy/v1/listings/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Listing not found" }));
      throw new Error(err.detail || "Listing not found");
    }
    return res.json();
  }

  // Saved Listings (Favourites)
  async getSaved(): Promise<{ count: number; results: Listing[] }> {
    const res = await this.fetchWithAuth("/api/proxy/v1/saved");
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to fetch saved listings" }));
      throw new Error(err.detail || "Failed to fetch saved listings");
    }
    return res.json();
  }

  async saveListing(listingId: string): Promise<void> {
    const res = await this.fetchWithAuth("/api/proxy/v1/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to save listing" }));
      throw new Error(err.detail || "Failed to save listing");
    }
  }

  async removeSaved(listingId: string): Promise<void> {
    const res = await this.fetchWithAuth(`/api/proxy/v1/saved/${listingId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to remove saved listing" }));
      throw new Error(err.detail || "Failed to remove saved listing");
    }
  }

  // Rentals API
  async getRentals(params: {
    offset?: number;
    limit?: number;
    locality?: string;
    bhk?: number | string;
    sort_by?: string;
    order?: string;
  }): Promise<PaginatedResponse<Rental>> {
    const query = new URLSearchParams();
    if (params.offset !== undefined) query.set("offset", params.offset.toString());
    if (params.limit !== undefined) query.set("limit", params.limit.toString());
    if (params.locality) query.set("locality", params.locality);
    if (params.bhk) query.set("bhk", params.bhk.toString());
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.order) query.set("order", params.order);

    const res = await this.fetchWithAuth(`/api/proxy/v1/rentals?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to fetch rentals" }));
      throw new Error(err.detail || "Failed to fetch rentals");
    }
    return res.json();
  }

  async getRentalDetail(id: string): Promise<Rental> {
    const res = await this.fetchWithAuth(`/api/proxy/v1/rentals/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Rental not found" }));
      throw new Error(err.detail || "Rental not found");
    }
    return res.json();
  }

  // Projects API
  async getProjects(params: {
    offset?: number;
    limit?: number;
    locality?: string;
    project_status?: string;
    sort_by?: string;
    order?: string;
  }): Promise<PaginatedResponse<Project>> {
    const query = new URLSearchParams();
    if (params.offset !== undefined) query.set("offset", params.offset.toString());
    if (params.limit !== undefined) query.set("limit", params.limit.toString());
    if (params.locality) query.set("locality", params.locality);
    if (params.project_status) query.set("project_status", params.project_status);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.order) query.set("order", params.order);

    const res = await this.fetchWithAuth(`/api/proxy/v1/projects?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to fetch projects" }));
      throw new Error(err.detail || "Failed to fetch projects");
    }
    return res.json();
  }

  async getProjectDetail(id: string): Promise<Project> {
    const res = await this.fetchWithAuth(`/api/proxy/v1/projects/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Project not found" }));
      throw new Error(err.detail || "Project not found");
    }
    return res.json();
  }
}

export const api = new ApiService();
