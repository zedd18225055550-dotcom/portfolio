(function () {
  const FLAG_KEY = "chennnPerfDebug";
  const DATA_KEY = "chennnPerfSelfTestV1";
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("debugPerf");
  const enabled = requested === "1" || window.sessionStorage.getItem(FLAG_KEY) === "1";
  const reset = requested === "reset";
  const now = () => Math.round(performance.now());
  const wallNow = () => Date.now();

  function noop() {}

  function decorateUrl(url) {
    if (!enabled && !reset) return url;
    try {
      const next = new URL(url, window.location.href);
      if (next.origin !== window.location.origin) return url;
      next.searchParams.set("debugPerf", "1");
      return `${next.pathname}${next.search}${next.hash}`;
    } catch (_) {
      return url;
    }
  }

  window.ChennnPerf = {
    enabled,
    decorateUrl,
    mark: noop,
    recordWarmup: noop,
    setWarmupTotal: noop,
    snapshot: noop,
  };

  if (reset) {
    window.sessionStorage.removeItem(DATA_KEY);
    window.sessionStorage.setItem(FLAG_KEY, "1");
  }

  if (!enabled && !reset) return;

  window.sessionStorage.setItem(FLAG_KEY, "1");

  function detectPage() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    if (path === "eye-intro.html") return "eye";
    if (path === "works.html") return "works";
    if (document.title.includes("Portfolio Preview")) return "preview";
    return path.replace(".html", "") || "page";
  }

  function readData() {
    try {
      return JSON.parse(window.sessionStorage.getItem(DATA_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  function createData() {
    return {
      id: `perf-${Date.now().toString(36)}`,
      startedAt: wallNow(),
      origin: window.location.origin,
      pages: {},
      marks: [],
      warmup: {
        total: 0,
        done: 0,
        failed: 0,
        coreTotal: 0,
        coreDone: 0,
        items: [],
      },
    };
  }

  const pageName = detectPage();
  let data = readData();
  if (!data || reset || (pageName === "preview" && requested === "1")) {
    data = createData();
  }

  function elapsed() {
    return Math.max(0, Math.round((wallNow() - data.startedAt) / 100) / 10);
  }

  function save() {
    try {
      window.sessionStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  function getNavigationSummary() {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    if (!nav) return null;
    return {
      type: nav.type,
      responseStartMs: Math.round(nav.responseStart || 0),
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd || 0),
      loadEventMs: Math.round(nav.loadEventEnd || 0),
      durationMs: Math.round(nav.duration || 0),
      transferKB: Math.round((nav.transferSize || 0) / 102.4) / 10,
      decodedKB: Math.round((nav.decodedBodySize || 0) / 102.4) / 10,
    };
  }

  function getResourceSummary() {
    const entries = performance.getEntriesByType?.("resource") || [];
    const byType = {};
    let transfer = 0;
    let decoded = 0;
    let cached = 0;
    const slowest = [];
    const videos = [];

    entries.forEach((entry) => {
      const type = entry.initiatorType || "other";
      const itemTransfer = entry.transferSize || 0;
      const itemDecoded = entry.decodedBodySize || 0;
      const duration = entry.duration || 0;
      transfer += itemTransfer;
      decoded += itemDecoded;
      if (itemTransfer === 0 && itemDecoded > 0) cached += 1;
      byType[type] ||= { count: 0, transferKB: 0, decodedKB: 0, maxDurationMs: 0 };
      byType[type].count += 1;
      byType[type].transferKB += itemTransfer / 1024;
      byType[type].decodedKB += itemDecoded / 1024;
      byType[type].maxDurationMs = Math.max(byType[type].maxDurationMs, duration);

      const row = {
        path: String(entry.name || "").replace(window.location.origin, "").slice(0, 110),
        type,
        transferKB: Math.round(itemTransfer / 102.4) / 10,
        decodedKB: Math.round(itemDecoded / 102.4) / 10,
        durationMs: Math.round(duration),
        startMs: Math.round(entry.startTime || 0),
      };
      slowest.push(row);
      if (/\.(mp4|mov)(\?|$)/i.test(entry.name || "")) videos.push(row);
    });

    Object.keys(byType).forEach((key) => {
      byType[key].transferKB = Math.round(byType[key].transferKB * 10) / 10;
      byType[key].decodedKB = Math.round(byType[key].decodedKB * 10) / 10;
      byType[key].maxDurationMs = Math.round(byType[key].maxDurationMs);
    });

    return {
      count: entries.length,
      transferMB: Math.round(transfer / 104857.6) / 10,
      decodedMB: Math.round(decoded / 104857.6) / 10,
      cached,
      byType,
      slowest: slowest.sort((a, b) => b.durationMs - a.durationMs).slice(0, 6),
      videos: videos.slice(0, 8),
    };
  }

  function mark(name, detail) {
    data.marks.push({
      page: pageName,
      name,
      at: elapsed(),
      detail: detail || null,
    });
    save();
    renderPanel();
  }

  function snapshot(reason) {
    data.pages[pageName] ||= {};
    data.pages[pageName].lastSeenAt = elapsed();
    data.pages[pageName].title = document.title;
    data.pages[pageName].path = `${window.location.pathname}${window.location.search}`;
    data.pages[pageName].reason = reason || "snapshot";
    data.pages[pageName].navigation = getNavigationSummary();
    data.pages[pageName].resources = getResourceSummary();
    save();
    renderPanel();
  }

  function recordWarmup(resource, status, durationMs) {
    const phase = resource?.phase || "unknown";
    const key = resource?.label || resource?.url || "resource";
    const exists = data.warmup.items.find((item) => item.key === key);
    if (!exists) {
      data.warmup.items.push({
        key,
        phase,
        type: resource?.type || "unknown",
        status,
        durationMs: Math.round(durationMs || 0),
        at: elapsed(),
      });
      data.warmup.done += 1;
      if (phase === "core") data.warmup.coreDone += 1;
      if (status === "failed") data.warmup.failed += 1;
    } else {
      exists.status = status;
      exists.durationMs = Math.round(durationMs || exists.durationMs || 0);
      exists.at = elapsed();
    }
    save();
    renderPanel();
  }

  function setWarmupTotal(resources) {
    data.warmup.total = resources.length;
    data.warmup.coreTotal = resources.filter((item) => item.phase === "core").length;
    save();
    renderPanel();
  }

  window.ChennnPerf = {
    enabled: true,
    decorateUrl,
    mark,
    recordWarmup,
    setWarmupTotal,
    snapshot,
    read: () => readData(),
  };

  function getMark(name) {
    return data.marks.find((item) => item.name === name);
  }

  function formatSeconds(value) {
    return typeof value === "number" ? `${value.toFixed(1)}s` : "--";
  }

  function formatMb(value) {
    return typeof value === "number" ? `${value.toFixed(1)}MB` : "--";
  }

  function buildReport() {
    const preview = data.pages.preview;
    const eye = data.pages.eye;
    const works = data.pages.works;
    const enter = getMark("enter_click");
    const coreReady = getMark("core_ready");
    const warm = data.warmup;
    const current = data.pages[pageName];
    const currentResources = current?.resources;
    const lines = [
      `Session: ${data.id}`,
      `Current: ${pageName}`,
      `Total elapsed: ${formatSeconds(elapsed())}`,
      `Preview stay: ${formatSeconds(enter?.at || (pageName === "preview" ? elapsed() : preview?.lastSeenAt))}`,
      `Core ready: ${formatSeconds(coreReady?.at)}`,
      `Eye reached: ${formatSeconds(eye?.lastSeenAt)}`,
      `Works reached: ${formatSeconds(works?.lastSeenAt)}`,
      `Warmup: ${warm.done}/${warm.total || "?"} (${warm.coreDone}/${warm.coreTotal || "?"} core), failed ${warm.failed}`,
      `Current transfer: ${formatMb(currentResources?.transferMB)} / decoded ${formatMb(currentResources?.decodedMB)}`,
      `Current resources: ${currentResources?.count || 0}, cache-like ${currentResources?.cached || 0}`,
    ];

    if (currentResources?.videos?.length) {
      lines.push("Videos:");
      currentResources.videos.slice(0, 4).forEach((item) => {
        lines.push(`- ${item.path.split("/").slice(-2).join("/")} ${item.transferKB}KB ${item.durationMs}ms`);
      });
    }

    if (currentResources?.slowest?.length) {
      lines.push("Slowest:");
      currentResources.slowest.slice(0, 4).forEach((item) => {
        lines.push(`- ${item.type} ${item.durationMs}ms ${item.path.split("/").slice(-2).join("/")}`);
      });
    }

    return lines.join("\n");
  }

  let panel;
  let body;
  let minimized = false;

  function ensurePanel() {
    if (panel || !document.body) return;
    panel = document.createElement("aside");
    panel.setAttribute("data-perf-panel", "");
    panel.innerHTML = `
      <button type="button" data-perf-toggle>Perf</button>
      <pre data-perf-body></pre>
    `;
    const style = document.createElement("style");
    style.textContent = `
      [data-perf-panel] {
        position: fixed;
        right: 14px;
        bottom: 14px;
        z-index: 2147483647;
        width: min(360px, calc(100vw - 28px));
        color: #f7f6f0;
        font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        pointer-events: auto;
      }
      [data-perf-toggle] {
        appearance: none;
        background: rgba(156, 255, 82, 0.86);
        border: 0;
        border-radius: 999px;
        color: #11120e;
        cursor: pointer;
        font: 800 11px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        margin: 0 0 6px auto;
        min-height: 28px;
        padding: 0 12px;
        text-transform: uppercase;
        display: block;
      }
      [data-perf-body] {
        backdrop-filter: blur(18px) saturate(1.2);
        background: rgba(5, 5, 5, 0.76);
        border: 1px solid rgba(244, 243, 237, 0.18);
        border-radius: 12px;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.34);
        margin: 0;
        max-height: min(54vh, 460px);
        overflow: auto;
        padding: 12px;
        white-space: pre-wrap;
      }
      [data-perf-panel].is-minimized [data-perf-body] {
        display: none;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(panel);
    body = panel.querySelector("[data-perf-body]");
    panel.querySelector("[data-perf-toggle]").addEventListener("click", () => {
      minimized = !minimized;
      panel.classList.toggle("is-minimized", minimized);
    });
  }

  function renderPanel() {
    ensurePanel();
    if (!body) return;
    body.textContent = buildReport();
  }

  function decorateInternalLinks() {
    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) return;
      link.setAttribute("href", decorateUrl(href));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    data.pages[pageName] ||= {};
    data.pages[pageName].enteredAt = data.pages[pageName].enteredAt ?? elapsed();
    mark(`${pageName}_entered`);
    decorateInternalLinks();
    snapshot("domcontentloaded");

    const enter = document.querySelector("[data-enter]");
    if (enter) {
      enter.setAttribute("href", decorateUrl(enter.getAttribute("href") || "./eye-intro.html?fromPreview=1"));
      enter.addEventListener("click", () => mark("enter_click"));
    }

    renderPanel();
  });

  window.addEventListener("load", () => {
    window.setTimeout(() => snapshot("load+idle"), 800);
  });

  window.addEventListener("beforeunload", () => {
    snapshot("beforeunload");
  });

  window.setInterval(() => snapshot("interval"), 2500);
})();
