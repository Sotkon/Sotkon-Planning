'use client';

import { useState, useEffect, useCallback } from 'react';
import LoginView from '@/components/LoginView';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import PlanningView from '@/components/PlanningView';
import CargasView from '@/components/CargasView';
import ShopfloorView from '@/components/ShopfloorView';
import AutocontroloView from '@/components/AutocontroloView';
import AdminView from '@/components/AdminView';
import { User, LoadOrder, Carga, cargaToLoadOrder } from '@/lib/types';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface DashboardStats {
  total: number;
  active: number;
  byState: Record<string, number>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [orders, setOrders] = useState<LoadOrder[]>([]); // Orders for Encomendas page (paginated)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null); // Stats for Dashboard
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openNewOrder, setOpenNewOrder] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(" --:-- ");
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(new Date().getFullYear());
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Fetch dashboard stats (count only - lightweight)
  const fetchDashboardStats = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(`/api/cargas/count?year=${currentYear}`);
      if (response.ok) {
        const stats = await response.json();
        setDashboardStats(stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, []);

  // Fetch paginated orders (for Encomendas page)
  const fetchCargas = useCallback(async (
    page: number = 1,
    append: boolean = false,
    year?: number | null,
    dateRange?: { start: string; end: string },
    limit: number = 50
  ) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Use provided values or fall back to current state
      const selectedYear = year !== undefined ? year : yearFilter;
      const selectedDateRange = dateRange !== undefined ? dateRange : dateRangeFilter;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      // Date range takes priority over year filter (sent to API for server-side filtering)
      if (selectedDateRange.start || selectedDateRange.end) {
        if (selectedDateRange.start) params.append('dateStart', selectedDateRange.start);
        if (selectedDateRange.end) params.append('dateEnd', selectedDateRange.end);
      } else if (selectedYear !== null) {
        // Only add year filter if no date range is set
        params.append('year', selectedYear.toString());
      }

      const response = await fetch(`/api/cargas?${params}`);
      if (response.ok) {
        const result = await response.json();
        const cargas: Carga[] = result.data;
        const loadOrders = cargas.map(cargaToLoadOrder);

        if (append) {
          setOrders(prev => {
            const existingIds = new Set(prev.map(o => o.id));
            const newOrders = loadOrders.filter(o => !existingIds.has(o.id));
            return [...prev, ...newOrders];
          });
        } else {
          setOrders(loadOrders);
        }
        setPagination(result.pagination);
      } else {
        console.error('Failed to fetch cargas');
      }
    } catch (error) {
      console.error('Error fetching cargas:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [yearFilter, dateRangeFilter]);

  const loadMoreCargas = useCallback(() => {
    if (pagination && pagination.hasMore && !loadingMore) {
      if (currentPath === '/global-planning' || currentPath === '/planeamento') return; // No custom infinite scroll for planning yet, as we load all
      fetchCargas(pagination.page + 1, true);
    }
  }, [pagination, loadingMore, fetchCargas, currentPath]);

  const handleYearFilterChange = useCallback((year: number | null) => {
    setYearFilter(year);
    // Clear date range when year is selected
    if (year !== null) {
      setDateRangeFilter({ start: '', end: '' });
    }
    setOrders([]);
    // Determine limit based on current path
    const limit = (currentPath === '/planeamento') ? 1000 : 50;
    fetchCargas(1, false, year, year !== null ? { start: '', end: '' } : dateRangeFilter, limit);
  }, [fetchCargas, dateRangeFilter, currentPath]);

  const handleDateRangeFilterChange = useCallback((start: string, end: string) => {
    const newDateRange = { start, end };
    setDateRangeFilter(newDateRange);
    // Clear year when date range is selected
    if (start || end) {
      setYearFilter(null);
    }
    setOrders([]);
    const limit = (currentPath === '/planeamento') ? 1000 : 50;
    fetchCargas(1, false, (start || end) ? null : yearFilter, newDateRange, limit);
  }, [fetchCargas, yearFilter, currentPath]);

  const runPrimaveraSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      const now = new Date();
      setLastSyncTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);

      // Executa sync silenciosamente
      const response = await fetch('/api/primavera/sync', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (data.linhasInseridas > 0) {
          // Se houve novos dados, recarrega as stats e a lista
          fetchDashboardStats();
          fetchCargas();
        }
      }
    } catch (err) {
      console.error('Auto-sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchCargas, fetchDashboardStats]);

  const handleManualSync = async () => {
    await runPrimaveraSync();
  };

  // Carregar dados quando o utilizador entra
  useEffect(() => {
    if (user) {
      // Fetch dashboard stats and orders in parallel
      Promise.all([fetchDashboardStats(), fetchCargas()]).then(() => {
        runPrimaveraSync();
      });
    }
  }, [user, fetchDashboardStats, fetchCargas, runPrimaveraSync]);

  // Verificar sessão ao carregar
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (err) {
        console.error('Session check failed', err);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed', err);
    }
    setUser(null);
    setCurrentPath('/');
  };

  const handleUpdateOrder = (updatedOrder: LoadOrder) => {
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleAddOrder = (newOrder: LoadOrder) => {
    setOrders([...orders, newOrder]);
    setOpenNewOrder(false);
  };

  const handleUpdateOrders = (updatedOrders: LoadOrder[]) => {
    setOrders(updatedOrders);
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setOpenNewOrder(false);
    
    // Auto-reload data with appropriate limit when switching views
    if (path === '/planeamento') {
       // Load ALL (or effectively all) for Gantt
       setOrders([]);
       fetchCargas(1, false, yearFilter, dateRangeFilter, 1000);
    } else if (path === '/encomendas') {
       // Reset to paginated view
       setOrders([]);
       fetchCargas(1, false, yearFilter, dateRangeFilter, 50);
    } else if (path === '/') {
        // Dashboard needs stats, maybe recent orders
        // Keep existing orders if they are there, or re-fetch default
        if (orders.length === 0 || orders.length > 50) {
            setOrders([]);
            fetchCargas(1, false, yearFilter, dateRangeFilter, 50);
        }
    }
  };

  const handleNewOrderFromSidebar = () => {
    setCurrentPath('/encomendas');
    setOpenNewOrder(true);
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentPath) {
      case '/':
        return (
          <DashboardView
            orders={orders}
            stats={dashboardStats}
            onTriggerNewOrder={handleNewOrderFromSidebar}
            onSync={handleManualSync}
            onAddOrder={handleAddOrder}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            isLoading={loading}
            user={user}
            onNavigate={handleNavigate}
          />
        );
      case '/planeamento':
        return (
          <PlanningView
            orders={orders}
            onUpdateOrders={handleUpdateOrders}
            yearFilter={yearFilter}
            onYearFilterChange={handleYearFilterChange}
            totalCount={pagination?.total || 0}
          />
        );
      case '/encomendas':
        return (
          <CargasView
            orders={orders}
            onUpdateOrder={handleUpdateOrder}
            onAddOrder={handleAddOrder}
            initialOpenNew={openNewOrder}
            onLoadMore={loadMoreCargas}
            hasMore={pagination?.hasMore || false}
            isLoadingMore={loadingMore}
            yearFilter={yearFilter}
            onYearFilterChange={handleYearFilterChange}
            dateRangeFilter={dateRangeFilter}
            onDateRangeFilterChange={handleDateRangeFilterChange}
            totalCount={pagination?.total || 0}
          />
        );
      case '/shopfloor':
        return <ShopfloorView />;
      case '/autocontrolo':
        return <AutocontroloView />;
      case '/admin':
        return <AdminView />;
      default:
        return (
          <DashboardView
            orders={orders}
            stats={dashboardStats}
            onTriggerNewOrder={handleNewOrderFromSidebar}
            onSync={handleManualSync}
            onAddOrder={handleAddOrder}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            isLoading={loading}
            user={user}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden">
      <Sidebar
        user={user}
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-hidden ml-64">
        {renderView()}
      </main>
    </div>
  );
}
