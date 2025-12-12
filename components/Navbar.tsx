'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const toggleDropdown = (menu: string) => {
    setOpenDropdown(openDropdown === menu ? null : menu)
  }

  const closeDropdown = () => {
    setOpenDropdown(null)
  }

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-900">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              
              {/* Dashboard Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('dashboard')}
                  className="px-4 py-2 rounded hover:bg-gray-850 font-medium transition text-gray-100 flex items-center gap-1"
                >
                  Dashboard
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      openDropdown === 'dashboard' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openDropdown === 'dashboard' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-gray-900 border border-gray-900 rounded-lg shadow-lg py-2 z-50">
                    <Link
                      href="/dashboard/geral"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Visão Geral
                    </Link>
                    <Link
                      href="/dashboard/metricas"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Métricas
                    </Link>
                    <Link
                      href="/dashboard/performance"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Performance
                    </Link>
                    <div className="border-t border-gray-900 my-2"></div>
                    <Link
                      href="/dashboard/alertas"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Alertas
                    </Link>
                    <Link
                      href="/dashboard/notificacoes"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Notificações
                    </Link>
                  </div>
                )}
              </div>

              {/* Encomendas Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('encomendas')}
                  className="px-4 py-2 rounded hover:bg-gray-850 font-medium transition text-gray-100 flex items-center gap-1"
                >
                  Encomendas
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      openDropdown === 'encomendas' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openDropdown === 'encomendas' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-gray-900 border border-gray-900 rounded-lg shadow-lg py-2 z-50">
                    <Link
                      href="/encomendas/nova"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Nova Encomenda
                    </Link>
                    <Link
                      href="/encomendas/lista"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Todas as Encomendas
                    </Link>
                    <div className="border-t border-gray-900 my-2"></div>
                    <Link
                      href="/encomendas/pendentes"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Pendentes
                    </Link>
                    <Link
                      href="/encomendas/em-preparacao"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Em Preparação
                    </Link>
                    <Link
                      href="/encomendas/prontas"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Prontas para Envio
                    </Link>
                    <Link
                      href="/encomendas/concluidas"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Concluídas
                    </Link>
                    <Link
                      href="/encomendas/canceladas"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Canceladas
                    </Link>
                    <div className="border-t border-gray-900 my-2"></div>
                    <Link
                      href="/encomendas/clientes"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Gestão de Clientes
                    </Link>
                  </div>
                )}
              </div>

              {/* Expedições Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('expedicoes')}
                  className="px-4 py-2 rounded hover:bg-gray-850 font-medium transition text-gray-100 flex items-center gap-1"
                >
                  Expedições
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      openDropdown === 'expedicoes' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openDropdown === 'expedicoes' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-gray-900 border border-gray-900 rounded-lg shadow-lg py-2 z-50">
                    <Link
                      href="/expedicoes/nova"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Nova Expedição
                    </Link>
                    <Link
                      href="/expedicoes/agendar"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Agendar Expedição
                    </Link>
                    <div className="border-t border-gray-900 my-2"></div>
                    <Link
                      href="/expedicoes/em-transito"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Em Trânsito
                    </Link>
                    <Link
                      href="/expedicoes/entregues"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Entregues
                    </Link>
                    <Link
                      href="/expedicoes/devolvidas"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Devolvidas
                    </Link>
                    <div className="border-t border-gray-900 my-2"></div>
                    <Link
                      href="/expedicoes/rastreamento"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Rastreamento
                    </Link>
                    <Link
                      href="/expedicoes/transportadoras"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Transportadoras
                    </Link>
                    <Link
                      href="/expedicoes/rotas"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Gestão de Rotas
                    </Link>
                  </div>
                )}
              </div>

              {/* Análises Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('analises')}
                  className="px-4 py-2 rounded hover:bg-gray-900 font-medium transition text-gray-100 flex items-center gap-1"
                >
                  Análises
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      openDropdown === 'analises' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openDropdown === 'analises' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-gray-900 border border-gray-900 rounded-lg shadow-lg py-2 z-50">
                    <Link
                      href="/analises/vendas"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Análise de Vendas
                    </Link>
                    <Link
                      href="/analises/operacional"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Análise Operacional
                    </Link>
                    <Link
                      href="/analises/financeira"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Análise Financeira
                    </Link>
                    <div className="border-t border-gray-900 my-2"></div>
                    <Link
                      href="/analises/clientes"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Análise de Clientes
                    </Link>
                    <Link
                      href="/analises/produtos"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Análise de Produtos
                    </Link>
                    <Link
                      href="/analises/fornecedores"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Análise de Fornecedores
                    </Link>
                    <div className="border-t border-gray-900 my-2"></div>
                    <Link
                      href="/analises/relatorios"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Relatórios Personalizados
                    </Link>
                    <Link
                      href="/analises/exportar"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Exportar Dados
                    </Link>
                  </div>
                )}
              </div>

              {/* Procurement Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('procurement')}
                  className="px-4 py-2 rounded hover:bg-gray-900 font-medium transition text-gray-100 flex items-center gap-1"
                >
                  Procurement
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      openDropdown === 'procurement' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openDropdown === 'procurement' && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-gray-900 border border-gray-600 rounded-lg shadow-lg py-2 z-50">
                    <Link
                      href="/procurement/requisicoes"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Requisições de Compra
                    </Link>
                    <Link
                      href="/procurement/nova-requisicao"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Nova Requisição
                    </Link>
                    <div className="border-t border-gray-900 my-2"></div>
                    <Link
                      href="/procurement/fornecedores"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Gestão de Fornecedores
                    </Link>
                    <Link
                      href="/procurement/cotacoes"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Cotações
                    </Link>
                    <Link
                      href="/procurement/contratos"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Contratos
                    </Link>
                    <div className="border-t border-gray-900 my-2"></div>
                    <Link
                      href="/procurement/ordens-compra"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Ordens de Compra
                    </Link>
                    <Link
                      href="/procurement/recepcao"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Recepção de Materiais
                    </Link>
                    <Link
                      href="/procurement/inventario"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Inventário
                    </Link>
                    <div className="border-t border-gray-900 my-2"></div>
                    <Link
                      href="/procurement/aprovacoes"
                      className="block px-4 py-2 hover:bg-gray-850 text-gray-100 transition"
                      onClick={closeDropdown}
                    >
                      Aprovações Pendentes
                    </Link>
                  </div>
                )}
              </div>

            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-100">Nome do Utilizador</div>
                <div className="text-xs text-gray-400">Administrador</div>
              </div>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition text-white">
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay para fechar dropdown ao clicar fora */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeDropdown}
        ></div>
      )}
    </>
  )
}
