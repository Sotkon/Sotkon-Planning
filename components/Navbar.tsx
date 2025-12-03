'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-green-600">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded hover:bg-green-700 font-medium transition text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/cargas/novo"
              className="px-4 py-2 rounded hover:bg-green-700 font-medium transition text-white"
            >
              Nova carga
            </Link>
            <Link
              href="/cargas"
              className="px-4 py-2 rounded hover:bg-green-700 font-medium transition text-white"
            >
              Cargas
            </Link>
            <Link
              href="/autocontrolo"
              className="px-4 py-2 rounded hover:bg-green-700 font-medium transition text-white"
            >
              Autocontrolo
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white">{session?.user?.name}</div>
              <div className="text-xs text-green-100">
                {session?.user?.role === 'admin' ? 'Administrador' : 'Utilizador'}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}