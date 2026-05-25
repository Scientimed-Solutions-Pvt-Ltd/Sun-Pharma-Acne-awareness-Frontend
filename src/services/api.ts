// API Base URL - Uses environment variable for different environments
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// MR Login Response Interface
export interface MRLoginResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    employee_id: string;
    mobile: string;
    email: string;
    designation: string;
    zone: {
      id: number;
      name: string;
      created_at: string;
      updated_at: string;
    };
    region: {
      id: number;
      name: string;
      zone_id: number;
      created_at: string;
      updated_at: string;
    };
    hq: {
      id: number;
      name: string;
      region_id: number;
      created_at: string;
      updated_at: string;
    };
  };
}

// MR Login API
export const mrLogin = async (
  employeeId: string,
  password: string = ''
): Promise<MRLoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/mr/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      employee_id: employeeId,
      ...(password && { password: password }),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Invalid employee code');
  }

  return response.json();
};

// Save user data to localStorage
export const saveUserData = (userData: MRLoginResponse['data']) => {
  localStorage.setItem('mrUser', JSON.stringify(userData));
};

// Get user data from localStorage
export const getUserData = (): MRLoginResponse['data'] | null => {
  const userData = localStorage.getItem('mrUser');
  return userData ? JSON.parse(userData) : null;
};

// Clear user data from localStorage
export const clearUserData = () => {
  localStorage.removeItem('mrUser');
};

// Check if user is logged in
export const isUserLoggedIn = (): boolean => {
  return getUserData() !== null;
};

// Doctor (HCP) Response Interface
export interface DoctorResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    dr_name: string;
    registration_no?: string;
    mobile?: string;
    email?: string;
    p_code?: string;
    city: string;
    pledge_taken: boolean;
    terms_accepted: boolean;
    field_team_id: number;
    created_at: string;
    updated_at: string;
  };
}

// Doctor List Response Interface
export interface DoctorListResponse {
  success: boolean;
  data: Array<{
    id: number;
    dr_name: string;
    registration_no: string | null;
    mobile: string | null;
    email: string | null;
    p_code: string | null;
    city: string;
    pledge_taken: boolean;
    terms_accepted: boolean;
    field_team_id: number;
    created_at: string;
    updated_at: string;
  }>;
}

// Add Doctor (HCP) API
export const addDoctor = async (
  drName: string,
  city: string,
  mobile?: string,
  pCode?: string
): Promise<DoctorResponse> => {
  const userData = getUserData();
  if (!userData) {
    throw new Error('User not logged in');
  }

  const response = await fetch(`${API_BASE_URL}/doctors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dr_name: drName,
      city: city,
      field_team_id: userData.id,
      ...(mobile && { mobile: mobile }),
      ...(pCode && { p_code: pCode }),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add doctor');
  }

  return response.json();
};

// Save doctor data to localStorage
export const saveDoctorData = (doctorData: DoctorResponse['data']) => {
  localStorage.setItem('currentDoctor', JSON.stringify(doctorData));
};

// Get doctor data from localStorage
export const getDoctorData = (): DoctorResponse['data'] | null => {
  const doctorData = localStorage.getItem('currentDoctor');
  return doctorData ? JSON.parse(doctorData) : null;
};

// Clear doctor data from localStorage
export const clearDoctorData = () => {
  localStorage.removeItem('currentDoctor');
};

// Get Doctor by ID API
export const getDoctorById = async (id: number): Promise<DoctorResponse> => {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get doctor');
  }

  return response.json();
};

// Accept Terms API
export const acceptTerms = async (id: number): Promise<DoctorResponse> => {
  console.log('acceptTerms called with ID:', id);
  console.log('API URL:', `${API_BASE_URL}/doctors/${id}/accept-terms`);
  
  const response = await fetch(`${API_BASE_URL}/doctors/${id}/accept-terms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error response:', errorData);
    throw new Error(errorData.message || 'Failed to accept terms');
  }

  const data = await response.json();
  console.log('Success response:', data);
  return data;
};

// Take Pledge API
export const takePledge = async (doctorId: number): Promise<DoctorResponse> => {
  console.log('takePledge called with doctor ID:', doctorId);
  
  const response = await fetch(`${API_BASE_URL}/pledge/take`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      doctor_id: doctorId,
    }),
  });

  console.log('Pledge API response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Pledge API error:', errorData);
    throw new Error(errorData.message || 'Failed to take pledge');
  }

  const data = await response.json();
  console.log('Pledge taken successfully:', data);
  return data;
};

// Get Pledge Count API
export const getPledgeCount = async (): Promise<{ success: boolean; data: { count: number } }> => {
  console.log('getPledgeCount called');
  
  const response = await fetch(`${API_BASE_URL}/pledge/count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('Pledge count API response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Pledge count API error:', errorData);
    throw new Error(errorData.message || 'Failed to get pledge count');
  }

  const data = await response.json();
  console.log('Pledge count retrieved successfully:', data);
  return data;
};

// Get Doctors by Field Team API
export const getDoctorsByFieldTeam = async (fieldTeamId: number): Promise<DoctorListResponse> => {
  console.log('getDoctorsByFieldTeam called with field_team_id:', fieldTeamId);
  
  const response = await fetch(`${API_BASE_URL}/doctors?field_team_id=${fieldTeamId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('Get doctors API response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Get doctors API error:', errorData);
    throw new Error(errorData.message || 'Failed to get doctors');
  }

  const data = await response.json();
  console.log('Doctors retrieved successfully:', data);
  return data;
};

// === IndexedDB helpers for doctor videos ===
const VIDEO_DB_NAME = 'doctorVideosDB';
const VIDEO_STORE = 'videos';

const openVideoDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(VIDEO_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export const saveVideoToDB = async (doctorId: number, blob: Blob): Promise<void> => {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, 'readwrite');
    tx.objectStore(VIDEO_STORE).put(blob, `doctor_video_${doctorId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getVideoFromDB = async (doctorId: number): Promise<Blob | null> => {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, 'readonly');
    const req = tx.objectStore(VIDEO_STORE).get(`doctor_video_${doctorId}`);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
};

export const hasVideoInDB = async (doctorId: number): Promise<boolean> => {
  const blob = await getVideoFromDB(doctorId);
  return blob !== null;
};

// === Backend video upload/status helpers ===
export const uploadVideoToServer = async (doctorId: number, blob: Blob): Promise<void> => {
  const formData = new FormData();
  // Convert blob to webm file
  formData.append('video', blob, `doctor_video_${doctorId}.webm`);
  const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/video`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Video upload failed: ${response.status}`);
  }
};

export const uploadPhotoToServer = async (doctorId: number, base64Photo: string): Promise<string | null> => {
  try {
    // Convert base64 to blob
    const res = await fetch(base64Photo);
    const blob = await res.blob();
    const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
    const formData = new FormData();
    formData.append('photo', blob, `doctor_photo_${doctorId}.${ext}`);
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/photo`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data.success ? data.photo_url : null;
  } catch {
    return null;
  }
};

export const getVideoStatusFromServer = async (doctorId: number): Promise<{ has_video: boolean; video_url: string | null }> => {
  try {
    const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/video-status`);
    const data = await res.json();
    return { has_video: data.has_video ?? false, video_url: data.video_url ?? null };
  } catch {
    return { has_video: false, video_url: null };
  }
};

// Update Doctor API
export const updateDoctor = async (
  id: number,
  drName: string,
  city: string,
  mobile?: string,
  pCode?: string
): Promise<DoctorResponse> => {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dr_name: drName,
      city: city,
      ...(mobile && { mobile: mobile }),
      ...(pCode && { p_code: pCode }),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update doctor');
  }

  return response.json();
};
