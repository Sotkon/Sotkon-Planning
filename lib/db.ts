import sql from 'mssql';

const config: sql.config = {
  server: 'euw-sql-planning-dev01.database.windows.net',
  database: 'euw-mssql-db-planning-dev01',
  user: 'planning_app',
  password: 'InternalTool@2026',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

let pool: sql.ConnectionPool | null = null;
let connecting: Promise<sql.ConnectionPool> | null = null;

export async function getDb(): Promise<sql.ConnectionPool> {
  // Se já existe uma conexão ativa, retorna
  if (pool && pool.connected) {
    return pool;
  }

  // Se já está conectando, aguarda a conexão
  if (connecting) {
    return connecting;
  }

  // Inicia nova conexão
  connecting = (async () => {
    try {
      console.log('🔌 Connecting to SQL Server...');
      pool = new sql.ConnectionPool(config);
      await pool.connect();
      console.log('✅ Connected to SQL Server');
      return pool;
    } catch (error) {
      console.error('❌ Failed to connect to SQL Server:', error);
      pool = null;
      throw error;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

// Helper para queries simples
export async function query<T = any>(queryText: string, params?: Record<string, any>): Promise<T[]> {
  const pool = await getDb();
  const request = pool.request();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }
  
  const result = await request.query(queryText);
  return result.recordset;
}