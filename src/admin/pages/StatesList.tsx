import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { getStates, deleteState } from '../../services/adminApi';
import type { State } from '../../services/adminApi';

const StatesList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<State[]>([]);
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
        const response = await getStates({ page, search });
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
        console.error('Failed to fetch states:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (item: State) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    try {
      await deleteState(item.id);
      fetchData(pagination.currentPage);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const columns = [
    { key: 'name', title: 'State Name' },
    {
      key: 'created_at',
      title: 'Created',
      render: (item: State) =>
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
        <h1 className="text-2xl font-bold text-gray-800">States</h1>
        <p className="text-gray-600 mt-1">Manage states</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={{ ...pagination, onPageChange: fetchData }}
        onEdit={(item) => navigate(`/admin/masters/states/${item.id}/edit`)}
        onDelete={handleDelete}
        onSearch={setSearch}
        onCreate={() => navigate('/admin/masters/states/create')}
        searchPlaceholder="Search states..."
      />
    </div>
  );
};

export default StatesList;
