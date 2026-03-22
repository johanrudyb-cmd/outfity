import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import puppeteer from 'puppeteer';

const PORT = Number(process.env.PERF_PORT || 3011);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUT_DIR = 'tmp';
const OUT_FILE = `${OUT_DIR}/perf-report-local.json`;
const SERVER_OUT = `${OUT_DIR}/perf-server-${PORT}.out.log`;
const SERVER_ERR = `${OUT_DIR}/perf-server-${PORT}.err.log`;
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'connexion', path: '/connexion' },
  { name: 'blog', path: '/blog' },
];
const RUNS_PER_PAGE = 2;

mkdirSync(OUT_DIR, { recursive: true });

function startServer() {
  const child = spawn('cmd.exe', ['/c', `npm run start -- -p ${PORT}`], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  const outChunks = [];
  const errChunks = [];

  child.stdout.on('data', (data) => {
    outChunks.push(data.toString());
  });

  child.stderr.on('data', (data) => {
    errChunks.push(data.toString());
  });

  const flushLogs = () => {
    writeFileSync(SERVER_OUT, outChunks.join(''), 'utf8');
    writeFileSync(SERVER_ERR, errChunks.join(''), 'utf8');
  };

  child.on('exit', flushLogs);
  process.on('exit', flushLogs);

  return { child, flushLogs };
}

async function waitForServerReady(timeoutMs = 120000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(BASE_URL, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) {
        return;
      }
    } catch {
      // Wait and retry until timeout.
    }
    await delay(1000);
  }

  throw new Error(`Server not reachable at ${BASE_URL} within ${timeoutMs}ms`);
}

async function measurePage(browser, pageConfig) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  const url = `${BASE_URL}${pageConfig.path}`;
  const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });

  // Let buffered paint/layout entries settle after network idle.
  await delay(1200);

  const data = await page.evaluate(() => {
    const getEntry = (name) =>
      performance.getEntriesByName(name).at(-1)?.startTime ?? null;

    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const topResources = resources
      .map((r) => ({
        name: r.name,
        initiatorType: r.initiatorType,
        duration: Math.round(r.duration * 10) / 10,
        transferSize: r.transferSize || 0,
        encodedBodySize: r.encodedBodySize || 0,
      }))
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, 10);

    let lcp = null;
    const lcpEntries = performance
      .getEntriesByType('largest-contentful-paint')
      .map((entry) => entry.startTime);
    if (lcpEntries.length) {
      lcp = lcpEntries[lcpEntries.length - 1];
    }

    let cls = 0;
    for (const entry of performance.getEntriesByType('layout-shift')) {
      if (!entry.hadRecentInput) {
        cls += entry.value || 0;
      }
    }

    return {
      title: document.title,
      finalUrl: location.href,
      fp: getEntry('first-paint'),
      fcp: getEntry('first-contentful-paint'),
      lcp,
      cls,
      ttfb: nav ? nav.responseStart : null,
      dcl: nav ? nav.domContentLoadedEventEnd : null,
      load: nav ? nav.loadEventEnd : null,
      resources: {
        count: resources.length,
        totalTransfer: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      },
      topResources,
    };
  });

  await page.close();

  return {
    status: response?.status() ?? null,
    ...data,
  };
}

function summarizeRuns(runs) {
  const middle = runs[Math.floor(runs.length / 2)];
  return {
    status: middle.status,
    finalUrl: middle.finalUrl,
    fp: middle.fp,
    fcp: middle.fcp,
    lcp: middle.lcp,
    cls: middle.cls,
    ttfb: middle.ttfb,
    dcl: middle.dcl,
    load: middle.load,
    resources: middle.resources,
  };
}

async function run() {
  const { child, flushLogs } = startServer();

  try {
    await waitForServerReady();

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    const results = [];
    for (const pageConfig of PAGES) {
      const runs = [];
      for (let i = 0; i < RUNS_PER_PAGE; i += 1) {
        runs.push(await measurePage(browser, pageConfig));
      }
      results.push({
        page: pageConfig,
        runs,
        summary: summarizeRuns(runs),
      });
    }

    await browser.close();

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      pages: PAGES,
      runsPerPage: RUNS_PER_PAGE,
      results,
    };

    writeFileSync(OUT_FILE, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Performance report generated: ${OUT_FILE}`);
  } finally {
    flushLogs();
    if (!child.killed) {
      spawnSync('cmd.exe', ['/c', `taskkill /PID ${child.pid} /T /F`], { stdio: 'ignore' });
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
