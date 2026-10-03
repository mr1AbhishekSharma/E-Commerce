import { Category, Product, Slide, CartOrder, User, BillingAddress, WishlistItem, Review } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// ─── Catalog APIs ─────────────────────────────────────────────────────────────

export async function getSlides(): Promise<Slide[]> {
  try {
    const res = await fetch(`${API_BASE}/slides/`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching slides:", error);
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories/`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getProducts(
  categorySlugOrOptions?: string | {
    categorySlug?: string;
    search?: string;
    ordering?: string;
    minPrice?: number;
    maxPrice?: number;
  },
  searchParam?: string
): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (typeof categorySlugOrOptions === "object" && categorySlugOrOptions !== null) {
      if (categorySlugOrOptions.categorySlug && categorySlugOrOptions.categorySlug !== "all") {
        params.append("category", categorySlugOrOptions.categorySlug);
      }
      if (categorySlugOrOptions.search) params.append("search", categorySlugOrOptions.search);
      if (categorySlugOrOptions.ordering) params.append("ordering", categorySlugOrOptions.ordering);
      if (categorySlugOrOptions.minPrice !== undefined && categorySlugOrOptions.minPrice !== null) {
        params.append("min_price", categorySlugOrOptions.minPrice.toString());
      }
      if (categorySlugOrOptions.maxPrice !== undefined && categorySlugOrOptions.maxPrice !== null) {
        params.append("max_price", categorySlugOrOptions.maxPrice.toString());
      }
    } else {
      if (categorySlugOrOptions && categorySlugOrOptions !== "all") {
        params.append("category", categorySlugOrOptions);
      }
      if (searchParam) params.append("search", searchParam);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/products/${query}`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}/`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// ─── Auth APIs ────────────────────────────────────────────────────────────────

export async function loginUser(
  emailOrUsername: string,
  password: string,
  asAdmin: boolean = false
): Promise<{ access: string; refresh: string; error?: string; is_verified?: boolean; is_admin?: boolean; email?: string; user?: User }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailOrUsername,
        username: emailOrUsername,
        password,
        as_admin: asAdmin,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        access: "",
        refresh: "",
        error: data.detail || (Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : (data.email ? data.email[0] : "Invalid credentials")),
        is_verified: data.is_verified !== false,
        is_admin: Boolean(data.is_admin),
        email: data.email || (emailOrUsername.includes("@") ? emailOrUsername : ""),
      };
    }
    const isAdmin = Boolean(
      data.is_admin || data.user?.is_staff || data.user?.is_superuser
    );
    return {
      ...data,
      is_admin: isAdmin,
    };
  } catch (error) {
    return { access: "", refresh: "", error: "Failed to connect to authentication service" };
  }
}

export async function registerUser(username: string, email: string, password: string): Promise<{
  access?: string;
  refresh?: string;
  user?: User;
  error?: string;
  message?: string;
  requires_verification?: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const firstErr = Object.values(data)[0];
      return { error: Array.isArray(firstErr) ? firstErr[0] : (data.detail || "Registration failed") };
    }
    return data;
  } catch (error) {
    return { error: "Network error during registration" };
  }
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/verify-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Verification failed or token expired" };
    }
    return { success: true, message: data.message || "Account verified successfully!" };
  } catch (error) {
    return { success: false, error: "Network error during verification" };
  }
}

export async function resendVerification(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/resend-verification/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Failed to resend verification email" };
    }
    return { success: true, message: data.message || "Verification link sent!" };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

export async function getCurrentUser(token: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/user/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

// ─── Cart APIs ────────────────────────────────────────────────────────────────

export async function getBackendCart(token: string): Promise<CartOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/cart/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function addBackendCartItem(token: string, slug: string): Promise<CartOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/cart/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function updateBackendCartItem(token: string, slug: string, action: "increase" | "decrease"): Promise<CartOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/cart/update/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ slug, action }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function removeBackendCartItem(token: string, slug: string): Promise<CartOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/cart/remove/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function syncBackendCart(token: string, items: { slug: string; quantity: number }[]): Promise<CartOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/cart/sync/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export async function applyBackendCoupon(token: string, code: string): Promise<{ order?: CartOrder; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/coupon/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Failed to apply coupon" };
    return { order: data };
  } catch (error) {
    return { error: "Network error" };
  }
}

// ─── Checkout & Payment APIs ──────────────────────────────────────────────────

export async function submitCheckout(token: string, address: BillingAddress): Promise<{ order?: CartOrder; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/checkout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(address),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Checkout submission failed" };
    return { order: data };
  } catch (error) {
    return { error: "Network error" };
  }
}

export async function submitPayment(token: string, stripeToken: string = "tok_visa"): Promise<{ order?: CartOrder; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/payment/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stripeToken }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Payment processing failed" };
    return data;
  } catch (error) {
    return { error: "Network error" };
  }
}

export interface RazorpayOrderResponse {
  razorpay_order_id?: string;
  amount?: number;
  display_amount?: number;
  currency?: string;
  key_id?: string;
  business_name?: string;
  order_ref?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  error?: string;
}

export interface RazorpayVerifyResponse {
  success?: boolean;
  message?: string;
  payment_id?: string;
  order?: CartOrder;
  error?: string;
}

export async function createRazorpayOrder(
  token: string,
  currency: string = "INR"
): Promise<RazorpayOrderResponse> {
  try {
    const res = await fetch(`${API_BASE}/razorpay/create-order/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currency }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Failed to initialize Razorpay order" };
    return data;
  } catch (error) {
    return { error: "Network error connecting to payment gateway" };
  }
}

export async function verifyRazorpayPayment(
  token: string,
  payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
  }
): Promise<RazorpayVerifyResponse> {
  try {
    const res = await fetch(`${API_BASE}/razorpay/verify-payment/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Razorpay signature verification failed" };
    return data;
  } catch (error) {
    return { error: "Network error while verifying payment" };
  }
}

export async function getUserOrders(token: string): Promise<CartOrder[]> {
  try {
    const res = await fetch(`${API_BASE}/orders/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export async function submitRefundRequest(token: string, ref_code: string, reason: string, email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/refunds/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ref_code, reason, email }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || "Failed to submit refund request" };
    return { success: true };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

export async function updateUserProfile(
  token: string,
  data: { first_name?: string; last_name?: string; email?: string; phone?: string; gender?: string; date_of_birth?: string }
): Promise<{ user?: User; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) return { error: resData.detail || "Failed to update profile" };
    return { user: resData };
  } catch (error) {
    return { error: "Network error updating profile" };
  }
}

export async function getUserAddresses(token: string, type?: "B" | "S"): Promise<BillingAddress[]> {
  try {
    const query = type ? `?type=${type}` : "";
    const res = await fetch(`${API_BASE}/addresses/${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export async function createUserAddress(token: string, address: BillingAddress): Promise<{ address?: BillingAddress; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/addresses/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(address),
    });
    const data = await res.json();
    if (!res.ok) return { error: Object.values(data)[0] as string || "Failed to save address" };
    return { address: data };
  } catch (error) {
    return { error: "Network error saving address" };
  }
}

export async function updateUserAddress(token: string, id: number, address: Partial<BillingAddress>): Promise<{ address?: BillingAddress; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/addresses/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(address),
    });
    const data = await res.json();
    if (!res.ok) return { error: "Failed to update address" };
    return { address: data };
  } catch (error) {
    return { error: "Network error updating address" };
  }
}

export async function deleteUserAddress(token: string, id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/addresses/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (error) {
    return false;
  }
}

// ─── Wishlist APIs ────────────────────────────────────────────────────────────

export async function getWishlist(token: string): Promise<WishlistItem[]> {
  try {
    const res = await fetch(`${API_BASE}/wishlist/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export async function toggleWishlistApi(
  token: string,
  slug: string
): Promise<{ status: "added" | "removed"; message: string; wishlist_item?: WishlistItem; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/wishlist/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ slug }),
    });
    const data = await res.json();
    if (!res.ok) return { status: "removed", message: data.error || "Failed", error: data.error };
    return data;
  } catch (error) {
    return { status: "removed", message: "Network error", error: "Network error" };
  }
}

export async function removeFromWishlistApi(token: string, slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/wishlist/${slug}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (error) {
    return false;
  }
}

// ─── Product Reviews APIs ─────────────────────────────────────────────────────

export async function getProductReviews(
  slug: string
): Promise<{ product_slug: string; average_rating: number; review_count: number; reviews: Review[] }> {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}/reviews/`, { cache: "no-store" });
    if (!res.ok) return { product_slug: slug, average_rating: 5.0, review_count: 0, reviews: [] };
    return await res.json();
  } catch (error) {
    return { product_slug: slug, average_rating: 5.0, review_count: 0, reviews: [] };
  }
}

export async function submitProductReview(
  token: string,
  slug: string,
  data: { rating: number; headline: string; comment: string }
): Promise<{ review?: Review; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}/reviews/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) return { error: resData.error || "Failed to submit review" };
    return resData;
  } catch (error) {
    return { error: "Network error submitting review" };
  }
}

export function formatMediaUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.png";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `http://127.0.0.1:8000${url.startsWith("/") ? "" : "/"}${url}`;
}

