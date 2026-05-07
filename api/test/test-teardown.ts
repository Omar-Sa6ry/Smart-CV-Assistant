import { execSync } from 'child_process';

export default async () => {
  console.log('\n[E2E Teardown] Cleaning up test infrastructure...');
  
  try {
    execSync('docker-compose -f docker/test/docker-compose.yml down', {
      stdio: 'inherit',
    });
    console.log('[E2E Teardown] Docker containers removed.');
  } catch (error) {
    console.error('[E2E Teardown] Failed to remove Docker containers:', error);
  }
};
