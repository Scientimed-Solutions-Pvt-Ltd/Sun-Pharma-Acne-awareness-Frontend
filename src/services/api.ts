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
