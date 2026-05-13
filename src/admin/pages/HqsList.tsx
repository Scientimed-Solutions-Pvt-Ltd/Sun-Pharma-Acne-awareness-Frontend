import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import {
  getHqs,
  deleteHq,
  getAllStates,
} from '../../services/adminApi';
import type { Hq, State } from '../../services/adminApi';

const HqsList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Hq[]>([]);
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
  });
  const [states, setStates] = useState<State[]>([]);

  const fetchData = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const response = await getHqs({
          page,
          search,
          state_id: filters.state_id || undefined,
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
        console.error('Failed to fetch HQs:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [search, filters]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const loadStates = async () => {
      try {
        const response = await getAllStates();
        if (response.success) setStates(response.data);
      } catch (error) {
        console.error('Failed to load states:', error);
      }
    };
    loadStates();
  }, []);

  const handleDelete = async (item: Hq) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    try {
      await deleteHq(item.id);
      fetchData(pagination.currentPage);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const columns = [
    { key: 'name', title: 'HQ Name' },
    {
      key: 'state',
      title: 'State',
      render: (item: Hq) => item.state?.name || '-',
    },
    {
      key: 'field_teams_count',
      title: 'Field Teams',
      render: (item: Hq) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {item.field_teams_count || 0}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (item: Hq) =>
        item.created_at
          ? new Date(item.created_at).toLocaleDateString('en-IN', {
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
        value={filters.state_id}
        onChange={(e) =>
          setFilters({ state_id: Number(e.target.value) })
        }
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
      >
        <option value={0}>All States</option>
        {states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">HQs</h1>
        <p className="text-gray-600 mt-1">Manage headquarters</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={{ ...pagination, onPageChange: fetchData }}
        onEdit={(item) => navigate(`/admin/masters/hqs/${item.id}/edit`)}
        onDelete={handleDelete}
        onSearch={setSearch}
        onCreate={() => navigate('/admin/masters/hqs/create')}
        searchPlaceholder="Search HQs..."
        filters={filterComponent}
      />
    </div>
  );
};

export default HqsList;
