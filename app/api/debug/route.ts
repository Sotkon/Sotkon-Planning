import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks = {
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    },
    prisma: null as any,
    error: null as any
  };

  try {
    // Tenta fazer uma query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    checks.prisma = { status: "connected", result };
  } catch (error) {
    checks.error = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
    };
  }

  return Response.json(checks);
}