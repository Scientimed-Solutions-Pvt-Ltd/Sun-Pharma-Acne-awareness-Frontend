import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createDoctor,
  updateDoctor,
  getDoctor,
  getAllZones,
  getAllRegions,
  getAllHqs,
  getFieldTeamsByHq,
} from '../../services/adminApi';
import type { Zone, Region, Hq, FieldTeam } from '../../services/adminApi';

interface FormData {
  dr_name: string;
  registration_no: string;
  p_code: string;
  mobile: string;
  email: string;
  city: string;
  zone_id: number;
  region_id: number;
  hq_id: number;
  field_team_id: number;
}

const DoctorsForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    dr_name: '',
    registration_no: '',
    p_code: '',
    mobile: '',
    email: '',
    city: '',
    zone_id: 0,
    region_id: 0,
    hq_id: 0,
    field_team_id: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEdit);

  // Options
  const [zones, setZones] = useState<Zone[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [hqs, setHqs] = useState<Hq[]>([]);
  const [fieldTeams, setFieldTeams] = useState<FieldTeam[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const zonesRes = await getAllZones();
        if (zonesRes.success) setZones(zonesRes.data);
      } catch (error) {
        console.error('Failed to load zones:', error);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      const loadDoctor = async () => {
        try {
          const response = await getDoctor(parseInt(id));
          if (response.success) {
            const doc = response.data;
            // Get zone/region/hq from field_team if available
            const zoneId = doc.zone_id || doc.field_team?.zone_id || 0;
            const regionId = doc.region_id || doc.field_team?.region_id || 0;
            const hqId = doc.hq_id || doc.field_team?.hq_id || 0;
            
            setFormData({
              dr_name: doc.dr_name,
              registration_no: doc.registration_no || '',
              p_code: doc.p_code || '',
              mobile: doc.mobile || '',
              email: doc.email || '',
              city: doc.city || '',
              zone_id: zoneId,
              region_id: regionId,
              hq_id: hqId,
              field_team_id: doc.field_team_id || 0,
            });

            // Load dependent dropdowns
            if (zoneId) {
              const regionsRes = await getAllRegions(zoneId);
              if (regionsRes.success) setRegions(regionsRes.data);
            }
            if (regionId) {
              const hqsRes = await getAllHqs(regionId);
              if (hqsRes.success) setHqs(hqsRes.data);
            }
            if (hqId) {
              const ftRes = await getFieldTeamsByHq(hqId);
              if (ftRes.success) setFieldTeams(ftRes.data);
            }
          }
        } catch (error) {
          console.error('Failed to load doctor:', error);
          navigate('/admin/doctors');
        } finally {
          setIsLoadingData(false);
        }
      };
      loadDoctor();
    }
  }, [id, isEdit, navigate]);

  useEffect(() => {
    if (formData.zone_id && !isLoadingData) {
      getAllRegions(formData.zone_id).then((res) => {
        if (res.success) setRegions(res.data);
      });
    } else if (!isLoadingData) {
      setRegions([]);
    }
  }, [formData.zone_id, isLoadingData]);

  useEffect(() => {
    if (formData.region_id && !isLoadingData) {
      getAllHqs(formData.region_id).then((res) => {
        if (res.success) setHqs(res.data);
      });
    } else if (!isLoadingData) {
      setHqs([]);
    }
  }, [formData.region_id, isLoadingData]);

  useEffect(() => {
    if (formData.hq_id && !isLoadingData) {
      getFieldTeamsByHq(formData.hq_id).then((res) => {
        if (res.success) setFieldTeams(res.data);
      });
    } else if (!isLoadingData) {
      setFieldTeams([]);
    }
  }, [formData.hq_id, isLoadingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Reset dependent fields
      if (name === 'zone_id') {
        newData.region_id = 0;
        newData.hq_id = 0;
        newData.field_team_id = 0;
      } else if (name === 'region_id') {
        newData.hq_id = 0;
        newData.field_team_id = 0;
      } else if (name === 'hq_id') {
        newData.field_team_id = 0;
      }

      return newData;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dr_name.trim()) {
      newErrors.dr_name = 'Name is required';
    }
    if (!formData.registration_no.trim()) {
      newErrors.registration_no = 'Registration number is required';
    }
    if (!formData.p_code.trim()) {
      newErrors.p_code = 'P-Code is required';
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile must be 10 digits';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.zone_id) {
      newErrors.zone_id = 'Zone is required';
    }
    if (!formData.region_id) {
      newErrors.region_id = 'Region is required';
    }
    if (!formData.hq_id) {
      newErrors.hq_id = 'HQ is required';
    }
    if (!formData.field_team_id) {
      newErrors.field_team_id = 'Field Team is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setIsLoading(true);
      const payload = {
        dr_name: formData.dr_name,
        registration_no: formData.registration_no,
        p_code: formData.p_code,
        mobile: formData.mobile,
        email: formData.email,
        city: formData.city,
        field_team_id: Number(formData.field_team_id),
      };

      if (isEdit && id) {
        await updateDoctor(parseInt(id), payload);
      } else {
        await createDoctor(payload);
      }
      navigate('/admin/doctors');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? 'Edit Doctor' : 'Add Doctor'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update doctor details' : 'Add a new doctor'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="dr_name"
                value={formData.dr_name}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.dr_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter doctor name"
              />
              {errors.dr_name && <p className="text-red-500 text-sm mt-1">{errors.dr_name}</p>}
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="registration_no"
                value={formData.registration_no}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.registration_no ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter registration number"
              />
              {errors.registration_no && (
                <p className="text-red-500 text-sm mt-1">{errors.registration_no}</p>
              )}
            </div>

            {/* P-Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                P-Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="p_code"
                value={formData.p_code}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.p_code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter P-Code"
              />
              {errors.p_code && <p className="text-red-500 text-sm mt-1">{errors.p_code}</p>}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.mobile ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter 10-digit mobile"
                maxLength={10}
              />
              {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter city"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>

            {/* Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone <span className="text-red-500">*</span>
              </label>
              <select
                name="zone_id"
                value={formData.zone_id}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.zone_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value={0}>Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
              {errors.zone_id && <p className="text-red-500 text-sm mt-1">{errors.zone_id}</p>}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region <span className="text-red-500">*</span>
              </label>
              <select
                name="region_id"
                value={formData.region_id}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.region_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!formData.zone_id}
              >
                <option value={0}>Select Region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              {errors.region_id && <p className="text-red-500 text-sm mt-1">{errors.region_id}</p>}
            </div>

            {/* HQ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HQ <span className="text-red-500">*</span>
              </label>
              <select
                name="hq_id"
                value={formData.hq_id}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.hq_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!formData.region_id}
              >
                <option value={0}>Select HQ</option>
                {hqs.map((hq) => (
                  <option key={hq.id} value={hq.id}>
                    {hq.name}
                  </option>
                ))}
              </select>
              {errors.hq_id && <p className="text-red-500 text-sm mt-1">{errors.hq_id}</p>}
            </div>

            {/* Field Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Team <span className="text-red-500">*</span>
              </label>
              <select
                name="field_team_id"
                value={formData.field_team_id}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.field_team_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!formData.hq_id}
              >
                <option value={0}>Select Field Team</option>
                {fieldTeams.map((ft) => (
                  <option key={ft.id} value={ft.id}>
                    {ft.name} ({ft.employee_id})
                  </option>
                ))}
              </select>
              {errors.field_team_id && (
                <p className="text-red-500 text-sm mt-1">{errors.field_team_id}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/doctors')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorsForm;
