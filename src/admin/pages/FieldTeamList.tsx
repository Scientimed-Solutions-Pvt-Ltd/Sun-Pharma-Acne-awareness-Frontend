import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import {
  getFieldTeams,
  deleteFieldTeam,
  exportFieldTeams,
  importFieldTeams,
  getAllStates,
  getAllHqs,
  getAllDesignations,
} from '../../services/adminApi';
import type { FieldTeam, State, Hq, Designation } from '../../services/adminApi';

const FieldTeamList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<FieldTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    state_id: 0,
    hq_id: 0,
    designation_id: 0,
  });

  // Filter options
  const [states, setStates] = useState<State[]>([]);
  const [hqs, setHqs] = useState<Hq[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  const fetchData = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getFieldTeams({
        page,
        search,
        state_id: filters.state_id || undefined,
        hq_id: filters.hq_id || undefined,
        designation_id: filters.designation_id || undefined,
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
      console.error('Failed to fetch field teams:', error);
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
        const [statesRes, designationsRes] = await Promise.all([
          getAllStates(),
          getAllDesignations(),
        ]);
        if (statesRes.success) setStates(statesRes.data);
        if (designationsRes.success) setDesignations(designationsRes.data);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (filters.state_id) {
      getAllHqs(filters.state_id).then((res) => {
        if (res.success) setHqs(res.data);
      });
    } else {
      setHqs([]);
      setFilters((prev) => ({ ...prev, hq_id: 0 }));
    }
  }, [filters.state_id]);

  const handleDelete = async (item: FieldTeam) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    try {
      await deleteFieldTeam(item.id);
      fetchData(pagination.currentPage);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportFieldTeams();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'field-teams.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importFieldTeams(file);
      alert(result.message);
      fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to import');
    }
  };

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'employee_id', title: 'Employee ID' },
    { key: 'mobile', title: 'Mobile' },
    { key: 'email', title: 'Email' },
    {
      key: 'designation',
      title: 'Designation',
      render: (item: FieldTeam) => item.designation_master?.name || item.designation || '-',
    },
    {
      key: 'state',
      title: 'State',
      render: (item: FieldTeam) => item.state_master?.name || '-',
    },
    {
      key: 'hq',
      title: 'HQ',
      render: (item: FieldTeam) => item.hq_master?.name || '-',
    },
    {
      key: 'doctors_count',
      title: 'Doctors',
      render: (item: FieldTeam) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {item.doctors_count || 0}
        </span>
      ),
    },
  ];

  const filterComponent = (
    <div className="flex flex-wrap gap-4">
      <select
        value={filters.state_id}
        onChange={(e) => setFilters({ ...filters, state_id: Number(e.target.value), hq_id: 0 })}
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
      >
        <option value={0}>All States</option>
        {states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name}
          </option>
        ))}
      </select>
      <select
        value={filters.hq_id}
        onChange={(e) => setFilters({ ...filters, hq_id: Number(e.target.value) })}
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
        disabled={!filters.state_id}
      >
        <option value={0}>All HQs</option>
        {hqs.map((hq) => (
          <option key={hq.id} value={hq.id}>
            {hq.name}
          </option>
        ))}
      </select>
      <select
        value={filters.designation_id}
        onChange={(e) => setFilters({ ...filters, designation_id: Number(e.target.value) })}
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
      >
        <option value={0}>All Designations</option>
        {designations.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.code})
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Field Team</h1>
        <p className="text-gray-600 mt-1">Manage field team members</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={{ ...pagination, onPageChange: fetchData }}
        onView={(item) => navigate(`/admin/field-team/${item.id}`)}
        onEdit={(item) => navigate(`/admin/field-team/${item.id}/edit`)}
        onDelete={handleDelete}
        onSearch={setSearch}
        onExport={handleExport}
        onImport={handleImport}
        onCreate={() => navigate('/admin/field-team/create')}
        searchPlaceholder="Search by name, employee ID..."
        filters={filterComponent}
      />
    </div>
  );
};

export default FieldTeamList;
