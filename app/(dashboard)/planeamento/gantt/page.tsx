'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ChevronLeft, ChevronRight } from 'lucide-react';

interface Order {
  id: number;
  numeroDoc: string;
  entidade: string;
  dataDoc: string;
  dataEntrega: string;
  dataPrevistaDeCarga: string | null;
  totalMerc: number;
  estado: string;
  estadoId: number;
}

export default function GanttView() {
  const queryClient = useQueryClient();
  const [language] = useState('pt');
  const [viewStartDate, setViewStartDate] = useState(new Date());
  const [draggedOrder, setDraggedOrder] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const translations = {
    pt: {
      title: 'Vista Gantt - Encomendas',
      loading: 'A carregar...',
      order: 'Encomenda',
      entity: 'Entidade',
      value: 'Valor',
      status: 'Estado',
      timeline: 'Linha do Tempo',
      saving: 'A guardar...',
      saved: 'Guardado',
      noOrders: 'Sem encomendas',
      dragHint: 'Arraste para a linha do tempo',
      loadDate: 'Data de Carga'
    }
  };

  const t = translations[language];

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['gantt-orders'],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio: '2024-01-01',
        language: language,
        estadoId: '0',
        countryId: '0',
        pageIndex: '0',
        pageSize: '100',
        textToSearch: ''
      });

      const res = await fetch(`/api/cargas?${params}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      return data.items as Order[];
    }
  });

  // Mutation for saving gantt data
  const saveMutation = useMutation({
    mutationFn: async (data: { orderId: number; dataPrevistaDeCarga: string }) => {
      const res = await fetch(`/api/cargas/${data.orderId}/gantt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataPrevistaDeCarga: data.dataPrevistaDeCarga
        })
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gantt-orders'] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  });

  // Autosave with debounce
  const autoSave = (orderId: number, dataPrevistaDeCarga: string) => {
    setSaveStatus('saving');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate({ orderId, dataPrevistaDeCarga });
    }, 1000);
  };

  // Generate timeline dates (30 days view)
  const generateTimeline = () => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(viewStartDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const timeline = generateTimeline();

  // Calculate position for gantt bars (1 day duration)
  const calculateBarStyle = (dataPrevistaDeCarga: string) => {
    const loadDate = new Date(dataPrevistaDeCarga);
    loadDate.setHours(0, 0, 0, 0);
    
    const viewStart = new Date(viewStartDate);
    viewStart.setHours(0, 0, 0, 0);
    
    const startDiff = Math.floor(
      (loadDate.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const dayWidth = 100 / 30; // 30 days visible
    const left = startDiff * dayWidth;
    const width = dayWidth; // 1 day duration

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - Math.max(0, left), width)}%`,
      visible: left >= 0 && left < 100
    };
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, orderId: number) => {
    setDraggedOrder(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    if (draggedOrder === null) return;

    const loadDate = new Date(viewStartDate);
    loadDate.setDate(loadDate.getDate() + dayIndex);
    loadDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    autoSave(draggedOrder, loadDate.toISOString());
    setDraggedOrder(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle click on gantt bar to change date
  const handleBarClick = (orderId: number, currentDate: string) => {
    const newDateStr = prompt(
      'Data de Carga (YYYY-MM-DD):',
      currentDate.split('T')[0]
    );
    
    if (newDateStr) {
      const newDate = new Date(newDateStr);
      newDate.setHours(12, 0, 0, 0);
      autoSave(orderId, newDate.toISOString());
    }
  };

  // Navigate timeline
  const shiftTimeline = (days: number) => {
    const newDate = new Date(viewStartDate);
    newDate.setDate(newDate.getDate() + days);
    setViewStartDate(newDate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-200">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-800 p-6">
      <div className="max-w-full mx-auto">
        
        {/* Header */}
        <div className="bg-neutral-700 shadow rounded-lg p-6 mb-4 border border-neutral-600">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-100">{t.title}</h1>
            <div className="flex items-center gap-4">
              {/* Save Status */}
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm text-gray-300">{t.saving}</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Save className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">{t.saved}</span>
                  </>
                )}
              </div>
              
              {/* Timeline Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => shiftTimeline(-7)}
                  className="p-2 bg-neutral-600 hover:bg-neutral-500 rounded text-gray-200"
                  title="Recuar 7 dias"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-300 px-3">
                  {viewStartDate.toLocaleDateString('pt-PT', { 
                    day: '2-digit', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <button
                  onClick={() => shiftTimeline(7)}
                  className="p-2 bg-neutral-600 hover:bg-neutral-500 rounded text-gray-200"
                  title="Avançar 7 dias"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Container */}
        <div className="bg-neutral-700 shadow rounded-lg overflow-hidden border border-neutral-600">
          <div className="flex">
            
            {/* Left Side - Orders List */}
            <div className="w-80 border-r border-neutral-600 bg-neutral-750">
              {/* Header */}
              <div className="p-4 border-b border-neutral-600 bg-neutral-700">
                <div className="text-sm font-semibold text-gray-200">{t.order}</div>
              </div>
              
              {/* Orders */}
              <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
                {orders.length === 0 ? (
                  <div className="p-4 text-gray-400 text-center">{t.noOrders}</div>
                ) : (
                  orders.map(order => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      className="p-4 border-b border-neutral-600 hover:bg-neutral-600 cursor-move transition-colors"
                    >
                      <div className="font-medium text-gray-100 text-sm">
                        {order.numeroDoc}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {order.entidade}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        €{order.totalMerc.toFixed(2)}
                      </div>
                      {order.dataPrevistaDeCarga && (
                        <div className="text-xs text-blue-400 mt-1">
                          {t.loadDate}: {new Date(order.dataPrevistaDeCarga).toLocaleDateString('pt-PT')}
                        </div>
                      )}
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          order.estadoId === 1 ? 'bg-yellow-600 text-white' :
                          order.estadoId === 2 ? 'bg-blue-600 text-white' :
                          order.estadoId === 3 ? 'bg-green-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {order.estado}
                        </span>
                      </div>
                      {!order.dataPrevistaDeCarga && (
                        <div className="text-xs text-gray-500 mt-2 italic">
                          {t.dragHint}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Side - Timeline */}
            <div className="flex-1 overflow-x-auto">
              {/* Timeline Header */}
              <div className="flex border-b border-neutral-600 bg-neutral-700 sticky top-0 z-10">
                {timeline.map((date, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 p-2 text-center border-r border-neutral-600"
                    style={{ width: `${100 / 30}%`, minWidth: '60px' }}
                  >
                    <div className="text-xs font-medium text-gray-300">
                      {date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {date.toLocaleDateString('pt-PT', { weekday: 'short' })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline Grid */}
              <div className="relative" style={{ minHeight: '70vh' }}>
                {/* Grid Lines */}
                <div className="absolute inset-0 flex">
                  {timeline.map((_, idx) => (
                    <div
                      key={idx}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragOver={handleDragOver}
                      className="flex-shrink-0 border-r border-neutral-600 hover:bg-neutral-650 transition-colors"
                      style={{ width: `${100 / 30}%`, minWidth: '60px' }}
                    />
                  ))}
                </div>

                {/* Gantt Bars */}
                {orders.map((order, orderIdx) => {
                  if (!order.dataPrevistaDeCarga) return null;

                  const style = calculateBarStyle(order.dataPrevistaDeCarga);
                  if (!style.visible) return null;

                  return (
                    <div
                      key={order.id}
                      className="absolute h-12 cursor-pointer"
                      style={{
                        top: `${orderIdx * 89}px`,
                        left: style.left,
                        width: style.width,
                        zIndex: 5
                      }}
                      onClick={() => handleBarClick(order.id, order.dataPrevistaDeCarga!)}
                      title={`${order.numeroDoc} - ${new Date(order.dataPrevistaDeCarga).toLocaleDateString('pt-PT')}`}
                    >
                      <div className="relative h-full px-1">
                        <div className={`h-full rounded shadow-lg flex items-center justify-center ${
                          order.estadoId === 1 ? 'bg-yellow-500 hover:bg-yellow-600' :
                          order.estadoId === 2 ? 'bg-blue-500 hover:bg-blue-600' :
                          order.estadoId === 3 ? 'bg-green-500 hover:bg-green-600' :
                          'bg-gray-500 hover:bg-gray-600'
                        } transition-colors`}>
                          <div className="text-xs font-medium text-white truncate px-2">
                            {order.numeroDoc}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
