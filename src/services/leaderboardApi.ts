// Leaderboard API Services
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Leaderboard Data Storage
const LEADERBOARD_STORAGE_KEY = 'leaderboard_data';
const LEADERBOARD_TOKEN_KEY = 'leaderboard_token';

// Interfaces
export interface LeaderboardUser {
  id: number;
  name: string;
  email: string;
}

export interface ManagerStats {
  id: number;
  name: string;
  employee_id: string;
  mobile: string;
  zone_id: number;
  region_id?: number;
  zone_name: string;
  region_name?: string;
  area_name?: string;
  total_rms?: number;
  total_ams?: number;
  total_mrs: number;
  total_doctors: number;
  pledged_doctors: number;
  pending_doctors: number;
  today_pledges: number;
  pledge_rate: number;
  score: number;
  rank: number;
}

export interface LeaderboardSummary {
  total_doctors: number;
  pledged_doctors: number;
  pending_doctors: number;
  today_pledges: number;
  pledge_rate: number;
  total_managers: number;
  total_mrs: number;
  last_updated: string;
}

export interface LeaderboardData {
  top_am: ManagerStats[];
  top_rm: ManagerStats[];
  top_zm: ManagerStats[];
  summary: LeaderboardSummary;
}

export interface FilterOptions {
  zones: Array<{ id: number; name: string }>;
  regions: Array<{ id: number; name: string; zone_id: number }>;
}

export interface MyPosition {
  position: number | null;
  total_participants: number;
  stats: ManagerStats | null;
  type: string;
}

export interface MRPerformance {
  mr_name: string;
  employee_id: string;
  total_doctors: number;
  pledged_doctors: number;
  pledge_rate: number;
}

export interface RegionPerformance {
  region_name: string;
  rm_name: string;
  total_doctors: number;
  pledged_doctors: number;
  pledge_rate: number;
}

export interface AreaPerformance {
  area_name: string;
  am_name: string;
  total_doctors: number;
  pledged_doctors: number;
  pledge_rate: number;
}

export interface RecentPledge {
  doctor_name: string;
  mr_name: string;
  pledged_at: string;
}

export interface SubordinateInfo {
  name: string;
  employee_id?: string;
  mobile?: string;
  region?: string;
  area?: string;
}

export interface ManagerDetails {
  id: number;
  name: string;
  employee_id: string;
  email: string;
  mobile: string;
  user_type: 'AM' | 'RM' | 'ZM';
  zone_name: string;
  region_name: string;
  area_name: string;
  total_rms?: number;
  total_ams?: number;
  total_mrs: number;
  total_doctors: number;
  pledged_doctors: number;
  pending_doctors: number;
  pledge_rate: number;
  regional_managers?: SubordinateInfo[];
  area_managers?: SubordinateInfo[];
  medical_representatives?: SubordinateInfo[];
  recent_pledges: RecentPledge[];
  region_performance?: RegionPerformance[];
  area_performance?: AreaPerformance[];
  mr_performance?: MRPerformance[];
}


// Leaderboard Data Management
export const saveLeaderboardData = (data: LeaderboardUser): void => {
  localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(data));
};

export const getLeaderboardData = (): LeaderboardUser | null => {
  const data = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveLeaderboardToken = (token: string): void => {
  localStorage.setItem(LEADERBOARD_TOKEN_KEY, token);
};

export const getLeaderboardToken = (): string | null => {
  return localStorage.getItem(LEADERBOARD_TOKEN_KEY);
};

export const clearLeaderboardData = (): void => {
  localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
  localStorage.removeItem(LEADERBOARD_TOKEN_KEY);
};

export const isLeaderboardAuthenticated = (): boolean => {
  return !!getLeaderboardToken() && !!getLeaderboardData();
};

// API Helper
const getHeaders = () => {
  const token = getLeaderboardToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Auth APIs
export const leaderboardLogin = async (
  email: string,
  password: string
): Promise<{ success: boolean; data: { user: LeaderboardUser; token: string } }> => {
  const response = await fetch(`${API_BASE_URL}/leaderboard/login`, {
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

export const leaderboardLogout = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/leaderboard/logout`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  clearLeaderboardData();
};

// Leaderboard APIs
export const getLeaderboard = async (params?: {
  limit?: number;
  zone_id?: number;
  region_id?: number;
}): Promise<{ success: boolean; data: LeaderboardData }> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.zone_id) queryParams.set('zone_id', params.zone_id.toString());
  if (params?.region_id) queryParams.set('region_id', params.region_id.toString());

  const response = await fetch(`${API_BASE_URL}/leaderboard/dashboard?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard data');
  }

  return response.json();
};

export const getLeaderboardByType = async (
  type: 'AM' | 'RM' | 'ZM',
  params?: { limit?: number; zone_id?: number; region_id?: number }
): Promise<{ success: boolean; type: string; data: ManagerStats[] }> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.zone_id) queryParams.set('zone_id', params.zone_id.toString());
  if (params?.region_id) queryParams.set('region_id', params.region_id.toString());

  const response = await fetch(`${API_BASE_URL}/leaderboard/${type}?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} leaderboard`);
  }

  return response.json();
};

export const getMyPosition = async (): Promise<{ success: boolean; data: MyPosition }> => {
  const response = await fetch(`${API_BASE_URL}/leaderboard/my/position`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch position');
  }

  return response.json();
};

export const getFilters = async (): Promise<{ success: boolean; data: FilterOptions }> => {
  const response = await fetch(`${API_BASE_URL}/leaderboard/filters/data`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch filters');
  }

  return response.json();
};

export const getManagerDetails = async (id: number): Promise<{ success: boolean; data: ManagerDetails }> => {
  const response = await fetch(`${API_BASE_URL}/leaderboard/manager/${id}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch manager details');
  }

  return response.json();
};

export const exportLeaderboard = async (params?: {
  zone_id?: number;
  region_id?: number;
}): Promise<Blob> => {
  const queryParams = new URLSearchParams();
  if (params?.zone_id) queryParams.set('zone_id', params.zone_id.toString());
  if (params?.region_id) queryParams.set('region_id', params.region_id.toString());

  const response = await fetch(`${API_BASE_URL}/leaderboard/export?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to export leaderboard data');
  }

  return response.blob();
};
