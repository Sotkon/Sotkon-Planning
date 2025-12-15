'use client'

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function DragDropCalendarBoard() {
  const language = 'pt';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendar, setCalendar] = useState({});
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [selectedEstados, setSelectedEstados] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]); // All selected by default

  // Fetch estados for the filter
  const { data: estados = [] } = useQuery({
    queryKey: ['estados', language],
    queryFn: async () => {
      const res = await fetch(`/api/estados?language=${language}`);
      if (!res.ok) throw new Error('Failed to fetch estados');
      return res.json();
    }
  });

  // Fetch countries for the filter
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await fetch('/api/countries');
      if (!res.ok) throw new Error('Failed to fetch countries');
      return res.json();
    }
  });

  // Fetch unscheduled orders from your API
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['unscheduled-orders', language, selectedEstados],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio: new Date().getFullYear() + '-01-01',
        language: language,
        estadoId: selectedEstados.join(','), // Multiple estados
        countryId: '0', // All countries
        pageIndex: '0',
        pageSize: '200', // Get more orders for scheduling
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
      1: 'bg-yellow-400',
      2: 'bg-blue-500',
      3: 'bg-purple-500',
      4: 'bg-orange-500',
      5: 'bg-green-500',
      6: 'bg-red-500',
      7: 'bg-pink-500',
      8: 'bg-amber-700'
    };
    return colors[estadoId] || 'bg-gray-500';
  };

  const handleEstadoToggle = (estadoId: number) => {
    setSelectedEstados(prev =>
      prev.includes(estadoId)
        ? prev.filter(id => id !== estadoId)
        : [...prev, estadoId]
    );
  };

  const toggleAllEstados = () => {
    if (selectedEstados.length === estados.length) {
      setSelectedEstados([]);
    } else {
      setSelectedEstados(estados.map(e => e.id));
    }
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

      setCalendar(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), draggedOrder]
      }));

      // TODO: Update the order in your database with the scheduled date
      // await fetch(`/api/cargas/${draggedOrder.id}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ dataPrevistaDeCarga: scheduledDate })
      // });

      setDraggedOrder(null);
      refetch();
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
    //   body: JSON.stringify({ dataPrevistaDeCarga: null })
    // });

    refetch();
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
      {/* Left Panel - Filters and Orders */}
      <div className="w-96 bg-neutral-800 rounded-lg border border-gray-700 overflow-y-auto">
        
        {/* Estado Filter */}
        <div className="sticky top-0 bg-neutral-800 p-4 border-b border-gray-700 z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Filtrar por Estado</h3>
            <button
              onClick={toggleAllEstados}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {selectedEstados.length === estados.length ? 'Desmarcar Todos' : 'Marcar Todos'}
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {estados.map(estado => (
              <label key={estado.id} className="flex items-center gap-2 cursor-pointer hover:bg-neutral-700 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedEstados.includes(estado.id)}
                  onChange={() => handleEstadoToggle(estado.id)}
                  className="w-4 h-4"
                />
                <span className={`w-3 h-3 rounded ${getOrderColor(estado.id)}`}></span>
                <span className="text-sm text-gray-300">{estado.descPT}</span>
              </label>
            ))}
          </div>
        </div>

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
                <div className="font-bold text-sm mb-1">{order.encomendaPrimavera}</div>
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
                <div className="text-xs opacity-75 mb-1">
                  <strong>Estado:</strong> {order.estadoDesc}
                </div>
                {order.dataPrevistaDeCarga && (
                  <div className="text-xs opacity-75 mb-1">
                    <strong>Data Prevista:</strong> {new Date(order.dataPrevistaDeCarga).toLocaleDateString('pt-PT')}
                  </div>
                )}
                {order.localizacao && (
                  <div className="text-xs opacity-75 mb-1">
                    <strong>Localização:</strong> {order.localizacao}
                  </div>
                )}
                {order.transportador && (
                  <div className="text-xs opacity-75 mb-1">
                    <strong>Transportador:</strong> {order.transportador}
                  </div>
                )}
                {order.observacoes && (
                  <div className="text-xs opacity-75 italic mt-2 pt-2 border-t border-white/20">
                    <strong>Obs:</strong> {order.observacoes}
                  </div>
                )}
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                Nenhuma encomenda encontrada com os filtros selecionados
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
