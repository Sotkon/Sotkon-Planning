'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, X, Calendar as CalendarIcon, Filter, RefreshCw } from 'lucide-react';

export default function DragDropCalendarBoard() {
  const language = 'pt';
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Estado do calendário sincronizado com a BD
  const [calendar, setCalendar] = useState<Record<string, any[]>>({}); 
  const [draggedOrder, setDraggedOrder] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState([1, 2, 3]);

  // 1. Fetch das encomendas (Mesmos parâmetros da sua página de listagem)
  const { data: ordersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cargas-planeamento', language],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio: '2024-01-01', // Busca alargada para captar agendamentos
        language: language,
        estadoId: '0', // Buscamos todos para filtrar no cliente com segurança
        countryId: '0',
        pageIndex: '0',
        pageSize: '1000', 
        textToSearch: ''
      });

      const res = await fetch(`/api/cargas?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar encomendas');
      return res.json();
    },
    refetchInterval: 30000 // Atualiza automaticamente a cada 30s para ver mudanças de outros users
  });

  // 2. Sincronização: Mapeia o que já tem data para o calendário
  useEffect(() => {
    if (ordersData?.items) {
      const newCalendar: Record<string, any[]> = {};
      ordersData.items.forEach((order: any) => {
        if (order.dataPrevistaDeCarga) {
          const date = new Date(order.dataPrevistaDeCarga);
          const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          if (!newCalendar[dateKey]) newCalendar[dateKey] = [];
          newCalendar[dateKey].push(order);
        }
      });
      setCalendar(newCalendar);
    }
  }, [ordersData]);

  // 3. Painel Esquerdo: Filtragem rigorosa (Reforço de Tipos)
  const ordersLeftPanel = useMemo(() => {
    if (!ordersData?.items) return [];

    return ordersData.items.filter((order: any) => {
      // Regra A: Só aparece à esquerda se NÃO tiver data na BD (está por planear)
      if (order.dataPrevistaDeCarga) return false;

      // Regra B: Filtragem por Estado (Normalização para Number)
      const estadoId = Number(order.estadoId);
      if (!activeFilters.includes(estadoId)) return false;

      // Regra C: Pesquisa
      if (searchText) {
        const s = searchText.toLowerCase();
        return (
          order.cliente?.toLowerCase().includes(s) ||
          order.encomendaPrimavera?.toLowerCase().includes(s) ||
          order.obra?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [ordersData, activeFilters, searchText]);

  // Lógica de Drag & Drop com Persistência na API
  const handleDrop = async (e: React.DragEvent, day: number) => {
    e.preventDefault();
    if (!draggedOrder) return;

    // Criamos a data ao meio-dia para evitar problemas de fuso horário/UTC
    const scheduledDate = new Date(year, month, day, 12, 0, 0);
    
    // UI Otimista: Movemos logo no ecrã
    const dateKey = `${year}-${month + 1}-${day}`;
    setCalendar(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), draggedOrder]
    }));

    try {
      const res = await fetch(`/api/cargas/${draggedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            dataPrevistaDeCarga: scheduledDate.toISOString(),
            // Ao arrastar, podemos opcionalmente forçar o estado para "Agendada" (3)
            estadoId: Number(draggedOrder.estadoId) === 1 ? 3 : draggedOrder.estadoId 
        })
      });

      if (!res.ok) throw new Error();
      refetch(); // Sincroniza com a BD para confirmar
    } catch (err) {
      alert("Erro ao gravar no servidor. Verifique a ligação.");
      refetch();
    }
    setDraggedOrder(null);
  };

  const handleRemove = async (order: any) => {
    try {
      await fetch(`/api/cargas/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPrevistaDeCarga: null })
      });
      refetch();
    } catch (err) {
      console.error("Erro ao remover agendamento", err);
    }
  };

  // Funções Auxiliares de Calendário
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
      case 1: return 'bg-yellow-400 text-yellow-950'; // Nova
      case 2: return 'bg-amber-700 text-white';      // A Definir
      case 3: return 'bg-blue-500 text-white';       // Agendada
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white p-4 gap-4 overflow-hidden">
      
      {/* PAINEL ESQUERDO: ENCOMENDAS PENDENTES */}
      <div className="w-80 flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl">
        <div className="p-4 border-b border-neutral-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2 text-blue-400">
              <Filter className="w-4 h-4" /> Pendentes
            </h2>
            {isFetching && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
            <input 
              className="w-full bg-black border border-neutral-800 rounded-lg py-2 pl-8 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ref ou Cliente..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          <div className="flex gap-1">
            {[1, 2, 3].map(id => (
              <button
                key={id}
                onClick={() => setActiveFilters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                className={`flex-1 text-[9px] py-2 rounded font-black uppercase transition-all ${
                  activeFilters.includes(id) 
                  ? (id === 1 ? 'bg-yellow-400 text-black' : id === 2 ? 'bg-amber-700' : 'bg-blue-500')
                  : 'bg-neutral-800 text-neutral-600'
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
              className={`${getOrderColor(order.estadoId)} p-3 rounded-lg cursor-grab active:cursor-grabbing shadow-md border border-white/5 hover:scale-[1.02] transition-transform`}
            >
              <div className="text-[10px] font-black opacity-70 mb-1">{order.encomendaPrimavera || 'S/ REF'}</div>
              <div className="text-xs font-bold truncate">{order.cliente}</div>
              {order.obra && <div className="text-[10px] mt-1 opacity-80 italic">Obra: {order.obra}</div>}
            </div>
          ))}
          {ordersLeftPanel.length === 0 && !isLoading && (
            <div className="text-center py-10 text-neutral-600 text-xs italic">
              Nenhuma encomenda pendente com estes filtros.
            </div>
          )}
        </div>
      </div>

      {/* PAINEL DIREITO: CALENDÁRIO DE PRODUÇÃO */}
      <div className="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col shadow-xl overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/50">
          <h2 className="text-xl font-black capitalize flex items-center gap-3">
            <CalendarIcon className="text-blue-500" />
            {new Intl.DateTimeFormat('pt', { month: 'long', year: 'numeric' }).format(currentMonth)}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 hover:bg-neutral-800 rounded-lg border border-neutral-700 transition-colors">←</button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 text-xs font-bold hover:bg-neutral-800 rounded-lg border border-neutral-700 uppercase">Hoje</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 hover:bg-neutral-800 rounded-lg border border-neutral-700 transition-colors">→</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-neutral-600 uppercase mb-2">{d}</div>
            ))}
            
            {Array.from({ length: Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7 }).map((_, i) => {
              const day = i - startingDayOfWeek + 1;
              const isValid = day > 0 && day <= daysInMonth;
              const dateKey = `${year}-${month + 1}-${day}`;
              const dayOrders = calendar[dateKey] || [];

              return (
                <div
                  key={i}
                  onDragOver={e => e.preventDefault()}
                  onDrop={isValid ? e => handleDrop(e, day) : null}
                  className={`min-h-[130px] rounded-xl border transition-all ${
                    isValid ? 'bg-black/20 border-neutral-800 hover:border-neutral-700' : 'border-transparent opacity-0'
                  }`}
                >
                  {isValid && (
                    <div className="p-2 h-full flex flex-col">
                      <span className="text-xs font-bold text-neutral-500">{day}</span>
                      <div className="mt-2 space-y-1 overflow-y-auto max-h-[100px] custom-scrollbar-mini">
                        {dayOrders.map((o: any) => (
                          <div
                            key={o.id}
                            onClick={() => handleRemove(o)}
                            title="Clique para remover do calendário"
                            className={`${getOrderColor(o.estadoId)} text-[10px] p-1.5 rounded-md font-bold cursor-pointer hover:brightness-110 shadow-sm animate-in zoom-in-95`}
                          >
                            <div className="truncate">{o.encomendaPrimavera}</div>
                            <div className="truncate opacity-80 font-normal text-[9px]">{o.cliente}</div>
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar-mini::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar-mini::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
