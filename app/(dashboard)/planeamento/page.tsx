'use client'

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const DragDropCalendarBoard = () => {
  const language = 'pt';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendar, setCalendar] = useState({});
  const [draggedOrder, setDraggedOrder] = useState(null);

  // Fetch unscheduled orders from your API
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['unscheduled-orders', language],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataPrevistaDeCarga: new Date().getFullYear() + '-01-01',
        language: language,
        estadoId: '0', // All states
        countryId: '0', // All countries
        pageIndex: '0',
        pageSize: '100', // Get more orders for scheduling
        textToSearch: ''
      });

      const res = await fetch(`/api/cargas?${params}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    staleTime: 30000
  });

  const orders = ordersData?.items || [];

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

  // Get color based on estado
  const getOrderColor = (estadoId) => {
    const colors = {
      1: 'bg-yellow-400',    // NOVA
      2: 'bg-blue-500',      // AGENDADA
      3: 'bg-purple-500',    // PRODUZIDA
      4: 'bg-orange-500',    // EM EXPEDIÇÃO
      5: 'bg-green-500',     // REALIZADA
      6: 'bg-red-500',       // CANCELADA
      7: 'bg-pink-500',      // FATURADA
      8: 'bg-amber-700'       // A DEFINIR
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
      
      // Add to calendar UI
      setCalendar(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), draggedOrder]
      }));

      // TODO: Update the order in your database with the scheduled date
      // await fetch(`/api/cargas/${draggedOrder.id}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ scheduledDate })
      // });

      setDraggedOrder(null);
      refetch(); // Refresh orders list
    }
  };

  const handleRemoveFromCalendar = async (dateKey, order) => {
    setCalendar(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(o => o.id !== order.id)
    }));

    // TODO: Remove scheduled date from database
    // await fetch(`/api/cargas/${order.id}`, {
    //   method: 'PATCH',
    //   body: JSON.stringify({ scheduledDate: null })
    // });

    refetch(); // Refresh orders list
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
          className={`min-h-24 border border-gray-700 p-2 ${
            isValidDay 
              ? 'bg-neutral-800 hover:bg-neutral-700 cursor-pointer' 
              : 'bg-neutral-900'
          }`}
        >
          {isValidDay && (
            <>
              <div className="text-xs text-gray-400 mb-1 font-semibold">{day}</div>
              <div className="space-y-1">
                {ordersForDay.map(order => (
                  <div
                    key={order.id}
                    className={`${getOrderColor(order.estadoId)} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80`}
                    onClick={() => handleRemoveFromCalendar(dateKey, order)}
                    title={`${order.nDoc} - ${order.entidade} - Click to remove`}
                  >
                    <div className="font-semibold">{order.nDoc}</div>
                    <div className="text-[10px] truncate">{order.entidade}</div>
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
        <span className="ml-3 text-white">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-900 text-white p-4 gap-4">
      {/* Left Panel - Unscheduled Orders */}
      <div className="w-80 bg-neutral-800 rounded-lg p-4 border border-gray-700 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center sticky top-0 bg-neutral-800 pb-2">
          Encomendas Não Agendadas
        </h2>
        <div className="text-xs text-gray-400 mb-3 text-center">
          {orders.length} orders
        </div>
        <div className="space-y-2">
          {orders.map(order => (
            <div
              key={order.id}
              draggable
              onDragStart={(e) => handleDragStart(e, order)}
              className={`${getOrderColor(order.estadoId)} p-3 rounded cursor-move hover:opacity-80 transition-opacity`}
            >
              <div className="font-semibold text-sm">{order.nDoc}</div>
              <div className="text-xs opacity-90 truncate" title={order.entidade}>
                {order.entidade}
              </div>
              <div className="text-xs opacity-75 mt-1">
                {order.estadoDesc}
              </div>
              <div className="text-xs opacity-75">
                Data: {new Date(order.dataDoc).toLocaleDateString('pt-PT')}
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              Todas as encomendas agendadas
            </div>
          )}
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
};

export default DragDropCalendarBoard;
