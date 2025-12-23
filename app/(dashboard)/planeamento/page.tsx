'use client'

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Loader2, Search, Calendar as CalendarIcon, Filter, XCircle, Save, X } from 'lucide-react';

// --- COMPONENTE MODAL DE EDIÇÃO ---
const OrderDetailModal = ({ order, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    estadoId: Number(order.estadoId),
    // Converte a data para o formato YYYY-MM-DD para o input HTML5
    dataPrevistaDeCarga: order.dataPrevistaDeCarga ? new Date(order.dataPrevistaDeCarga).toISOString().split('T')[0] : ''
  });

  const handleSaveClick = () => {
    // Certifica-se de que a data é enviada como ISO string ou null
    const dateToSend = formData.dataPrevistaDeCarga 
      ? new Date(formData.dataPrevistaDeCarga).toISOString() 
      : null;

    onSave(order.id, {
      estadoId: formData.estadoId,
      dataPrevistaDeCarga: dateToSend
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
          <h2 className="text-xl font-bold text-white">{order.encomendaPrimavera || 'S/ Ref'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><XCircle className="w-8 h-8" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
              <select 
                value={formData.estadoId}
                onChange={(e) => setFormData({...formData, estadoId: Number(e.target.value)})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Nova</option>
                <option value={2}>A Definir</option>
                <option value={3}>Agendada</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Data Prevista (Calendário)</label>
              <input 
                type="date" 
                value={formData.dataPrevistaDeCarga}
                onChange={(e) => setFormData({...formData, dataPrevistaDeCarga: e.target.value})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 scheme-dark"
              />
            </div>
          </div>
          
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Cliente</p>
            <p className="text-white font-semibold">{order.cliente}</p>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
          <button 
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
            Gravar
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
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchText, setSearchText] = useState('');

  // 1. QUERY (Fetch de Dados)
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['cargas-planeamento', language],
    queryFn: async () => {
      const res = await fetch(`/api/cargas?dataInicio=2024-01-01&pageSize=1000&language=${language}`);
      if (!res.ok) throw new Error('Erro ao carregar');
      return res.json();
    }
  });

  // 2. MUTATION (Gravação na Base de Dados)
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await fetch(`/api/cargas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Erro na gravação');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargas-planeamento'] });
      setSelectedOrder(null);
    },
    onError: () => alert("Erro ao gravar alterações. Verifique a ligação ou os dados.")
  });

  // 3. Lógica de Separação de Dados
  const { calendarOrders, pendingOrders } = useMemo(() => {
    const cal = {};
    const left = [];
    if (ordersData?.items) {
      ordersData.items.forEach(order => {
        // Filtro de Texto
        if (searchText && !(order.cliente + order.encomendaPrimavera).toLowerCase().includes(searchText.toLowerCase())) return;

        if (order.dataPrevistaDeCarga) {
          const d = new Date(order.dataPrevistaDeCarga);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          if (!cal[key]) cal[key] = [];
          cal[key].push(order);
        } else {
          left.push(order);
        }
      });
    }
    return { calendarOrders: cal, pendingOrders: left };
  }, [ordersData, searchText]);

  // --- Handlers ---
  const handleDrop = (day) => {
    if (!draggedOrder) return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12);
    updateMutation.mutate({
      id: draggedOrder.id,
      payload: { 
        dataPrevistaDeCarga: date.toISOString(),
        estadoId: draggedOrder.estadoId === 1 ? 3 : draggedOrder.estadoId // Opcional: passa a agendada ao soltar
      }
    });
    setDraggedOrder(null);
  };

  const handleRemove = (order, e) => {
    e.stopPropagation();
    if (order.estadoId !== 1) {
      alert("Só encomendas 'Nova' podem ser removidas do calendário.");
      return;
    }
    updateMutation.mutate({
      id: order.id,
      payload: { dataPrevistaDeCarga: null }
    });
  };

  // Funções Auxiliares de Calendário (Sem Fim de Semana)
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  return (
    <div className="flex h-screen bg-neutral-950 text-white p-4 gap-4 overflow-hidden">
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onSave={(id, p) => updateMutation.mutate({ id, payload: p })}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* PAINEL ESQUERDO */}
      <div className="w-80 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="font-bold flex items-center gap-2 mb-3">Pendentes</h2>
          <input 
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
            placeholder="Pesquisar..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {pendingOrders.map(order => (
            <div
              key={order.id}
              draggable
              onDragStart={() => setDraggedOrder(order)}
              onClick={() => setSelectedOrder(order)}
              className="bg-yellow-500 text-black p-3 rounded-lg cursor-grab active:cursor-grabbing border border-yellow-600 shadow-lg hover:brightness-110"
            >
              <div className="text-[10px] font-black">{order.encomendaPrimavera}</div>
              <div className="text-xs font-bold truncate">{order.cliente}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CALENDÁRIO */}
      <div className="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b border-neutral-800">
          <h2 className="text-xl font-black uppercase flex items-center gap-2">
            <CalendarIcon className="text-blue-500" />
            {new Intl.DateTimeFormat('pt', { month: 'long', year: 'numeric' }).format(currentMonth)}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 hover:bg-neutral-800 rounded">←</button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 text-xs font-bold bg-neutral-800 rounded">Hoje</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 hover:bg-neutral-800 rounded">→</button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-neutral-950/20">
          <div className="grid grid-cols-5 gap-2">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase py-2">{d}</div>
            ))}
            {(() => {
              const cells = [];
              for (let d = 1; d <= daysInMonth; d++) {
                const dateObj = new Date(year, month, d);
                const weekDay = dateObj.getDay();
                if (weekDay === 0 || weekDay === 6) continue;

                const key = `${year}-${month + 1}-${d}`;
                const orders = calendarOrders[key] || [];

                cells.push(
                  <div
                    key={d}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(d)}
                    className="min-h-[140px] bg-neutral-900 border border-neutral-800 rounded-lg p-2 hover:border-neutral-700"
                  >
                    <div className="text-xs font-bold text-gray-500 mb-2">{d}</div>
                    <div className="space-y-1">
                      {orders.map(o => (
                        <div
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className={`p-2 rounded text-[10px] font-bold border relative group cursor-pointer ${
                            o.estadoId === 1 ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-blue-600 text-white border-blue-500'
                          }`}
                        >
                          {o.encomendaPrimavera}
                          {o.estadoId === 1 && (
                            <button 
                              onClick={(e) => handleRemove(o, e)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 hidden group-hover:flex items-center justify-center"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
