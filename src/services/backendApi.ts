import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage';
import * as mockDB from './mockData';
import type { Book, User, Review, Chat, Message, SearchFilters } from '../types';
import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'revoshelf_auth_token';
const REFRESH_TOKEN_KEY = 'revoshelf_refresh_token';

let currentAccessToken: string | null = null;
let unauthorizedCallback: (() => void) | null = null;
let rateLimitCallback: (() => void) | null = null;

export const setAccessToken = async (token: string | null) => {
  currentAccessToken = token;
  if (token) {
    await safeSetItem(TOKEN_KEY, token);
  } else {
    await safeRemoveItem(TOKEN_KEY);
  }
};

export const getAccessToken = () => currentAccessToken;

export const loadStoredToken = async (): Promise<string | null> => {
  const token = await safeGetItem(TOKEN_KEY);
  currentAccessToken = token;
  return token;
};

export const setOnUnauthorized = (cb: () => void) => {
  unauthorizedCallback = cb;
};

export const setOnRateLimit = (cb: () => void) => {
  rateLimitCallback = cb;
};

const mapListing = (listing: any): Book => {
  if (!listing) return listing;
  const seller = listing.seller || {};
  return {
    ...listing,
    id: listing._id || listing.id,
    status: listing.isSold ? 'sold' : (listing.salePending ? 'pending' : 'active'),
    category: typeof listing.category === 'object' && listing.category !== null
      ? (listing.category.name ? listing.category.name.toLowerCase().replace(/ /g, '-') : '')
      : listing.category,
    sellerId: seller._id || seller.id || listing.sellerId || '',
    sellerName: seller.name || listing.sellerName || '',
    sellerAvatar: seller.avatarUrl || seller.avatar || listing.sellerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    sellerRating: seller.rating || listing.sellerRating || 5.0,
    sellerReviewsCount: seller.reviewsCount || listing.sellerReviewsCount || 0,
    sellerSpamScore: seller.spamScore || 0,
    sellerScamScore: seller.scamScore || 0,
    sellerVerified: seller.isVerified || false,
    college: listing.college || seller.institutionName || seller.college || '',
    metadata: (() => {
      let m = listing.metadata;
      if (typeof m === 'string') {
        try {
          m = JSON.parse(m);
        } catch {
          m = {};
        }
      }
      if (typeof m === 'object' && m !== null && !Array.isArray(m)) {
        const cleanObj: Record<string, any> = {};
        for (const [k, v] of Object.entries(m)) {
          if (!/^\d+$/.test(k)) {
            cleanObj[k] = v;
          }
        }
        return cleanObj;
      }
      return {};
    })(),
    distanceKm: listing.distanceKm,
    isNearMe: listing.isNearMe,
    author: listing.author || listing.authorName || '',
  };
};

const mapUser = (user: any): User => {
  if (!user) return user;
  return {
    ...user,
    id: user._id || user.id,
    college: user.institutionName || user.college || '',
    department: user.academicDetails?.department || user.department || '',
    semester: user.academicDetails?.semester || user.semester || 0,
    avatar: user.avatarUrl || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    rating: user.rating || 5.0,
    reviewsCount: user.reviewsCount || 0,
    joinedDate: user.joinedDate || user.createdAt || new Date().toISOString(),
    addressLine: user.addressLine || '',
    city: user.city || '',
    state: user.state || '',
    pincode: user.pincode || '',
    country: user.country || '',
    coordinates: user.coordinates,
  };
};

function toQueryString(params: Record<string, any>): string {
  const esc = encodeURIComponent;
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return v.map((val) => `${esc(k)}=${esc(val)}`).join('&');
      }
      return `${esc(k)}=${esc(v)}`;
    })
    .join('&');
  return query ? `?${query}` : '';
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!currentAccessToken) {
    currentAccessToken = await safeGetItem(TOKEN_KEY);
  }
  if (currentAccessToken) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let res: Response;
  try {
    res = await fetch(url, config);
  } catch (netErr) {
    throw netErr;
  }

  if (res.status === 401) {
    try {
      const storedRefreshToken = await safeGetItem(REFRESH_TOKEN_KEY);
      const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedRefreshToken ? { 'Authorization': `Bearer ${storedRefreshToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        await setAccessToken(data.accessToken);
        if (data.refreshToken) {
          await safeSetItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        headers.set('Authorization', `Bearer ${data.accessToken}`);
        res = await fetch(url, { ...config, headers });
      } else {
        await setAccessToken(null);
        await safeRemoveItem(REFRESH_TOKEN_KEY);
        if (unauthorizedCallback) unauthorizedCallback();
      }
    } catch {
      await setAccessToken(null);
      if (unauthorizedCallback) unauthorizedCallback();
    }
  }

  if (res.status === 429) {
    if (rateLimitCallback) rateLimitCallback();
  }

  return res;
}

async function get<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = `${API_BASE_URL}${path}${params ? toQueryString(params) : ''}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || `GET ${path} failed with ${res.status}`);
    (error as any).status = res.status;
    (error as any).isHttpError = true;
    throw error;
  }
  return (await res.json()) as T;
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetchWithAuth(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || `POST ${path} failed with ${res.status}`);
    (error as any).status = res.status;
    (error as any).isHttpError = true;
    throw error;
  }
  return (await res.json()) as T;
}

async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetchWithAuth(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || `POST ${path} failed with ${res.status}`);
    (error as any).status = res.status;
    (error as any).isHttpError = true;
    throw error;
  }
  return (await res.json()) as T;
}

async function put<T>(path: string, body: any): Promise<T> {
  const res = await fetchWithAuth(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || `PUT ${path} failed with ${res.status}`);
    (error as any).status = res.status;
    (error as any).isHttpError = true;
    throw error;
  }
  return (await res.json()) as T;
}

async function putFormData<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetchWithAuth(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || `PUT ${path} failed with ${res.status}`);
    (error as any).status = res.status;
    (error as any).isHttpError = true;
    throw error;
  }
  return (await res.json()) as T;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetchWithAuth(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || `DELETE ${path} failed with ${res.status}`);
    (error as any).status = res.status;
    (error as any).isHttpError = true;
    throw error;
  }
  return (await res.json()) as T;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const backendApi = {
  setOnUnauthorized(cb: () => void) {
    setOnUnauthorized(cb);
  },
  setOnRateLimit(cb: () => void) {
    setOnRateLimit(cb);
  },

  // Auth
  async login(email: string, password?: string) {
    const res = await post<{ success: boolean; accessToken: string; refreshToken?: string; user: any }>('/api/auth/login', {
      email,
      password: password || 'password123',
    });
    await setAccessToken(res.accessToken);
    if (res.refreshToken) {
      await safeSetItem(REFRESH_TOKEN_KEY, res.refreshToken);
    }
    return mapUser(res.user);
  },

  async loginWithGoogle(idToken: string) {
    const res = await post<{ success: boolean; accessToken: string; refreshToken?: string; user: any }>('/api/auth/google', {
      idToken,
    });
    await setAccessToken(res.accessToken);
    if (res.refreshToken) {
      await safeSetItem(REFRESH_TOKEN_KEY, res.refreshToken);
    }
    return mapUser(res.user);
  },

  async register(name: string, email: string, password?: string) {
    return post<{ success: boolean; message: string }>('/api/auth/register', {
      name,
      email,
      password: password || 'password123',
    });
  },

  async verifyEmail(token: string, id: string) {
    return get<{ success: boolean; message: string }>('/api/auth/verify-email', { token, id });
  },

  async resendVerification(email: string) {
    return post<{ success: boolean; message: string }>('/api/auth/resend-verification', { email });
  },

  async forgotPassword(email: string) {
    return post<{ success: boolean; message: string }>('/api/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password?: string) {
    return post<{ success: boolean; message: string }>('/api/auth/reset-password', { token, password });
  },

  async logout() {
    try {
      await post('/api/auth/logout', {});
    } catch {
      // ignore
    } finally {
      await setAccessToken(null);
      await safeRemoveItem(REFRESH_TOKEN_KEY);
    }
  },

  // Listings
  async getBooks(filters?: Partial<SearchFilters>): Promise<Book[]> {
    const params: Record<string, string> = {};
    if (filters?.query) params.search = filters.query;
    if (filters?.category && filters.category !== 'all') params.category = filters.category;
    if (filters?.condition && filters.condition.length > 0) params.condition = filters.condition.join(',');
    if (filters?.minPrice && filters.minPrice > 0) params.minPrice = String(filters.minPrice);
    if (filters?.maxPrice && filters.maxPrice < 5000) params.maxPrice = String(filters.maxPrice);
    if (filters?.sort && filters.sort !== 'recent') params.sort = filters.sort;
    if (filters?.nearMe) params.nearMe = String(filters.nearMe);

    return get<{ success: boolean; listings: any[] }>(
      '/api/listings/search',
      params
    ).then((r) => r.listings.map(mapListing)).catch(async (error) => {
      if (error && error.isHttpError) throw error;
      await delay(300);
      let books = mockDB.getStoredBooks();
      if (filters?.category && filters.category !== 'all') {
        books = books.filter(b => b.category === filters.category);
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase();
        books = books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
      }
      return books.filter(b => b.status === 'active' || b.status === 'sold');
    });
  },

  async getBookById(id: string): Promise<Book | null> {
    return get<{ success: boolean; listing: any }>(`/api/listings/${id}`)
      .then((r) => mapListing(r.listing))
      .catch(async (error) => {
        if (error && error.isHttpError) throw error;
        await delay(200);
        return mockDB.getStoredBooks().find(b => b.id === id) || null;
      });
  },

  async createListing(formData: FormData | any): Promise<Book> {
    if (formData instanceof FormData) {
      return postFormData<{ success: boolean; listing: any }>('/api/listings', formData).then((r) => mapListing(r.listing));
    }
    return post<{ success: boolean; listing: any }>('/api/listings', formData).then((r) => mapListing(r.listing));
  },

  async updateListing(id: string, updates: FormData | any): Promise<Book> {
    if (updates instanceof FormData) {
      return putFormData<{ success: boolean; listing: any }>(`/api/listings/${id}`, updates).then((r) => mapListing(r.listing));
    }
    return put<{ success: boolean; listing: any }>(`/api/listings/${id}`, updates).then((r) => mapListing(r.listing));
  },

  async deleteListing(id: string): Promise<boolean> {
    return del<{ success: boolean }>(`/api/listings/${id}`).then((r) => r.success);
  },

  async markAsSold(id: string, buyerId?: string): Promise<Book> {
    return post<{ success: boolean; data: { listing: any } }>(`/api/violations/mark-sold/${id}`, { buyerId })
      .then((r) => mapListing(r.data.listing));
  },

  async confirmReceipt(bookId: string): Promise<any> {
    return post<{ success: boolean }>(`/api/violations/confirm-receipt/${bookId}`, {})
      .then((r) => r);
  },

  async cancelPendingSale(bookId: string): Promise<any> {
    return post<{ success: boolean }>(`/api/violations/cancel-pending/${bookId}`, {})
      .then((r) => r);
  },

  async sendArrivalAlert(chatId: string, userId: string): Promise<Message> {
    const text = '📍 I have arrived at the pickup location!';
    return post<{ success: boolean; message: Message }>('/api/messages', { chatId, text })
      .then((r) => r.message);
  },

  // Users
  async getUserProfile(): Promise<User> {
    return get<{ success: boolean; user: any }>('/api/users/me').then((r) => mapUser(r.user));
  },

  async updateProfile(updates: Partial<User> | FormData): Promise<User> {
    if (updates instanceof FormData) {
      return putFormData<{ success: boolean; user: any }>('/api/users/me', updates).then((r) => mapUser(r.user));
    }
    return put<{ success: boolean; user: any }>('/api/users/me', updates).then((r) => mapUser(r.user));
  },

  async getSellerDetails(id: string): Promise<{ user: User; listings: Book[]; reviews: Review[] }> {
    return get<{ success: boolean; user: any; listings: any[]; reviews: any[] }>(`/api/users/${id}`)
      .then((res) => ({
        user: mapUser(res.user),
        listings: (res.listings || []).map(mapListing),
        reviews: res.reviews || [],
      }))
      .catch(async () => {
        const u = mockDB.SEED_USERS.find(user => user.id === id) || mockDB.SEED_USERS[0];
        const listings = mockDB.SEED_BOOKS.filter(b => b.sellerId === id);
        return { user: u, listings, reviews: [] };
      });
  },

  async addReview(sellerId: string, rating: number, comment: string): Promise<Review> {
    return post<{ success: boolean; review: Review }>(`/api/users/${sellerId}/reviews`, { rating, comment })
      .then((r) => r.review);
  },

  async createReconsiderationTicket(reason: string): Promise<any> {
    return post<any>('/api/users/reconsideration-tickets', { reason });
  },

  async getReconsiderationStatus(): Promise<any> {
    return get<any>('/api/users/reconsideration-tickets/my-status');
  },

  // Wishlist
  async getWishlist(): Promise<string[]> {
    return get<{ success: boolean; wishlist: string[] }>('/api/wishlist')
      .then((r) => r.wishlist)
      .catch(async () => {
        return mockDB.getStoredWishlist();
      });
  },

  async toggleWishlist(bookId: string): Promise<boolean> {
    return post<{ success: boolean; isSaved: boolean }>('/api/wishlist/toggle', { bookId })
      .then((r) => r.isSaved)
      .catch(async () => {
        const wishlist = mockDB.getStoredWishlist();
        const index = wishlist.indexOf(bookId);
        let isSaved = false;
        if (index > -1) {
          wishlist.splice(index, 1);
        } else {
          wishlist.push(bookId);
          isSaved = true;
        }
        mockDB.saveStoredWishlist(wishlist);
        return isSaved;
      });
  },

  // Chat & Messages
  async getChats(userId: string): Promise<Chat[]> {
    return get<{ success: boolean; chats: Chat[] }>('/api/chat')
      .then((r) => r.chats)
      .catch(async () => []);
  },

  async getMessages(chatId: string): Promise<Message[]> {
    return get<{ success: boolean; messages: Message[] }>(`/api/messages/${chatId}`)
      .then((r) => r.messages)
      .catch(async () => []);
  },

  async sendMessage(chatId: string, text: string): Promise<Message> {
    return post<{ success: boolean; message: Message }>('/api/messages', { chatId, text })
      .then((r) => r.message);
  },

  async createOrGetChat(bookId: string): Promise<Chat> {
    return post<{ success: boolean; chat: Chat }>('/api/chat', { bookId })
      .then((r) => r.chat);
  },

  async markChatAsRead(chatId: string): Promise<boolean> {
    return put<{ success: boolean }>(`/api/chat/${chatId}/read`, {})
      .then((r) => r.success)
      .catch(() => true);
  },

  async getUnreadNotificationCount(): Promise<{ unreadCount: number; unreadChatCount: number }> {
    return get<{ success: boolean; unreadCount: number; unreadChatCount: number }>('/api/notifications/unread-count')
      .then((r) => ({ unreadCount: r.unreadCount || 0, unreadChatCount: r.unreadChatCount || 0 }))
      .catch(() => ({ unreadCount: 0, unreadChatCount: 0 }));
  },

  // Dynamic Banners
  async getBanners(): Promise<any[]> {
    return get<{ success: boolean; data: any[] }>('/api/banners')
      .then((r) => r.data || [])
      .catch(() => []);
  },

  // Support
  async submitContactForm(firstName: string, lastName: string, email: string, topic: string, message: string) {
    return post('/api/support/contact-us', { firstName, lastName, email, topic, message });
  },

  async submitSupportTicket(issueType: string, description: string, name?: string, email?: string) {
    return post('/api/support/report-issue', { issueType, description, name, email });
  }
};

export default backendApi;
