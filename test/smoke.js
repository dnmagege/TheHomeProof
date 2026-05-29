const { spawn } = require('child_process');
const { setTimeout: delay } = require('timers/promises');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = process.env.SMOKE_PORT || '3002';
const baseUrl = `http://127.0.0.1:${port}`;

const fetchImpl = global.fetch || ((...args) => import('undici').then(({ fetch }) => fetch(...args)));

function launchDevServer() {
  console.log(`Starting dev server on ${baseUrl}...`);
  const nextBin = path.join(root, 'node_modules', '.bin', 'next');
  const dev = spawn(`cross-env NODE_OPTIONS=--max-old-space-size=2048 "${nextBin}" dev --hostname 127.0.0.1 --port ${port}`, {
    cwd: root,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  dev.stdout.on('data', (chunk) => {
    process.stdout.write(`[dev] ${chunk}`);
  });
  dev.stderr.on('data', (chunk) => {
    process.stderr.write(`[dev] ${chunk}`);
  });

  const cleanup = async () => {
    if (!dev.killed) {
      dev.kill('SIGTERM');
      await delay(500);
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup().then(() => process.exit(1));
  });
  process.on('SIGTERM', () => {
    cleanup().then(() => process.exit(1));
  });

  return { dev, cleanup };
}

async function waitForServer(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetchImpl(url, { method: 'GET' });
      if (res.ok) return;
    } catch (e) {
      // ignore until ready
    }
    await delay(500);
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

async function request({ method, path, body, expectedStatus }) {
  const url = `${baseUrl}${path}`;
  const opts = { method, headers: {} };
  if (body != null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetchImpl(url, opts);
  const text = await res.text();
  const json = (() => {
    try { return JSON.parse(text); } catch { return null; }
  })();
  if (res.status !== expectedStatus) {
    throw new Error(`Expected ${method} ${path} to return ${expectedStatus} but got ${res.status}. Response: ${text}`);
  }
  return { status: res.status, body: json || text };
}

async function runTests() {
  const tests = [
    { method: 'GET', path: '/api', expectedStatus: 200 },
    { method: 'OPTIONS', path: '/api/auth/recover', expectedStatus: 200 },
    { method: 'POST', path: '/api/auth/recover', body: {}, expectedStatus: 400 },
    { method: 'GET', path: '/reset-password', expectedStatus: 200 },
  ];

  for (const test of tests) {
    process.stdout.write(`Running smoke test: ${test.method} ${test.path} ... `);
    await request(test);
    console.log('OK');
  }
}

(async () => {
  const { dev, cleanup } = launchDevServer();
  try {
    await waitForServer(`${baseUrl}/api`);
    await runTests();
    console.log('Smoke tests passed.');
    await cleanup();
    process.exit(0);
  } catch (err) {
    console.error('Smoke tests failed:', err.message);
    await cleanup();
    process.exit(1);
  }
})();
