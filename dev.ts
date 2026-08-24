import { spawn } from 'child_process';

const vite = spawn('vite', [], { stdio: 'inherit', shell: true });
const server = spawn('tsx', ['server.ts'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  vite.kill('SIGINT');
  server.kill('SIGINT');
  process.exit();
});
process.on('SIGTERM', () => {
  vite.kill('SIGTERM');
  server.kill('SIGTERM');
  process.exit();
});
