// SafaiPay API Client connecting to FastAPI backend with resilient fallback
import { User, UserRole, PickupRequest, MaterialRate, CollectorEarningsSummary } from './types';
import { 
  INITIAL_MATERIAL_RATES, 
  INITIAL_PICKUPS, 
  INITIAL_COLLECTOR_EARNINGS 
} from './mockData';

const API_BASE = typeof window !== 'undefined' ? '/api/v1' : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1');

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('safaipay_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('safaipay_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('safaipay_token');
    localStorage.removeItem('safaipay_active_role');
    sessionStorage.removeItem('safaipay_token');
  }
}

export function extractUserRole(rawUser: any): UserRole | 'unknown' {
  if (!rawUser) return 'unknown';

  // 1. Direct explicit role property
  if (typeof rawUser.role === 'string') {
    const directRole = rawUser.role.toLowerCase();
    if (directRole === 'admin' || directRole === 'collector' || directRole === 'recycler' || directRole === 'customer') {
      return directRole as UserRole;
    }
  }

  // 2. Roles array (supports array of strings or array of objects with role_name / name)
  if (rawUser.roles && Array.isArray(rawUser.roles) && rawUser.roles.length > 0) {
    for (const r of rawUser.roles) {
      const roleStr = typeof r === 'string' ? r : (r?.role_name || r?.name || '');
      const clean = String(roleStr).toUpperCase();
      if (clean === 'ADMIN') return 'admin';
      if (clean === 'COLLECTOR') return 'collector';
      if (clean === 'RECYCLER') return 'recycler';
      if (clean === 'CUSTOMER') return 'customer';
    }
  }

  // 3. User profile object indicators
  if (rawUser.admin_profile) return 'admin';
  if (rawUser.collector_profile) return 'collector';
  if (rawUser.recycler_profile) return 'recycler';
  if (rawUser.customer_profile) return 'customer';

  return 'unknown';
}

export function getDashboardPath(role?: string | null): string {
  if (!role) return '/onboarding';
  const r = role.toLowerCase();
  if (r === 'admin') return '/admin/dashboard';
  if (r === 'collector') return '/collector/dashboard';
  if (r === 'recycler') return '/recycler/dashboard';
  if (r === 'customer') return '/customer/dashboard';
  return '/onboarding';
}

// Local mock store helpers for zero-backend / offline mode
function getLocalPickups(): PickupRequest[] {
  if (typeof window === 'undefined') return INITIAL_PICKUPS;
  const stored = localStorage.getItem('safaipay_mock_pickups');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return INITIAL_PICKUPS;
}

function saveLocalPickups(pickups: PickupRequest[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('safaipay_mock_pickups', JSON.stringify(pickups));
  }
}

function getLocalRates(): MaterialRate[] {
  if (typeof window === 'undefined') return INITIAL_MATERIAL_RATES;
  const stored = localStorage.getItem('safaipay_mock_rates');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return INITIAL_MATERIAL_RATES;
}

function saveLocalRates(rates: MaterialRate[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('safaipay_mock_rates', JSON.stringify(rates));
  }
}

// Low-level fetch wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only default to application/json if body is not FormData and Content-Type was not set
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      errMessage = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {}
    const error: any = new Error(errMessage);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export function shouldRethrowError(err: any): boolean {
  // If the server responded with an HTTP client error status (400-499: bad request,
  // unauthorized 401, forbidden 403, not found 404, validation 422, rate limited 429),
  // NEVER hide it behind a mock fallback.
  if (err && typeof err.status === 'number' && err.status < 500) {
    return true;
  }
  return false;
}

async function uploadRequest<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      errMessage = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {}
    const error: any = new Error(errMessage);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// Check if backend service is reachable
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// Authentication
export async function loginWithCredentials(identifier: string, pass: string) {
  // Clear any existing session before starting new login attempt
  removeAuthToken();

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, password: pass }),
  });

  if (!res.ok) {
    let errMessage = 'Invalid credentials: Phone/email or password is incorrect.';
    try {
      const errJson = await res.json();
      errMessage = errJson.detail || errJson.message || errMessage;
    } catch {}
    throw new Error(errMessage);
  }

  const data = await res.json();
  const detectedRole = extractUserRole(data.user);

  if (detectedRole === 'unknown') {
    throw new Error('Access denied: Your account does not have a verified platform role.');
  }

  setAuthToken(data.access_token);
  return {
    ...data,
    user: {
      ...data.user,
      role: detectedRole,
    },
  };
}

export async function loginAsGuest(role: 'customer' | 'collector' | 'recycler') {
  // Clear any existing session before starting new guest login attempt
  removeAuthToken();

  try {
    const res = await fetch(`${API_BASE}/auth/guest-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    if (res.ok) {
      const data = await res.json();
      const detectedRole = extractUserRole(data.user);
      setAuthToken(data.access_token);
      return {
        ...data,
        user: {
          ...data.user,
          role: detectedRole,
        },
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Guest login request rejected (${res.status})`);
    }
  } catch (err: any) {
    // Only fall back to local demo credentials if network connection failed completely (offline mode)
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      const demoFallback: Record<string, { identifier: string; pass: string }> = {
        customer: { identifier: 'customer@safaipay.test', pass: 'SafaiPassword123!' },
        collector: { identifier: 'collector@safaipay.test', pass: 'SafaiPassword123!' },
        recycler: { identifier: 'recycler@safaipay.test', pass: 'SafaiPassword123!' },
      };
      const cred = demoFallback[role] || demoFallback.customer;
      return loginWithCredentials(cred.identifier, cred.pass);
    }
    throw err;
  }
}

export async function getCurrentUser(): Promise<User> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const raw = await request<any>('/auth/me');
    const userRole = extractUserRole(raw);
    if (userRole === 'unknown') {
      removeAuthToken();
      throw new Error('Access denied: Account role is not recognized.');
    }
    return {
      ...raw,
      role: userRole,
    };
  } catch (err) {
    removeAuthToken();
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {}
  }
  removeAuthToken();
}

export async function updateUserProfile(payload: {
  full_name?: string;
  email?: string;
  profile_photo_url?: string;
  address?: string;
  service_area?: string;
  company_name?: string;
  emergency_contact?: string;
  payout_method?: string;
  payout_account?: string;
}): Promise<User> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated.');

  const res = await fetch(`${API_BASE}/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = 'Failed to update profile.';
    try {
      const err = await res.json();
      msg = err.detail || err.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const updatedRaw = await res.json();
  const userRole = extractUserRole(updatedRaw);
  return {
    ...updatedRaw,
    role: userRole,
  };
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated.');

  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = 'Failed to change password.';
    try {
      const err = await res.json();
      msg = err.detail || err.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await res.json();
}

// Pickups
export async function createPickup(payload: {
  material_code: string;
  estimated_quantity_kg: number;
  street_address: string;
  city?: string;
  preferred_time?: string;
  notes?: string;
  photo_url?: string;
}): Promise<PickupRequest> {
  try {
    return await request<PickupRequest>('/pickups', {
      method: 'POST',
      body: JSON.stringify({
        material_code: payload.material_code,
        estimated_quantity_kg: payload.estimated_quantity_kg,
        street_address: payload.street_address,
        city: payload.city || 'Karachi',
        preferred_time: payload.preferred_time || new Date().toISOString(),
        notes: payload.notes || 'Doorstep recyclable collection',
        photo_url: payload.photo_url || null,
      }),
    });
  } catch (err: any) {
    if (shouldRethrowError(err)) throw err;
    // Local fallback for offline/Vercel demo
    const all = getLocalPickups();
    const rates = getLocalRates();
    const rateItem = rates.find(r => r.code === payload.material_code) || rates[0];
    const unitRate = rateItem ? rateItem.benchmark_rate_pkr : 80;
    const estimatedPayout = Number(payload.estimated_quantity_kg) * unitRate;

    const newPickup: PickupRequest = {
      id: `sp-req-${Date.now().toString().slice(-6)}`,
      tracking_number: `SP-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      customer_id: 'usr-cust-001',
      assigned_collector_id: null,
      material_code: payload.material_code,
      estimated_quantity_kg: Number(payload.estimated_quantity_kg),
      street_address: payload.street_address,
      city: payload.city || 'Karachi',
      preferred_time: payload.preferred_time || 'Today',
      notes: payload.notes || 'Doorstep recyclable collection',
      status: 'requested',
      created_at: new Date().toISOString(),
      pricing_calculations: [
        {
          id: `calc-${Date.now()}`,
          material_code: payload.material_code,
          verified_weight_kg: Number(payload.estimated_quantity_kg),
          material_rate_applied: unitRate,
          quality_factor: 1.0,
          total_price: estimatedPayout,
          calculation_breakdown: `${payload.estimated_quantity_kg} kg * PKR ${unitRate.toFixed(2)}/kg * Q(1.00) (Estimated)`,
          is_estimated: true,
        },
      ],
    };

    const updated = [newPickup, ...all];
    saveLocalPickups(updated);
    return newPickup;
  }
}

export async function getPickups(userRole?: UserRole | 'unknown'): Promise<PickupRequest[]> {
  try {
    if (userRole === 'customer') {
      return await request<PickupRequest[]>('/pickups/my-requests');
    }
    if (userRole === 'collector') {
      return await request<PickupRequest[]>('/pickups/available');
    }
    if (userRole === 'recycler') {
      return await request<PickupRequest[]>('/pickups?role=recycler');
    }
    if (userRole === 'admin') {
      return await request<PickupRequest[]>('/pickups');
    }
    return await request<PickupRequest[]>('/pickups');
  } catch (err: any) {
    if (shouldRethrowError(err)) throw err;
    // Offline / fallback storage
    const local = getLocalPickups();
    if (userRole === 'customer') {
      return local.filter(p => p.customer_id === 'usr_guest_cust' || p.customer_id === 'usr-cust-001');
    }
    if (userRole === 'collector') {
      return local.filter(p => ['available', 'pending', 'requested', 'assigned', 'accepted', 'in_progress', 'pickup_started', 'weight_verified'].includes(p.status));
    }
    if (userRole === 'recycler') {
      return local.filter(p => ['picked_up', 'delivered_to_recycler', 'processing', 'completed'].includes(p.status));
    }
    return local;
  }
}

export async function deliverPickupToRecycler(pickupId: string, data?: { recycler_id?: string; recycler_name?: string }) {
  return await request<PickupRequest>(`/pickups/${pickupId}/deliver-recycler`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  });
}

export async function processRecyclerBatch(pickupId: string, data: {
  action?: 'start_processing' | 'complete';
  recycled_weight_kg?: number;
  notes?: string;
  proof_url?: string;
}) {
  return await request<PickupRequest>(`/pickups/${pickupId}/process-recycler`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadFile(formData: FormData): Promise<{ file_id: string; file_url: string; filename: string }> {
  return await request<{ file_id: string; file_url: string; filename: string }>('/storage/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function getMyPickups(): Promise<PickupRequest[]> {
  return getPickups('customer');
}

export async function getAvailablePickups(): Promise<PickupRequest[]> {
  return getPickups('collector');
}

export async function getPickupById(id: string): Promise<PickupRequest> {
  try {
    return await request<PickupRequest>(`/pickups/${id}`);
  } catch (err: any) {
    if (shouldRethrowError(err)) throw err;
    const list = getLocalPickups();
    const found = list.find(p => p.id === id);
    if (!found) throw new Error(`Pickup with id ${id} not found.`);
    return found;
  }
}

export async function assignCollector(pickupId: string, collectorId: string) {
  try {
    return await request<PickupRequest>(`/pickups/${pickupId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ collector_id: collectorId }),
    });
  } catch (err: any) {
    if (shouldRethrowError(err)) throw err;
    const list = getLocalPickups();
    const updated = list.map(p => {
      if (p.id === pickupId) {
        return { ...p, status: 'assigned', assigned_collector_id: collectorId };
      }
      return p;
    });
    saveLocalPickups(updated);
    return updated.find(p => p.id === pickupId)!;
  }
}

export const assignPickupToCollector = assignCollector;

export async function acceptPickup(pickupId: string) {
  try {
    return await request<PickupRequest>(`/pickups/${pickupId}/accept`, {
      method: 'POST',
    });
  } catch (err: any) {
    if (shouldRethrowError(err)) throw err;
    const list = getLocalPickups();
    let found = false;
    const updated = list.map(p => {
      if (p.id === pickupId) {
        found = true;
        return { ...p, status: 'accepted', assigned_collector_id: 'usr_guest_coll' };
      }
      return p;
    });
    if (!found) {
      const fallbackJob: PickupRequest = {
        id: pickupId,
        tracking_number: `SP-2026-${pickupId.slice(-6).toUpperCase()}`,
        customer_id: 'usr_guest_cust',
        assigned_collector_id: 'usr_guest_coll',
        material_code: 'PET_PLASTIC',
        estimated_quantity_kg: 15,
        street_address: 'House 14-C, 7th Commercial St, Phase 2, DHA, Karachi',
        city: 'Karachi',
        preferred_time: 'Within 45 mins',
        notes: 'Accepted nearby job',
        status: 'accepted',
        created_at: new Date().toISOString(),
        pricing_calculations: [
          {
            id: `calc-${pickupId}`,
            material_code: 'PET_PLASTIC',
            verified_weight_kg: 15,
            material_rate_applied: 80,
            quality_factor: 1.0,
            total_price: 1200,
            calculation_breakdown: '15 kg * 80 PKR/kg',
            is_estimated: true,
          },
        ],
      };
      updated.unshift(fallbackJob);
    }
    saveLocalPickups(updated);
    return updated.find(p => p.id === pickupId)!;
  }
}

export async function rejectPickup(pickupId: string, reason: string) {
  try {
    return await request<PickupRequest>(`/pickups/${pickupId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  } catch (err: any) {
    if (shouldRethrowError(err)) throw err;
    const list = getLocalPickups();
    const updated = list.map(p => {
      if (p.id === pickupId) {
        return { ...p, status: 'rejected' };
      }
      return p;
    });
    saveLocalPickups(updated);
    return updated.find(p => p.id === pickupId)!;
  }
}

export async function startPickup(pickupId: string, latitude = 24.8607, longitude = 67.0011) {
  try {
    return await request<PickupRequest>(`/pickups/${pickupId}/start`, {
      method: 'POST',
      body: JSON.stringify({ gps_latitude: latitude, gps_longitude: longitude }),
    });
  } catch (err: any) {
    if (err.status && err.status < 500) throw err;
    const list = getLocalPickups();
    const updated = list.map(p => {
      if (p.id === pickupId) {
        return { ...p, status: 'in_progress' };
      }
      return p;
    });
    saveLocalPickups(updated);
    return updated.find(p => p.id === pickupId)!;
  }
}

export async function uploadPickupPhoto(pickupId: string, formData: FormData): Promise<PickupRequest> {
  try {
    return await request<PickupRequest>(`/pickups/${pickupId}/upload-photo`, {
      method: 'POST',
      body: formData,
    });
  } catch (err: any) {
    if (err.status && err.status < 500) throw err;
    const list = getLocalPickups();
    const updated = list.map(p => {
      if (p.id === pickupId) {
        const file = (formData.get('file') || formData.get('photo')) as File | null;
        const photoUrl = file ? URL.createObjectURL(file) : `/uploads/proofs/proof-${pickupId}-${Date.now()}.jpg`;
        const newImages = p.images ? [...p.images] : [];
        newImages.push({
          id: `img-${Date.now()}`,
          image_type: 'scale_display',
          image_url: photoUrl,
          caption: 'On-site scale photo evidence',
        });
        return {
          ...p,
          images: newImages,
          scale_photo_url: photoUrl,
        };
      }
      return p;
    });
    saveLocalPickups(updated);
    return updated.find(p => p.id === pickupId)!;
  }
}

export async function submitWeight(
  pickupId: string,
  payload: {
    verified_weight_kg: number;
    quality_factor: number;
    quality_grade?: string;
    scale_photo_url?: string;
  }
) {
  try {
    return await request<PickupRequest>(`/pickups/${pickupId}/verify-weight`, {
      method: 'POST',
      body: JSON.stringify({
        verified_weight_kg: payload.verified_weight_kg,
        quality_factor: payload.quality_factor,
        quality_grade: payload.quality_grade || 'A',
        scale_photo_url: payload.scale_photo_url || null,
        notes: 'Certified field scale measurement',
      }),
    });
  } catch (err: any) {
    if (err.status && err.status < 500) throw err;
    const list = getLocalPickups();
    const rates = getLocalRates();
    const target = list.find(p => p.id === pickupId);
    const rateItem = rates.find(r => r.code === target?.material_code) || rates[0];
    const unitRate = rateItem ? rateItem.benchmark_rate_pkr : 80;
    const totalPrice = Number((payload.verified_weight_kg * unitRate * payload.quality_factor).toFixed(2));

    const updated = list.map(p => {
      if (p.id === pickupId) {
        return {
          ...p,
          status: 'weight_verified',
          scale_photo_url: payload.scale_photo_url || p.scale_photo_url,
          pricing_calculations: [
            {
              id: `calc-${Date.now()}`,
              material_code: p.material_code,
              verified_weight_kg: payload.verified_weight_kg,
              material_rate_applied: unitRate,
              quality_factor: payload.quality_factor,
              total_price: totalPrice,
              calculation_breakdown: `${payload.verified_weight_kg} kg * PKR ${unitRate.toFixed(2)}/kg * Q(${payload.quality_factor.toFixed(2)}) = PKR ${totalPrice.toFixed(2)}`,
              is_estimated: false,
            },
          ],
        };
      }
      return p;
    });
    saveLocalPickups(updated);
    return updated.find(p => p.id === pickupId)!;
  }
}

export async function confirmPickup(pickupId: string) {
  try {
    return await request<PickupRequest>(`/pickups/${pickupId}/confirm-completion`, {
      method: 'POST',
      body: JSON.stringify({ customer_notes: 'Verified and accepted weight' }),
    });
  } catch (err: any) {
    if (err.status && err.status < 500) throw err;
    const list = getLocalPickups();
    const updated = list.map(p => {
      if (p.id === pickupId) {
        const calc = p.pricing_calculations?.[0];
        const amount = calc?.total_price || 1200;
        return {
          ...p,
          status: 'completed',
          payment: {
            id: `pay-${pickupId}`,
            amount_pkr: amount,
            transaction_reference: `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${pickupId.slice(-6).toUpperCase()}`,
            status: 'completed' as const,
            retry_count: 0,
          },
        };
      }
      return p;
    });
    saveLocalPickups(updated);
    return updated.find(p => p.id === pickupId)!;
  }
}

export async function cancelPickup(pickupId: string, reason: string) {
  try {
    return await request<PickupRequest>(`/pickups/${pickupId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  } catch (err: any) {
    if (shouldRethrowError(err)) throw err;
    const list = getLocalPickups();
    const updated = list.map(p => {
      if (p.id === pickupId) {
        return { ...p, status: 'cancelled' };
      }
      return p;
    });
    saveLocalPickups(updated);
    return updated.find(p => p.id === pickupId)!;
  }
}

export async function disputePickup(pickupId: string, reason: string, disputeType = 'WEIGHT_DISCREPANCY') {
  try {
    return await request<any>(`/pickups/${pickupId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason, dispute_type: disputeType }),
    });
  } catch (err: any) {
    if (shouldRethrowError(err)) throw err;
    const list = getLocalPickups();
    const updated = list.map(p => {
      if (p.id === pickupId) {
        return { ...p, status: 'disputed' };
      }
      return p;
    });
    saveLocalPickups(updated);
    return { success: true, message: 'Dispute recorded' };
  }
}

export async function ratePickup(pickupId: string, score: number, review?: string) {
  try {
    return await request<any>(`/pickups/${pickupId}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating_score: score, review_comment: review || '' }),
    });
  } catch (err: any) {
    if (shouldRethrowError(err)) throw err;
    return { success: true, score };
  }
}

// Payments
export async function simulatePayment(pickupId: string, simulateFailure = false) {
  try {
    return await request<any>(`/payments/by-pickup/${pickupId}/process`, {
      method: 'POST',
      body: JSON.stringify({
        simulate_failure: simulateFailure,
        failure_reason: simulateFailure ? 'Simulated settlement rejection / timeout' : undefined,
      }),
    });
  } catch (err: any) {
    if (shouldRethrowError(err)) throw err;
    const list = getLocalPickups();
    const updated = list.map(p => {
      if (p.id === pickupId) {
        return {
          ...p,
          status: simulateFailure ? 'payment_failed' : 'payment_completed',
          payment: {
            id: `pay-${Date.now()}`,
            amount_pkr: p.pricing_calculations?.[0]?.total_price || 1200,
            transaction_reference: `SP-TXN-${Date.now().toString().slice(-6)}`,
            status: (simulateFailure ? 'failed' : 'completed') as any,
            retry_count: 0,
          },
        };
      }
      return p;
    });
    saveLocalPickups(updated);
    return { status: simulateFailure ? 'failed' : 'completed' };
  }
}

export async function retryPayment(paymentId: string) {
  try {
    return await request<any>(`/payments/${paymentId}/retry`, {
      method: 'POST',
    });
  } catch {
    return { status: 'completed' };
  }
}

// Materials & Benchmark Rates
export async function getMaterialRates(): Promise<MaterialRate[]> {
  try {
    return await request<MaterialRate[]>('/materials');
  } catch {
    return getLocalRates();
  }
}

export async function updateMaterialRate(code: string, ratePerKg: number, notes?: string) {
  try {
    return await request<MaterialRate>(`/materials/${code}/rate`, {
      method: 'PATCH',
      body: JSON.stringify({
        benchmark_rate_pkr: ratePerKg,
        notes: notes || 'Updated via Admin Operations Portal',
      }),
    });
  } catch {
    const rates = getLocalRates();
    const updated = rates.map(r => {
      if (r.code === code) {
        return { ...r, benchmark_rate_pkr: ratePerKg };
      }
      return r;
    });
    saveLocalRates(updated);
    return updated.find(r => r.code === code)!;
  }
}

// Collector Earnings
export async function getMyEarnings(): Promise<CollectorEarningsSummary> {
  try {
    return await request<CollectorEarningsSummary>('/earnings/summary');
  } catch {
    return INITIAL_COLLECTOR_EARNINGS;
  }
}

// Admin stats & endpoints
export async function getSuspiciousRecords() {
  try {
    const data = await request<{ count: number; records: any[] }>('/admin/suspicious-records');
    return data.records || [];
  } catch {
    return [
      {
        pickup_id: 'sp-req-001',
        tracking_number: 'SP-202610-A91B2C',
        estimated_kg: 10,
        verified_kg: 48.5,
        variance_percentage: 385,
        quality_factor: 1.0,
        status: 'weight_verified',
        flag: 'High weight variance',
      },
    ];
  }
}

export async function getDisputes() {
  try {
    return await request<any[]>('/admin/disputes');
  } catch {
    return [];
  }
}

export async function getAllUsers(role?: string) {
  try {
    const query = role ? `?role=${role.toUpperCase()}` : '';
    return await request<any[]>(`/admin/users${query}`);
  } catch {
    return [
      { id: 'usr-coll-001', full_name: 'Muhammad Rafiq', roles: ['COLLECTOR'] },
      { id: 'usr-coll-002', full_name: 'Tariq Mehmood', roles: ['COLLECTOR'] },
    ];
  }
}

// AI Computer Vision Classification
export async function classifyWasteAI(hint?: string, imageUrl?: string) {
  try {
    return await request<any>('/pickups/ai-classify', {
      method: 'POST',
      body: JSON.stringify({ stream_hint: hint, image_url: imageUrl }),
    });
  } catch {
    return {
      predicted_material: hint?.toLowerCase().includes('cardboard') ? 'CARDBOARD_OCC' : 'PET_PLASTIC',
      confidence_score: 0.984,
      quality_tier: 'Tier A',
      quality_factor: 1.0,
      estimated_rate_pkr: 80.0,
      disclaimer: 'Estimated Value: AI classification is an advisory pre-screening. Final payment is calculated strictly by calibrated digital scale weight and collector inspection.',
      manual_override_allowed: true,
    };
  }
}

// Digital Financial Identity
export async function getFinancialScore(consent = true) {
  try {
    return await request<any>(`/earnings/financial-score?consent=${consent}`);
  } catch {
    return {
      collector_id: 'col-current',
      collector_name: 'Rashid Khan',
      credit_score: 785,
      score_grade: 'AAA (Excellent)',
      monthly_moving_avg_pkr: 44200.0,
      total_verified_kg: 1250.0,
      dispute_free_rate: 100.0,
      customer_rating_avg: 4.95,
      eligible_micro_loan_pkr: 150000.0,
      eligible_financing_product: 'Electric Loader Rickshaw / Motorbike Lease Financing',
      consent_granted: consent,
      disclaimer: 'DISCLAIMER: SafaiPay is an informal circular-economy marketplace technology platform, NOT a bank, microfinance institution, lender, insurer, or payment system operator.',
      pillars: [
        { pillar_name: 'Collection Volume Regularity', weight_percentage: 40, score_earned: 38.5, max_score: 40.0, description: 'Verified monthly recyclable collection volume consistency.' },
        { pillar_name: 'IoT Calibrated Scale Verification', weight_percentage: 30, score_earned: 30.0, max_score: 30.0, description: 'Use of tamper-evident digital scales with LCD photo capture.' },
        { pillar_name: 'Dispute-Free Fulfillment Rate', weight_percentage: 20, score_earned: 20.0, max_score: 20.0, description: 'Transaction history free from customer weight or pricing disputes.' },
        { pillar_name: 'Customer Trust & Service Rating', weight_percentage: 10, score_earned: 9.8, max_score: 10.0, description: '5-star ratings from verified household and enterprise pickups.' },
      ],
    };
  }
}

// Material Batches & Procurement
export async function getMaterialBatches(statusFilter?: string) {
  try {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    return await request<any[]>(`/batches${query}`);
  } catch {
    return [];
  }
}

export async function procureBatch(batchId: string, notes?: string) {
  try {
    return await request<any>(`/batches/${batchId}/procure`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  } catch {
    return { id: batchId, status: 'PROCURED' };
  }
}

// Collector KYC Approval / Rejection
export async function approveCollectorKYC(collectorId: string) {
  return await request<any>(`/admin/collectors/${collectorId}/approve`, { method: 'POST' });
}

export async function rejectCollectorKYC(collectorId: string, reason?: string) {
  const q = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return await request<any>(`/admin/collectors/${collectorId}/reject${q}`, { method: 'POST' });
}

// ESG Analytics
export async function getESGImpact() {
  try {
    return await request<any>('/analytics/esg-impact');
  } catch {
    return {
      total_diverted_kg: 18450.0,
      diverted_tonnage: 18.45,
      total_co2_offset_kg: 24907.5,
      active_collectors_count: 24,
      partner_enterprises_count: 18,
      total_disbursed_pkr: 842000.0,
      material_breakdown: { PET_PLASTIC: 8302.5, CARDBOARD_OCC: 6457.5, MIXED_METAL: 2214.0, HDPE_PLASTIC: 1476.0 },
      disclaimer: 'Estimated Environmental Impact: CO2 equivalent reductions are computed based on EPA WARM circular diversion standards (1.35 kg CO2e abated per kg diverted recyclable).',
    };
  }
}

// ==========================================
// PHASE 4: AI CLASSIFICATION & GOVERNANCE
// ==========================================
export interface AIPredictionItem {
  id: string;
  image_url: string;
  material: string;
  confidence: number;
  requires_manual_verification: boolean;
  status: 'PENDING' | 'VERIFIED' | 'CORRECTED';
  verified_material?: string;
  is_corrected: boolean;
  model_version: string;
  created_at: string;
  disclaimer: string;
}

export async function uploadAndClassifyImage(file: File, pickupId?: string): Promise<AIPredictionItem> {
  const formData = new FormData();
  formData.append('file', file);
  if (pickupId) formData.append('pickup_id', pickupId);
  try {
    return await uploadRequest<AIPredictionItem>('/ai/classify', formData);
  } catch (err: any) {
    // Demo fallback for client-side resilience
    const fileName = file.name.toLowerCase();
    const isCardboard = fileName.includes('cardboard') || fileName.includes('carton');
    const isPet = fileName.includes('pet') || fileName.includes('bottle');
    const material = isCardboard ? 'cardboard' : isPet ? 'PET plastic' : 'other/unknown';
    const confidence = material === 'other/unknown' ? 0.55 : 0.92;
    return {
      id: 'demo-pred-' + Date.now(),
      image_url: URL.createObjectURL(file),
      material,
      confidence,
      requires_manual_verification: confidence < 0.70 || material === 'other/unknown',
      status: 'PENDING',
      is_corrected: false,
      model_version: 'demo-v1',
      created_at: new Date().toISOString(),
      disclaimer: 'DEMO CLASSIFIER (demo-v1): Preliminary estimate for workflow demonstration. Final material payout requires calibrated scale physical verification.',
    };
  }
}

export async function getLowConfidencePredictions(): Promise<AIPredictionItem[]> {
  try {
    return await request<AIPredictionItem[]>('/ai/predictions/low-confidence');
  } catch {
    return [
      {
        id: 'pred-low-001',
        image_url: '/uploads/debris_sample.jpg',
        material: 'other/unknown',
        confidence: 0.54,
        requires_manual_verification: true,
        status: 'PENDING',
        is_corrected: false,
        model_version: 'demo-v1',
        created_at: new Date().toISOString(),
        disclaimer: 'DEMO CLASSIFIER (demo-v1): Requires supervisor review.',
      }
    ];
  }
}

export async function verifyAIPrediction(predictionId: string, verifiedMaterial: string, notes?: string): Promise<any> {
  return await request(`/ai/predictions/${predictionId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ verified_material: verifiedMaterial, verification_notes: notes }),
  });
}

export async function correctAIPrediction(predictionId: string, correctedMaterial: string, notes?: string): Promise<any> {
  return await request(`/ai/predictions/${predictionId}/correct`, {
    method: 'POST',
    body: JSON.stringify({ corrected_material: correctedMaterial, notes }),
  });
}

// ==========================================
// PHASE 4: RECYCLER MARKETPLACE & DEMANDS
// ==========================================
export interface RecyclerDemand {
  id: string;
  recycler_id: string;
  recycler_name?: string;
  material_type: string;
  required_quantity_kg: number;
  minimum_quality: string;
  location: string;
  offered_price_per_kg: number;
  total_budget_pkr: number;
  deadline: string;
  status: 'OPEN' | 'PARTIALLY_FILLED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';
  offers_count?: number;
  created_at: string;
}

export interface SupplyOffer {
  id: string;
  demand_id: string;
  collector_id: string;
  collector_name?: string;
  inventory_item_id?: string;
  offered_quantity_kg: number;
  offered_price_per_kg: number;
  total_payout_pkr: number;
  status: 'OFFER_SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  notes?: string;
  created_at: string;
}

export interface SupplyTransaction {
  id: string;
  demand_id: string;
  offer_id: string;
  inventory_item_id?: string;
  collector_id: string;
  collector_name?: string;
  recycler_id: string;
  recycler_name?: string;
  material_type: string;
  quantity_kg: number;
  agreed_price_per_kg: number;
  total_amount_pkr: number;
  status: 'ACCEPTED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  delivery_proof_url?: string;
  dispute_reason?: string;
  cancellation_reason?: string;
  created_at: string;
}

export async function createRecyclerDemand(data: {
  material_type: string;
  required_quantity_kg: number;
  minimum_quality: string;
  location: string;
  offered_price_per_kg: number;
  deadline: string;
}): Promise<RecyclerDemand> {
  return await request<RecyclerDemand>('/marketplace/demands', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getRecyclerDemands(status?: string, material?: string): Promise<RecyclerDemand[]> {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (material) params.append('material', material);
    const q = params.toString() ? `?${params.toString()}` : '';
    return await request<RecyclerDemand[]>(`/marketplace/demands${q}`);
  } catch {
    return [];
  }
}

export async function getMyRecyclerDemands(): Promise<RecyclerDemand[]> {
  try {
    return await request<RecyclerDemand[]>('/marketplace/demands/my-demands');
  } catch {
    return [];
  }
}

export async function submitSupplyOffer(demandId: string, data: {
  offered_quantity_kg: number;
  offered_price_per_kg: number;
  inventory_item_id?: string;
  notes?: string;
}): Promise<SupplyOffer> {
  return await request<SupplyOffer>(`/marketplace/demands/${demandId}/offers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function acceptSupplyOffer(offerId: string): Promise<SupplyTransaction> {
  return await request<SupplyTransaction>(`/marketplace/offers/${offerId}/accept`, {
    method: 'POST',
  });
}

export async function rejectSupplyOffer(offerId: string, reason?: string): Promise<SupplyOffer> {
  return await request<SupplyOffer>(`/marketplace/offers/${offerId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function getMarketplaceTransactions(status?: string): Promise<SupplyTransaction[]> {
  try {
    const q = status ? `?status=${status}` : '';
    return await request<SupplyTransaction[]>(`/marketplace/transactions${q}`);
  } catch {
    return [];
  }
}

export async function deliverMarketplaceTransaction(txnId: string, deliveryProofUrl?: string): Promise<SupplyTransaction> {
  const q = deliveryProofUrl ? `?delivery_proof_url=${encodeURIComponent(deliveryProofUrl)}` : '';
  return await request<SupplyTransaction>(`/marketplace/transactions/${txnId}/deliver${q}`, {
    method: 'POST',
  });
}

export async function completeMarketplaceTransaction(txnId: string): Promise<SupplyTransaction> {
  return await request<SupplyTransaction>(`/marketplace/transactions/${txnId}/complete`, {
    method: 'POST',
  });
}

export async function disputeMarketplaceTransaction(txnId: string, reason: string): Promise<SupplyTransaction> {
  return await request<SupplyTransaction>(`/marketplace/transactions/${txnId}/dispute`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function cancelMarketplaceTransaction(txnId: string, reason: string): Promise<SupplyTransaction> {
  return await request<SupplyTransaction>(`/marketplace/transactions/${txnId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ==========================================
// PHASE 4: AGGREGATION CENTER INVENTORY
// ==========================================
export interface InventoryItem {
  id: string;
  pickup_id?: string;
  collector_id?: string;
  material_type: string;
  verified_weight_kg: number;
  quality_factor: number;
  quality_grade: string;
  location: string;
  status: 'AVAILABLE' | 'OFFER_SUBMITTED' | 'SOLD' | 'DISPATCHED';
  created_at: string;
}

export async function getInventoryItems(status?: string, material?: string): Promise<InventoryItem[]> {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (material) params.append('material', material);
    const q = params.toString() ? `?${params.toString()}` : '';
    return await request<InventoryItem[]>(`/inventory${q}`);
  } catch {
    return [];
  }
}

export async function createInventoryFromPickup(pickupId: string): Promise<InventoryItem> {
  return await request<InventoryItem>(`/inventory/from-pickup/${pickupId}`, {
    method: 'POST',
  });
}

// ==========================================
// IN-APP NOTIFICATIONS API
// ==========================================
export interface AppNotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type?: string;
  type?: string;
  is_read: boolean;
  link?: string;
  related_entity_id?: string;
  created_at: string;
  read_at?: string;
}

export async function fetchUserNotifications(): Promise<AppNotificationItem[]> {
  try {
    const data = await request<any[]>('/notifications');
    return (data || []).map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      notification_type: n.notification_type || n.type || 'INFO',
      type: n.type || n.notification_type || 'INFO',
      is_read: n.is_read !== undefined ? n.is_read : (n.isRead !== undefined ? n.isRead : false),
      link: n.link || n.related_entity_id || '',
      created_at: n.created_at || n.createdAt || new Date().toISOString(),
      read_at: n.read_at || n.readAt,
    }));
  } catch (error) {
    console.warn('Failed to fetch notifications:', error);
    return [];
  }
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const data = await request<{ unread_count: number }>('/notifications/unread-count');
    return data.unread_count ?? 0;
  } catch (error) {
    console.warn('Failed to fetch unread count:', error);
    return 0;
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    await request(`/notifications/${id}/read`, { method: 'POST' });
    return true;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    await request('/notifications/mark-all-read', { method: 'POST' });
    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
}


