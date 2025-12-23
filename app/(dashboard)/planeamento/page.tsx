'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, X, Calendar as CalendarIcon, Filter, RefreshCw, Maximize2, XCircle } from 'lucide-react';

// --- COMPONENTE MODAL DE DETALHES ---
const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-6 border-b border-neutral-800 flex justify-between items-start bg-neutral-800/50">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
              {order.encomendaPrimavera || 'Sem Nº Primavera'}
              <span className={`text-xs px-2 py-1 rounded uppercase tracking-wider font-bold 
                ${Number(order.estadoId) === 1 ? 'bg-yellow-400 text-black' : 
                  Number(order.estadoId) === 2 ? 'bg-amber-700 text-white' : 'bg-blue-500 text-white'}`}>
                {Number(order.estadoId) === 1 ? 'Nova' : Number(order.estadoId) === 2 ? 'A Definir' : 'Agendada'}
              </span>
            </h2>
            <p className="text-gray-400 text-sm">{order.cliente}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <XCircle className="w-8 h-8" />
          </button>
        </div>

        {/* Content Modal */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Projeto / Obra</span>
              <p className="text-gray-200 text-base">{order.projecto || order.obra || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Data Prevista</span>
              <p className="text-gray-200 text-base">
                {order.dataPrevistaDeCarga ? new Date(order.dataPrevistaDeCarga).toLocaleDateString() : 'Não definida'}
              </p>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Mercadoria</span>
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 text-gray-300 whitespace-pre-wrap leading-relaxed">
                {order.mercadoria || 'Sem descrição de mercadoria.'}
              </div>
            </div>
            {/* Adicione mais campos aqui conforme o seu objeto 'encomendas.tsx' */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">País</span>
              <p className="text-gray-200">{order.paisDesc || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Zona</span>
              <p className="text-gray-200">{order.zona || '-'}</p>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function DragDropCalendarBoard() {
  const language = 'pt';
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [calendar, setCalendar] = useState<Record<string, any[]>>({}); 
  const [draggedOrder, setDraggedOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // Para o Modal
  
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState([1, 2, 3]);

  // 1. Fetch Data
  const { data: ordersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cargas-planeamento', language],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio: '2024-01-01',
        language: language,
        estadoId: '0', 
        countryId: '0',
        pageIndex: '0',
        pageSize: '2000', 
        textToSearch: ''
      });
      const res = await fetch(`/api/cargas?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar');
      return res.json();
    },
    refetchInterval: 30000 
  });

  // Funções de Filtro Partilhadas (usadas tanto no painel esquerdo como no calendário)
  const matchesFilter = (order) => {
    // 1. Filtro de Estado
    if (!activeFilters.includes(Number(order.estadoId))) return false;
    
    // 2. Filtro de Texto
    if (searchText) {
      const s = searchText.toLowerCase();
      return (
        (order.cliente || '').toLowerCase().includes(s) ||
        (order.encomendaPrimavera || '').toLowerCase().includes(s) ||
        (order.projecto || order.obra || '').toLowerCase().includes(s) ||
        (order.mercadoria || '').toLowerCase().includes(s)
      );
    }
    return true;
  };

  // 2. Sincronização Calendário
  useEffect(() => {
    if (ordersData?.items) {
      const newCalendar: Record<string, any[]> = {};
      ordersData.items.forEach((order: any) => {
        // Regra Especial: Encomendas "Nova" (1) NUNCA vão para o calendário automaticamente,
        // mesmo que tenham data (ignora data de fim de ano).
        // Apenas estados 2 e 3 com data válida aparecem no calendário.
        if (order.dataPrevistaDeCarga && Number(order.estadoId) !== 1) {
          const date = new Date(order.dataPrevistaDeCarga);
          const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          if (!newCalendar[dateKey]) newCalendar[dateKey] = [];
          newCalendar[dateKey].push(order);
        }
      });
      setCalendar(newCalendar);
    }
  }, [ordersData]);

  // 3. Painel Esquerdo (Pendentes)
  const ordersLeftPanel = useMemo(() => {
    if (!ordersData?.items) return [];

    return ordersData.items.filter((order: any) => {
      // Aparece à esquerda se:
      // A. É "Nova" (1) (Sempre à esquerda por defeito)
      // OU
      // B. Não tem data definida
      const isPending = Number(order.estadoId) === 1 || !order.dataPrevistaDeCarga;

      return isPending && matchesFilter(order);
    });
  }, [ordersData, activeFilters, searchText]);

  // Drag & Drop Logic
  const handleDrop = async (e: React.DragEvent, day: number) => {
    e.preventDefault();
    if (!draggedOrder) return;

    const scheduledDate = new Date(year, month, day, 12, 0, 0);
    const dateKey = `${year}-${month + 1}-${day}`;
    
    // UI Update Otimista
    setCalendar(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), draggedOrder]
    }));

    // Se a encomenda for "Nova" (1), ao arrastar para o calendário passa a "Agendada" (3)
    // para garantir que ela "fica" no calendário e sai da esquerda.
    const newEstadoId = Number(draggedOrder.estadoId) === 1 ? 3 : draggedOrder.estadoId;

    try {
      await fetch(`/api/cargas/${draggedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            dataPrevistaDeCarga: scheduledDate.toISOString(),
            estadoId: newEstadoId 
        })
      });
      refetch();
    } catch (err) {
      alert("Erro ao gravar.");
      refetch();
    }
    setDraggedOrder(null);
  };

  const handleRemoveDate = async (order: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o modal ao clicar no botão de remover
    if(!confirm("Deseja retirar esta encomenda do planeamento?")) return;

    try {
      await fetch(`/api/cargas/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPrevistaDeCarga: null })
      });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Renderização do Cartão (Reutilizável para Esquerda e Direita)
  const renderCardContent = (order) => (
    <>
      <div className="flex justify-between items-start mb-1">
        <div className="text-[11px] font-black uppercase tracking-wider opacity-90">
          {order.encomendaPrimavera || 'S/ Ref'}
        </div>
      </div>
      
      {order.projecto && (
        <div className="text-[10px] font-bold text-blue-200 truncate mb-0.5">
          {order.projecto}
        </div>
      )}

      <div className="text-xs font-semibold truncate text-white/90 mb-1">
        {order.cliente}
      </div>

      {order.mercadoria && (
        <div className="text-[10px] opacity-70 leading-tight bg-black/20 p-1 rounded line-clamp-2 min-h-[2.4em]">
          {order.mercadoria}
        </div>
      )}
    </>
  );

  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    return { daysInMonth: total, startingDayOfWeek: first, year: y, month: m };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const getOrderColor = (id: any) => {
    const n = Number(id);
    switch(n) {
      case 1: return 'bg-yellow-600 border-yellow-500/50'; 
      case 2: return 'bg-amber-800 border-amber-700/50';
      case 3: return 'bg-blue-600 border-blue-500/50';
      default: return 'bg-neutral-700 border-neutral-600';
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white p-4 gap-4 overflow-hidden font-sans">
      
      {/* Modal de Detalhes */}
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      {/* PAINEL ESQUERDO */}
      <div className="w-80 flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl">
        <div className="p-4 border-b border-neutral-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2 text-white">
              <Filter className="w-4 h-4 text-blue-500" /> Pendentes
            </h2>
            <div className="text-xs text-neutral-500 font-mono bg-neutral-800 px-2 py-1 rounded">
              {ordersLeftPanel.length}
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 pl-9 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-neutral-600"
              placeholder="Pesquisar..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            {searchText && (
              <button onClick={() => setSearchText('')} className="absolute right-3 top-2.5 text-neutral-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3].map(id => (
              <button
                key={id}
                onClick={() => setActiveFilters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                className={`flex-1 text-[10px] py-1.5 rounded-md font-bold uppercase tracking-wide transition-all border ${
                  activeFilters.includes(id) 
                  ? (id === 1 ? 'bg-yellow-400 text-black border-yellow-400' : id === 2 ? 'bg-amber-700 text-white border-amber-700' : 'bg-blue-600 text-white border-blue-600')
                  : 'bg-transparent text-gray-300 border-neutral-700 hover:border-neutral-500' // Texto mais claro
                }`}
              >
                {id === 1 ? 'Nova' : id === 2 ? 'Definir' : 'Agend.'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {ordersLeftPanel.map((order: any) => (
            <div
              key={order.id}
              draggable
              onDragStart={() => setDraggedOrder(order)}
              onClick={() => setSelectedOrder(order)}
              className={`${getOrderColor(order.estadoId)} p-3 rounded-lg cursor-pointer border hover:brightness-110 active:scale-[0.98] transition-all shadow-md group`}
            >
              {renderCardContent(order)}
              
              {/* Badge indicando se tem data (mas é Nova) */}
              {order.dataPrevistaDeCarga && Number(order.estadoId) === 1 && (
                <div className="mt-2 pt-2 border-t border-black/10 text-[9px] flex items-center justify-between opacity-75">
                  <span>📅 {new Date(order.dataPrevistaDeCarga).toLocaleDateString()} (Ignorada)</span>
                </div>
              )}
            </div>
          ))}
          {ordersLeftPanel.length === 0 && (
             <div className="text-center py-10 opacity-40">
               <p className="text-xs">Sem resultados.</p>
             </div>
          )}
        </div>
      </div>

      {/* PAINEL DIREITO: CALENDÁRIO */}
      <div className="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col shadow-xl overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black capitalize flex items-center gap-2">
              <CalendarIcon className="text-blue-500 w-5 h-5" />
              {new Intl.DateTimeFormat('pt', { month: 'long' }).format(currentMonth)}
              <span className="text-neutral-600 font-medium">{year}</span>
            </h2>
            {/* Indicador de Filtro Ativo no Calendário */}
            {(searchText || activeFilters.length < 3) && (
              <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filtros aplicados ao calendário
              </span>
            )}
          </div>
          
          <div className="flex gap-1">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 rounded border border-neutral-700 transition-colors">←</button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 h-8 text-xs font-bold hover:bg-neutral-800 rounded border border-neutral-700 uppercase tracking-wider">Hoje</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 rounded border border-neutral-700 transition-colors">→</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-neutral-950/30">
          <div className="grid grid-cols-7 gap-2 h-full content-start">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-neutral-500 uppercase py-2">{d}</div>
            ))}
            
            {Array.from({ length: Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7 }).map((_, i) => {
              const day = i - startingDayOfWeek + 1;
              const isValid = day > 0 && day <= daysInMonth;
              const dateKey = `${year}-${month + 1}-${day}`;
              
              // Aplicar filtro também aqui!
              const dayOrders = (calendar[dateKey] || []).filter(matchesFilter);

              return (
                <div
                  key={i}
                  onDragOver={e => e.preventDefault()}
                  onDrop={isValid ? e => handleDrop(e, day) : null}
                  className={`min-h-[140px] rounded-lg border transition-all relative ${
                    isValid ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'border-transparent opacity-0 pointer-events-none'
                  }`}
                >
                  {isValid && (
                    <div className="p-2 h-full flex flex-col">
                      <span className="text-xs font-bold text-neutral-600 mb-2">{day}</span>
                      
                      <div className="space-y-1.5 overflow-y-auto flex-1 custom-scrollbar-mini pr-1">
                        {dayOrders.map((o: any) => (
                          <div
                            key={o.id}
                            onClick={() => setSelectedOrder(o)}
                            className={`${getOrderColor(o.estadoId)} p-2 rounded border shadow-sm cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all relative group`}
                          >
                            {renderCardContent(o)}
                            
                            {/* Botão X para remover (só aparece no hover) */}
                            <button 
                              onClick={(e) => handleRemoveDate(o, e)}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10"
                              title="Remover do calendário"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #404040; border-radius: 4px; }
        .custom-scrollbar-mini::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-mini::-webkit-scrollbar-thumb { background: #404040; border-radius: 4px; }
      `}</style>
    </div>
  );
}
