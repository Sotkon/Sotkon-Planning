'use client'

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Loader2, Search, X, Calendar, Filter, XCircle, Save, AlertCircle } from 'lucide-react';

// --- CONFIGURAÇÃO DE FERIADOS PORTUGAL (Fixos) ---
const isHoliday = (d: number, m: number) => {
  const holidays = [
    '1-0', '25-3', '1-4', '10-5', '15-7', '5-9', '1-10', '1-11', '8-11', '25-11'
  ];
  return holidays.includes(`${d}-${m}`);
};

// --- MODAL DE EDIÇÃO ---
const OrderDetailModal = ({ order, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    estadoId: Number(order.estadoId),
    dataPrevistaDeCarga: order.dataPrevistaDeCarga 
      ? new Date(order.dataPrevistaDeCarga).toISOString().split('T')[0] 
      : ''
  });
  const [error, setError] = useState('');

  if (!order) return null;

  const handleSaveClick = () => {
    setError('');
    
    // Validação: Se estado for "Agendada" (3), data é obrigatória
    if (formData.estadoId === 3 && !formData.dataPrevistaDeCarga) {
      setError('Estado "Agendada" requer uma data prevista.');
      return;
    }

    const dateToSend = formData.dataPrevistaDeCarga 
      ? new Date(formData.dataPrevistaDeCarga + 'T12:00:00').toISOString() 
      : null;

    onSave(order.id, {
      estadoId: Number(formData.estadoId),
      dataPrevistaDeCarga: dateToSend
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {order.encomendaPrimavera || 'S/ Ref'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <XCircle className="w-8 h-8" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="bg-red-900/20 border border-red-600 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Cliente / Obra</p>
            <p className="text-lg font-semibold text-white">{order.cliente}</p>
            <p className="text-sm text-blue-300">{order.projecto || order.obra || '-'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
              <select 
                value={formData.estadoId}
                onChange={(e) => setFormData({...formData, estadoId: Number(e.target.value)})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={1}>Nova</option>
                <option value={2}>A Definir</option>
                <option value={3}>Agendada</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Data Prevista {formData.estadoId === 3 && <span className="text-red-400">*</span>}
              </label>
              <input 
                type="date" 
                value={formData.dataPrevistaDeCarga}
                onChange={(e) => setFormData({...formData, dataPrevistaDeCarga: e.target.value})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Mercadoria</label>
            <div className="bg-neutral-950 p-3 rounded border border-neutral-800 text-sm text-gray-400 min-h-[60px] max-h-[120px] overflow-y-auto">
              {order.mercadoria || 'Sem descrição.'}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                A gravar...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Gravar Alterações
              </>
            )}
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
  
  const [draggedOrder, setDraggedOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState([1, 2, 3]);

  // 1. QUERY (Leitura de Dados)
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['cargas-planeamento', language],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio: '2024-01-01',
        estadoId: '0', 
        pageSize: '2000'
      });
      const res = await fetch(`/api/cargas?${params}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erro API: ${res.status} - ${errorText}`);
      }
      return res.json();
    },
    refetchOnWindowFocus: true, 
    staleTime: 1000 * 60,
    retry: 2
  });

  // 2. MUTATION (Gravação de Dados)
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: any }) => {
      console.log('🔄 Enviando atualização:', { id, payload });
      
      const res = await fetch(`/api/cargas/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Falha ao gravar: ${res.status}`);
      }
      
      const result = await res.json();
      console.log('✅ Atualização bem-sucedida:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('✅ Mutation success, invalidando queries...');
      queryClient.invalidateQueries({ queryKey: ['cargas-planeamento'] });
      setSelectedOrder(null);
      setDraggedOrder(null);
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutation:', error);
      alert(`Erro ao gravar alterações: ${error.message || 'Erro desconhecido'}`);
    }
  });

  // 3. Processamento dos Dados
  const { calendar, ordersLeftPanel } = useMemo(() => {
    const cal: Record<string, any[]> = {};
    const left: any[] = [];

    if (ordersData?.items) {
      ordersData.items.forEach((order: any) => {
        const matches = activeFilters.includes(Number(order.estadoId)) && 
          (!searchText || 
            (order.cliente + order.encomendaPrimavera + (order.projecto || '')).toLowerCase().includes(searchText.toLowerCase())
          );

        if (!matches) return;

        const isNova = Number(order.estadoId) === 1;
        
        if (isNova || !order.dataPrevistaDeCarga) {
          left.push(order);
        } else {
          const date = new Date(order.dataPrevistaDeCarga);
          const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          if (!cal[dateKey]) cal[dateKey] = [];
          cal[dateKey].push(order);
        }
      });
    }
    return { calendar: cal, ordersLeftPanel: left };
  }, [ordersData, activeFilters, searchText]);

  // --- HANDLERS ---
  const handleDragStart = (e: React.DragEvent, order: any) => {
    console.log('🎯 Drag start:', order.encomendaPrimavera);
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', order.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('🏁 Drag end');
    setDraggedOrder(null);
    setDragOverDay(null);
  };

  const handleDragOver = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(day);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📦 Drop no dia:', day);
    
    if (!draggedOrder) {
      console.warn('⚠️ Nenhuma encomenda arrastada');
      return;
    }

    const { year, month } = getDaysInMonth(currentMonth);
    const scheduledDate = new Date(year, month, day, 12, 0, 0);
    
    console.log('📅 Data agendada:', scheduledDate.toISOString());
    
    // REGRA: "Nova" (1) -> muda para "A Definir" (2)
    // Outros estados mantêm-se
    const currentEstadoId = Number(draggedOrder.estadoId);
    const newEstadoId = currentEstadoId === 1 ? 2 : currentEstadoId;
    
    console.log('🔄 Estado:', { atual: currentEstadoId, novo: newEstadoId });
    
    updateOrderMutation.mutate({
      id: draggedOrder.id,
      payload: { 
        dataPrevistaDeCarga: scheduledDate.toISOString(),
        estadoId: newEstadoId
      }
    });
    
    setDraggedOrder(null);
    setDragOverDay(null);
  };

  const handleRemoveDate = (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if(confirm(`Remover "${order.encomendaPrimavera}" do calendário e voltar para Pendentes (Estado: Nova)?`)) {
      console.log('🗑️ Removendo do calendário:', order.id);
      updateOrderMutation.mutate({
        id: order.id,
        payload: { 
          dataPrevistaDeCarga: null,
          estadoId: 1
        }
      });
    }
  };

  const handleModalSave = (id, payload) => {
    console.log('💾 Gravando do modal:', { id, payload });
    updateOrderMutation.mutate({ id, payload });
  };

  // --- CONFIGURAÇÃO CALENDÁRIO ---
  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const firstDayObj = new Date(y, m, 1);
    let startDay = firstDayObj.getDay(); 
    const totalDays = new Date(y, m + 1, 0).getDate();
    return { totalDays, startDay, year: y, month: m };
  };

  const { totalDays, startDay, year, month } = getDaysInMonth(currentMonth);

  const getOrderColor = (id: any) => {
    const n = Number(id);
    if (n === 1) return 'bg-yellow-500 text-black border-yellow-600';
    if (n === 2) return 'bg-amber-700 text-white border-amber-600';
    if (n === 3) return 'bg-blue-600 text-white border-blue-500';
    return 'bg-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">A carregar dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="bg-red-900/20 border border-red-600 p-6 rounded-xl max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-center">Erro ao carregar dados</h3>
          <p className="text-sm text-gray-300 text-center">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-white p-4 gap-4 overflow-hidden font-sans">
      
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onSave={handleModalSave}
          isSaving={updateOrderMutation.isPending}
        />
      )}

      {/* --- PAINEL ESQUERDO --- */}
      <div className="w-80 flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl">
        <div className="p-4 border-b border-neutral-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2 text-white">
              <Filter className="w-4 h-4 text-blue-500" /> Pendentes
            </h2>
            <span className="bg-neutral-800 text-xs px-2 py-1 rounded text-gray-400">
              {ordersLeftPanel.length}
            </span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input 
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 pl-9 text-sm focus:border-blue-500 outline-none"
              placeholder="Pesquisar..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          <div className="flex gap-1">
            {[1, 2, 3].map(id => (
              <button
                key={id}
                onClick={() => setActiveFilters(prev => 
                  prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                )}
                className={`flex-1 text-[10px] py-1.5 rounded font-bold uppercase border transition-all ${
                  activeFilters.includes(id) 
                  ? (id === 1 ? 'bg-yellow-500 text-black border-yellow-500' : 
                     id === 2 ? 'bg-amber-700 border-amber-700' : 
                     'bg-blue-600 border-blue-600')
                  : 'border-neutral-700 text-gray-500'
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
              onDragStart={(e) => handleDragStart(e, order)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedOrder(order)}
              className={`${getOrderColor(order.estadoId)} p-3 rounded-lg cursor-grab active:cursor-grabbing border shadow-md hover:scale-[1.01] transition-transform ${
                draggedOrder?.id === order.id ? 'opacity-50' : ''
              }`}
            >
              <div className="text-[10px] font-black uppercase opacity-80 mb-1">
                {order.encomendaPrimavera}
              </div>
              <div className="text-xs font-bold truncate">{order.cliente}</div>
              {order.projecto && (
                <div className="text-[10px] opacity-75 truncate mt-0.5">{order.projecto}</div>
              )}
            </div>
          ))}
          {ordersLeftPanel.length === 0 && (
            <div className="text-center py-10 text-gray-600 text-xs">Sem pendentes.</div>
          )}
        </div>
      </div>

      {/* --- PAINEL DIREITO (CALENDÁRIO) --- */}
      <div className="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col shadow-xl overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black capitalize flex items-center gap-2">
              <Calendar className="text-blue-500" />
              {new Intl.DateTimeFormat('pt', { month: 'long', year: 'numeric' }).format(currentMonth)}
            </h2>
            {updateOrderMutation.isPending && (
              <div className="text-xs text-blue-400 flex gap-2 items-center">
                <Loader2 className="w-3 h-3 animate-spin"/> A gravar...
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentMonth(new Date(year, month - 1))} 
              className="p-2 hover:bg-neutral-800 rounded border border-neutral-700 transition-colors"
            >
              ←
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())} 
              className="px-3 text-xs font-bold hover:bg-neutral-800 rounded border border-neutral-700 uppercase transition-colors"
            >
              Hoje
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(year, month + 1))} 
              className="p-2 hover:bg-neutral-800 rounded border border-neutral-700 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        {/* GRELHA SEMANAL (5 DIAS) */}
        <div className="flex-1 overflow-y-auto p-4 bg-neutral-950/50">
          <div className="grid grid-cols-5 gap-3 h-full content-start">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase py-2 border-b border-neutral-800 mb-2">
                {d}
              </div>
            ))}
            
            {/* Renderização dos Dias Úteis */}
            {(() => {
              const daysElements = [];
              for (let d = 1; d <= totalDays; d++) {
                const dateCheck = new Date(year, month, d);
                const weekDay = dateCheck.getDay();
                
                if (weekDay === 0 || weekDay === 6) continue;

                const isHoly = isHoliday(d, month);
                const dateKey = `${year}-${month + 1}-${d}`;
                const dayOrders = calendar[dateKey] || [];
                const isDragOver = dragOverDay === d;

                daysElements.push(
                  <div
                    key={d}
                    onDragOver={(e) => handleDragOver(e, d)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, d)}
                    className={`min-h-[160px] rounded-xl border transition-all relative group/day 
                      ${isHoly ? 'bg-red-900/10 border-red-900/30' : 'bg-neutral-900 border-neutral-800'}
                      ${isDragOver ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'hover:border-neutral-600'}
                    `}
                  >
                    <div className="p-2 h-full flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold ${isHoly ? 'text-red-400' : 'text-gray-500'}`}>
                          {d} {isHoly && '★'}
                        </span>
                        {isHoly && (
                          <span className="text-[9px] uppercase text-red-500 font-bold tracking-widest">
                            Feriado
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar-mini pr-1">
                        {dayOrders.map((o: any) => (
                          <div
                            key={o.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, o)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedOrder(o)}
                            className={`${getOrderColor(o.estadoId)} p-2 rounded border shadow-sm cursor-grab active:cursor-grabbing hover:brightness-110 transition-all relative group/card ${
                              draggedOrder?.id === o.id ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="text-[10px] font-black uppercase opacity-90">
                              {o.encomendaPrimavera}
                            </div>
                            <div className="text-xs font-semibold truncate text-white/90">
                              {o.cliente}
                            </div>
                            {o.projecto && (
                              <div className="text-[9px] text-blue-100 truncate">{o.projecto}</div>
                            )}
                            
                            <button 
                              onClick={(e) => handleRemoveDate(o, e)}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity shadow hover:bg-red-600 z-10"
                              title="Remover do calendário"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return daysElements;
            })()}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #404040; border-radius: 4px; }
        .custom-scrollbar-mini::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-mini::-webkit-scrollbar-thumb { background: #525252; border-radius: 3px; }
      `}</style>
    </div>
  );
}
