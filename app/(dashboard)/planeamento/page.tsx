'use client'

import React, { useState } from 'react';
// ... rest of your imports

export default function YourComponent() {
  const [state, setState] = useState(...)
  // ... rest of your component
}
import React, { useState } from 'react';

const DragDropCalendarBoard = () => {
  const [orders, setOrders] = useState([
    { id: 1, number: 'ORD-001', client: 'Client A', color: 'bg-blue-500' },
    { id: 2, number: 'ORD-002', client: 'Client B', color: 'bg-green-500' },
    { id: 3, number: 'ORD-003', client: 'Client C', color: 'bg-purple-500' },
    { id: 4, number: 'ORD-004', client: 'Client D', color: 'bg-orange-500' },
    { id: 5, number: 'ORD-005', client: 'Client E', color: 'bg-pink-500' }
  ]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendar, setCalendar] = useState({});
  const [draggedOrder, setDraggedOrder] = useState(null);

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

  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, day) => {
    e.preventDefault();
    if (draggedOrder) {
      const dateKey = `${year}-${month + 1}-${day}`;
      setCalendar(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), draggedOrder]
      }));
      setOrders(prev => prev.filter(o => o.id !== draggedOrder.id));
      setDraggedOrder(null);
    }
  };

  const handleRemoveFromCalendar = (dateKey, order) => {
    setCalendar(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(o => o.id !== order.id)
    }));
    setOrders(prev => [...prev, order]);
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
              <div className="text-xs text-gray-400 mb-1">{day}</div>
              <div className="space-y-1">
                {ordersForDay.map(order => (
                  <div
                    key={order.id}
                    className={`${order.color} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80`}
                    onClick={() => handleRemoveFromCalendar(dateKey, order)}
                    title="Click to remove"
                  >
                    {order.number}
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

  return (
    <div className="flex h-screen bg-neutral-900 text-white p-4 gap-4">
      {/* Left Panel - Orders */}
      <div className="w-72 bg-neutral-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-center">New Orders</h2>
        <div className="space-y-2">
          {orders.map(order => (
            <div
              key={order.id}
              draggable
              onDragStart={(e) => handleDragStart(e, order)}
              className={`${order.color} p-3 rounded cursor-move hover:opacity-80 transition-opacity`}
            >
              <div className="font-semibold">{order.number}</div>
              <div className="text-sm opacity-90">{order.client}</div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              All orders scheduled
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Calendar */}
      <div className="flex-1 bg-neutral-800 rounded-lg p-4 border border-gray-700 overflow-auto">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded"
          >
            ← Prev
          </button>
          <h2 className="text-2xl font-bold">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded"
          >
            Next →
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>

        <div className="mt-4 text-sm text-gray-400 text-center">
          💡 Drag orders from left to calendar days. Click orders on calendar to remove them.
        </div>
      </div>
    </div>
  );
};

export default DragDropCalendarBoard;
