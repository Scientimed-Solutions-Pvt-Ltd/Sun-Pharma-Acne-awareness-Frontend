// Admin API Services
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Admin Data Storage
const ADMIN_STORAGE_KEY = 'admin_data';
const ADMIN_TOKEN_KEY = 'admin_token';

// Interfaces
export interface AdminUser {
  id: number;
  name: string;
  email: string;
}

export interface Zone {
  id: number;
  name: string;
  regions_count?: number;
  field_teams_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Region {
  id: number;
  name: string;
  zone_id: number;
  zone?: Zone;
  hqs_count?: number;
  field_teams_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Hq {
  id: number;
  name: string;
  zone_id: number;
  region_id: number;
  zone?: Zone;
  region?: Region;
  field_teams_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FieldTeam {
  id: number;
  name: string;
  employee_id: string;
  mobile: string;
  email: string;
  designation: string;
  zone_id: number;
  region_id: number;
  hq_id: number;
  zone?: Zone;
  region?: Region;
  hq?: Hq;
  doctors_count?: number;
  doctors?: Doctor[];
  created_at?: string;
  updated_at?: string;
}

export interface Doctor {
  id: number;
  dr_name: string;
  name?: string; // alias for dr_name
  registration_no: string;
  registration_number?: string; // alias
  p_code: string;
  city: string;
  mobile: string;
  email: string;
  photo?: string;
  field_team_id: number;
  zone_id?: number;
  region_id?: number;
  hq_id?: number;
  field_team?: FieldTeam;
  zone?: Zone;
  region?: Region;
  hq?: Hq;
  terms_accepted: boolean;
  pledge_taken: boolean;
  pledge_taken_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export interface DashboardStats {
  stats: {
    total_doctors: number;
    total_field_teams: number;
    doctors_pledged: number;
    doctors_pending: number;
    total_zones: number;
    total_regions: number;
    total_hqs: number;
  };
  recent_pledges: Doctor[];
}

// Admin Data Management
export const saveAdminData = (data: AdminUser): void => {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
};

export const getAdminData = (): AdminUser | null => {
  const data = localStorage.getItem(ADMIN_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveAdminToken = (token: string): void => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const getAdminToken = (): string | null => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const clearAdminData = (): void => {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const isAdminAuthenticated = (): boolean => {
  return !!getAdminToken() && !!getAdminData();
};

// API Helper
const getHeaders = () => {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Auth APIs
export const adminLogin = async (email: string, password: string): Promise<{ success: boolean; data: { user: AdminUser; token: string } }> => {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
};

// Dashboard APIs
export const getDashboardStats = async (): Promise<{ success: boolean; data: DashboardStats }> => {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  return response.json();
};

// Zone APIs
export const getZones = async (params?: { page?: number; search?: string; per_page?: number }): Promise<PaginatedResponse<Zone>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.search) queryParams.set('search', params.search);
  if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

  const response = await fetch(`${API_BASE_URL}/admin/zones?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch zones');
  }

  return response.json();
};

export const getAllZones = async (): Promise<{ success: boolean; data: Zone[] }> => {
  const response = await fetch(`${API_BASE_URL}/admin/zones/all`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch all zones');
  }

  return response.json();
};

export const getZone = async (id: number): Promise<SingleResponse<Zone>> => {
  const response = await fetch(`${API_BASE_URL}/admin/zones/${id}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch zone');
  }

  return response.json();
};

export const createZone = async (data: { name: string }): Promise<SingleResponse<Zone>> => {
  const response = await fetch(`${API_BASE_URL}/admin/zones`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create zone');
  }

  return response.json();
};

export const updateZone = async (id: number, data: { name: string }): Promise<SingleResponse<Zone>> => {
  const response = await fetch(`${API_BASE_URL}/admin/zones/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update zone');
  }

  return response.json();
};

export const deleteZone = async (id: number): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/admin/zones/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete zone');
  }

  return response.json();
};

export const exportZones = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/admin/zones/export`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to export zones');
  }

  return response.blob();
};

export const importZones = async (file: File): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}/admin/zones/import`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to import zones');
  }

  return response.json();
};

// Region APIs
export const getRegions = async (params?: { page?: number; search?: string; zone_id?: number; per_page?: number }): Promise<PaginatedResponse<Region>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.search) queryParams.set('search', params.search);
  if (params?.zone_id) queryParams.set('zone_id', params.zone_id.toString());
  if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

  const response = await fetch(`${API_BASE_URL}/admin/regions?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch regions');
  }

  return response.json();
};

export const getAllRegions = async (zone_id?: number): Promise<{ success: boolean; data: Region[] }> => {
  const queryParams = new URLSearchParams();
  if (zone_id) queryParams.set('zone_id', zone_id.toString());

  const response = await fetch(`${API_BASE_URL}/admin/regions/all?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch all regions');
  }

  return response.json();
};

export const getRegion = async (id: number): Promise<SingleResponse<Region>> => {
  const response = await fetch(`${API_BASE_URL}/admin/regions/${id}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch region');
  }

  return response.json();
};

export const createRegion = async (data: { name: string; zone_id: number }): Promise<SingleResponse<Region>> => {
  const response = await fetch(`${API_BASE_URL}/admin/regions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create region');
  }

  return response.json();
};

export const updateRegion = async (id: number, data: { name: string; zone_id: number }): Promise<SingleResponse<Region>> => {
  const response = await fetch(`${API_BASE_URL}/admin/regions/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update region');
  }

  return response.json();
};

export const deleteRegion = async (id: number): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/admin/regions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete region');
  }

  return response.json();
};

export const exportRegions = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/admin/regions/export`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to export regions');
  }

  return response.blob();
};

export const importRegions = async (file: File): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}/admin/regions/import`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to import regions');
  }

  return response.json();
};

// HQ APIs
export const getHqs = async (params?: { page?: number; search?: string; zone_id?: number; region_id?: number; per_page?: number }): Promise<PaginatedResponse<Hq>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.search) queryParams.set('search', params.search);
  if (params?.zone_id) queryParams.set('zone_id', params.zone_id.toString());
  if (params?.region_id) queryParams.set('region_id', params.region_id.toString());
  if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

  const response = await fetch(`${API_BASE_URL}/admin/hqs?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch HQs');
  }

  return response.json();
};

export const getAllHqs = async (region_id?: number): Promise<{ success: boolean; data: Hq[] }> => {
  const queryParams = new URLSearchParams();
  if (region_id) queryParams.set('region_id', region_id.toString());

  const response = await fetch(`${API_BASE_URL}/admin/hqs/all?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch all HQs');
  }

  return response.json();
};

export const getHq = async (id: number): Promise<SingleResponse<Hq>> => {
  const response = await fetch(`${API_BASE_URL}/admin/hqs/${id}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch HQ');
  }

  return response.json();
};

export const createHq = async (data: { name: string; region_id: number }): Promise<SingleResponse<Hq>> => {
  const response = await fetch(`${API_BASE_URL}/admin/hqs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create HQ');
  }

  return response.json();
};

export const updateHq = async (id: number, data: { name: string; region_id: number }): Promise<SingleResponse<Hq>> => {
  const response = await fetch(`${API_BASE_URL}/admin/hqs/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update HQ');
  }

  return response.json();
};

export const deleteHq = async (id: number): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/admin/hqs/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete HQ');
  }

  return response.json();
};

export const exportHqs = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/admin/hqs/export`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to export HQs');
  }

  return response.blob();
};

export const importHqs = async (file: File): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}/admin/hqs/import`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to import HQs');
  }

  return response.json();
};

// Field Team APIs
export const getFieldTeams = async (params?: { page?: number; search?: string; zone_id?: number; region_id?: number; hq_id?: number; per_page?: number }): Promise<PaginatedResponse<FieldTeam>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.search) queryParams.set('search', params.search);
  if (params?.zone_id) queryParams.set('zone_id', params.zone_id.toString());
  if (params?.region_id) queryParams.set('region_id', params.region_id.toString());
  if (params?.hq_id) queryParams.set('hq_id', params.hq_id.toString());
  if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

  const response = await fetch(`${API_BASE_URL}/admin/field-teams?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch field teams');
  }

  return response.json();
};

export const getFieldTeam = async (id: number): Promise<SingleResponse<FieldTeam & { doctors: Doctor[] }>> => {
  const response = await fetch(`${API_BASE_URL}/admin/field-teams/${id}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch field team');
  }

  return response.json();
};

export const createFieldTeam = async (data: {
  name: string;
  employee_id: string;
  mobile: string;
  email: string;
  designation: string;
  zone_id: number;
  region_id: number;
  hq_id: number;
}): Promise<SingleResponse<FieldTeam>> => {
  const response = await fetch(`${API_BASE_URL}/admin/field-teams`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create field team');
  }

  return response.json();
};

export const updateFieldTeam = async (id: number, data: {
  name: string;
  employee_id: string;
  mobile: string;
  email: string;
  designation: string;
  zone_id: number;
  region_id: number;
  hq_id: number;
}): Promise<SingleResponse<FieldTeam>> => {
  const response = await fetch(`${API_BASE_URL}/admin/field-teams/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update field team');
  }

  return response.json();
};

export const deleteFieldTeam = async (id: number): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/admin/field-teams/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete field team');
  }

  return response.json();
};

export const exportFieldTeams = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/admin/field-teams/export`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to export field teams');
  }

  return response.blob();
};

export const importFieldTeams = async (file: File): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}/admin/field-teams/import`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to import field teams');
  }

  return response.json();
};

export const getFieldTeamsByHq = async (hqId: number): Promise<{ success: boolean; data: FieldTeam[] }> => {
  const response = await fetch(`${API_BASE_URL}/admin/field-teams/hq/${hqId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch field teams');
  }

  return response.json();
};

// Doctor APIs
export const getDoctors = async (params?: { 
  page?: number; 
  search?: string; 
  field_team_id?: number; 
  zone_id?: number;
  region_id?: number;
  hq_id?: number;
  pledge_taken?: boolean; 
  per_page?: number 
}): Promise<PaginatedResponse<Doctor>> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.search) queryParams.set('search', params.search);
  if (params?.field_team_id) queryParams.set('field_team_id', params.field_team_id.toString());
  if (params?.zone_id) queryParams.set('zone_id', params.zone_id.toString());
  if (params?.region_id) queryParams.set('region_id', params.region_id.toString());
  if (params?.hq_id) queryParams.set('hq_id', params.hq_id.toString());
  if (params?.pledge_taken !== undefined) queryParams.set('pledge_taken', params.pledge_taken.toString());
  if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

  const response = await fetch(`${API_BASE_URL}/admin/doctors?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch doctors');
  }

  return response.json();
};

export const getDoctor = async (id: number): Promise<SingleResponse<Doctor>> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors/${id}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch doctor');
  }

  return response.json();
};

export const createDoctor = async (data: {
  dr_name: string;
  registration_no: string;
  p_code: string;
  city: string;
  mobile: string;
  email: string;
  field_team_id: number;
}): Promise<SingleResponse<Doctor>> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create doctor');
  }

  return response.json();
};

export const updateDoctor = async (id: number, data: {
  dr_name: string;
  registration_no: string;
  p_code: string;
  city: string;
  mobile: string;
  email: string;
  field_team_id: number;
}): Promise<SingleResponse<Doctor>> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update doctor');
  }

  return response.json();
};

export const deleteDoctor = async (id: number): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete doctor');
  }

  return response.json();
};

export const exportDoctors = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/admin/doctors/export`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to export doctors');
  }

  return response.blob();
};

export const importDoctors = async (file: File): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}/admin/doctors/import`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to import doctors');
  }

  return response.json();
};

// ==================== REPORTS & ANALYTICS APIS ====================

export interface ReportSummary {
  total_doctors: number;
  pledged_doctors: number;
  terms_accepted: number;
  pending_doctors: number;
  total_mrs: number;
  active_mrs: number;
  inactive_mrs: number;
  pledge_rate: number;
  terms_acceptance_rate: number;
  mr_activity_rate: number;
  avg_pledges_per_mr: number;
}

export interface ZoneReport {
  id: number;
  name: string;
  code: string;
  total_regions: number;
  total_mrs: number;
  total_doctors: number;
  pledged_doctors: number;
  pending_doctors: number;
  pledge_rate: number;
}

export interface RegionReport {
  id: number;
  name: string;
  code: string;
  zone_name: string;
  total_areas: number;
  total_mrs: number;
  total_doctors: number;
  pledged_doctors: number;
  pending_doctors: number;
  pledge_rate: number;
}

export interface AreaReport {
  id: number;
  name: string;
  code: string;
  region_name: string;
  zone_name: string;
  total_mrs: number;
  total_doctors: number;
  pledged_doctors: number;
  pending_doctors: number;
  pledge_rate: number;
}

export interface CityReport {
  city: string;
  total_doctors: number;
  pledged_doctors: number;
  pending_doctors: number;
  pledge_rate: number;
}

export interface MRPerformance {
  id: number;
  name: string;
  employee_id: string;
  mobile?: string;
  zone_name: string;
  region_name: string;
  area_name: string;
  total_doctors: number;
  pledged_doctors: number;
  pending_doctors: number;
  pledge_rate: number;
}

export interface PledgeTrend {
  date: string;
  count: number;
}

export interface HierarchyPerformance {
  id: number;
  name: string;
  employee_id: string;
  user_type: string;
  zone_name: string;
  region_name: string;
  area_name: string;
  total_mrs: number;
  total_doctors: number;
  pledged_doctors: number;
  pending_doctors: number;
  pledge_rate: number;
}

// Report Summary
export const getReportSummary = async (): Promise<SingleResponse<ReportSummary>> => {
  const response = await fetch(`${API_BASE_URL}/admin/reports/summary`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch report summary');
  }

  return response.json();
};

// Zone-wise Report
export const getZoneWiseReport = async (): Promise<SingleResponse<ZoneReport[]>> => {
  const response = await fetch(`${API_BASE_URL}/admin/reports/zone-wise`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch zone-wise report');
  }

  return response.json();
};

// Region-wise Report
export const getRegionWiseReport = async (zoneId?: number): Promise<SingleResponse<RegionReport[]>> => {
  const params = new URLSearchParams();
  if (zoneId) params.set('zone_id', zoneId.toString());

  const response = await fetch(`${API_BASE_URL}/admin/reports/region-wise?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch region-wise report');
  }

  return response.json();
};

// Area-wise Report
export const getAreaWiseReport = async (params?: { zone_id?: number; region_id?: number }): Promise<SingleResponse<AreaReport[]>> => {
  const queryParams = new URLSearchParams();
  if (params?.zone_id) queryParams.set('zone_id', params.zone_id.toString());
  if (params?.region_id) queryParams.set('region_id', params.region_id.toString());

  const response = await fetch(`${API_BASE_URL}/admin/reports/area-wise?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch area-wise report');
  }

  return response.json();
};

// City-wise Report
export const getCityWiseReport = async (limit?: number): Promise<SingleResponse<CityReport[]>> => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/admin/reports/city-wise?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch city-wise report');
  }

  return response.json();
};

// MR Performance Report
export const getMRPerformanceReport = async (params?: {
  sort_by?: string;
  sort_order?: string;
  limit?: number;
  zone_id?: number;
  region_id?: number;
  area_id?: number;
}): Promise<SingleResponse<MRPerformance[]>> => {
  const queryParams = new URLSearchParams();
  if (params?.sort_by) queryParams.set('sort_by', params.sort_by);
  if (params?.sort_order) queryParams.set('sort_order', params.sort_order);
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.zone_id) queryParams.set('zone_id', params.zone_id.toString());
  if (params?.region_id) queryParams.set('region_id', params.region_id.toString());
  if (params?.area_id) queryParams.set('area_id', params.area_id.toString());

  const response = await fetch(`${API_BASE_URL}/admin/reports/mr-performance?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch MR performance report');
  }

  return response.json();
};

// Top Performers
export const getTopPerformers = async (limit?: number): Promise<SingleResponse<MRPerformance[]>> => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());

  const response = await fetch(`${API_BASE_URL}/admin/reports/top-performers?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch top performers');
  }

  return response.json();
};

// Zero Pledge MRs
export const getZeroPledgeMRs = async (): Promise<SingleResponse<MRPerformance[]> & { count: number }> => {
  const response = await fetch(`${API_BASE_URL}/admin/reports/zero-pledge-mrs`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch zero pledge MRs');
  }

  return response.json();
};

// Pledge Trend
export const getPledgeTrend = async (days?: number): Promise<SingleResponse<PledgeTrend[]>> => {
  const params = new URLSearchParams();
  if (days) params.set('days', days.toString());

  const response = await fetch(`${API_BASE_URL}/admin/reports/pledge-trend?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch pledge trend');
  }

  return response.json();
};

// Hierarchy Performance (ZM/RM/AM wise)
export const getHierarchyPerformance = async (level: 'ZM' | 'RM' | 'AM'): Promise<SingleResponse<HierarchyPerformance[]>> => {
  const params = new URLSearchParams();
  params.set('level', level);

  const response = await fetch(`${API_BASE_URL}/admin/reports/hierarchy-performance?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch hierarchy performance');
  }

  return response.json();
};

// Export Report
export const exportReport = async (type: string, format: 'json' | 'csv' = 'csv'): Promise<Blob | object> => {
  const params = new URLSearchParams();
  params.set('type', type);
  params.set('format', format);

  const response = await fetch(`${API_BASE_URL}/admin/reports/export?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to export report');
  }

  if (format === 'csv') {
    return response.blob();
  }

  return response.json();
};

// Today's Pledge Interface
export interface TodaysPledge {
  id: number;
  dr_name: string;
  registration_no: string | null;
  p_code: string | null;
  mobile: string | null;
  city: string | null;
  mr_name: string;
  mr_employee_id: string;
  area_name: string;
  region_name: string;
  zone_name: string;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  pledge_taken_at: string | null;
  pledge_date: string;
  pledge_time: string;
  terms_time: string;
}

export interface TodaysPledgesResponse {
  success: boolean;
  data: {
    start_date: string;
    end_date: string;
    total_count: number;
    pledges: TodaysPledge[];
  };
}

export interface PledgeFilters {
  start_date?: string;
  end_date?: string;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
}

// Get Pledges (supports date range and sorting)
export const getTodaysPledges = async (filters?: PledgeFilters): Promise<TodaysPledgesResponse> => {
  const params = new URLSearchParams();
  if (filters?.start_date) params.set('start_date', filters.start_date);
  if (filters?.end_date) params.set('end_date', filters.end_date);
  if (filters?.sort_field) params.set('sort_field', filters.sort_field);
  if (filters?.sort_order) params.set('sort_order', filters.sort_order);

  const url = params.toString() 
    ? `${API_BASE_URL}/admin/reports/todays-pledges?${params}`
    : `${API_BASE_URL}/admin/reports/todays-pledges`;

  const response = await fetch(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch pledges');
  }

  return response.json();
};

// Export Pledges to CSV (supports date range)
export const exportTodaysPledges = async (filters?: PledgeFilters): Promise<Blob> => {
  const params = new URLSearchParams();
  if (filters?.start_date) params.set('start_date', filters.start_date);
  if (filters?.end_date) params.set('end_date', filters.end_date);

  const url = params.toString()
    ? `${API_BASE_URL}/admin/reports/todays-pledges/export?${params}`
    : `${API_BASE_URL}/admin/reports/todays-pledges/export`;

  const response = await fetch(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to export pledges');
  }

  return response.blob();
};
