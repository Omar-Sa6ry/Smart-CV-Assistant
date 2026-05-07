import { execSync } from 'child_process';

export default async () => {
  console.log('\n[E2E Setup] Starting test infrastructure...');

  // Start Docker containers
  try {
    execSync('docker-compose -f docker/test/docker-compose.yml up -d --remove-orphans', {
      stdio: 'inherit',
    });
    console.log('[E2E Setup] Docker containers started.');
  } catch (error) {
    console.error('[E2E Setup] Failed to start Docker containers:', error);
    process.exit(1);
  }

  // Set environment variables for tests
  process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5433/cv_assistant_test?schema=public';
  process.env.REDIS_HOST = '127.0.0.1';
  process.env.REDIS_PORT = '6381';
  process.env.REDIS_URL = 'redis://127.0.0.1:6381';
  process.env.JWT_SECRET = 'test-secret';
  
  // Disable noisy features
  process.env.ENABLE_TELEGRAM_BOT = 'false';
  
  // OAuth Mock Variables
  process.env.GOOGLE_CLIENT_ID = 'mock-id';
  process.env.GOOGLE_CLIENT_SECRET = 'mock-secret';
  process.env.GOOGLE_CALLBACK = 'http://localhost:4003/auth/google/callback';

  // Retry logic for database connection
  console.log('[E2E Setup] Waiting for database and Redis to be ready...');
  
  const checkRedis = async () => {
    const net = require('net');
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.on('connect', () => { socket.destroy(); resolve(true); });
      socket.on('error', () => { socket.destroy(); resolve(false); });
      socket.on('timeout', () => { socket.destroy(); resolve(false); });
      socket.connect(6381, '127.0.0.1');
    });
  };

  let retries = 10;
  while (retries > 0) {
    try {
      const redisReady = await checkRedis();
      if (!redisReady) {
        throw new Error('Redis is not ready yet');
      }

      execSync('npx prisma db push', {
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
        stdio: 'pipe',
      });
      console.log('[E2E Setup] Database schema and Redis synchronized successfully.');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('[E2E Setup] Failed to synchronize infrastructure after multiple attempts.');
        console.error(error.stdout?.toString() || error.stderr?.toString() || error.message);

        execSync('docker-compose -f docker/test/docker-compose.yml down', { stdio: 'inherit' });
        process.exit(1);
      }
      
      const redisReady = await checkRedis();
      console.log(`[E2E Setup] Infra not ready yet (DB attempt ${retries}, Redis: ${redisReady ? 'UP' : 'DOWN'}), retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log('[E2E Setup] Ready to run tests.\n');
};
