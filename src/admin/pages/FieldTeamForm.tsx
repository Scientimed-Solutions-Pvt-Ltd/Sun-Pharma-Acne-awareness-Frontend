import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createFieldTeam,
  updateFieldTeam,
  getFieldTeam,
  getAllStates,
  getAllHqs,
} from '../../services/adminApi';
import type { State, Hq } from '../../services/adminApi';

interface FormData {
  name: string;
  employee_id: string;
  mobile: string;
  email: string;
  designation: string;
  state_id: number;
  hq_id: number;
}

const FieldTeamForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    employee_id: '',
    mobile: '',
    email: '',
    designation: '',
    state_id: 0,
    hq_id: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEdit);

  // Options
  const [states, setStates] = useState<State[]>([]);
  const [hqs, setHqs] = useState<Hq[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const statesRes = await getAllStates();
        if (statesRes.success) setStates(statesRes.data);
      } catch (error) {
        console.error('Failed to load states:', error);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      const loadFieldTeam = async () => {
        try {
          const response = await getFieldTeam(parseInt(id));
          if (response.success) {
            const ft = response.data;
            setFormData({
              name: ft.name,
              employee_id: ft.employee_id,
              mobile: ft.mobile || '',
              email: ft.email || '',
              designation: ft.designation || '',
              state_id: ft.state_id,
              hq_id: ft.hq_id,
            });

            // Load hqs for the existing state
            if (ft.state_id) {
              const hqsRes = await getAllHqs(ft.state_id);
              if (hqsRes.success) setHqs(hqsRes.data);
            }
          }
        } catch (error) {
          console.error('Failed to load field team:', error);
          navigate('/admin/field-team');
        } finally {
          setIsLoadingData(false);
        }
      };
      loadFieldTeam();
    }
  }, [id, isEdit, navigate]);

  useEffect(() => {
    if (formData.state_id && !isLoadingData) {
      getAllHqs(formData.state_id).then((res) => {
        if (res.success) setHqs(res.data);
      });
    } else if (!isLoadingData) {
      setHqs([]);
    }
  }, [formData.state_id, isLoadingData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Reset dependent fields
      if (name === 'state_id') {
        newData.hq_id = 0;
      }

      return newData;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.employee_id.trim()) {
      newErrors.employee_id = 'Employee ID is required';
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
    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }
    if (!formData.state_id) {
      newErrors.state_id = 'State is required';
    }
    if (!formData.hq_id) {
      newErrors.hq_id = 'HQ is required';
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
        ...formData,
        state_id: Number(formData.state_id),
        hq_id: Number(formData.hq_id),
      };

      if (isEdit && id) {
        await updateFieldTeam(parseInt(id), payload);
      } else {
        await createFieldTeam(payload);
      }
      navigate('/admin/field-team');
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
          {isEdit ? 'Edit Field Team Member' : 'Add Field Team Member'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update field team member details' : 'Add a new field team member'}
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
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.employee_id ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter employee ID"
              />
              {errors.employee_id && <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>}
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
                placeholder="Enter 10-digit mobile number"
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
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.designation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter designation"
              />
              {errors.designation && <p className="text-red-500 text-sm mt-1">{errors.designation}</p>}
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                name="state_id"
                value={formData.state_id}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.state_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value={0}>Select State</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.state_id && <p className="text-red-500 text-sm mt-1">{errors.state_id}</p>}
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
                disabled={!formData.state_id}
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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/field-team')}
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

export default FieldTeamForm;
