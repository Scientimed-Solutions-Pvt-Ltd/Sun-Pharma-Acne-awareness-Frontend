import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import {
  getHqs,
  deleteHq,
  getAllZones,
  getAllRegions,
} from '../../services/adminApi';
import type { Hq, Zone, Region } from '../../services/adminApi';

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
    zone_id: 0,
    region_id: 0,
  });
  const [zones, setZones] = useState<Zone[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  const fetchData = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const response = await getHqs({
          page,
          search,
          zone_id: filters.zone_id || undefined,
          region_id: filters.region_id || undefined,
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
    if (filters.zone_id) {
      getAllRegions(filters.zone_id).then((res) => {
        if (res.success) setRegions(res.data);
      });
    } else {
      setRegions([]);
      setFilters((prev) => ({ ...prev, region_id: 0 }));
    }
  }, [filters.zone_id]);

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
      key: 'zone',
      title: 'Zone',
      render: (item: Hq) => item.zone?.name || '-',
    },
    {
      key: 'region',
      title: 'Region',
      render: (item: Hq) => item.region?.name || '-',
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
        value={filters.zone_id}
        onChange={(e) =>
          setFilters({ zone_id: Number(e.target.value), region_id: 0 })
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
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, region_id: Number(e.target.value) }))
        }
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
