#!/usr/bin/env node
/**
 * Frees a TCP port by killing whatever process is listening on it.
 * Cross-platform: Windows (netstat) / macOS+Linux (lsof).
 * Usage: node scripts/free-port.mjs <port>
 */
import { execSync } from 'node:child_process';

const port = Number(process.argv[2]);
if (!port || Number.isNaN(port)) {
  console.error('Usage: free-port.mjs <port>');
  process.exit(1);
}

const isWin = process.platform === 'win32';

function killWindows(p) {
  let out = '';
  try {
    out = execSync(`netstat -ano -p tcp | findstr :${p}`, { encoding: 'utf8' });
  } catch {
    return [];
  }
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/LISTENING\s+(\d+)/);
    if (m) pids.add(m[1]);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`free-port: killed PID ${pid} on :${p}`);
    } catch {
      /* ignore */
    }
  }
  return [...pids];
}

function killUnix(p) {
  let out = '';
  try {
    out = execSync(`lsof -nP -iTCP:${p} -sTCP:LISTEN -t`, { encoding: 'utf8' });
  } catch {
    return [];
  }
  const pids = out
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const pid of pids) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`free-port: killed PID ${pid} on :${p}`);
    } catch {
      /* ignore */
    }
  }
  return pids;
}

const killed = isWin ? killWindows(port) : killUnix(port);
if (killed.length === 0) {
  console.log(`free-port: :${port} already free`);
}
