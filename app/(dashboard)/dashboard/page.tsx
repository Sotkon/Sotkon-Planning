// app/(dashboard)/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  // Order Statistics
  const ordersDelivered = await prisma.tblPlanningCargas.count({
    where: { status: 'DELIVERED' }
  })
  
  const ordersConcluded = await prisma.tblPlanningCargas.count({
    where: { status: 'CONCLUDED' }
  })
  
  const ordersScheduled = await prisma.tblPlanningCargas.count({
    where: { status: 'SCHEDULED' }
  })
  
  const ordersInProduction = await prisma.tblPlanningCargas.count({
    where: { status: 'IN_PRODUCTION' }
  })
  
  const ordersToStart = await prisma.tblPlanningCargas.count({
    where: { status: 'TO_START' }
  })
  
  const ordersCanceled = await prisma.tblPlanningCargas.count({
    where: { status: 'CANCELED' }
  })

  // Delivery Statistics
  const deliveriesConcluded = await prisma.tblDeliveries.count({
    where: { status: 'CONCLUDED' }
  })
  
  const deliveriesInTransit = await prisma.tblDeliveries.count({
    where: { status: 'IN_TRANSIT' }
  })
  
  const deliveriesScheduled = await prisma.tblDeliveries.count({
    where: { status: 'SCHEDULED' }
  })
  
  const deliveriesToSchedule = await prisma.tblDeliveries.count({
    where: { status: 'TO_SCHEDULE' }
  })

  // Time Metrics (average in days)
  const avgTimeToDeliver = await prisma.tblPlanningCargas.aggregate({
    where: { 
      status: 'DELIVERED',
      dateCreated: { not: null },
      dateDelivered: { not: null }
    },
    _avg: {
      daysToDeliver: true
    }
  })

  const avgTimeToFinish = await prisma.tblPlanningCargas.aggregate({
    where: { 
      status: 'CONCLUDED',
      dateCreated: { not: null },
      dateConcluded: { not: null }
    },
    _avg: {
      daysToFinish: true
    }
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-6">
        Bem-vindo, {session?.user?.name}!
      </h1>

      {/* Orders Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">📦 Orders Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          
          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">Delivered</p>
              <p className="text-3xl font-bold text-green-400">{ordersDelivered}</p>
            </div>
          </div>

          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">Concluded</p>
              <p className="text-3xl font-bold text-blue-400">{ordersConcluded}</p>
            </div>
          </div>

          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">Scheduled</p>
              <p className="text-3xl font-bold text-purple-400">{ordersScheduled}</p>
            </div>
          </div>

          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">In Production</p>
              <p className="text-3xl font-bold text-yellow-400">{ordersInProduction}</p>
            </div>
          </div>

          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">To Start</p>
              <p className="text-3xl font-bold text-orange-400">{ordersToStart}</p>
            </div>
          </div>

          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">Canceled</p>
              <p className="text-3xl font-bold text-red-400">{ordersCanceled}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Deliveries Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">🚚 Deliveries Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          
          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">Concluded</p>
              <p className="text-3xl font-bold text-green-400">{deliveriesConcluded}</p>
            </div>
          </div>

          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">In Transit</p>
              <p className="text-3xl font-bold text-blue-400">{deliveriesInTransit}</p>
            </div>
          </div>

          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">Scheduled</p>
              <p className="text-3xl font-bold text-purple-400">{deliveriesScheduled}</p>
            </div>
          </div>

          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">To Schedule</p>
              <p className="text-3xl font-bold text-orange-400">{deliveriesToSchedule}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Time Metrics Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">⏱️ Time Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">Avg. Time to Deliver</p>
              <p className="text-3xl font-bold text-cyan-400">
                {avgTimeToDeliver._avg.daysToDeliver?.toFixed(1) || '0'} days
              </p>
            </div>
          </div>

          <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
            <div className="flex flex-col">
              <p className="text-gray-400 text-sm mb-2">Avg. Time to Finish</p>
              <p className="text-3xl font-bold text-cyan-400">
                {avgTimeToFinish._avg.daysToFinish?.toFixed(1) || '0'} days
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-neutral-800 border border-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/cargas" className="p-4 border-2 border-gray-600 rounded-lg hover:border-blue-500 hover:bg-neutral-700 transition">
            <div className="text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="font-semibold text-gray-200">Ver Cargas</div>
            </div>
          </a>
          <a href="/cargas/novo" className="p-4 border-2 border-gray-600 rounded-lg hover:border-green-500 hover:bg-neutral-700 transition">
            <div className="text-center">
              <div className="text-3xl mb-2">➕</div>
              <div className="font-semibold text-gray-200">Nova Carga</div>
            </div>
          </a>
          <a href="/autocontrolo" className="p-4 border-2 border-gray-600 rounded-lg hover:border-purple-500 hover:bg-neutral-700 transition">
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="font-semibold text-gray-200">Autocontrolo</div>
            </div>
          </a>
          <a href="/admin/users" className="p-4 border-2 border-gray-600 rounded-lg hover:border-orange-500 hover:bg-neutral-700 transition">
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="font-semibold text-gray-200">Utilizadores</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
