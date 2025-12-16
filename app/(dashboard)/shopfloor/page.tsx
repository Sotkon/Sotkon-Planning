'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Trash2, Save, Upload, X } from 'lucide-react';

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
  const [placedCards, setPlacedCards] = useState([]);
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Filter orders based on search
  const filteredOrders = orders.filter(order => 
    order.projeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.encomenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if a grid cell is occupied
  const isCellOccupied = (row, col) => {
    return placedCards.some(card => card.row === row && card.col === col);
  };

  // Get cell position from mouse coordinates
  const getCellFromCoordinates = (x, y) => {
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

  // Handle dragging order from sidebar
  const handleOrderDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle dragging existing card on canvas
  const handleCardDragStart = (e, card) => {
    e.stopPropagation();
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over canvas
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cell = getCellFromCoordinates(x, y);
    setHoveredCell(cell);
    
    if (draggedOrder) {
      e.dataTransfer.dropEffect = 'copy';
    } else if (draggedCard) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleCanvasDragLeave = () => {
    setHoveredCell(null);
  };

  // Handle drop on canvas
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cell = getCellFromCoordinates(x, y);
    
    if (!cell) {
      setDraggedOrder(null);
      setDraggedCard(null);
      setHoveredCell(null);
      return;
    }

    // Check if cell is occupied
    if (isCellOccupied(cell.row, cell.col)) {
      setDraggedOrder(null);
      setDraggedCard(null);
      setHoveredCell(null);
      return;
    }

    if (draggedOrder) {
      // Adding new card
      const newCard = {
        ...draggedOrder,
        uniqueId: Date.now() + Math.random(),
        row: cell.row,
        col: cell.col,
        notes: ''
      };
      setPlacedCards([...placedCards, newCard]);
    } else if (draggedCard) {
      // Moving existing card
      setPlacedCards(prev => prev.map(card => 
        card.uniqueId === draggedCard.uniqueId
          ? { ...card, row: cell.row, col: cell.col }
          : card
      ));
    }

    setDraggedOrder(null);
    setDraggedCard(null);
    setHoveredCell(null);
  };

  // Update card notes
  const updateCardNotes = (uniqueId, notes) => {
    setPlacedCards(prev => prev.map(card => 
      card.uniqueId === uniqueId ? { ...card, notes } : card
    ));
  };

  // Remove card
  const removeCard = (uniqueId) => {
    setPlacedCards(prev => prev.filter(card => card.uniqueId !== uniqueId));
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
      placedCards
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
      setPlacedCards(layout.placedCards || []);
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Left Sidebar - Orders */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold mb-4">Encomendas</h2>
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
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">Disponíveis</h3>
            <div className="space-y-2">
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  draggable
                  onDragStart={(e) => handleOrderDragStart(e, order)}
                  className="p-3 rounded-lg cursor-move hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: estadoColors[order.estadoId] || '#6B7280' }}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{order.projeto}</div>
                      <div className="text-xs truncate">{order.encomenda}</div>
                      <div className="text-xs mt-1 opacity-90">{order.estado}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Placed Cards */}
          {placedCards.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
                No Layout ({placedCards.length})
              </h3>
              <div className="space-y-2">
                {placedCards.map(card => (
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
                          Célula: {card.row},{card.col}
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
                ))}
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

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Organização da Fábrica</h1>
          <p className="text-sm text-gray-400 mt-1">
            Arraste as encomendas para o layout da fábrica • {placedCards.length}/{GRID_COLS * GRID_ROWS} células ocupadas
          </p>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div
            ref={canvasRef}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            className="relative w-full h-full min-h-[800px] rounded-lg"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundColor: '#374151'
            }}
          >
            {/* Grid cells */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-10 gap-0">
              {Array.from({ length: GRID_ROWS }).map((_, row) =>
                Array.from({ length: GRID_COLS }).map((_, col) => {
                  const isOccupied = isCellOccupied(row, col);
                  const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
                  
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`border border-gray-600 transition-colors ${
                        isOccupied 
                          ? 'bg-gray-800/50' 
                          : isHovered 
                            ? (draggedOrder || draggedCard) ? 'bg-blue-500/30' : 'bg-gray-700/30'
                            : 'bg-transparent hover:bg-gray-700/20'
                      }`}
                    >
                      {!isOccupied && (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 opacity-0 hover:opacity-100">
                          {row},{col}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Placed cards */}
            {placedCards.map(card => {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return null;
              
              const cellWidth = rect.width / GRID_COLS;
              const cellHeight = rect.height / GRID_ROWS;
              
              return (
                <div
                  key={card.uniqueId}
                  draggable
                  onDragStart={(e) => handleCardDragStart(e, card)}
                  className="absolute rounded-lg shadow-lg cursor-move"
                  style={{
                    left: `${card.col * cellWidth}px`,
                    top: `${card.row * cellHeight}px`,
                    width: `${cellWidth}px`,
                    height: `${cellHeight}px`,
                    backgroundColor: estadoColors[card.estadoId] || '#6B7280'
                  }}
                >
                  <div className="p-2 h-full flex flex-col">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <GripVertical className="w-4 h-4 flex-shrink-0" />
                      <button
                        onClick={() => removeCard(card.uniqueId)}
                        className="p-1 hover:bg-black/20 rounded transition-colors"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="font-semibold text-xs mb-0.5 truncate">{card.projeto}</div>
                    <div className="text-xs mb-0.5 truncate">{card.encomenda}</div>
                    <div className="text-xs opacity-90 mb-1 truncate">{card.estado}</div>
                    
                    <textarea
                      value={card.notes}
                      onChange={(e) => updateCardNotes(card.uniqueId, e.target.value)}
                      placeholder="Notas..."
                      className="flex-1 w-full px-1 py-1 text-xs bg-black/20 border border-white/20 rounded resize-none focus:outline-none focus:ring-1 focus:ring-white/40"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              );
            })}

            {!backgroundImage && placedCards.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
                <div className="text-center">
                  <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Carregue uma imagem de fundo e arraste encomendas</p>
                  <p className="text-sm mt-2">Grade: 4 colunas × 10 linhas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
