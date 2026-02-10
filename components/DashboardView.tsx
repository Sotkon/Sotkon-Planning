
import React from 'react';
import {
  Factory,
  Truck,
  Megaphone,
  ShoppingCart,
  Plus,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Loader2,
  Eye,
  Edit3,
  X,
  Trash2,
  Save,
  CheckCircle
} from 'lucide-react';
import { LoadStatus, LoadOrder, User, UserRole } from '@/lib/types';
import { STATUS_COLORS } from '@/lib/constants';

interface DashboardStats {
  total: number;
  active: number;
  byState: Record<string, number>;
}

interface DashboardViewProps {
  orders: any[];
  stats: DashboardStats | null;
  onTriggerNewOrder: () => void;
  onSync: () => void;
  isSyncing: boolean;
  lastSyncTime: string;
  isLoading?: boolean;
  onAddOrder: (order: LoadOrder) => void;
  user: User;
  onNavigate: (path: string) => void;
}

// State color map for order states
const ORDER_STATE_COLORS: Record<string, string> = {
  'NOVA': '#F59E0B',
  'A DEFINIR': '#06B6D4',
  'AGENDADA': '#3B82F6',
  'REALIZADA': '#10B981',
};

const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  stats,
  onTriggerNewOrder,
  onSync,
  isSyncing,
  lastSyncTime,
  isLoading,
  onAddOrder,
  user,
  onNavigate
}) => {
  // State for Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<LoadOrder | null>(null);
  const [isNewOrder, setIsNewOrder] = React.useState(false);
  const [isViewOnly, setIsViewOnly] = React.useState(false);

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
      },
      dateCreated: new Date().toISOString()
    };
    setSelectedOrder(newOrder);
    setIsNewOrder(true);
    setIsViewOnly(false);
    setIsModalOpen(true);
  };

  const handleViewOrder = (order: LoadOrder) => {
    setSelectedOrder({ ...order });
    setIsNewOrder(false);
    setIsViewOnly(true);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (selectedOrder) {
      onAddOrder(selectedOrder);
      setIsModalOpen(false);
      setSelectedOrder(null);
    }
  };

  // Parse mercadoria string into table rows
  const parseMercadoria = (mercadoria: string): { qty: string; desc: string }[] => {
    if (!mercadoria) return [];
    return mercadoria.split('|').map(item => {
      const trimmed = item.trim();
      const match = trimmed.match(/^(\d+)\s*[x\-]\s*(.+)/i);
      if (match) return { qty: match[1], desc: match[2].trim() };
      return { qty: '', desc: trimmed };
    }).filter(item => item.desc);
  };

  // Recent orders sorted by dateCreated (uses paginated orders for display)
  const recentOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.dateCreated || a.startDate).getTime();
    const dateB = new Date(b.dateCreated || b.startDate).getTime();
    return dateB - dateA;
  });

  // Use stats from dedicated count endpoint (independent of pagination)
  const producaoTotal = stats?.total || 0;
  const expedicaoAtiva = (stats?.byState?.['AGENDADA'] || 0) + (stats?.byState?.['REALIZADA'] || 0);

  // Check if sync button should be visible (only for ADMIN or roles Produção/Expedição)
  const canSeeSync = user.role === UserRole.ADMIN || user.role === UserRole.USER;

  // Dashboard cards data
  const dashboardCards = [
    {
      label: 'Produção',
      value: producaoTotal,
      subValue: 'Encomendas Ativas',
      icon: <Factory size={28} />,
      trend: '+5.2%',
      trendUp: true,
      color: 'blue',
      clickPath: '/encomendas'
    },
    {
      label: 'Expedição',
      value: expedicaoAtiva,
      subValue: 'Cargas Agendadas',
      icon: <Truck size={28} />,
      trend: '0%',
      trendUp: true,
      color: 'emerald',
      clickPath: null
    },
    {
      label: 'Marketing',
      value: '0',
      subValue: 'Leads Qualificados',
      icon: <Megaphone size={28} />,
      trend: '0%',
      trendUp: true,
      color: 'purple',
      clickPath: null
    },
    {
      label: 'Procurement',
      value: '0',
      subValue: 'Pedidos Pendentes',
      icon: <ShoppingCart size={28} />,
      trend: '0%',
      trendUp: true,
      color: 'amber',
      clickPath: null
    },
  ];

  const lastUpdate = lastSyncTime === " --:-- " ? "Não sincronizado" : `Hoje às ${lastSyncTime}`;



  return (
    <>
    <div className="p-8 space-y-8 animate-in fade-in duration-500 h-full overflow-y-auto pb-24 custom-scrollbar">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase tracking-tighter">Dashboard Corporativo</h2>
          <p className="text-gray-500 font-medium">Gestão integrada SOTKON: Visão global de operações.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {canSeeSync && (
            <>
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] px-4 py-2 rounded-md hover:bg-[#252525] transition-colors text-sm text-white font-bold group disabled:opacity-50"
              >
                <RefreshCw size={16} className={`group-active:animate-spin ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'A Sincronizar...' : 'Sincronizar Primavera'}
              </button>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest bg-black/20 px-2 py-1 rounded border border-[#333]">
                {isSyncing ? (
                   <>
                     <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                     <span className="text-blue-500 animate-pulse">A Sincronizar...</span>
                   </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                    Última Sincronização: <span className="text-gray-400">{lastUpdate}</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((stat, idx) => (
          <div
            key={idx}
            onClick={() => stat.clickPath && onNavigate(stat.clickPath)}
            className={`bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl hover:border-gray-500 transition-all duration-300 relative overflow-hidden group ${stat.clickPath ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
          >
            {/* Background Glow Effect */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-[60px] opacity-10 transition-opacity group-hover:opacity-20 ${
              stat.color === 'blue' ? 'bg-blue-600' :
              stat.color === 'emerald' ? 'bg-emerald-600' :
              stat.color === 'purple' ? 'bg-purple-600' : 'bg-amber-600'
            }`} />

            <div className="flex justify-between items-start mb-8">
              <div className={`p-4 rounded-xl border border-white/5 bg-white/5 ${
                stat.color === 'blue' ? 'text-blue-500' :
                stat.color === 'emerald' ? 'text-emerald-500' :
                stat.color === 'purple' ? 'text-purple-500' : 'text-amber-500'
              }`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
                stat.trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
              }`}>
                {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.trend}
              </div>
            </div>

              <div className="space-y-2">
                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</h3>
                <div className="flex items-baseline gap-3">
                  {isLoading ? (
                    <div className="h-10 w-24 bg-gray-800 rounded animate-pulse" />
                  ) : (
                    <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
                  )}
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{stat.subValue}</p>
                </div>
              </div>
              {stat.clickPath && (
                <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-gray-600 group-hover:text-blue-500 transition-colors uppercase tracking-wider">
                  Ver detalhes <ArrowRight size={10} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            Fluxo de Produção Recente
          </h3>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden shadow-xl">
            {isLoading ? (
              // SKELETON LOADING STATE
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="p-5 border-b border-[#333] flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-white/5 rounded" />
                      <div className="h-3 w-24 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block space-y-2">
                      <div className="h-4 w-16 bg-white/5 rounded ml-auto" />
                      <div className="h-3 w-24 bg-white/5 rounded ml-auto" />
                    </div>
                    <div className="h-7 w-20 bg-white/5 rounded-lg" />
                  </div>
                </div>
              ))
            ) : (
              // DATA LOADED STATE
              recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map((order, idx) => {
                  const date = order.startDate ? new Date(order.startDate) : null;
                  const isValidDate = date && !isNaN(date.getTime());
                  const day = isValidDate ? date.getDate().toString().padStart(2, '0') : '--';
                  const month = isValidDate ? date.toLocaleString('pt-PT', { month: 'short' }).toUpperCase().replace('.', '') : '---';
                  const stateColor = ORDER_STATE_COLORS[order.orderState] || STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || '#333';

                  return (
                    <div
                      key={`${order.id}-${idx}`}
                      onClick={() => handleViewOrder(order)}
                      className="p-5 border-b border-[#333] flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        {/* Date box with status color - like Encomendas cards */}
                        <div
                          className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: stateColor }}
                        >
                          <span className="text-xl font-black leading-none">{day}</span>
                          <span className="text-[9px] font-bold uppercase opacity-80">{month}</span>
                        </div>
                        <div>
                          <p className="text-white font-black text-sm uppercase group-hover:text-blue-400 transition-colors">{order.client || "SEM CLIENTE"}</p>
                          <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">{order.orderNumber} • {order.project}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-white text-xs font-black uppercase">{order.destination || 'N/D'}</p>
                          <p className="text-gray-500 text-[9px] uppercase font-bold">Data Carga: {isValidDate ? date.toLocaleDateString('pt-PT') : 'A Definir'}</p>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest group-hover:border-blue-500/30 transition-all"
                          style={{ backgroundColor: `${stateColor}15`, borderColor: `${stateColor}40`, color: stateColor }}
                        >
                          {order.orderState}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                 <div className="p-8 text-center text-gray-500 text-sm font-medium">
                    Sem produção recente.
                 </div>
              )
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Ações Rápidas</h3>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={handleNewOrderClick}
              className="group flex items-center justify-between p-5 bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl shadow-inner">
                  <Plus className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <p className="text-white font-black uppercase text-xs tracking-widest">Nova Encomenda</p>
                  <p className="text-blue-100 text-[10px] font-bold uppercase opacity-70">Produção & Logística</p>
                </div>
              </div>
              <ArrowRight className="text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" size={20} />
            </button>


          </div>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }`}</style>
    </div>

      {/* MODAL */}
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
                          {parseMercadoria(selectedOrder.mercadoria).length > 0 ? (
                            parseMercadoria(selectedOrder.mercadoria).map((item, i) => (
                              <tr key={i} className="border-b border-[#222]">
                                <td className="px-4 py-2.5 text-sm text-white font-bold">{item.qty || '-'}</td>
                                <td className="px-4 py-2.5 text-sm text-white">{item.desc}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="px-4 py-3 text-sm text-gray-600 text-center">Sem mercadoria</td>
                            </tr>
                          )}
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
                          {parseMercadoria(selectedOrder.mercadoriaMissing).length > 0 ? (
                            parseMercadoria(selectedOrder.mercadoriaMissing).map((item, i) => (
                              <tr key={i} className="border-b border-[#222]">
                                <td className="px-4 py-2.5 text-sm text-white font-bold">{item.qty || '-'}</td>
                                <td className="px-4 py-2.5 text-sm text-white">{item.desc}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="px-4 py-2.5 text-sm text-gray-600 border-b border-[#222]">&nbsp;</td>
                              <td className="px-4 py-2.5 text-sm text-gray-600 border-b border-[#222]">&nbsp;</td>
                            </tr>
                          )}
                          {/* Always show empty rows for future filling */}
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

              {/* SECÇÃO 4: Serviços */}
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
    </>
  );
};

export default DashboardView;
