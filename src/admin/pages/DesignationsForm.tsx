import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createDesignation,
  updateDesignation,
  getAllDesignations,
} from '../../services/adminApi';
import type { Designation } from '../../services/adminApi';

interface FormData {
  name: string;
  code: string;
  reports_to_id: number | null;
  level: number;
}

const DesignationsForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    reports_to_id: null,
    level: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [designations, setDesignations] = useState<Designation[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getAllDesignations();
        if (res.success) {
          setDesignations(res.data);
          
          // If editing, populate form
          if (isEdit && id) {
            const existing = res.data.find((d: Designation) => d.id === parseInt(id));
            if (existing) {
              setFormData({
                name: existing.name,
                code: existing.code,
                reports_to_id: existing.reports_to_id,
                level: existing.level,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to load designations:', error);
      }
    };
    loadData();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'level' ? parseInt(value) || 1 : 
              name === 'reports_to_id' ? (value ? parseInt(value) : null) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    if (!formData.level || formData.level < 1) newErrors.level = 'Level must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsLoading(true);
      if (isEdit && id) {
        await updateDesignation(parseInt(id), formData);
      } else {
        await createDesignation(formData);
      }
      navigate('/admin/masters/designations');
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? 'Edit Designation' : 'Add Designation'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update designation details' : 'Add a new designation'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="e.g. Zonal Manager"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g. ZM"
              />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reports To
              </label>
              <select
                name="reports_to_id"
                value={formData.reports_to_id || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">None (Top Level)</option>
                {designations
                  .filter((d) => !isEdit || d.id !== parseInt(id!))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="level"
                value={formData.level}
                onChange={handleChange}
                min={1}
                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.level ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1 = top level"
              />
              {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level}</p>}
              <p className="text-gray-500 text-xs mt-1">Lower number = higher in hierarchy</p>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/masters/designations')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DesignationsForm;
