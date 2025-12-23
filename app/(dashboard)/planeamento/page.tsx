'use client'

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function DragDropCalendarBoard() {
  const language = 'pt';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendar, setCalendar] = useState({});
  const [draggedOrder, setDraggedOrder] = useState(null);
  const queryClient = useQueryClient();

  // Fetch ALL orders from your API
  const { data: ordersData, isLoading } = useQuery({
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

  // Mutation to update order scheduled date
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, dataPrevistaDeCarga }) => {
      const res = await fetch(`/api/cargas/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataPrevistaDeCarga })
      });
      if (!res.ok) throw new Error('Failed to update order');
      return res.json();
    },
    onSuccess: () => {
      // Refetch orders to keep everything in sync
      queryClient.invalidateQueries(['all-orders', language]);
    }
  });

  const allOrders = ordersData?.items || [];

  // Filter out orders that are already scheduled in the calendar
  const getScheduledOrderIds = () => {
    const scheduledIds = new Set();
    Object.values(calendar).forEach((dayOrders: any) => {
      dayOrders.forEach(order => scheduledIds.add(order.id));
    });
    return scheduledIds;
  };

  const scheduledIds = getScheduledOrderIds();
  const orders = allOrders.filter(order => !scheduledIds.has(order.id));

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

  // Updated colors to match LegendaEstados.tsx
  const getOrderColor = (estadoId) => {
    const colors = {
      1: 'bg-yellow-400',    // NOVA
      2: 'bg-blue-500',      // AGENDADA
      8: 'bg-amber-700',     // A DEFINIR
      5: 'bg-green-500',     // REALIZADA
      // Keep other estados with default colors
      3: 'bg-purple-500',
      4: 'bg-orange-500',
      6: 'bg-red-500',
      7: 'bg-pink-500'
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
    if (draggedOrder) {
      const dateKey = `${year}-${month + 1}-${day}`;
      const scheduledDate = new Date(year, month, day);

      // Update local state immediately
      setCalendar(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), draggedOrder]
      }));

      // Save to database
      try {
        await updateOrderMutation.mutateAsync({
          orderId: draggedOrder.id,
          dataPrevistaDeCarga: scheduledDate.toISOString()
        });
      } catch (error) {
        console.error('Failed to update order:', error);
        // Optionally revert the local change if the API call fails
        setCalendar(prev => ({
          ...prev,
          [dateKey]: prev[dateKey].filter(o => o.id !== draggedOrder.id)
        }));
      }

      setDraggedOrder(null);
    }
  };

  const handleRemoveFromCalendar = async (dateKey, order) => {
    // Update local state immediately
    setCalendar(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(o => o.id !== order.id)
    }));

    // Remove scheduled date from database
    try {
      await updateOrderMutation.mutateAsync({
        orderId: order.id,
        dataPrevistaDeCarga: null
      });
    } catch (error) {
      console.error('Failed to remove order schedule:', error);
      // Optionally revert the local change if the API call fails
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
          className={`min-h-32 border border-gray-700 p-2 ${
            isValidDay
              ? 'bg-neutral-800 hover:bg-neutral-700 cursor-pointer'
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
                    className={`${getOrderColor(order.estadoId)} text-white text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => handleRemoveFromCalendar(dateKey, order)}
                    title="Clique para remover"
                  >
                    <div className="font-bold">{order.encomendaPrimavera}</div>
                    <div className="text-[10px] truncate">{order.cliente}</div>
                    <div className="text-[10px] opacity-75">{order.estadoDesc}</div>
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
        <span className="ml-3 text-white">A carregar encomendas...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-900 text-white p-4 gap-4">
      {/* Left Panel - Orders */}
      <div className="w-96 bg-neutral-800 rounded-lg border border-gray-700 overflow-y-auto">
        
        {/* Orders List */}
        <div className="p-4">
          <h2 className="text-lg font-bold mb-3 text-center">
            Encomendas Não Agendadas
          </h2>
          <div className="text-xs text-gray-400 mb-3 text-center">
            {orders.length} encomenda(s)
          </div>
          <div className="space-y-2">
            {orders.map(order => (
              <div
                key={order.id}
                draggable
                onDragStart={(e) => handleDragStart(e, order)}
                className={`${getOrderColor(order.estadoId)} p-3 rounded cursor-move hover:opacity-80 transition-opacity shadow-lg`}
              >
                <div className="text-xs opacity-90 mb-1">
                  <strong>Cliente:</strong> {order.cliente}
                </div>
                {order.encomendaDoCliente && (
                  <div className="text-xs opacity-90 mb-1">
                    <strong>Enc. Cliente:</strong> {order.encomendaDoCliente}
                  </div>
                )}
                {order.projecto && (
                  <div className="text-xs opacity-90 mb-1">
                    <strong>Projecto:</strong> {order.projecto}
                  </div>
                )}
                {order.mercadoria && (
                  <div className="text-xs opacity-90 mb-1">
                    <strong>Mercadoria:</strong> 
                    <span className="block line-clamp-2 mt-0.5">{order.mercadoria}</span>
                  </div>
                )}
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                Todas as encomendas foram agendadas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Calendar */}
      <div className="flex-1 bg-neutral-800 rounded-lg p-4 border border-gray-700 overflow-auto">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-neutral-800 pb-2 z-10">
          <button
            onClick={() => changeMonth(-1)}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
          >
            ← Anterior
          </button>
          <h2 className="text-2xl font-bold">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors"
          >
            Próximo →
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-gray-400 py-2 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>

        <div className="mt-4 text-sm text-gray-400 text-center bg-neutral-800 py-2">
          💡 Arraste encomendas da esquerda para os dias do calendário. Clique nas encomendas no calendário para removê-las.
        </div>
      </div>
    </div>
  );
}
