'use client'

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function DragDropCalendarBoard() {
  const language = 'pt';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // O calendário inicia explicitamente vazio, ignorando o que vem da BD
  const [calendar, setCalendar] = useState({}); 
  const [draggedOrder, setDraggedOrder] = useState(null);
  const queryClient = useQueryClient();

  // 1. Fetch dos dados
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['all-orders', language],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio: new Date().getFullYear() + '-01-01',
        language: language,
        estadoId: '1,2,3,4,5,6,7,8',
        countryId: '0',
        pageIndex: '0',
        pageSize: '500',
        textToSearch: ''
      });

      const res = await fetch(`/api/cargas?${params}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    staleTime: 30000
  });

  // 2. Filtramos apenas os estados desejados (Nova, A Definir, Agendada)
  const relevantOrders = useMemo(() => {
    return (ordersData?.items || []).filter(order => 
      [1, 2, 3].includes(order.estadoId)
    );
  }, [ordersData]);

  // NOTA: Removi o useEffect que preenchia o calendário automaticamente.
  // Agora o calendário obedece apenas à sua interação manual.

  // 3. Painel Esquerdo: Mostra tudo o que NÃO está no calendário local (nesta sessão)
  const ordersLeftPanel = useMemo(() => {
    // Lista de IDs que você já arrastou para o calendário
    const scheduledIds = Object.values(calendar).flat().map((o: any) => o.id);
    
    // Mostra a encomenda se ela for relevante E ainda não tiver sido arrastada
    return relevantOrders.filter(order => !scheduledIds.includes(order.id));
  }, [relevantOrders, calendar]);


  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const getOrderColor = (estadoId) => {
    const colors = {
      1: 'bg-yellow-400',    // NOVA
      2: 'bg-amber-700',     // A DEFINIR
      3: 'bg-blue-500',      // AGENDADA
      4: 'bg-green-500',     // REALIZADA
      5: 'bg-purple-500',
      6: 'bg-orange-500',
      7: 'bg-red-500',
      8: 'bg-pink-500'
    };
    return colors[estadoId] || 'bg-gray-500';
  };

  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, day) => {
    e.preventDefault();
    if (!draggedOrder) return;

    const dateKey = `${year}-${month + 1}-${day}`;
    // Define meio-dia para evitar problemas de fuso horário
    const scheduledDate = new Date(year, month, day, 12, 0, 0);

    const existingOrders = calendar[dateKey] || [];
    if (existingOrders.some(o => o.id === draggedOrder.id)) {
      setDraggedOrder(null);
      return; 
    }

    // Atualização Visual Imediata: Move da esquerda para o calendário
    setCalendar(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), { ...draggedOrder, dataPrevistaDeCarga: scheduledDate.toISOString() }]
    }));

    setDraggedOrder(null);

    // Salva na Base de Dados silenciosamente
    try {
      await fetch(`/api/cargas/${draggedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPrevistaDeCarga: scheduledDate.toISOString() })
      });
      // Não fazemos refetch aqui para não "resetar" a vista, pois queremos manter o estado visual que você criou
    } catch (error) {
      console.error('Failed to update order:', error);
      alert("Erro ao guardar na base de dados!");
      
      // Reverter visualmente em caso de erro
      setCalendar(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].filter(o => o.id !== draggedOrder.id)
      }));
    }
  };

  const handleRemoveFromCalendar = async (dateKey, order) => {
    // Ao remover do calendário, ela volta automaticamente para a esquerda (devido ao filtro ordersLeftPanel)
    setCalendar(prev => {
      const newDayList = prev[dateKey].filter(o => o.id !== order.id);
      return { ...prev, [dateKey]: newDayList };
    });

    try {
      await fetch(`/api/cargas/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPrevistaDeCarga: null })
      });
    } catch (error) {
      console.error('Failed to remove order schedule:', error);
      // Reverter visualmente
      setCalendar(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), order]
      }));
    }
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - startingDayOfWeek + 1;
      const isValidDay = day > 0 && day <= daysInMonth;
      const dateKey = `${year}-${month + 1}-${day}`;
      const ordersForDay = calendar[dateKey] || [];

      days.push(
        <div
          key={i}
          onDragOver={handleDragOver}
          onDrop={isValidDay ? (e) => handleDrop(e, day) : null}
          className={`min-h-32 border border-gray-700 p-2 transition-colors ${
            isValidDay
              ? 'bg-neutral-800 hover:bg-neutral-700'
              : 'bg-neutral-900'
          }`}
        >
          {isValidDay && (
            <>
              <div className="text-sm text-gray-300 mb-2 font-bold">{day}</div>
              <div className="space-y-1">
                {ordersForDay.map(order => (
                  <div
                    key={order.id}
                    className={`${getOrderColor(order.estadoId)} text-white text-xs p-2 rounded cursor-pointer hover:brightness-110 transition-all shadow-sm group relative`}
                    onClick={() => handleRemoveFromCalendar(dateKey, order)}
                  >
                    <div className="font-bold">{order.encomendaPrimavera || 'S/ Ref'}</div>
                    <div className="text-[10px] truncate">{order.cliente}</div>
                     {/* Tooltip on hover */}
                     <div className="hidden group-hover:block absolute z-50 bottom-full left-0 bg-black text-white p-2 text-xs rounded w-40 mb-1 shadow-xl">
                      Clique para devolver à lista
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }
    return days;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-white">A carregar encomendas para planeamento...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-900 text-white p-4 gap-4">
      {/* Painel Esquerdo - A Planear */}
      <div className="w-80 flex flex-col bg-neutral-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700 bg-neutral-800 rounded-t-lg z-10 shadow-md">
          <h2 className="text-lg font-bold text-center text-blue-400">
            A Planear
          </h2>
          <div className="text-xs text-gray-400 text-center mt-1">
            {ordersLeftPanel.length} encomendas disponíveis
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {ordersLeftPanel.map(order => (
            <div
              key={order.id}
              draggable
              onDragStart={(e) => handleDragStart(e, order)}
              className={`${getOrderColor(order.estadoId)} p-3 rounded cursor-move hover:brightness-110 transition-all shadow-md border border-white/10 active:scale-95`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-xs">{order.encomendaPrimavera || 'S/ Ref'}</span>
                <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
                  {order.estadoDesc || order.estadoId}
                </span>
              </div>
              <div className="text-xs font-medium mb-1 truncate">
                {order.cliente}
              </div>
              {order.mercadoria && (
                <div className="text-[10px] opacity-80 line-clamp-2 italic bg-black/10 p-1 rounded">
                  {order.mercadoria}
                </div>
              )}
               {/* Indicador visual se já tiver data na DB, mas está a ser replaneada */}
               {order.dataPrevistaDeCarga && (
                <div className="mt-2 text-[9px] flex items-center gap-1 opacity-75 border-t border-white/20 pt-1">
                  <span>📅 Atual: {new Date(order.dataPrevistaDeCarga).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ))}
          {ordersLeftPanel.length === 0 && (
            <div className="text-gray-500 text-center py-10 text-sm px-6 border-2 border-dashed border-gray-700 rounded mx-2">
              <p className="mb-2">Sem encomendas pendentes.</p>
              <p className="text-xs">Se remover algo do calendário, aparecerá aqui.</p>
            </div>
          )}
        </div>
      </div>

      {/* Painel Direito - Calendário */}
      <div className="flex-1 bg-neutral-800 rounded-lg p-4 border border-gray-700 overflow-hidden flex flex-col">
        {/* Cabeçalho Mês */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition-colors border border-gray-600"
          >
            ← Anterior
          </button>
          <div className="text-center">
             <h2 className="text-xl font-bold capitalize">
            {monthNames[month]} <span className="text-gray-400">{year}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Arraste para definir o plano de montagem</p>
          </div>
         
          <button
            onClick={() => changeMonth(1)}
            className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition-colors border border-gray-600"
          >
            Próximo →
          </button>
        </div>

        {/* Conteúdo Calendário */}
        <div className="flex-1 overflow-y-auto">
            {/* Dias Semana */}
            <div className="grid grid-cols-7 gap-1 mb-1 sticky top-0 bg-neutral-800 py-2 z-10 shadow-sm">
            {dayNames.map(day => (
                <div key={day} className="text-center font-bold text-gray-500 text-xs uppercase tracking-wider">
                {day}
                </div>
            ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 pb-4">
            {renderCalendarDays()}
            </div>
        </div>
      </div>
    </div>
  );
}
