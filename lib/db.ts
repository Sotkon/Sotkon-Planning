import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER || '',
  database: process.env.DB_DATABASE || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection() {
  try {
    if (pool) {
      // Verificar se a conexão ainda está ativa
      if (pool.connected) {
        return pool;
      }
      // Se não está conectada, fechar e reconectar
      await pool.close();
      pool = null;
    }

    // Validar configuração
    if (!config.server || !config.database || !config.user || !config.password) {
      console.error('[DB] Missing database configuration:', {
        server: !!config.server,
        database: !!config.database,
        user: !!config.user,
        password: !!config.password
      });
      throw new Error('Database configuration is incomplete. Check environment variables.');
    }

    console.log(`[DB] Connecting to ${config.server}/${config.database}...`);
    pool = await sql.connect(config);
    console.log('[DB] Connected successfully');

    // Registar evento de erro para reconexão automática
    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err);
      pool = null;
    });

    return pool;
  } catch (error) {
    console.error('[DB] Connection error:', error);
    pool = null;
    throw error;
  }
}

export { sql };
