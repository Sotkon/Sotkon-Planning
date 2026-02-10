
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Eye,
  Edit3,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Package as PackageIcon,
  Search,
  Calendar,
  Globe,
  ClipboardList,
  X,
  Trash2,
  Clock,
  Euro,
  Truck,
  Building2,
  Save,
  CheckCircle,
  Plus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { LoadStatus, LoadOrder, OrderState } from '@/lib/types';
import { STATUS_COLORS, STATUS_ICONS } from '@/lib/constants';

// State color map for order states
const ORDER_STATE_COLORS: Record<string, string> = {
  'NOVA': '#F59E0B',
  'A DEFINIR': '#06B6D4',
  'AGENDADA': '#3B82F6',
  'REALIZADA': '#10B981',
};

interface CargasViewProps {
  orders: LoadOrder[];
  onUpdateOrder: (order: LoadOrder) => void;
  onAddOrder: (order: LoadOrder) => void;
  initialOpenNew?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  yearFilter?: number | null;
  onYearFilterChange?: (year: number | null) => void;
  dateRangeFilter?: { start: string; end: string };
  onDateRangeFilterChange?: (start: string, end: string) => void;
  totalCount?: number;
}

type SortKey = keyof LoadOrder;

const CargasView: React.FC<CargasViewProps> = ({
  orders,
  onUpdateOrder,
  onAddOrder,
  initialOpenNew,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  yearFilter,
  onYearFilterChange,
  dateRangeFilter = { start: '', end: '' },
  onDateRangeFilterChange,
  totalCount = 0
}) => {
  const [displayMode, setDisplayMode] = useState<'TABLE' | 'CARDS'>('TABLE'); // Alterado para TABLE por defeito para visualizar a ordenação
  const [selectedOrder, setSelectedOrder] = useState<LoadOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewOrder, setIsNewOrder] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Sort State - Inicializado por Data de Carga Ascendente
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({
    key: 'startDate',
    direction: 'asc'
  });

  // Filter States (local filters that don't require API call)
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState('TODOS');
  const [erpStateFilter, setErpStateFilter] = useState('ATIVAS');

  // Infinite scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Infinite scroll observer
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore && onLoadMore) {
          onLoadMore();
        }
      },
      {
        root: null, // Use viewport as root for better detection
        rootMargin: '200px', // Trigger 200px before reaching the bottom
        threshold: 0
      }
    );

    observer.observe(trigger);

    return () => {
      observer.unobserve(trigger);
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  const handleNewOrderClick = () => {
    // Template para nova encomenda com todos os campos da tabela cargas
    const newOrder: LoadOrder = {
      id: `ORD-${Date.now()}`,
      orderNumber: '',
      clientOrder: '',
      client: '',
      destination: '',
      country: '',
      market: 'PT',
      status: LoadStatus.PENDING,
      orderState: 'NOVA',
      startDate: '',
      startTime: '',
      deliveryDeadline: '',
      ganttStart: '', // dataInicio - início produção
      ganttEnd: '', // dataFim - fim produção
      progress: 0,
      weight: 0,
      project: '',
      mercadoria: '',
      mercadoriaMissing: '',
      paymentConditions: '',
      transportador: '',
      transportCosts: 0,
      contacts: '',
      services: {
        transporte: false,
        instalacao: false,
        obraCivil: false,
        sotkisAccess: false,
        sotkisLevel: false,
        sotcare: false
      }
    };
    setSelectedOrder(newOrder);
    setIsNewOrder(true);
    setIsViewOnly(false);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (initialOpenNew) {
      handleNewOrderClick();
    }
  }, [initialOpenNew]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredOrders = useMemo(() => {
    // 1. Filtering (local filters only - date range is handled by API)
    let result = orders.filter(order => {
      const matchesSearch =
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.mercadoria.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMarket = marketFilter === 'TODOS' || order.market === marketFilter;
      const matchesErpState =
        erpStateFilter === 'TODOS' ? true :
        erpStateFilter === 'ATIVAS' ? order.orderState !== 'REALIZADA' :
        order.orderState === erpStateFilter;

      // Note: Date range filtering is now done server-side via API
      return matchesSearch && matchesMarket && matchesErpState;
    });

    // 2. Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        // Tratamento de Datas
        if (sortConfig.key === 'startDate' || sortConfig.key === 'deliveryDeadline') {
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // Tratamento de Números
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Tratamento de Strings (incluindo estados e mercados)
        const strA = String(aValue).toLowerCase();
        const strB = String(bValue).toLowerCase();
        
        return sortConfig.direction === 'asc'
          ? strA.localeCompare(strB, 'pt-PT')
          : strB.localeCompare(strA, 'pt-PT');
      });
    }

    return result;
  }, [orders, searchTerm, marketFilter, erpStateFilter, sortConfig]);

  const handleEditClick = (order: LoadOrder) => {
    setSelectedOrder({ ...order });
    setIsNewOrder(false);
    setIsViewOnly(false);
    setIsModalOpen(true);
  };

  const handleViewClick = (order: LoadOrder) => {
    setSelectedOrder({ ...order });
    setIsNewOrder(false);
    setIsViewOnly(true);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (selectedOrder) {
      if (isNewOrder) {
        onAddOrder(selectedOrder);
      } else {
        onUpdateOrder(selectedOrder);
      }
      setIsModalOpen(false);
      setSelectedOrder(null);
    }
  };

  // Ícone de ordenação inteligente
  const SortIndicator = ({ column }: { column: SortKey }) => {
    const isActive = sortConfig?.key === column;
    if (!isActive) {
      return <ArrowUpDown size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-blue-500 animate-in slide-in-from-bottom-1 duration-200 ml-auto" /> 
      : <ChevronDown size={14} className="text-blue-500 animate-in slide-in-from-top-1 duration-200 ml-auto" />;
  };

  const renderTable = () => (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="text-[9px] text-gray-500 uppercase tracking-wider bg-[#1a1a1a] sticky top-0 z-20">
            <tr className="border-b border-[#333]">
              <th
                className={`px-3 py-4 font-black cursor-pointer hover:bg-white/5 transition-colors group select-none w-[100px] ${sortConfig?.key === 'startDate' ? 'text-white bg-white/[0.03]' : ''}`}
                onClick={() => handleSort('startDate')}
              >
                <div className="flex items-center gap-1">
                  Data <SortIndicator column="startDate" />
                </div>
              </th>
              <th
                className={`px-3 py-4 font-black cursor-pointer hover:bg-white/5 transition-colors group select-none w-[140px] ${sortConfig?.key === 'project' ? 'text-white bg-white/[0.03]' : ''}`}
                onClick={() => handleSort('project')}
              >
                <div className="flex items-center gap-1">
                  Projeto <SortIndicator column="project" />
                </div>
              </th>
              <th
                className={`px-3 py-4 font-black cursor-pointer hover:bg-white/5 transition-colors group select-none ${sortConfig?.key === 'client' ? 'text-white bg-white/[0.03]' : ''}`}
                onClick={() => handleSort('client')}
              >
                <div className="flex items-center gap-1">
                  Cliente <SortIndicator column="client" />
                </div>
              </th>
              <th
                className={`px-3 py-4 font-black cursor-pointer hover:bg-white/5 transition-colors group select-none hidden xl:table-cell ${sortConfig?.key === 'mercadoria' ? 'text-white bg-white/[0.03]' : ''}`}
                onClick={() => handleSort('mercadoria')}
              >
                <div className="flex items-center gap-1">
                  Mercadoria <SortIndicator column="mercadoria" />
                </div>
              </th>
              <th
                className={`px-3 py-4 font-black cursor-pointer hover:bg-white/5 transition-colors group select-none w-[120px] hidden lg:table-cell ${sortConfig?.key === 'destination' ? 'text-white bg-white/[0.03]' : ''}`}
                onClick={() => handleSort('destination')}
              >
                <div className="flex items-center gap-1">
                  Destino <SortIndicator column="destination" />
                </div>
              </th>
              <th
                className={`px-3 py-4 font-black cursor-pointer hover:bg-white/5 transition-colors group select-none w-[90px] ${sortConfig?.key === 'orderState' ? 'text-white bg-white/[0.03]' : ''}`}
                onClick={() => handleSort('orderState')}
              >
                <div className="flex items-center gap-1">
                  Estado <SortIndicator column="orderState" />
                </div>
              </th>
              <th className="px-3 py-4 font-black text-right bg-[#1a1a1a] w-[70px]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {sortedAndFilteredOrders.map((order, idx) => {
              const d = new Date(order.startDate);
              const isActiveRow = sortConfig?.key;
              return (
                <tr key={`${order.id}-${idx}`} className="hover:bg-white/5 transition-colors group">
                  <td className={`px-3 py-3 transition-colors ${isActiveRow === 'startDate' ? 'bg-white/[0.01]' : ''}`}>
                    <div className="flex flex-col">
                      <span className="text-white font-black text-[10px] uppercase whitespace-nowrap">
                        {d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-[9px] text-gray-500 font-bold">{order.startTime}</span>
                    </div>
                  </td>
                  <td className={`px-3 py-3 transition-colors ${isActiveRow === 'project' ? 'bg-white/[0.01]' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: ORDER_STATE_COLORS[order.orderState] || STATUS_COLORS[order.status] }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-blue-500 font-black text-[10px] uppercase truncate">{order.project}</span>
                        <span className="text-[9px] text-gray-400 font-mono truncate">{order.orderNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`px-3 py-3 transition-colors ${isActiveRow === 'client' ? 'bg-white/[0.01]' : ''}`}>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-white font-black uppercase truncate">{order.client}</span>
                      <span className="text-[9px] text-gray-500 font-medium italic truncate">{order.clientOrder}</span>
                    </div>
                  </td>
                  <td className={`px-3 py-3 transition-colors hidden xl:table-cell ${isActiveRow === 'mercadoria' ? 'bg-white/[0.01]' : ''}`}>
                    <p className="text-[10px] text-gray-400 font-medium line-clamp-2 italic leading-relaxed">
                      {order.mercadoria || <span className="text-gray-600">N/D</span>}
                    </p>
                  </td>
                  <td className={`px-3 py-3 transition-colors hidden lg:table-cell ${isActiveRow === 'destination' ? 'bg-white/[0.01]' : ''}`}>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <MapPin size={10} className="text-blue-500 shrink-0" />
                      <span className="truncate uppercase">{order.destination}</span>
                    </div>
                  </td>
                  <td className={`px-3 py-3 transition-colors ${isActiveRow === 'orderState' ? 'bg-white/[0.01]' : ''}`}>
                    <span
                      className="px-1.5 py-0.5 rounded border text-[8px] font-black uppercase whitespace-nowrap"
                      style={{
                        backgroundColor: `${ORDER_STATE_COLORS[order.orderState] || '#333'}15`,
                        borderColor: `${ORDER_STATE_COLORS[order.orderState] || '#333'}40`,
                        color: ORDER_STATE_COLORS[order.orderState] || '#9CA3AF'
                      }}
                    >
                      {order.orderState}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <div className="flex items-center justify-end gap-0">
                      <button onClick={() => handleViewClick(order)} className="p-1.5 text-gray-500 hover:text-emerald-500 transition-colors" title="Ver"><Eye size={14} /></button>
                      <button onClick={() => handleEditClick(order)} className="p-1.5 text-gray-500 hover:text-blue-500 transition-colors" title="Editar"><Edit3 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedAndFilteredOrders.map((order, idx) => {
        const date = new Date(order.startDate);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('pt-PT', { month: 'short' }).toUpperCase().replace('.', '');
        const weekday = date.toLocaleString('pt-PT', { weekday: 'short' }).replace('.', '');
        const stateColor = ORDER_STATE_COLORS[order.orderState] || STATUS_COLORS[order.status];

        return (
          <div key={`${order.id}-${idx}`} className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl overflow-hidden flex flex-col group hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-300">
            <div className="flex" style={{ backgroundColor: stateColor }}>
              <div className="bg-white/10 p-4 flex flex-col justify-center items-center min-w-[70px] border-r border-black/5">
                <span className="text-[10px] font-bold text-white/80 uppercase">{weekday}</span>
                <span className="text-3xl font-black text-white">{day}</span>
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between items-end text-right">
                <span className="text-xs font-black text-white uppercase tracking-wider">{month}</span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-white">{order.project}</span>
                  <span className="text-[9px] font-medium text-white/60">{order.clientOrder}</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 flex-1">
              <h3 className="text-lg font-black text-white leading-tight uppercase line-clamp-2 min-h-[3rem]">
                {order.client || "SEM CLIENTE"}
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-black text-gray-300 leading-snug uppercase">
                    {order.destination || "DESTINO A DEFINIR"}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <PackageIcon size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-gray-200 line-clamp-3 italic leading-relaxed">
                    {order.mercadoria || "Nenhuma mercadoria discriminada"}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#333] flex justify-between items-center bg-[#222]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Estado ERP</span>
                <span className="text-[10px] font-black text-gray-300 uppercase">
                  {order.orderState}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleViewClick(order)} className="p-2 text-gray-500 hover:text-emerald-500 transition-colors" title="Ver Detalhes">
                  <Eye size={18} />
                </button>
                <button onClick={() => handleEditClick(order)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors" title="Editar">
                  <Edit3 size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={scrollContainerRef} className="p-8 animate-in slide-in-from-bottom-4 duration-500 h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Gestão de Encomendas</h2>
          <p className="text-gray-500 font-medium italic">Administração de encomendas e planeamento de produção.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleNewOrderClick}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus size={18} /> Nova Encomenda
          </button>
          <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-[#333]">
            <button 
              onClick={() => setDisplayMode('TABLE')}
              className={`p-2 rounded-lg transition-all ${displayMode === 'TABLE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setDisplayMode('CARDS')}
              className={`p-2 rounded-lg transition-all ${displayMode === 'CARDS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6 bg-[#1a1a1a] p-4 rounded-2xl border border-[#333] shadow-xl">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Calendar size={12} /> Ano
          </label>
          <select
            value={yearFilter || ''}
            onChange={(e) => {
              const selectedYear = e.target.value ? parseInt(e.target.value, 10) : null;
              onYearFilterChange?.(selectedYear);
              // Clear date range when year is selected (handled by parent)
            }}
            className={`w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-600 outline-none cursor-pointer appearance-none font-medium ${!yearFilter ? 'text-gray-500' : ''}`}
          >
            <option value="">Todos os Anos</option>
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Search size={12} /> Pesquisa
          </label>
          <input
            type="text"
            placeholder="Cliente, Projeto, Mercadoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-600 outline-none transition-all placeholder:text-gray-700 font-medium"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Globe size={12} /> Mercado
          </label>
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-600 outline-none cursor-pointer appearance-none font-medium"
          >
            <option value="TODOS">Todos os Mercados</option>
            <option value="PT">PT</option>
            <option value="SP">SP</option>
            <option value="FR">FR</option>
            <option value="INT">INT</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            <ClipboardList size={12} /> Estado Encomenda
          </label>
          <select
            value={erpStateFilter}
            onChange={(e) => setErpStateFilter(e.target.value)}
            className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-600 outline-none cursor-pointer appearance-none font-medium"
          >
            <option value="TODOS">Todos os Estados</option>
            <option value="ATIVAS">Ativas (Não Realizadas)</option>
            <option value="NOVA">Nova</option>
            <option value="AGENDADA">Agendada</option>
            <option value="A DEFINIR">A Definir</option>
            <option value="REALIZADA">Realizada</option>
          </select>
        </div>

        <div className="space-y-2 col-span-2 lg:col-span-1">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Calendar size={12} /> Data Carga (Intervalo)
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={dateRangeFilter.start}
              onChange={(e) => {
                onDateRangeFilterChange?.(e.target.value, dateRangeFilter.end);
              }}
              className="flex-1 bg-[#121212] border border-[#333] rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-600 outline-none transition-all [color-scheme:dark] font-medium"
              title="Data início"
            />
            <span className="text-gray-500 text-xs font-bold">a</span>
            <input
              type="date"
              value={dateRangeFilter.end}
              onChange={(e) => {
                onDateRangeFilterChange?.(dateRangeFilter.start, e.target.value);
              }}
              className="flex-1 bg-[#121212] border border-[#333] rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-600 outline-none transition-all [color-scheme:dark] font-medium"
              title="Data fim"
            />
            {(dateRangeFilter.start || dateRangeFilter.end) && (
              <button
                onClick={() => {
                  // Clear date range and restore year filter to current year
                  onDateRangeFilterChange?.('', '');
                  onYearFilterChange?.(currentYear);
                }}
                className="p-2 text-gray-500 hover:text-white transition-colors"
                title="Limpar datas"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Count indicator */}
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
          {sortedAndFilteredOrders.length} de {totalCount} encomendas
          {yearFilter && ` em ${yearFilter}`}
          {(dateRangeFilter.start || dateRangeFilter.end) && !yearFilter && (
            <span className="ml-1">
              {dateRangeFilter.start && dateRangeFilter.end
                ? `de ${new Date(dateRangeFilter.start).toLocaleDateString('pt-PT')} a ${new Date(dateRangeFilter.end).toLocaleDateString('pt-PT')}`
                : dateRangeFilter.start
                  ? `a partir de ${new Date(dateRangeFilter.start).toLocaleDateString('pt-PT')}`
                  : `até ${new Date(dateRangeFilter.end).toLocaleDateString('pt-PT')}`
              }
            </span>
          )}
        </span>
      </div>
      
      {displayMode === 'TABLE' ? renderTable() : renderCards()}

      {/* Infinite scroll trigger */}
      <div ref={loadMoreTriggerRef} className="py-8 flex justify-center">
        {isLoadingMore && (
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">A carregar mais...</span>
          </div>
        )}
        {!hasMore && orders.length > 0 && (
          <span className="text-xs text-gray-600 font-medium">
            Todas as {orders.length} encomendas carregadas
          </span>
        )}
      </div>

      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#161616] border border-[#333] w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isViewOnly ? 'bg-emerald-600/10 text-emerald-500' : 'bg-blue-600/10 text-blue-500'}`}>
                  {isViewOnly ? <Eye size={24} /> : isNewOrder ? <Plus size={24} /> : <Edit3 size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    {isViewOnly ? 'Detalhes da Encomenda' : isNewOrder ? 'Criar Nova Encomenda' : 'Editar Encomenda'}
                  </h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {isNewOrder ? 'Preencha os dados técnicos da encomenda' : `${selectedOrder.orderNumber} • ${selectedOrder.project}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              {/* SECÇÃO 1: Informação Básica */}
              <div className="space-y-6">
                <h3 className={`text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-l-4 ${isViewOnly ? 'border-emerald-600' : 'border-blue-600'} pl-3`}>Informação Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cliente *</label>
                    <input readOnly={isViewOnly} type="text" value={selectedOrder.client} onChange={e => setSelectedOrder({...selectedOrder, client: e.target.value})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 disabled:opacity-50" placeholder="Nome do Cliente" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Projecto</label>
                    <input readOnly={isViewOnly} type="text" value={selectedOrder.project} onChange={e => setSelectedOrder({...selectedOrder, project: e.target.value})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 disabled:opacity-50" placeholder="Referência do Projecto" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Encomenda Primavera</label>
                    <input readOnly={isViewOnly} type="text" value={selectedOrder.orderNumber} onChange={e => setSelectedOrder({...selectedOrder, orderNumber: e.target.value})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 font-mono disabled:opacity-50" placeholder="ENC 2025/..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Encomenda do Cliente</label>
                    <input readOnly={isViewOnly} type="text" value={selectedOrder.clientOrder} onChange={e => setSelectedOrder({...selectedOrder, clientOrder: e.target.value})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 disabled:opacity-50" placeholder="Ref. Cliente" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">País / Mercado</label>
                    <select disabled={isViewOnly} value={selectedOrder.market} onChange={e => setSelectedOrder({...selectedOrder, market: e.target.value as any})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 disabled:opacity-70">
                      <option value="PT">PT - Portugal</option>
                      <option value="SP">SP - Espanha</option>
                      <option value="FR">FR - França</option>
                      <option value="INT">INT - Internacional</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado</label>
                    <select disabled={isViewOnly} value={selectedOrder.orderState} onChange={e => setSelectedOrder({...selectedOrder, orderState: e.target.value as any})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 disabled:opacity-70">
                      <option value="NOVA">Nova</option>
                      <option value="A DEFINIR">A Definir</option>
                      <option value="AGENDADA">Agendada</option>
                      <option value="REALIZADA">Realizada</option>
                    </select>
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Localização / Destino</label>
                    <input readOnly={isViewOnly} type="text" value={selectedOrder.destination} onChange={e => setSelectedOrder({...selectedOrder, destination: e.target.value})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 disabled:opacity-50" placeholder="Morada de entrega" />
                  </div>
                </div>
              </div>

              {/* SECÇÃO 2: Datas e Prazos */}
              <div className="space-y-6">
                <h3 className={`text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-l-4 border-amber-500 pl-3`}>Datas e Prazos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Data Início Produção</label>
                    <input readOnly={isViewOnly} type="date" value={selectedOrder.ganttStart ? selectedOrder.ganttStart.split('T')[0] : ''} onChange={e => setSelectedOrder({...selectedOrder, ganttStart: e.target.value || ''})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white [color-scheme:dark] outline-none focus:border-blue-600 disabled:opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Data Fim Produção</label>
                    <input readOnly={isViewOnly} type="date" value={selectedOrder.ganttEnd ? selectedOrder.ganttEnd.split('T')[0] : ''} onChange={e => setSelectedOrder({...selectedOrder, ganttEnd: e.target.value || ''})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white [color-scheme:dark] outline-none focus:border-blue-600 disabled:opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Data Prevista de Carga</label>
                    <input readOnly={isViewOnly} type="date" value={selectedOrder.startDate ? selectedOrder.startDate.split('T')[0] : ''} onChange={e => setSelectedOrder({...selectedOrder, startDate: e.target.value ? new Date(e.target.value).toISOString() : ''})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white [color-scheme:dark] outline-none focus:border-blue-600 disabled:opacity-50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Prazo de Entrega Previsto</label>
                    <input readOnly={isViewOnly} type="text" value={selectedOrder.deliveryDeadline} onChange={e => setSelectedOrder({...selectedOrder, deliveryDeadline: e.target.value})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 disabled:opacity-50" placeholder="Ex: 15 dias úteis" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Condições de Pagamento</label>
                    <input readOnly={isViewOnly} type="text" value={selectedOrder.paymentConditions} onChange={e => setSelectedOrder({...selectedOrder, paymentConditions: e.target.value})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 disabled:opacity-50" placeholder="Ex: 30 dias" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Contactos para Entrega</label>
                    <input readOnly={isViewOnly} type="text" value={selectedOrder.contacts} onChange={e => setSelectedOrder({...selectedOrder, contacts: e.target.value})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 disabled:opacity-50" placeholder="Nome / Telefone" />
                  </div>
                </div>
              </div>

              {/* SECÇÃO 3: Mercadoria - Table format */}
              <div className="space-y-6">
                <h3 className={`text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-3`}>Mercadoria</h3>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Descrição da Mercadoria</label>
                  {isViewOnly ? (
                    <div className="bg-[#0f0f0f] border border-[#333] rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#333] bg-[#1a1a1a]">
                            <th className="px-4 py-2 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest w-20">Qtd</th>
                            <th className="px-4 py-2 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Descrição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const items = selectedOrder.mercadoria ? selectedOrder.mercadoria.split('|').map(item => {
                              const trimmed = item.trim();
                              const match = trimmed.match(/^(\d+)\s*[x\-]\s*(.+)/i);
                              if (match) return { qty: match[1], desc: match[2].trim() };
                              return { qty: '', desc: trimmed };
                            }).filter(item => item.desc) : [];
                            return items.length > 0 ? items.map((item, i) => (
                              <tr key={i} className="border-b border-[#222]">
                                <td className="px-4 py-2.5 text-sm text-white font-bold">{item.qty || '-'}</td>
                                <td className="px-4 py-2.5 text-sm text-white">{item.desc}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={2} className="px-4 py-3 text-sm text-gray-600 text-center">Sem mercadoria</td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <textarea value={selectedOrder.mercadoria} onChange={e => setSelectedOrder({...selectedOrder, mercadoria: e.target.value})} rows={3} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 resize-none" placeholder="Formato: Qtd x Descrição | Qtd x Descrição ..." />
                  )}
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mercadoria que Falta Entregar</label>
                  {isViewOnly ? (
                    <div className="bg-[#0f0f0f] border border-[#333] rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#333] bg-[#1a1a1a]">
                            <th className="px-4 py-2 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest w-20">Qtd</th>
                            <th className="px-4 py-2 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Descrição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const items = selectedOrder.mercadoriaMissing ? selectedOrder.mercadoriaMissing.split('|').map(item => {
                              const trimmed = item.trim();
                              const match = trimmed.match(/^(\d+)\s*[x\-]\s*(.+)/i);
                              if (match) return { qty: match[1], desc: match[2].trim() };
                              return { qty: '', desc: trimmed };
                            }).filter(item => item.desc) : [];
                            return items.length > 0 ? items.map((item, i) => (
                              <tr key={i} className="border-b border-[#222]">
                                <td className="px-4 py-2.5 text-sm text-white font-bold">{item.qty || '-'}</td>
                                <td className="px-4 py-2.5 text-sm text-white">{item.desc}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td className="px-4 py-2.5 text-sm text-gray-600 border-b border-[#222]">&nbsp;</td>
                                <td className="px-4 py-2.5 text-sm text-gray-600 border-b border-[#222]">&nbsp;</td>
                              </tr>
                            );
                          })()}
                          {/* Empty rows for future filling */}
                          <tr>
                            <td className="px-4 py-2.5 text-sm text-gray-600 border-b border-[#222]">&nbsp;</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600 border-b border-[#222]">&nbsp;</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 text-sm text-gray-600">&nbsp;</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600">&nbsp;</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <textarea value={selectedOrder.mercadoriaMissing} onChange={e => setSelectedOrder({...selectedOrder, mercadoriaMissing: e.target.value})} rows={2} className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-600 resize-none" placeholder="Itens pendentes de entrega..." />
                  )}
                </div>
              </div>

              {/* SECÇÃO 5: Serviços */}
              <div className="space-y-6">
                <h3 className={`text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-l-4 border-cyan-500 pl-3`}>Serviços Associados</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder.services.transporte ? 'bg-blue-600/10 border-blue-600' : 'bg-[#0f0f0f] border-[#333] hover:border-gray-500'} ${isViewOnly ? 'pointer-events-none opacity-70' : ''}`}>
                    <input type="checkbox" checked={selectedOrder.services.transporte} onChange={e => setSelectedOrder({...selectedOrder, services: {...selectedOrder.services, transporte: e.target.checked}})} className="sr-only" disabled={isViewOnly} />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedOrder.services.transporte ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                      {selectedOrder.services.transporte && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold text-white uppercase">Transporte</span>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder.services.instalacao ? 'bg-blue-600/10 border-blue-600' : 'bg-[#0f0f0f] border-[#333] hover:border-gray-500'} ${isViewOnly ? 'pointer-events-none opacity-70' : ''}`}>
                    <input type="checkbox" checked={selectedOrder.services.instalacao} onChange={e => setSelectedOrder({...selectedOrder, services: {...selectedOrder.services, instalacao: e.target.checked}})} className="sr-only" disabled={isViewOnly} />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedOrder.services.instalacao ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                      {selectedOrder.services.instalacao && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold text-white uppercase">Instalação</span>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder.services.obraCivil ? 'bg-blue-600/10 border-blue-600' : 'bg-[#0f0f0f] border-[#333] hover:border-gray-500'} ${isViewOnly ? 'pointer-events-none opacity-70' : ''}`}>
                    <input type="checkbox" checked={selectedOrder.services.obraCivil} onChange={e => setSelectedOrder({...selectedOrder, services: {...selectedOrder.services, obraCivil: e.target.checked}})} className="sr-only" disabled={isViewOnly} />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedOrder.services.obraCivil ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                      {selectedOrder.services.obraCivil && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold text-white uppercase">Obra Civil</span>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder.services.sotkisAccess ? 'bg-blue-600/10 border-blue-600' : 'bg-[#0f0f0f] border-[#333] hover:border-gray-500'} ${isViewOnly ? 'pointer-events-none opacity-70' : ''}`}>
                    <input type="checkbox" checked={selectedOrder.services.sotkisAccess} onChange={e => setSelectedOrder({...selectedOrder, services: {...selectedOrder.services, sotkisAccess: e.target.checked}})} className="sr-only" disabled={isViewOnly} />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedOrder.services.sotkisAccess ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                      {selectedOrder.services.sotkisAccess && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold text-white uppercase">Sotkis Access</span>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder.services.sotkisLevel ? 'bg-blue-600/10 border-blue-600' : 'bg-[#0f0f0f] border-[#333] hover:border-gray-500'} ${isViewOnly ? 'pointer-events-none opacity-70' : ''}`}>
                    <input type="checkbox" checked={selectedOrder.services.sotkisLevel} onChange={e => setSelectedOrder({...selectedOrder, services: {...selectedOrder.services, sotkisLevel: e.target.checked}})} className="sr-only" disabled={isViewOnly} />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedOrder.services.sotkisLevel ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                      {selectedOrder.services.sotkisLevel && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold text-white uppercase">Sotkis Level</span>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder.services.sotcare ? 'bg-blue-600/10 border-blue-600' : 'bg-[#0f0f0f] border-[#333] hover:border-gray-500'} ${isViewOnly ? 'pointer-events-none opacity-70' : ''}`}>
                    <input type="checkbox" checked={selectedOrder.services.sotcare} onChange={e => setSelectedOrder({...selectedOrder, services: {...selectedOrder.services, sotcare: e.target.checked}})} className="sr-only" disabled={isViewOnly} />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedOrder.services.sotcare ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                      {selectedOrder.services.sotcare && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold text-white uppercase">Sotcare</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-[#1a1a1a] border-t border-[#333] flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs tracking-[0.2em] transition-all">
                {isViewOnly ? 'Fechar Detalhes' : 'Cancelar'}
              </button>
              {!isViewOnly && (
                <button onClick={handleSave} className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 flex items-center gap-3">
                  <Save size={18} /> {isNewOrder ? 'Criar Encomenda' : 'Atualizar Encomenda'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }`}</style>
    </div>
  );
};

export default CargasView;
