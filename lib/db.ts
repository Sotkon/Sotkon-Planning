import sql from 'mssql';

const config: sql.config = {
  server: 'euw-sql-planning-dev01.database.windows.net',
  database: 'euw-mssql-db-planning-dev01',
  user: 'planning_app',
  password: 'InternalTool@2026',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;

export async function getDb() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
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