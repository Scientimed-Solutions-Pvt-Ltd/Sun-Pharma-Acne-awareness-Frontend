import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { getRegions, deleteRegion, getAllZones } from '../../services/adminApi';
import type { Region, Zone } from '../../services/adminApi';

const RegionsList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState(0);
  const [zones, setZones] = useState<Zone[]>([]);

  const fetchData = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const response = await getRegions({
          page,
          search,
          zone_id: zoneFilter || undefined,
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
        console.error('Failed to fetch regions:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [search, zoneFilter]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleDelete = async (item: Region) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    try {
      await deleteRegion(item.id);
      fetchData(pagination.currentPage);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const columns = [
    { key: 'name', title: 'Region Name' },
    {
      key: 'zone',
      title: 'Zone',
      render: (item: Region) => item.zone?.name || '-',
    },
    {
      key: 'hqs_count',
      title: 'HQs',
      render: (item: Region) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {item.hqs_count || 0}
        </span>
      ),
    },
    {
      key: 'field_teams_count',
      title: 'Field Teams',
      render: (item: Region) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {item.field_teams_count || 0}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (item: Region) =>
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
        value={zoneFilter}
        onChange={(e) => setZoneFilter(Number(e.target.value))}
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
      >
        <option value={0}>All Zones</option>
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Regions</h1>
        <p className="text-gray-600 mt-1">Manage regions</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pagination={{ ...pagination, onPageChange: fetchData }}
        onEdit={(item) => navigate(`/admin/masters/regions/${item.id}/edit`)}
        onDelete={handleDelete}
        onSearch={setSearch}
        onCreate={() => navigate('/admin/masters/regions/create')}
        searchPlaceholder="Search regions..."
        filters={filterComponent}
      />
    </div>
  );
};

export default RegionsList;
