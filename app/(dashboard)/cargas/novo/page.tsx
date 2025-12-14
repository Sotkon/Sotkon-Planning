'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';

export default function NovaCargaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    cliente: '',
    paisId: 1,
    encomendaDoCliente: '',
    encomendaPrimavera: '',
    projecto: '',
    estadoId: 1,
    dataPrevistaDeCarga: '',
    horaPrevistaDeCarga: '09:00',
    prazoDeEntregaPrevisto: '',
    contactosParaEntrega: '',
    mercadoria: '',
    condicoesDePagamento: '',
    mercadoriaQueFaltaEntregar: '',
    localizacao: '',
    transportador: '',
    custos_de_transporte: '',
    servicosARealizar: [] as number[]
  });

  // Fetch dados da carga (se edit)
  const { data: cargaData } = useQuery({
    queryKey: ['carga', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/cargas/${id}`);
      if (!res.ok) throw new Error('Failed to fetch carga');
      return res.json();
    },
    enabled: isEdit
  });

  // Fetch países
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await fetch('/api/countries');
      if (!res.ok) throw new Error('Failed to fetch countries');
      return res.json();
    }
  });

  // Fetch estados
  const { data: estados = [] } = useQuery({
    queryKey: ['estados', 'pt'],
    queryFn: async () => {
      const res = await fetch('/api/estados?language=pt');
      if (!res.ok) throw new Error('Failed to fetch estados');
      const data = await res.json();
      return data.filter((e: any) => e.value > 0); // Remove "TODOS"
    }
  });

  // Fetch serviços
  const { data: servicos = [] } = useQuery({
    queryKey: ['servicos', 'pt'],
    queryFn: async () => {
      const res = await fetch('/api/servicos?language=pt');
      if (!res.ok) throw new Error('Failed to fetch servicos');
      return res.json();
    }
  });

  // Preencher form se edit
  useEffect(() => {
    if (cargaData) {
      setFormData({
        cliente: cargaData.cliente || '',
        paisId: cargaData.paisId || 1,
        encomendaDoCliente: cargaData.encomendaDoCliente || '',
        encomendaPrimavera: cargaData.encomendaPrimavera || '',
        projecto: cargaData.projecto || '',
        estadoId: cargaData.estadoId || 1,
        dataPrevistaDeCarga: cargaData.dataPrevistaDeCarga || '',
        horaPrevistaDeCarga: cargaData.horaPrevistaDeCarga || '09:00',
        prazoDeEntregaPrevisto: cargaData.prazoDeEntregaPrevisto || '',
        contactosParaEntrega: cargaData.contactosParaEntrega || '',
        mercadoria: cargaData.mercadoria || '',
        condicoesDePagamento: cargaData.condicoesDePagamento || '',
        mercadoriaQueFaltaEntregar: cargaData.mercadoriaQueFaltaEntregar || '',
        localizacao: cargaData.localizacao || '',
        transportador: cargaData.transportador || '',
        custos_de_transporte: cargaData.custos_de_transporte || '',
        servicosARealizar: cargaData.servicosARealizar || []
      });
    }
  }, [cargaData]);

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = isEdit ? `/api/cargas/${id}` : '/api/cargas';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save carga');
      return res.json();
    },
    onSuccess: () => {
      alert(isEdit ? 'Carga atualizada com sucesso!' : 'Carga criada com sucesso!');
      router.push('/cargas');
    },
    onError: () => {
      alert('Erro ao salvar carga!');
    }
  });

  // Mutation para apagar
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cargas/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete carga');
      return res.json();
    },
    onSuccess: () => {
      alert('Carga apagada com sucesso!');
      router.push('/cargas');
    },
    onError: () => {
      alert('Erro ao apagar carga!');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente || !formData.dataPrevistaDeCarga) {
      alert('Por favor preencha os campos obrigatórios (Cliente e Data)');
      return;
    }

    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm('Tem a certeza que deseja apagar esta carga?')) {
      deleteMutation.mutate();
    }
  };

  const handleServicoToggle = (servicoId: number) => {
    setFormData(prev => ({
      ...prev,
      servicosARealizar: prev.servicosARealizar.includes(servicoId)
        ? prev.servicosARealizar.filter(id => id !== servicoId)
        : [...prev.servicosARealizar, servicoId]
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-800 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-neutral-800 border border-gray-100 shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/cargas')}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-100">
                {isEdit ? 'Editar Carga' : 'Nova, Agendada, A Definir'}
              </h1>
            </div>

            {isEdit && (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Apagar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          
          {/* Secção 1: Informação Básica */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Informação Básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* País */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <select
                  value={formData.paisId}
                  onChange={(e) => setFormData({ ...formData, paisId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {countries.map((country: any) => (
                    <option key={country.id} value={country.id}>
                      {country.country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Encomenda Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encomenda do Cliente
                </label>
                <input
                  type="text"
                  value={formData.encomendaDoCliente}
                  onChange={(e) => setFormData({ ...formData, encomendaDoCliente: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Encomenda Primavera */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encomenda Primavera
                </label>
                <input
                  type="text"
                  value={formData.encomendaPrimavera}
                  onChange={(e) => setFormData({ ...formData, encomendaPrimavera: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Projeto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projeto
                </label>
                <input
                  type="text"
                  value={formData.projecto}
                  onChange={(e) => setFormData({ ...formData, projecto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.estadoId}
                  onChange={(e) => setFormData({ ...formData, estadoId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {estados.map((estado: any) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.text}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Secção 2: Datas */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Datas e Prazos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Data Prevista */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Prevista de Carga <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dataPrevistaDeCarga}
                  onChange={(e) => setFormData({ ...formData, dataPrevistaDeCarga: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Hora Prevista */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Prevista
                </label>
                <input
                  type="time"
                  value={formData.horaPrevistaDeCarga}
                  onChange={(e) => setFormData({ ...formData, horaPrevistaDeCarga: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Prazo Entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prazo de Entrega Previsto
                </label>
                <input
                  type="text"
                  value={formData.prazoDeEntregaPrevisto}
                  onChange={(e) => setFormData({ ...formData, prazoDeEntregaPrevisto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 2 semanas"
                />
              </div>

            </div>
          </div>

          {/* Secção 3: Detalhes */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Detalhes da Carga
            </h2>
            <div className="grid grid-cols-1 gap-4">
              
              {/* Localização */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localização
                </label>
                <input
                  type="text"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contactos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contactos para Entrega
                </label>
                <textarea
                  value={formData.contactosParaEntrega}
                  onChange={(e) => setFormData({ ...formData, contactosParaEntrega: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mercadoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mercadoria
                </label>
                <textarea
                  value={formData.mercadoria}
                  onChange={(e) => setFormData({ ...formData, mercadoria: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mercadoria que falta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mercadoria que Falta Entregar
                </label>
                <textarea
                  value={formData.mercadoriaQueFaltaEntregar}
                  onChange={(e) => setFormData({ ...formData, mercadoriaQueFaltaEntregar: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Condições Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condições de Pagamento
                </label>
                <input
                  type="text"
                  value={formData.condicoesDePagamento}
                  onChange={(e) => setFormData({ ...formData, condicoesDePagamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>
          </div>

          {/* Secção 4: Transporte */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Transporte
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Transportador */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transportador
                </label>
                <input
                  type="text"
                  value={formData.transportador}
                  onChange={(e) => setFormData({ ...formData, transportador: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Custos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custos de Transporte (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.custos_de_transporte}
                  onChange={(e) => setFormData({ ...formData, custos_de_transporte: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>
          </div>

          {/* Secção 5: Serviços */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Serviços a Realizar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {servicos.map((servico: { value: number; text: string | null }) => (
                <label
                  key={servico.value}
                  className="flex items-center gap-2 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.servicosARealizar.includes(servico.value)}
                    onChange={() => handleServicoToggle(servico.value)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{servico.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push('/cargas')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'A guardar...' : (isEdit ? 'Atualizar' : 'Criar')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
