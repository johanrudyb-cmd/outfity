import { writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';

const PORT = Number(process.env.PERF_PORT || 3010);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUT_FILE = `tmp/http-payload-audit-${PORT}.json`;
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'connexion', path: '/connexion' },
  { name: 'blog', path: '/blog' },
  { name: 'dashboard', path: '/dashboard' },
];

async function waitForServerReady(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(BASE_URL, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) {
        return;
      }
    } catch {
      // retry
    }
    await delay(1000);
  }
  throw new Error(`Server not reachable at ${BASE_URL} within ${timeoutMs}ms`);
}

function extractAssets(html) {
  const urls = new Set();
  const regex = /(?:src|href)=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    if (!url.startsWith('/_next/')) {
      continue;
    }
    if (!(url.endsWith('.js') || url.endsWith('.css'))) {
      continue;
    }
    urls.add(url);
  }
  return Array.from(urls);
}

async function fetchWithTiming(url, init) {
  const start = performance.now();
  const res = await fetch(url, init);
  const end = performance.now();
  return { res, ms: Math.round((end - start) * 10) / 10 };
}

async function getResourceSize(urlPath) {
  const url = `${BASE_URL}${urlPath}`;
  const head = await fetch(url, { method: 'HEAD' });
  const headerLength = head.headers.get('content-length');
  if (headerLength) {
    return Number(headerLength) || 0;
  }

  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return buf.byteLength;
}

async function auditPage(page) {
  const url = `${BASE_URL}${page.path}`;
  const { res, ms } = await fetchWithTiming(url, { redirect: 'manual' });
  const status = res.status;
  const location = res.headers.get('location');
  const html = await res.text();
  const htmlBytes = Buffer.byteLength(html, 'utf8');
  const assets = extractAssets(html);

  const assetRows = [];
  for (const asset of assets) {
    const size = await getResourceSize(asset);
    assetRows.push({ asset, sizeBytes: size });
  }

  assetRows.sort((a, b) => b.sizeBytes - a.sizeBytes);

  return {
    page,
    status,
    location,
    responseMs: ms,
    htmlBytes,
    assetCount: assetRows.length,
    assetsTotalBytes: assetRows.reduce((sum, a) => sum + a.sizeBytes, 0),
    topAssets: assetRows.slice(0, 8),
  };
}

async function run() {
  await waitForServerReady();

  const results = [];
  for (const page of PAGES) {
    results.push(await auditPage(page));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    results,
  };

  writeFileSync(OUT_FILE, JSON.stringify(report, null, 2), 'utf8');
  console.log(`HTTP payload audit generated: ${OUT_FILE}`);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
