import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { getZones, deleteZone } from '../../services/adminApi';
import type { Zone } from '../../services/adminApi';

const ZonesList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });
  const [search, setSearch] = useState('');

  const fetchData = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const response = await getZones({ page, search });
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
        console.error('Failed to fetch zones:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (item: Zone) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    try {
      await deleteZone(item.id);
      fetchData(pagination.currentPage);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const columns = [
    { key: 'name', title: 'Zone Name' },
    {
      key: 'regions_count',
      title: 'Regions',
      render: (item: Zone) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {item.regions_count || 0}
        </span>
      ),
    },
    {
      key: 'field_teams_count',
      title: 'Field Teams',
      render: (item: Zone) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {item.field_teams_count || 0}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (item: Zone) =>
        item.created_at
          ? new Date(item.created_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '-',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Zones</h1>
        <p className="text-gray-600 mt-1">Manage zones</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={{ ...pagination, onPageChange: fetchData }}
        onEdit={(item) => navigate(`/admin/masters/zones/${item.id}/edit`)}
        onDelete={handleDelete}
        onSearch={setSearch}
        onCreate={() => navigate('/admin/masters/zones/create')}
        searchPlaceholder="Search zones..."
      />
    </div>
  );
};

export default ZonesList;
