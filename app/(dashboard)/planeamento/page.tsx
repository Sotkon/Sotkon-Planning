'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, X, Calendar as CalendarIcon, Filter, RefreshCw } from 'lucide-react';

export default function DragDropCalendarBoard() {
  const language = 'pt';
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // O estado 'calendar' será sincronizado com a Base de Dados
  const [calendar, setCalendar] = useState({}); 
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState([1, 2, 3]);

  // 1. Fetch dos dados - Pedimos todos os estados 1, 2 e 3
  const { data: ordersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['all-orders-calendar', language],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio: '2024-01-01', // Data ampla para apanhar tudo
        language: language,
        estadoId: '1,2,3', // Garante que a API traz os 3 estados
        countryId: '0',
        pageIndex: '0',
        pageSize: '2000'
      });

      const res = await fetch(`/api/cargas?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar dados');
      return res.json();
    },
    refetchOnWindowFocus: true
  });

  // 2. SINCRONIZAÇÃO: Sempre que os dados chegam da API, atualizamos o calendário
  useEffect(() => {
    if (ordersData?.items) {
      const newCalendar = {};
      ordersData.items.forEach(order => {
        // Se a encomenda já tem data na BD, ela vai para o calendário
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

  // 3. FILTRO PAINEL ESQUERDO: Apenas o que NÃO tem data na BD
  const ordersLeftPanel = useMemo(() => {
    if (!ordersData?.items) return [];

    return ordersData.items.filter(order => {
      // Regra 1: Não pode ter data definida (para aparecer à esquerda)
      if (order.dataPrevistaDeCarga) return false;

      // Regra 2: O estado tem de estar nos filtros ativos (forçar Number para evitar erro de string)
      if (!activeFilters.includes(Number(order.estadoId))) return false;

      // Regra 3: Pesquisa de texto
      if (searchText) {
        const s = searchText.toLowerCase();
        return (
          order.cliente?.toLowerCase().includes(s) ||
          order.encomendaPrimavera?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [ordersData, activeFilters, searchText]);

  // Funções de manipulação
  const handleDrop = async (e, day) => {
    e.preventDefault();
    if (!draggedOrder) return;

    const scheduledDate = new Date(year, month, day, 12, 0, 0);
    
    // 1. Atualização Otimista (imediata na UI)
    const dateKey = `${year}-${month + 1}-${day}`;
    setCalendar(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), { ...draggedOrder, dataPrevistaDeCarga: scheduledDate.toISOString() }]
    }));

    // 2. Gravação na Base de Dados (Persistência para todos os users)
    try {
      await fetch(`/api/cargas/${draggedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            dataPrevistaDeCarga: scheduledDate.toISOString(),
            estadoId: 3 // Opcional: Mudar para 'Agendada' automaticamente
        })
      });
      refetch(); // Atualiza os dados reais
    } catch (err) {
      alert("Erro ao gravar. Tente novamente.");
      refetch();
    }
    setDraggedOrder(null);
  };

  const handleRemove = async (order) => {
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

  // Cálculo de datas
  const getDaysInMonth = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    return { daysInMonth: total, startingDayOfWeek: first, year: y, month: m };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const getOrderColor = (id) => {
    const n = Number(id);
    if (n === 1) return 'bg-yellow-400 text-yellow-950';
    if (n === 2) return 'bg-amber-700 text-white';
    if (n === 3) return 'bg-blue-500 text-white';
    return 'bg-gray-500';
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white p-4 gap-4 overflow-hidden">
      
      {/* PAINEL ESQUERDO */}
      <div className="w-80 flex flex-col bg-neutral-900 rounded-xl border border-neutral-800">
        <div className="p-4 border-b border-neutral-800 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold">A Planear</h2>
            {isFetching && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
            <input 
              className="w-full bg-black border border-neutral-800 rounded-md py-1.5 pl-8 text-sm outline-none focus:border-blue-500"
              placeholder="Pesquisar..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          <div className="flex gap-1">
            {[1, 2, 3].map(id => (
              <button
                key={id}
                onClick={() => setActiveFilters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                className={`flex-1 text-[9px] py-1.5 rounded font-bold uppercase transition-all ${
                  activeFilters.includes(id) 
                  ? (id === 1 ? 'bg-yellow-400 text-black' : id === 2 ? 'bg-amber-700' : 'bg-blue-500')
                  : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {id === 1 ? 'Nova' : id === 2 ? 'A Definir' : 'Agendada'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {ordersLeftPanel.map(order => (
            <div
              key={order.id}
              draggable
              onDragStart={() => setDraggedOrder(order)}
              className={`${getOrderColor(order.estadoId)} p-3 rounded-lg cursor-grab shadow-lg border border-white/5 active:scale-95 transition-all`}
            >
              <div className="text-[10px] font-black opacity-60 uppercase">{order.encomendaPrimavera}</div>
              <div className="text-xs font-bold truncate">{order.cliente}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PAINEL DIREITO - CALENDÁRIO */}
      <div className="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-neutral-800">
          <h2 className="text-xl font-black capitalize">
            {new Intl.DateTimeFormat('pt', { month: 'long', year: 'numeric' }).format(currentMonth)}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 bg-neutral-800 rounded">←</button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 text-xs font-bold bg-neutral-800 rounded uppercase">Hoje</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 bg-neutral-800 rounded">→</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-neutral-600 uppercase">{d}</div>
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
                  className={`min-h-[120px] rounded-lg border transition-all ${
                    isValid ? 'bg-black/20 border-neutral-800' : 'border-transparent'
                  }`}
                >
                  {isValid && (
                    <div className="p-2 h-full">
                      <div className="text-xs font-bold text-neutral-600">{day}</div>
                      <div className="mt-2 space-y-1">
                        {dayOrders.map(o => (
                          <div
                            key={o.id}
                            onClick={() => handleRemove(o)}
                            className={`${getOrderColor(o.estadoId)} text-[10px] p-1.5 rounded font-bold cursor-pointer hover:scale-105 transition-all`}
                          >
                            <div className="truncate">{o.encomendaPrimavera}</div>
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
    </div>
  );
}
