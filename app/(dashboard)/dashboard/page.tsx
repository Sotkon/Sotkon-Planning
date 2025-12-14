// app/(dashboard)/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const currentYear = new Date().getFullYear()
  
  // Buscar estatísticas
  const totalCargas = await prisma.tblPlanningCargas.count({
  where: { 
    estadoId: 4,
    dateCreated: {
      gte: new Date(`${currentYear}-01-01`),
      lte: new Date(`${currentYear}-12-31`)
     }
    }
})
  const cargasRecentes = await prisma.tblPlanningCargas.count({
    where: {
      dateCreated: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30))
      }
    }
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">
        Bem-vindo, {session?.user?.name}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Total Cargas */}
        <div className="bg-neutral-800 border border-gray-100 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-6  00 text-sm">Total de Encomendas de Cliente</p>
              <p className="text-3xl font-bold text-gray-100">{totalCargas}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card Cargas Recentes (30 dias) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Últimos 30 dias</p>
              <p className="text-3xl font-bold text-gray-800">{cargasRecentes}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card User Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Perfil</p>
              <p className="text-xl font-bold text-gray-800">{session?.user?.role}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Links rápidos */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/cargas" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
            <div className="text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="font-semibold">Ver Cargas</div>
            </div>
          </a>
          <a href="/cargas/novo" className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
            <div className="text-center">
              <div className="text-3xl mb-2">➕</div>
              <div className="font-semibold">Nova Carga</div>
            </div>
          </a>
          <a href="/autocontrolo" className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="font-semibold">Autocontrolo</div>
            </div>
          </a>
          <a href="/admin/users" className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition">
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="font-semibold">Utilizadores</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
