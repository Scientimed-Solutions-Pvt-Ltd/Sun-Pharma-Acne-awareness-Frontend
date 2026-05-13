import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import {
  getDesignations,
  deleteDesignation,
} from '../../services/adminApi';
import type { Designation } from '../../services/adminApi';

const DesignationsList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getDesignations({ page, search });
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
      console.error('Failed to fetch designations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (item: Designation) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      await deleteDesignation(item.id);
      fetchData(pagination.currentPage);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const columns = [
    { key: 'code', title: 'Code' },
    { key: 'name', title: 'Name' },
    { key: 'level', title: 'Level' },
    {
      key: 'reports_to',
      title: 'Reports To',
      render: (item: Designation) => item.reports_to?.name || '-',
    },
    {
      key: 'field_teams_count',
      title: 'Field Teams',
      render: (item: Designation) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {item.field_teams_count || 0}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Designations</h1>
        <p className="text-gray-600 mt-1">Manage designation hierarchy</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={{ ...pagination, onPageChange: fetchData }}
        onEdit={(item) => navigate(`/admin/masters/designations/${item.id}/edit`)}
        onDelete={handleDelete}
        onSearch={setSearch}
        onCreate={() => navigate('/admin/masters/designations/create')}
        searchPlaceholder="Search by name or code..."
      />
    </div>
  );
};

export default DesignationsList;
