import sql from 'mssql';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('🔍 [DEBUG] Starting debug endpoint');
  console.log('📅 [DEBUG] Timestamp:', new Date().toISOString());
  
  const checks = {
    timestamp: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'NOT_FOUND',
      nodeEnv: process.env.NODE_ENV,
    },
    mssql: null as any,
    error: null as any
  };

  console.log('🔒 [DEBUG] Environment variables check:');
  console.log('  - DATABASE_URL exists:', checks.env.hasDatabaseUrl);
  console.log('  - DATABASE_URL prefix:', checks.env.databaseUrlPrefix);
  console.log('  - NEXTAUTH_SECRET exists:', checks.env.hasNextAuthSecret);
  console.log('  - NEXTAUTH_URL exists:', checks.env.hasNextAuthUrl);
  console.log('  - NEXTAUTH_URL value:', process.env.NEXTAUTH_URL || 'NOT_SET');
  console.log('  - NODE_ENV:', checks.env.nodeEnv);

  if (!checks.env.hasDatabaseUrl) {
    console.error('❌ [DEBUG] DATABASE_URL is not set!');
    checks.error = {
      message: 'DATABASE_URL environment variable is not set',
      name: 'ConfigurationError',
      stack: undefined
    };
    console.log('📤 [DEBUG] Returning response with error');
    return Response.json(checks, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  try {
    console.log('🔌 [DEBUG] Attempting to connect to SQL Server...');
    const pool = await sql.connect(process.env.DATABASE_URL!);

    console.log('✅ [DEBUG] Connected successfully');
    console.log('🔄 [DEBUG] Executing test query...');

    const result = await pool.request().query('SELECT 1 as test');

    console.log('✅ [DEBUG] Query executed successfully!');
    console.log('📊 [DEBUG] Query result:', JSON.stringify(result.recordset));

    checks.mssql = { status: "connected", result: result.recordset };

    console.log('🔌 [DEBUG] Closing connection...');
    await pool.close();
    console.log('✅ [DEBUG] Connection closed successfully');

  } catch (error) {
    console.error('❌ [DEBUG] Error occurred during SQL Server operations:');
    console.error('  - Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('  - Error message:', error instanceof Error ? error.message : String(error));
    console.error('  - Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    checks.error = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    };
  }

  console.log('📤 [DEBUG] Returning final response');
  console.log('📋 [DEBUG] Response data:', JSON.stringify(checks, null, 2));

  return Response.json(checks, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}