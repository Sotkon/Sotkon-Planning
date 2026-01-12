// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getDb } from './db'
import bcrypt from 'bcryptjs'
import sql from 'mssql'

declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    id?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const pool = await getDb()
        
        const result = await pool.request()
          .input('username', sql.NVarChar, credentials.username)
          .query('SELECT * FROM users WHERE username = @username')

        if (result.recordset.length === 0) {
          return null
        }

        const user = result.recordset[0]

        if (!user.active) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isValid) {
          return null
        }

        // Atualizar último login
        await pool.request()
          .input('id', sql.Int, user.id)
          .input('lastLogin', sql.DateTime, new Date())
          .query('UPDATE users SET lastLogin = @lastLogin WHERE id = @id')

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email || '',
          role: user.role || 'user'
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}