
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Edit3,
  X,
  Trash2,
  Save,
  Package,
  Plus,
  MapPin,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  SortAsc,
  ChevronDown,
  Globe,
  CheckCircle
} from 'lucide-react';
import { ViewMode, LoadOrder, LoadStatus, Market, OrderState } from '@/lib/types';
import { STATUS_COLORS } from '@/lib/constants';

// Order state colors for Gantt bars - mapped to actual ERP states
const ORDER_STATE_BAR_COLORS: Record<string, string> = {
  'NOVA': '#F59E0B',       // Amber
  'A DEFINIR': '#06B6D4',  // Cyan
  'AGENDADA': '#3B82F6',   // Blue
  'REALIZADA': '#10B981',  // Green
};

type SortOption = 'date-asc' | 'date-desc' | 'client-asc' | 'client-desc' | 'state' | 'market';

interface PlanningViewProps {
  orders: LoadOrder[];
  onUpdateOrders: (orders: LoadOrder[]) => void;
  yearFilter?: number | null;
  onYearFilterChange?: (year: number | null) => void;
}

const PlanningView: React.FC<PlanningViewProps> = ({ orders, onUpdateOrders, yearFilter, onYearFilterChange }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.MONTHLY);
  const [focusDate, setFocusDate] = useState(new Date());
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<LoadOrder | null>(null);

  // Sorting and filtering state
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterMarket, setFilterMarket] = useState<Market | 'ALL'>('ALL');
  const [filterState, setFilterState] = useState<OrderState | 'ALL' | 'ATIVAS'>('ALL');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  const today = useMemo(() => new Date(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const orderRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortDropdownOpen]);

  const [dragging, setDragging] = useState<{
    orderId: string;
    type: 'move' | 'resize';
    startX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  // Helper function to get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Helper function to get Monday of the week
  const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Determinar o intervalo da timeline
  const timelineRange = useMemo(() => {
    let start: Date;
    let end: Date;
    const cells: { label: string; date: Date; endDate?: Date }[] = [];

    if (viewMode === ViewMode.WEEKLY) {
      // Vista Semanal: mostra dias (2 semanas)
      start = new Date(focusDate);
      start.setDate(start.getDate() - 3);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 14);

      const temp = new Date(start);
      while (temp < end) {
        cells.push({
          label: temp.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit' }),
          date: new Date(temp)
        });
        temp.setDate(temp.getDate() + 1);
      }
    } else if (viewMode === ViewMode.MONTHLY) {
      // Vista Mensal: mostra semanas
      // Começa na segunda-feira da primeira semana do mês
      const firstDayOfMonth = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
      start = getMonday(firstDayOfMonth);

      // Termina na segunda-feira depois do fim do mês
      const lastDayOfMonth = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 0);
      const lastMonday = getMonday(lastDayOfMonth);
      end = new Date(lastMonday);
      end.setDate(end.getDate() + 7); // Incluir a última semana completa

      const temp = new Date(start);
      while (temp < end) {
        const weekEnd = new Date(temp);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekNum = getWeekNumber(temp);
        const startDay = temp.getDate();
        const endDay = weekEnd.getDate();
        const startMonth = temp.toLocaleDateString('pt-PT', { month: 'short' });
        const endMonth = weekEnd.toLocaleDateString('pt-PT', { month: 'short' });

        // Format: "Sem 6 (03-09 Fev)" ou "Sem 5 (27 Jan - 02 Fev)"
        const label = startMonth === endMonth
          ? `Sem ${weekNum} (${startDay.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')} ${startMonth})`
          : `Sem ${weekNum} (${startDay.toString().padStart(2, '0')} ${startMonth} - ${endDay.toString().padStart(2, '0')} ${endMonth})`;

        cells.push({
          label,
          date: new Date(temp),
          endDate: new Date(weekEnd)
        });
        temp.setDate(temp.getDate() + 7);
      }
    } else {
      // Vista Anual: mostra meses
      start = new Date(focusDate.getFullYear(), 0, 1);
      end = new Date(focusDate.getFullYear() + 1, 0, 1);

      const temp = new Date(start);
      while (temp < end) {
        cells.push({
          label: temp.toLocaleDateString('pt-PT', { month: 'short' }),
          date: new Date(temp)
        });
        temp.setMonth(temp.getMonth() + 1);
      }
    }

    return { start, end, cells };
  }, [viewMode, focusDate]);

  // Largura das células baseada na vista
  // Anual: meses (180px), Mensal: semanas (200px para caber o texto), Semanal: dias (120px)
  const cellWidth = viewMode === ViewMode.ANNUAL ? 180 : viewMode === ViewMode.MONTHLY ? 200 : 120;
  const totalTimelineWidth = timelineRange.cells.length * cellWidth;

  // Lógica para focar no dia atual (Scroll automático ao carregar ou mudar de modo)
  useEffect(() => {
    const scrollToToday = () => {
      if (containerRef.current) {
        const totalTime = timelineRange.end.getTime() - timelineRange.start.getTime();
        const elapsedToToday = today.getTime() - timelineRange.start.getTime();
        
        if (elapsedToToday > 0 && elapsedToToday < totalTime) {
          const scrollPos = (elapsedToToday / totalTime) * totalTimelineWidth;
          // Centraliza a linha de hoje na tela
          containerRef.current.scrollTo({
            left: scrollPos - containerRef.current.clientWidth / 2,
            behavior: 'smooth'
          });
        }
      }
    };

    // Pequeno delay para garantir que o DOM renderizou as larguras corretamente
    const timeoutId = setTimeout(scrollToToday, 100);
    return () => clearTimeout(timeoutId);
  }, [viewMode, focusDate, totalTimelineWidth]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleNext = () => {
    const next = new Date(focusDate);
    if (viewMode === ViewMode.WEEKLY) next.setDate(next.getDate() + 7);
    else if (viewMode === ViewMode.MONTHLY) next.setMonth(next.getMonth() + 1);
    else next.setFullYear(next.getFullYear() + 1);
    setFocusDate(next);
  };

  const handlePrev = () => {
    const prev = new Date(focusDate);
    if (viewMode === ViewMode.WEEKLY) prev.setDate(prev.getDate() - 7);
    else if (viewMode === ViewMode.MONTHLY) prev.setMonth(prev.getMonth() - 1);
    else prev.setFullYear(prev.getFullYear() - 1);
    setFocusDate(prev);
  };

  const getXFromDate = (date: Date | string) => {
    const d = new Date(date);
    const totalTime = timelineRange.end.getTime() - timelineRange.start.getTime();
    const elapsedTime = d.getTime() - timelineRange.start.getTime();
    return (elapsedTime / totalTime) * 100;
  };

  const getWidthFromDates = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const totalTime = timelineRange.end.getTime() - timelineRange.start.getTime();
    const duration = end.getTime() - start.getTime();
    return Math.max(0.5, (duration / totalTime) * 100);
  };

  const handleMouseDown = (e: React.MouseEvent, orderId: string, type: 'move' | 'resize') => {
    e.stopPropagation();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    setDragging({
      orderId,
      type,
      startX: e.clientX,
      initialStart: new Date(order.ganttStart || order.startDate).getTime(),
      initialEnd: new Date(order.ganttEnd || order.startDate).getTime(),
    });
    setSelectedOrderId(orderId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    const deltaX = e.clientX - dragging.startX;
    const totalTime = timelineRange.end.getTime() - timelineRange.start.getTime();
    const deltaTime = (deltaX / totalTimelineWidth) * totalTime;

    let newStart = dragging.initialStart;
    let newEnd = dragging.initialEnd;

    if (dragging.type === 'move') {
      newStart = dragging.initialStart + deltaTime;
      const d = new Date(newStart);
      d.setHours(0, 0, 0, 0);
      newStart = d.getTime();
      newEnd = newStart + (dragging.initialEnd - dragging.initialStart);
    } else {
      newEnd = dragging.initialEnd + deltaTime;
      const d = new Date(newEnd);
      d.setHours(0, 0, 0, 0);
      newEnd = d.getTime();
      if (newEnd - newStart < 86400000) newEnd = newStart + 86400000;
    }

    onUpdateOrders(orders.map(o => {
      if (o.id !== dragging.orderId) return o;
      return {
        ...o,
        ganttStart: new Date(newStart).toISOString(),
        ganttEnd: new Date(newEnd).toISOString()
      };
    }));
  };

  const handleMouseUp = async () => {
    if (dragging) {
      // Find the updated order to persist its new dates
      const updatedOrder = orders.find(o => o.id === dragging.orderId);
      if (updatedOrder && (updatedOrder.ganttStart || updatedOrder.ganttEnd)) {
        try {
          const cargaId = parseInt(updatedOrder.id, 10);
          if (!isNaN(cargaId)) {
            await fetch(`/api/cargas/${cargaId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dataInicio: updatedOrder.ganttStart ? updatedOrder.ganttStart.split('T')[0] : null,
                dataFim: updatedOrder.ganttEnd ? updatedOrder.ganttEnd.split('T')[0] : null,
              })
            });
          }
        } catch (error) {
          console.error('Failed to save Gantt dates:', error);
        }
      }
    }
    setDragging(null);
  };

  // Scroll to order in sidebar when selected from Gantt
  const scrollToOrderInSidebar = (orderId: string) => {
    const orderElement = orderRefs.current[orderId];
    if (orderElement && sidebarRef.current) {
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const orderRect = orderElement.getBoundingClientRect();

      // Check if element is not fully visible
      const isAbove = orderRect.top < sidebarRect.top + 80; // Account for sticky header
      const isBelow = orderRect.bottom > sidebarRect.bottom;

      if (isAbove || isBelow) {
        orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Handle click on Gantt bar
  const handleGanttBarClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    scrollToOrderInSidebar(orderId);
  };

  const handleEditClick = (e: React.MouseEvent, order: LoadOrder) => {
    e.stopPropagation();
    setEditingOrder({ ...order });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingOrder) {
      onUpdateOrders(orders.map(o => o.id === editingOrder.id ? editingOrder : o));
      setIsEditModalOpen(false);
      setEditingOrder(null);
    }
  };

  const mercadoriaItems = useMemo(() => {
    if (!editingOrder?.mercadoria) return [];
    return editingOrder.mercadoria.split('|').filter(s => s.trim()).map(item => {
      const parts = item.split('-');
      return {
        qty: parts[0]?.trim() || '',
        desc: parts.slice(1).join('-').trim() || ''
      };
    });
  }, [editingOrder?.mercadoria]);

  const updateMercadoriaItem = (idx: number, field: 'qty' | 'desc', value: string) => {
    if (!editingOrder) return;
    const items = [...mercadoriaItems];
    items[idx] = { ...items[idx], [field]: value };
    const serialized = items.map(i => `${i.qty} - ${i.desc}`).join(' | ');
    setEditingOrder({ ...editingOrder, mercadoria: serialized });
  };

  const addMercadoriaItem = () => {
    if (!editingOrder) return;
    const current = editingOrder.mercadoria.trim();
    const newItem = "1 - Nova Mercadoria";
    const serialized = current ? `${current} | ${newItem}` : newItem;
    setEditingOrder({ ...editingOrder, mercadoria: serialized });
  };

  const removeMercadoriaItem = (idx: number) => {
    if (!editingOrder) return;
    const items = mercadoriaItems.filter((_, i) => i !== idx);
    const serialized = items.map(i => `${i.qty} - ${i.desc}`).join(' | ');
    setEditingOrder({ ...editingOrder, mercadoria: serialized });
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      // Search filter
      const matchesSearch =
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

      // Market filter
      const matchesMarket = filterMarket === 'ALL' || order.market === filterMarket;

      // State filter
      let matchesState = true;
      if (filterState === 'ATIVAS') {
        matchesState = order.orderState !== 'REALIZADA';
      } else if (filterState !== 'ALL') {
        matchesState = order.orderState === filterState;
      }

      // Local date range filter (for sidebar filters)
      let matchesDateRange = true;
      if (filterDateStart || filterDateEnd) {
        const orderDate = order.startDate ? new Date(order.startDate) : null;
        if (orderDate) {
          if (filterDateStart) {
            matchesDateRange = matchesDateRange && orderDate >= new Date(filterDateStart);
          }
          if (filterDateEnd) {
            matchesDateRange = matchesDateRange && orderDate <= new Date(filterDateEnd);
          }
        } else {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesMarket && matchesState && matchesDateRange;
    });

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return new Date(a.startDate || '').getTime() - new Date(b.startDate || '').getTime();
        case 'date-desc':
          return new Date(b.startDate || '').getTime() - new Date(a.startDate || '').getTime();
        case 'client-asc':
          return a.client.localeCompare(b.client);
        case 'client-desc':
          return b.client.localeCompare(a.client);
        case 'state':
          const stateOrder = { 'NOVA': 1, 'A DEFINIR': 2, 'AGENDADA': 3, 'REALIZADA': 4 };
          return (stateOrder[a.orderState] || 5) - (stateOrder[b.orderState] || 5);
        case 'market':
          return a.market.localeCompare(b.market);
        default:
          return 0;
      }
    });

    return result;
  }, [orders, searchTerm, filterMarket, filterState, filterDateStart, filterDateEnd, sortOption]);

  const todayX = useMemo(() => getXFromDate(today), [today, timelineRange]);
  const isTodayInView = todayX >= 0 && todayX <= 100;

  return (
    <div 
      className={`flex flex-col h-screen overflow-hidden select-none bg-[#121212] ${dragging ? 'cursor-grabbing' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="p-6 border-b border-[#333] flex justify-between items-center z-40 bg-[#121212]">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase italic flex items-center gap-2">
              <Calendar className="text-blue-500" size={20} />
              Planeamento Industrial
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">SOTKON Shopfloor Management</p>
          </div>
          
          <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-[#333]">
            {[ViewMode.WEEKLY, ViewMode.MONTHLY, ViewMode.ANNUAL].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white'
                }`}
              >
                {mode === ViewMode.WEEKLY ? 'Semana' : mode === ViewMode.MONTHLY ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#333] px-4 py-2 rounded-xl text-white">
            <button onClick={handlePrev} className="hover:text-blue-500"><ChevronLeft size={18} /></button>
            <span className="text-[10px] font-black min-w-[140px] text-center uppercase tracking-widest">
              {viewMode === ViewMode.WEEKLY ? `Semana Atual` : 
               viewMode === ViewMode.MONTHLY ? focusDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) :
               `Ano ${focusDate.getFullYear()}`}
            </span>
            <button onClick={handleNext} className="hover:text-blue-500"><ChevronRight size={18} /></button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input 
            type="text" 
            placeholder="Pesquisar Encomenda ou Cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1a1a1a] border border-[#333] pl-9 pr-4 py-2 rounded-lg text-[11px] font-bold uppercase focus:border-blue-600 outline-none w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Restaurada com Detalhes Completos */}
        <div ref={sidebarRef} className="w-80 border-r border-[#333] bg-[#161616] overflow-y-auto flex flex-col shadow-2xl z-30 shrink-0 custom-scrollbar">
          <div className="p-4 border-b border-[#333] bg-[#161616] sticky top-0 z-10">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Painel de Cargas</h4>
              <span className="bg-blue-600/10 text-blue-500 text-[10px] px-2 py-0.5 rounded font-black">{filteredOrders.length}</span>
            </div>

            {/* Sorting and Filter Buttons */}
            <div className="flex gap-2">
              {/* Sort Dropdown */}
              <div ref={sortDropdownRef} className="relative flex-1">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-blue-600/50 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <SortAsc size={12} className="text-blue-500" />
                    {sortOption === 'date-desc' ? 'Recentes' :
                     sortOption === 'date-asc' ? 'Antigos' :
                     sortOption === 'client-asc' ? 'Cliente A-Z' :
                     sortOption === 'client-desc' ? 'Cliente Z-A' :
                     sortOption === 'state' ? 'Estado' : 'Mercado'}
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden">
                    {[
                      { value: 'date-desc', label: 'Mais Recentes' },
                      { value: 'date-asc', label: 'Mais Antigos' },
                      { value: 'client-asc', label: 'Cliente A-Z' },
                      { value: 'client-desc', label: 'Cliente Z-A' },
                      { value: 'state', label: 'Por Estado' },
                      { value: 'market', label: 'Por Mercado' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortOption(opt.value as SortOption);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide transition-all ${
                          sortOption === opt.value
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterMarket !== 'ALL' || filterState !== 'ALL' || filterDateStart || filterDateEnd
                    ? 'bg-blue-600/20 border-blue-600/50 text-blue-400'
                    : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-blue-600/50 hover:text-white'
                }`}
              >
                <Filter size={12} />
                Filtros
                {(filterMarket !== 'ALL' || filterState !== 'ALL' || filterDateStart || filterDateEnd) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>
            </div>
          </div>
          <div className="divide-y divide-[#222]">
            {filteredOrders.map(order => {
              const isSelected = selectedOrderId === order.id;
              const isOverdue = new Date(order.deliveryDeadline) < today && order.status !== LoadStatus.COMPLETED;
              return (
                <div
                  key={order.id}
                  ref={(el) => { orderRefs.current[order.id] = el; }}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-5 cursor-pointer transition-all border-l-4 relative group ${
                    isSelected ? 'bg-blue-600/10 border-blue-600' : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                       <span
                         className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase"
                         style={{
                           backgroundColor: `${ORDER_STATE_BAR_COLORS[order.orderState] || '#333'}20`,
                           color: ORDER_STATE_BAR_COLORS[order.orderState] || '#9CA3AF'
                         }}
                       >
                         {order.orderState}
                       </span>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{order.project}</span>
                    </div>
                    <button onClick={(e) => handleEditClick(e, order)} className="p-1.5 hover:bg-white/10 rounded text-gray-600 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={14} /></button>
                  </div>
                  
                  <h5 className="text-sm font-black text-white truncate uppercase mb-0.5">{order.client}</h5>
                  <p className="text-[10px] text-gray-500 font-mono mb-3">{order.orderNumber}</p>
                  
                  {/* Informação Técnica da Carga */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-[10px] text-gray-400 font-medium">
                      <MapPin size={12} className="text-blue-500 shrink-0 mt-0.5" />
                      <span className="truncate uppercase">{order.destination || 'Sem Destino'}</span>
                    </div>
                    
                    <div className="flex items-start gap-2 text-[10px] text-gray-500 italic line-clamp-2">
                      <Package size={12} className="shrink-0 mt-0.5" />
                      {order.mercadoria || 'Nenhuma mercadoria discriminada'}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-gray-400'}`}>
                        <Clock size={12} />
                        {new Date(order.deliveryDeadline).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                      </div>
                      <span className="text-[9px] bg-[#111] border border-[#333] px-2 py-0.5 rounded text-gray-400 font-black uppercase tracking-widest">{order.market}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Gantt */}
        <div className="flex-1 bg-[#0f0f0f] relative overflow-hidden flex flex-col">
          <div ref={headerRef} className="flex h-10 bg-[#121212] border-b border-[#333] shrink-0 overflow-hidden relative">
            <div className="flex h-full" style={{ width: `${totalTimelineWidth}px` }}>
              {timelineRange.cells.map((cell, idx) => {
                const isTodayCell = cell.date.toDateString() === today.toDateString();
                return (
                  <div 
                    key={idx} 
                    className={`border-r border-[#222] flex flex-col items-center justify-center text-[9px] font-black uppercase shrink-0 ${isTodayCell ? 'bg-blue-600/10 text-blue-400' : 'text-gray-600'}`}
                    style={{ width: `${cellWidth}px` }}
                  >
                    {cell.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div 
            ref={containerRef} 
            onScroll={handleScroll} 
            className="flex-1 overflow-auto relative custom-scrollbar bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:24px_24px] scroll-smooth"
          >
            <div className="relative min-h-full" style={{ width: `${totalTimelineWidth}px` }}>
              {/* Marcador Vertical "HOJE" */}
              {isTodayInView && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-rose-500 z-40 pointer-events-none"
                  style={{ left: `${todayX}%` }}
                >
                  <div className="bg-rose-500 text-white text-[8px] px-2 py-0.5 font-black absolute top-0 -left-1 rounded shadow-xl uppercase">Hoje</div>
                </div>
              )}

              <div className="absolute inset-0 flex pointer-events-none">
                {timelineRange.cells.map((_, idx) => (
                  <div key={idx} className="border-r border-[#222]/30 h-full shrink-0" style={{ width: `${cellWidth}px` }} />
                ))}
              </div>

              <div className="relative pt-4 h-full">
                {filteredOrders.map((order) => {
                  // Use ganttStart/ganttEnd for bar positioning (production period)
                  const barStart = order.ganttStart || order.startDate;
                  const barEnd = order.ganttEnd || order.startDate;
                  const left = getXFromDate(barStart);
                  const width = getWidthFromDates(barStart, barEnd);
                  const isSelected = selectedOrderId === order.id;
                  const isOverdue = order.status !== LoadStatus.COMPLETED && new Date(order.startDate) < today;
                  
                  return (
                    <div key={order.id} className={`h-14 flex relative items-center border-b border-[#222]/10 ${isSelected ? 'bg-white/[0.03]' : ''}`}>
                      <div
                        className={`absolute h-9 rounded-xl flex items-center px-4 text-[10px] font-black text-black shadow-lg transition-all ${
                          isSelected ? 'ring-2 ring-white z-20 scale-y-105 shadow-xl' : 'opacity-90 hover:opacity-100 z-10'
                        } cursor-grab active:cursor-grabbing group`}
                        style={{
                          backgroundColor: ORDER_STATE_BAR_COLORS[order.orderState] || STATUS_COLORS[order.status],
                          left: `${left}%`,
                          width: `${width}%`,
                          border: isOverdue ? '2px solid #f43f5e' : 'none'
                        }}
                        onClick={() => handleGanttBarClick(order.id)}
                        onMouseDown={(e) => handleMouseDown(e, order.id, 'move')}
                      >
                        <span className="truncate uppercase font-black tracking-tight">{order.project}</span>
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-black/10 rounded-r-xl transition-colors" 
                          onMouseDown={(e) => handleMouseDown(e, order.id, 'resize')}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="h-64" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE FILTROS */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#161616] border border-[#333] w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20">
                  <Filter size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Filtros</h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.15em]">Refinar visualização</p>
                </div>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2.5 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl text-gray-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Year Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} className="text-blue-500" />
                  Ano
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[null, 2024, 2025, 2026].map(year => (
                    <button
                      key={year ?? 'all'}
                      onClick={() => {
                        if (onYearFilterChange) {
                          onYearFilterChange(year);
                        }
                        // Clear date range when selecting year
                        if (year !== null) {
                          setFilterDateStart('');
                          setFilterDateEnd('');
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        yearFilter === year
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-[#0f0f0f] text-gray-400 border-[#333] hover:border-blue-600/50 hover:text-white'
                      }`}
                    >
                      {year ?? 'Todos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} className="text-blue-500" />
                  Período Específico
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-gray-600 uppercase">De</span>
                    <input
                      type="date"
                      value={filterDateStart}
                      onChange={(e) => {
                        setFilterDateStart(e.target.value);
                        if (e.target.value && onYearFilterChange) {
                          onYearFilterChange(null);
                        }
                      }}
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white [color-scheme:dark] outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-gray-600 uppercase">Até</span>
                    <input
                      type="date"
                      value={filterDateEnd}
                      onChange={(e) => {
                        setFilterDateEnd(e.target.value);
                        if (e.target.value && onYearFilterChange) {
                          onYearFilterChange(null);
                        }
                      }}
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-xl px-4 py-3 text-sm text-white [color-scheme:dark] outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Market Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={12} className="text-blue-500" />
                  Mercado
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['ALL', 'PT', 'SP', 'FR', 'INT'].map(market => (
                    <button
                      key={market}
                      onClick={() => setFilterMarket(market as Market | 'ALL')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        filterMarket === market
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-[#0f0f0f] text-gray-400 border-[#333] hover:border-blue-600/50 hover:text-white'
                      }`}
                    >
                      {market === 'ALL' ? 'Todos' : market}
                    </button>
                  ))}
                </div>
              </div>

              {/* State Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle size={12} className="text-blue-500" />
                  Estado
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'ALL', label: 'Todos' },
                    { value: 'ATIVAS', label: 'Ativas (Não Realizadas)' },
                    { value: 'NOVA', label: 'Nova' },
                    { value: 'A DEFINIR', label: 'A Definir' },
                    { value: 'AGENDADA', label: 'Agendada' },
                    { value: 'REALIZADA', label: 'Realizada' }
                  ].map(state => (
                    <button
                      key={state.value}
                      onClick={() => setFilterState(state.value as OrderState | 'ALL' | 'ATIVAS')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        filterState === state.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-[#0f0f0f] text-gray-400 border-[#333] hover:border-blue-600/50 hover:text-white'
                      }`}
                    >
                      {state.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-[#1a1a1a] border-t border-[#333] flex justify-between items-center">
              <button
                onClick={() => {
                  setFilterMarket('ALL');
                  setFilterState('ALL');
                  setFilterDateStart('');
                  setFilterDateEnd('');
                  if (onYearFilterChange) {
                    onYearFilterChange(new Date().getFullYear());
                  }
                }}
                className="px-6 py-3 rounded-xl bg-white/5 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5"
              >
                Limpar Filtros
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <CheckCircle size={14} />
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO ESTRUTURADO */}
      {isEditModalOpen && editingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#161616] border border-[#333] w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="px-10 py-8 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[1.25rem] bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20">
                  <Edit3 size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{editingOrder.project}</h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{editingOrder.orderNumber}</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-3 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl text-gray-500 transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Entidade Cliente</label>
                  <input type="text" value={editingOrder.client} onChange={e => setEditingOrder({...editingOrder, client: e.target.value})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-2xl px-5 py-4 text-sm text-white focus:border-blue-600 outline-none transition-all shadow-inner" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Projeto Primavera</label>
                  <input type="text" value={editingOrder.project} onChange={e => setEditingOrder({...editingOrder, project: e.target.value})} className="w-full bg-[#0f0f0f] border border-[#333] rounded-2xl px-5 py-4 text-sm text-white font-bold focus:border-blue-600 outline-none transition-all shadow-inner" />
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex justify-between items-center border-l-4 border-emerald-500 pl-5">
                  <div>
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Package size={16} className="text-emerald-500" />
                      Especificação de Mercadoria
                    </h3>
                  </div>
                  <button onClick={addMercadoriaItem} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600/10 text-emerald-500 text-[10px] font-black rounded-2xl hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-widest border border-emerald-600/20">
                    <Plus size={16} /> Adicionar Item
                  </button>
                </div>
                
                <div className="bg-[#0f0f0f] border border-[#333] rounded-[2rem] overflow-hidden shadow-2xl">
                  <table className="w-full text-left">
                    <thead className="bg-[#1a1a1a] text-[10px] font-black text-gray-500 uppercase border-b border-[#333]">
                      <tr>
                        <th className="px-8 py-5 w-32 text-center">Quant.</th>
                        <th className="px-8 py-5">Designação do Produto</th>
                        <th className="px-8 py-5 w-24 text-center">Acção</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333]">
                      {mercadoriaItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-4">
                            <input 
                              type="text" 
                              value={item.qty} 
                              onChange={e => updateMercadoriaItem(idx, 'qty', e.target.value)} 
                              className="w-full bg-transparent text-center text-white text-sm font-black outline-none border-b border-transparent focus:border-blue-600 transition-all" 
                              placeholder="0" 
                            />
                          </td>
                          <td className="px-8 py-4">
                            <input 
                              type="text" 
                              value={item.desc} 
                              onChange={e => updateMercadoriaItem(idx, 'desc', e.target.value)} 
                              className="w-full bg-transparent text-gray-300 text-sm outline-none border-b border-transparent focus:border-blue-600 transition-all" 
                              placeholder="Introduzir descrição técnica..." 
                            />
                          </td>
                          <td className="px-8 py-4 text-center">
                            <button onClick={() => removeMercadoriaItem(idx)} className="text-gray-600 hover:text-rose-500 transition-colors p-2.5 bg-rose-500/0 hover:bg-rose-500/5 rounded-xl"><Trash2 size={20} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {mercadoriaItems.length === 0 && (
                    <div className="p-16 text-center text-gray-600 italic text-sm font-medium uppercase tracking-[0.2em]">Sem artigos associados à carga</div>
                  )}
                </div>
              </div>

              {/* Datas de Planeamento de Produção */}
              <div className="space-y-5 pt-8 border-t border-[#333]">
                <div className="border-l-4 border-amber-500 pl-5">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={16} className="text-amber-500" />
                    Planeamento de Produção
                  </h3>
                  <p className="text-[9px] text-gray-600 mt-1">Define o período de produção para visualização no Gantt</p>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Data Início Produção</label>
                    <input
                      type="date"
                      value={editingOrder.ganttStart ? editingOrder.ganttStart.split('T')[0] : ''}
                      onChange={e => setEditingOrder({...editingOrder, ganttStart: e.target.value || ''})}
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-2xl px-5 py-4 text-sm text-white [color-scheme:dark] outline-none focus:border-amber-500 transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Data Fim Produção</label>
                    <input
                      type="date"
                      value={editingOrder.ganttEnd ? editingOrder.ganttEnd.split('T')[0] : ''}
                      onChange={e => setEditingOrder({...editingOrder, ganttEnd: e.target.value || ''})}
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-2xl px-5 py-4 text-sm text-white [color-scheme:dark] outline-none focus:border-amber-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10 pt-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Data Prevista de Carga</label>
                    <input
                      type="date"
                      value={editingOrder.startDate ? editingOrder.startDate.split('T')[0] : ''}
                      onChange={e => setEditingOrder({...editingOrder, startDate: e.target.value ? new Date(e.target.value).toISOString() : ''})}
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-2xl px-5 py-4 text-sm text-white [color-scheme:dark] outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Prazo de Entrega Previsto</label>
                    <input
                      type="text"
                      value={editingOrder.deliveryDeadline || ''}
                      onChange={e => setEditingOrder({...editingOrder, deliveryDeadline: e.target.value})}
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-2xl px-5 py-4 text-sm text-white outline-none transition-all shadow-inner"
                      placeholder="Ex: 15 dias úteis"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-12 py-10 bg-[#1a1a1a] border-t border-[#333] flex justify-end gap-5">
              <button onClick={() => setIsEditModalOpen(false)} className="px-10 py-4 rounded-[1.5rem] bg-white/5 text-gray-400 font-black uppercase text-xs tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-10 py-4 rounded-[1.5rem] bg-blue-600 text-white font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all flex items-center gap-4 shadow-2xl shadow-blue-600/30">
                <Save size={20} /> Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; border: 2px solid #0f0f0f; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
        .scroll-smooth { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default PlanningView;
