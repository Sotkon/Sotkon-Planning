'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Trash2, Save, Upload, X, Copy, Plus } from 'lucide-react';

// Estado colors mapping
const estadoColors = {
  1: '#EF4444', // red-500
  2: '#F59E0B', // amber-500
  3: '#10B981', // emerald-500
  4: '#3B82F6', // blue-500
  5: '#8B5CF6', // violet-500
  6: '#6B7280', // gray-500
};

// Mock orders data (simulating what would come from ENC.tsx)
const mockOrders = [
  { id: 1, projeto: 'PRJ-001', encomenda: 'ENC-2024-001', estadoId: 1, estado: 'Pendente' },
  { id: 2, projeto: 'PRJ-002', encomenda: 'ENC-2024-002', estadoId: 2, estado: 'Em Produção' },
  { id: 3, projeto: 'PRJ-003', encomenda: 'ENC-2024-003', estadoId: 3, estado: 'Concluído' },
  { id: 4, projeto: 'PRJ-004', encomenda: 'ENC-2024-004', estadoId: 1, estado: 'Pendente' },
  { id: 5, projeto: 'PRJ-005', encomenda: 'ENC-2024-005', estadoId: 4, estado: 'Em Teste' },
  { id: 6, projeto: 'PRJ-006', encomenda: 'ENC-2024-006', estadoId: 2, estado: 'Em Produção' },
  { id: 7, projeto: 'PRJ-007', encomenda: 'ENC-2024-007', estadoId: 5, estado: 'Aguardando' },
  { id: 8, projeto: 'PRJ-008', encomenda: 'ENC-2024-008', estadoId: 3, estado: 'Concluído' },
];

const GRID_COLS = 4;
const GRID_ROWS = 10;

export default function FactoryLayoutPlanner() {
  const [orders] = useState(mockOrders);
  const [availableOrders, setAvailableOrders] = useState(mockOrders);
  const [placedCards, setPlacedCards] = useState({ month1: [], month2: [], month3: [] });
  const [newOrderText, setNewOrderText] = useState('');
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedFromMonth, setDraggedFromMonth] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthTitles, setMonthTitles] = useState({
    month1: 'Mês 1',
    month2: 'Mês 2',
    month3: 'Mês 3'
  });
  
  const canvasRefs = {
    month1: useRef(null),
    month2: useRef(null),
    month3: useRef(null)
  };
  const fileInputRef = useRef(null);

  // Filter orders based on search
  const filteredOrders = availableOrders.filter(order => 
    order.projeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.encomenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get all placed cards across all months
  const allPlacedCards = [...placedCards.month1, ...placedCards.month2, ...placedCards.month3];

  // Check if a grid cell is occupied
  const isCellOccupied = (month, row, col) => {
    return placedCards[month].some(card => card.row === row && card.col === col);
  };

  // Get cell position from mouse coordinates
  const getCellFromCoordinates = (x, y, canvasRef) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const cellWidth = rect.width / GRID_COLS;
    const cellHeight = rect.height / GRID_ROWS;
    
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);
    
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      return { row, col };
    }
    return null;
  };

  // Duplicate order in available panel
  const duplicateOrder = (order) => {
    const newOrder = {
      ...order,
      id: Date.now() + Math.random(),
      uniqueId: Date.now() + Math.random()
    };
    
    // Find the index of the original order and insert right after it
    const orderIndex = availableOrders.findIndex(o => o.id === order.id);
    const newOrders = [...availableOrders];
    newOrders.splice(orderIndex + 1, 0, newOrder);
    setAvailableOrders(newOrders);
  };

  // Add new custom order from text field
  const addCustomOrder = () => {
    if (!newOrderText.trim()) return;
    
    const newOrder = {
      id: Date.now() + Math.random(),
      uniqueId: Date.now() + Math.random(),
      projeto: newOrderText,
      encomenda: 'Custom',
      estadoId: 6,
      estado: 'Personalizado'
    };
    
    setAvailableOrders([newOrder, ...availableOrders]);
    setNewOrderText('');
  };

  // Handle dragging order from sidebar
  const handleOrderDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle dragging existing card on canvas
  const handleCardDragStart = (e, card, month) => {
    e.stopPropagation();
    setDraggedCard(card);
    setDraggedFromMonth(month);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over canvas
  const handleCanvasDragOver = (e, month) => {
    e.preventDefault();
    const rect = canvasRefs[month].current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cell = getCellFromCoordinates(x, y, canvasRefs[month]);
    setHoveredCell(cell);
    setHoveredMonth(month);
    
    if (draggedOrder) {
      e.dataTransfer.dropEffect = 'copy';
    } else if (draggedCard) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleCanvasDragLeave = () => {
    setHoveredCell(null);
    setHoveredMonth(null);
  };

  // Handle drop on canvas
  const handleCanvasDrop = (e, month) => {
    e.preventDefault();
    const rect = canvasRefs[month].current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cell = getCellFromCoordinates(x, y, canvasRefs[month]);
    
    if (!cell) {
      setDraggedOrder(null);
      setDraggedCard(null);
      setDraggedFromMonth(null);
      setHoveredCell(null);
      setHoveredMonth(null);
      return;
    }

    // Check if cell is occupied
    if (isCellOccupied(month, cell.row, cell.col)) {
      setDraggedOrder(null);
      setDraggedCard(null);
      setDraggedFromMonth(null);
      setHoveredCell(null);
      setHoveredMonth(null);
      return;
    }

    if (draggedOrder) {
      // Adding new card from available orders
      const newCard = {
        ...draggedOrder,
        uniqueId: Date.now() + Math.random(),
        row: cell.row,
        col: cell.col,
        notes: ''
      };
      
      setPlacedCards(prev => ({
        ...prev,
        [month]: [...prev[month], newCard]
      }));

      // Remove from available orders
      setAvailableOrders(prev => prev.filter(o => o.id !== draggedOrder.id));
      
    } else if (draggedCard && draggedFromMonth) {
      // Moving existing card
      if (draggedFromMonth === month) {
        // Moving within same month
        setPlacedCards(prev => ({
          ...prev,
          [month]: prev[month].map(card => 
            card.uniqueId === draggedCard.uniqueId
              ? { ...card, row: cell.row, col: cell.col }
              : card
          )
        }));
      } else {
        // Moving to different month
        setPlacedCards(prev => ({
          ...prev,
          [draggedFromMonth]: prev[draggedFromMonth].filter(card => card.uniqueId !== draggedCard.uniqueId),
          [month]: [...prev[month], { ...draggedCard, row: cell.row, col: cell.col }]
        }));
      }
    }

    setDraggedOrder(null);
    setDraggedCard(null);
    setDraggedFromMonth(null);
    setHoveredCell(null);
    setHoveredMonth(null);
  };

  // Update card notes
  const updateCardNotes = (uniqueId, notes) => {
    setPlacedCards(prev => ({
      month1: prev.month1.map(card => card.uniqueId === uniqueId ? { ...card, notes } : card),
      month2: prev.month2.map(card => card.uniqueId === uniqueId ? { ...card, notes } : card),
      month3: prev.month3.map(card => card.uniqueId === uniqueId ? { ...card, notes } : card)
    }));
  };

  // Remove card and return to available
  const removeCard = (uniqueId) => {
    const card = allPlacedCards.find(c => c.uniqueId === uniqueId);
    if (card) {
      // Return to available orders
      setAvailableOrders(prev => [...prev, card]);
      
      // Remove from placed cards
      setPlacedCards(prev => ({
        month1: prev.month1.filter(c => c.uniqueId !== uniqueId),
        month2: prev.month2.filter(c => c.uniqueId !== uniqueId),
        month3: prev.month3.filter(c => c.uniqueId !== uniqueId)
      }));
    }
  };

  // Handle background image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save layout
  const saveLayout = () => {
    const layout = {
      backgroundImage,
      placedCards,
      monthTitles,
      availableOrders
    };
    localStorage.setItem('factoryLayout', JSON.stringify(layout));
    alert('Layout guardado com sucesso!');
  };

  // Load layout
  useEffect(() => {
    const saved = localStorage.getItem('factoryLayout');
    if (saved) {
      const layout = JSON.parse(saved);
      setBackgroundImage(layout.backgroundImage);
      setPlacedCards(layout.placedCards || { month1: [], month2: [], month3: [] });
      setMonthTitles(layout.monthTitles || { month1: 'Mês 1', month2: 'Mês 2', month3: 'Mês 3' });
      setAvailableOrders(layout.availableOrders || mockOrders);
    }
  }, []);

  const renderMonth = (monthKey, showImage = false) => (
    <div className="flex-1 min-w-0">
      {/* Month Title */}
      <div className="mb-3">
        <input
          type="text"
          value={monthTitles[monthKey]}
          onChange={(e) => setMonthTitles(prev => ({ ...prev, [monthKey]: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-center font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nome do mês"
        />
      </div>

      {/* Background Image (only for month1) */}
      {showImage && backgroundImage && (
        <div className="mb-3 rounded-lg overflow-hidden border-2 border-gray-600">
          <img src={backgroundImage} alt="Factory Layout" className="w-full h-auto" />
        </div>
      )}

      {/* Grid */}
      <div
        ref={canvasRefs[monthKey]}
        onDrop={(e) => handleCanvasDrop(e, monthKey)}
        onDragOver={(e) => handleCanvasDragOver(e, monthKey)}
        onDragLeave={handleCanvasDragLeave}
        className="relative w-full aspect-[2/5] rounded-lg bg-gray-800 border-4 border-white"
      >
        {/* Grid cells */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-10">
          {Array.from({ length: GRID_ROWS }).map((_, row) =>
            Array.from({ length: GRID_COLS }).map((_, col) => {
              const isOccupied = isCellOccupied(monthKey, row, col);
              const isHovered = hoveredMonth === monthKey && hoveredCell?.row === row && hoveredCell?.col === col;
              
              return (
                <div
                  key={`${row}-${col}`}
                  className={`border-2 border-white transition-all ${
                    isOccupied 
                      ? 'bg-gray-900' 
                      : isHovered 
                        ? (draggedOrder || draggedCard) ? 'bg-green-500/50' : 'bg-blue-500/30'
                        : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">
                    {!isOccupied && `${row},${col}`}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Placed cards */}
        {placedCards[monthKey].map(card => {
          const rect = canvasRefs[monthKey].current?.getBoundingClientRect();
          if (!rect) return null;
          
          const cellWidth = rect.width / GRID_COLS;
          const cellHeight = rect.height / GRID_ROWS;
          
          return (
            <div
              key={card.uniqueId}
              draggable
              onDragStart={(e) => handleCardDragStart(e, card, monthKey)}
              className="absolute rounded shadow-xl cursor-move p-1.5 overflow-hidden"
              style={{
                left: `${card.col * cellWidth + 2}px`,
                top: `${card.row * cellHeight + 2}px`,
                width: `${cellWidth - 4}px`,
                height: `${cellHeight - 4}px`,
                backgroundColor: estadoColors[card.estadoId] || '#6B7280',
                zIndex: 10
              }}
            >
              <div className="h-full flex flex-col text-[10px] leading-tight">
                <div className="flex items-start justify-between gap-0.5 mb-0.5">
                  <GripVertical className="w-2.5 h-2.5 flex-shrink-0" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCard(card.uniqueId);
                    }}
                    className="p-0.5 hover:bg-black/30 rounded transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
                
                <div className="font-bold truncate text-[11px]">{card.projeto}</div>
                <div className="truncate text-[9px]">{card.encomenda}</div>
                <div className="opacity-90 truncate text-[9px]">{card.estado}</div>
                
                <textarea
                  value={card.notes}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateCardNotes(card.uniqueId, e.target.value);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => e.preventDefault()}
                  placeholder="Notas..."
                  className="flex-1 w-full mt-0.5 px-1 py-0.5 bg-black/30 border border-white/30 rounded resize-none focus:outline-none focus:ring-1 focus:ring-white/50 text-[9px]"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-2 text-center text-sm text-gray-400">
        {placedCards[monthKey].length}/{GRID_COLS * GRID_ROWS} células ocupadas
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Left Sidebar - Orders */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold mb-4">Encomendas</h2>
          
          {/* Add custom order field */}
          <div className="mb-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar encomenda personalizada..."
                value={newOrderText}
                onChange={(e) => setNewOrderText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomOrder()}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCustomOrder}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                title="Adicionar"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Search field */}
          <input
            type="text"
            placeholder="Procurar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Available Orders */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
              Disponíveis ({filteredOrders.length})
            </h3>
            <div className="space-y-2">
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  className="rounded-lg"
                  style={{ backgroundColor: estadoColors[order.estadoId] || '#6B7280' }}
                >
                  <div
                    draggable
                    onDragStart={(e) => handleOrderDragStart(e, order)}
                    className="p-3 cursor-move hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{order.projeto}</div>
                        <div className="text-xs truncate">{order.encomenda}</div>
                        <div className="text-xs mt-1 opacity-90">{order.estado}</div>
                      </div>
                      <button
                        onClick={() => duplicateOrder(order)}
                        className="p-1 hover:bg-black/20 rounded transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Placed Cards across all months */}
          {allPlacedCards.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
                No Layout ({allPlacedCards.length})
              </h3>
              <div className="space-y-2">
                {allPlacedCards.map(card => {
                  // Find which month this card is in
                  const month = placedCards.month1.find(c => c.uniqueId === card.uniqueId) ? 'Mês 1' :
                                placedCards.month2.find(c => c.uniqueId === card.uniqueId) ? 'Mês 2' : 'Mês 3';
                  
                  return (
                    <div
                      key={card.uniqueId}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: estadoColors[card.estadoId] || '#6B7280' }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{card.projeto}</div>
                          <div className="text-xs truncate">{card.encomenda}</div>
                          <div className="text-xs opacity-90">{card.estado}</div>
                          <div className="text-xs mt-1 opacity-75">
                            {month} • Célula: {card.row},{card.col}
                          </div>
                        </div>
                        <button
                          onClick={() => removeCard(card.uniqueId)}
                          className="p-1 hover:bg-black/20 rounded transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        value={card.notes}
                        onChange={(e) => updateCardNotes(card.uniqueId, e.target.value)}
                        placeholder="Notas..."
                        className="w-full px-2 py-1 text-xs bg-black/20 border border-white/20 rounded resize-none focus:outline-none focus:ring-1 focus:ring-white/40"
                        rows="3"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Carregar Imagem</span>
          </button>
          <button
            onClick={saveLayout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Layout</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Calendar Area - 3 Months */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Planeamento de Produção</h1>
          <p className="text-sm text-gray-400 mt-1">
            Arraste as encomendas para os meses • Total: {allPlacedCards.length} encomendas no layout
          </p>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-3 gap-6">
            {renderMonth('month1', true)}
            {renderMonth('month2')}
            {renderMonth('month3')}
          </div>
        </div>
      </div>
    </div>
  );
}
