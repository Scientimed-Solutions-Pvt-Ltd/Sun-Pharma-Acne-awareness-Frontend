import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import {
  getDoctors,
  deleteDoctor,
  exportDoctors,
  importDoctors,
  getAllZones,
  getAllRegions,
  getAllHqs,
} from '../../services/adminApi';
import type { Doctor, Zone, Region, Hq } from '../../services/adminApi';

const DoctorsList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    zone_id: 0,
    region_id: 0,
    hq_id: 0,
    pledge_taken: '',
  });

  // Filter options
  const [zones, setZones] = useState<Zone[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [hqs, setHqs] = useState<Hq[]>([]);

  const fetchData = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getDoctors({
        page,
        search,
        zone_id: filters.zone_id || undefined,
        region_id: filters.region_id || undefined,
        hq_id: filters.hq_id || undefined,
        pledge_taken: filters.pledge_taken === '' ? undefined : filters.pledge_taken === '1',
      });
      if (response.success) {
        setData(response.data.data);
        setPagination({
          currentPage: response.data.current_page,
          lastPage: response.data.last_page,
          total: response.data.total,
          perPage: response.data.per_page,
        });
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const zonesRes = await getAllZones();
        if (zonesRes.success) setZones(zonesRes.data);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (filters.zone_id) {
      getAllRegions(filters.zone_id).then((res) => {
        if (res.success) setRegions(res.data);
      });
    } else {
      setRegions([]);
      setFilters((prev) => ({ ...prev, region_id: 0, hq_id: 0 }));
    }
  }, [filters.zone_id]);

  useEffect(() => {
    if (filters.region_id) {
      getAllHqs(filters.region_id).then((res) => {
        if (res.success) setHqs(res.data);
      });
    } else {
      setHqs([]);
      setFilters((prev) => ({ ...prev, hq_id: 0 }));
    }
  }, [filters.region_id]);

  const handleDelete = async (item: Doctor) => {
    if (!window.confirm(`Are you sure you want to delete ${item.dr_name}?`)) return;
    try {
      await deleteDoctor(item.id);
      fetchData(pagination.currentPage);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportDoctors();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'doctors.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importDoctors(file);
      alert(result.message);
      fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to import');
    }
  };

  const columns = [
    { 
      key: 'dr_name', 
      title: 'Name',
      render: (item: Doctor) => item.dr_name,
    },
    { 
      key: 'registration_no', 
      title: 'Registration No.',
      render: (item: Doctor) => item.registration_no,
    },
    { key: 'mobile', title: 'Mobile' },
    { key: 'email', title: 'Email' },
    { key: 'city', title: 'City' },
    {
      key: 'field_team',
      title: 'Field Team',
      render: (item: Doctor) => item.field_team?.name || '-',
    },
    {
      key: 'pledge_taken',
      title: 'Pledge Status',
      render: (item: Doctor) =>
        item.pledge_taken ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Taken
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Not Taken
          </span>
        ),
    },
    {
      key: 'pledge_taken_at',
      title: 'Pledge Date',
      render: (item: Doctor) =>
        item.pledge_taken_at
          ? new Date(item.pledge_taken_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '-',
    },
  ];

  const filterComponent = (
    <div className="flex flex-wrap gap-4">
      <select
        value={filters.zone_id}
        onChange={(e) =>
          setFilters({ ...filters, zone_id: Number(e.target.value), region_id: 0, hq_id: 0 })
        }
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
      >
        <option value={0}>All Zones</option>
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.name}
          </option>
        ))}
      </select>
      <select
        value={filters.region_id}
        onChange={(e) => setFilters({ ...filters, region_id: Number(e.target.value), hq_id: 0 })}
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
        disabled={!filters.zone_id}
      >
        <option value={0}>All Regions</option>
        {regions.map((region) => (
          <option key={region.id} value={region.id}>
            {region.name}
          </option>
        ))}
      </select>
      <select
        value={filters.hq_id}
        onChange={(e) => setFilters({ ...filters, hq_id: Number(e.target.value) })}
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
        disabled={!filters.region_id}
      >
        <option value={0}>All HQs</option>
        {hqs.map((hq) => (
          <option key={hq.id} value={hq.id}>
            {hq.name}
          </option>
        ))}
      </select>
      <select
        value={filters.pledge_taken}
        onChange={(e) => setFilters({ ...filters, pledge_taken: e.target.value })}
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
      >
        <option value="">All Pledge Status</option>
        <option value="1">Pledge Taken</option>
        <option value="0">Not Taken</option>
      </select>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Doctors</h1>
        <p className="text-gray-600 mt-1">Manage doctor records and pledges</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={{ ...pagination, onPageChange: fetchData }}
        onView={(item) => navigate(`/admin/doctors/${item.id}`)}
        onEdit={(item) => navigate(`/admin/doctors/${item.id}/edit`)}
        onDelete={handleDelete}
        onSearch={setSearch}
        onExport={handleExport}
        onImport={handleImport}
        onCreate={() => navigate('/admin/doctors/create')}
        searchPlaceholder="Search by name, registration, mobile..."
        filters={filterComponent}
      />
    </div>
  );
};

export default DoctorsList;
