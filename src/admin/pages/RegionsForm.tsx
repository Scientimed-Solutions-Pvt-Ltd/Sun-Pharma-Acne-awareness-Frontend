import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createRegion, updateRegion, getRegion, getAllZones } from '../../services/adminApi';
import type { Zone } from '../../services/adminApi';

const RegionsForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [zoneId, setZoneId] = useState(0);
  const [zones, setZones] = useState<Zone[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEdit);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await getAllZones();
        if (response.success) setZones(response.data);
      } catch (error) {
        console.error('Failed to load zones:', error);
      }
    };
    loadZones();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      const loadRegion = async () => {
        try {
          const response = await getRegion(parseInt(id));
          if (response.success) {
            setName(response.data.name);
            setZoneId(response.data.zone_id);
          }
        } catch (error) {
          console.error('Failed to load region:', error);
          navigate('/admin/masters/regions');
        } finally {
          setIsLoadingData(false);
        }
      };
      loadRegion();
    }
  }, [id, isEdit, navigate]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Region name is required';
    if (!zoneId) newErrors.zone_id = 'Zone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsLoading(true);
      if (isEdit && id) {
        await updateRegion(parseInt(id), { name, zone_id: zoneId });
      } else {
        await createRegion({ name, zone_id: zoneId });
      }
      navigate('/admin/masters/regions');
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save' });
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
          {isEdit ? 'Edit Region' : 'Add Region'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update region details' : 'Add a new region'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zone <span className="text-red-500">*</span>
            </label>
            <select
              value={zoneId}
              onChange={(e) => {
                setZoneId(Number(e.target.value));
                setErrors((prev) => ({ ...prev, zone_id: '' }));
              }}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: '' }));
              }}
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter region name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/masters/regions')}
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

export default RegionsForm;
