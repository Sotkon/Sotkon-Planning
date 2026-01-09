import { PrismaClient } from "@prisma/client";

// 🔗 Define a connection string diretamente aqui
const connectionString = "sqlserver://planning_app_login:InternalTool2026@euw-sql-planning-dev01.database.windows.net/euw-mssql-db-planning-dev01?encrypt=true&trustServerCertificate=true&multipleActiveResultSets=true";

const prisma = new PrismaClient({
  datasources: {
    db: { url: connectionString }
  }
});

async function testConnection() {
  console.log("🔗 Connection string usada pelo Prisma:");
  console.log(connectionString);

  try {
    console.log("Tentando conectar ao banco...");
    
    // Busca apenas 1 usuário para teste
    const users = await prisma.users.findMany({ take: 1 });
    
    console.log("✅ Conexão OK! Exemplo de usuário:", users);
  } catch (err) {
    console.log("❌ Erro ao conectar:");
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Conexão encerrada");
  }
}

testConnection();
