/**
 * Chen IP Pixel Pet — floating sprite companion (Node 019).
 *
 * Features:
 *   • 9-state pixel sprite animator (192x208 cells, 8x9 atlas at 50% scale)
 *   • Click pet  → wave once
 *   • Drag pet   → reposition (any corner / any pixel)
 *   • Long-press empty space (≥280ms) → drop a ✨ star → pet walks over to collect
 *   • Auto returns to home corner ~3s after collecting / drag end
 *
 * Usage (zero deps):
 *   <script src="./assets/chen-pet.js" defer></script>
 *
 * Public API:
 *   ChenPet.setState(name)        // force a state
 *   ChenPet.playOnce(name, then?) // play once, then fall back
 *   ChenPet.dropStar(x, y)        // programmatically drop a star at viewport coords
 *   ChenPet.goto(x, y)            // walk pet to coords (foot anchor)
 *   ChenPet.home()                // return to corner anchor
 *   ChenPet.destroy()
 */
(() => {
  if (window.ChenPet) {
    try { window.ChenPet.destroy(); } catch (_) {}
  }

  const SHEET = "./assets/chen-pet.webp?v=node-019";
  const COL_W = 192;
  const ROW_H = 208;
  const COLS = 8;

  // [row index, frame count, default ms per full cycle]
  const STATES = {
    "idle":          [0, 6, 1100],
    "running-right": [1, 8,  720],
    "running-left":  [2, 8,  720],
    "waving":        [3, 4,  640],
    "jumping":       [4, 5,  680],
    "failed":        [5, 8, 1080],
    "waiting":       [6, 6, 1020],
    "running":       [7, 6,  780],
    "review":        [8, 6, 1080],
  };

  // Display half of native atlas.
  const DRAW_W = COL_W / 2;   // 96
  const DRAW_H = ROW_H / 2;   // 104

  const HOME_OFFSET_X = 1.25 * 16; // 1.25rem from right
  const HOME_OFFSET_Y = 1.25 * 16; // 1.25rem from bottom

  // -- styles ----------------------------------------------------------------
  const css = `
  .chen-pet-host {
    position: fixed;
    left: 0; top: 0;
    width: ${DRAW_W}px; height: ${DRAW_H}px;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    z-index: 70;
    transform: translate3d(0, 0, 0);
    transition: filter 0.3s ease, opacity 0.4s ease;
    opacity: 0;
    will-change: transform;
    touch-action: none;
  }
  .chen-pet-host[data-ready="1"] { opacity: 1; }
  .chen-pet-host:active,
  .chen-pet-host[data-dragging="1"] { cursor: grabbing; }
  .chen-pet-host[data-dragging="1"] { filter: drop-shadow(0 0.6rem 1.2rem rgba(156, 255, 82, 0.4)); }
  .chen-pet-sprite {
    width: 100%; height: 100%;
    background-image: url("${SHEET}");
    background-size: ${COL_W * COLS / 2}px ${ROW_H * 9 / 2}px;
    background-repeat: no-repeat;
    pointer-events: none;
  }
  .chen-pet-tip {
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translate(-8px, -50%) scale(0.94);
    background: rgba(16, 16, 16, 0.86);
    color: #f6f6f1;
    border: 1px solid rgba(156, 255, 82, 0.42);
    border-radius: 999px;
    padding: 0.4rem 0.7rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.24s ease, transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .chen-pet-host:hover .chen-pet-tip,
  .chen-pet-host[data-show-tip="1"] .chen-pet-tip {
    opacity: 1;
    transform: translate(-8px, -50%) scale(1);
  }
  .chen-pet-star {
    position: fixed;
    width: 28px; height: 28px;
    margin-left: -14px; margin-top: -14px;
    font-size: 22px;
    line-height: 28px;
    text-align: center;
    pointer-events: none;
    z-index: 69;
    filter: drop-shadow(0 0 8px rgba(255, 220, 100, 0.65));
    animation: chen-pet-star-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both,
               chen-pet-star-bob 1.4s ease-in-out 0.4s infinite alternate;
    will-change: transform, opacity;
  }
  .chen-pet-star[data-collected="1"] {
    animation: chen-pet-star-burst 0.46s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .chen-pet-pre-star {
    position: fixed;
    width: 14px; height: 14px;
    margin-left: -7px; margin-top: -7px;
    border: 2px solid rgba(156, 255, 82, 0.85);
    border-radius: 50%;
    pointer-events: none;
    z-index: 69;
    opacity: 0.9;
    animation: chen-pet-prestar 0.28s ease forwards;
  }
  @keyframes chen-pet-star-pop {
    0%   { transform: scale(0.2) rotate(-30deg); opacity: 0; }
    60%  { transform: scale(1.2) rotate(8deg);   opacity: 1; }
    100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
  }
  @keyframes chen-pet-star-bob {
    from { transform: translateY(0)      rotate(-4deg); }
    to   { transform: translateY(-4px)   rotate(6deg); }
  }
  @keyframes chen-pet-star-burst {
    0%   { transform: scale(1)   rotate(0deg);  opacity: 1; }
    60%  { transform: scale(1.6) rotate(40deg); opacity: 1; }
    100% { transform: scale(0.2) rotate(80deg); opacity: 0; }
  }
  @keyframes chen-pet-prestar {
    from { transform: scale(0.4); opacity: 0.9; }
    to   { transform: scale(2.4); opacity: 0; }
  }
  @media (max-width: 540px) {
    .chen-pet-host { transform-origin: left top; }
  }
  `;

  const style = document.createElement("style");
  style.id = "chen-pet-style";
  style.textContent = css;
  document.head.appendChild(style);

  // -- DOM -------------------------------------------------------------------
  const host = document.createElement("div");
  host.className = "chen-pet-host";
  host.setAttribute("aria-label", "Chen pixel pet — drag me, or long-press anywhere to drop a star");
  host.setAttribute("role", "button");
  host.setAttribute("tabindex", "0");
  const sprite = document.createElement("div");
  sprite.className = "chen-pet-sprite";
  const tip = document.createElement("span");
  tip.className = "chen-pet-tip";
  tip.textContent = "嗨！";
  host.appendChild(tip);
  host.appendChild(sprite);
  document.body.appendChild(host);
  requestAnimationFrame(() => host.setAttribute("data-ready", "1"));

  // -- position state --------------------------------------------------------
  // Pet position is the TOP-LEFT corner of the host (in viewport coordinates).
  let posX = 0;
  let posY = 0;

  function homeXY() {
    return {
      x: window.innerWidth - DRAW_W - HOME_OFFSET_X,
      y: window.innerHeight - DRAW_H - HOME_OFFSET_Y,
    };
  }

  function clampPos(x, y) {
    const maxX = window.innerWidth - DRAW_W;
    const maxY = window.innerHeight - DRAW_H;
    return [Math.max(0, Math.min(maxX, x)), Math.max(0, Math.min(maxY, y))];
  }

  function setPos(x, y) {
    [posX, posY] = clampPos(x, y);
    host.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
  }

  // Foot center in viewport coords (used as anchor for "where the pet stands").
  function footPos() {
    return { x: posX + DRAW_W / 2, y: posY + DRAW_H * 0.92 };
  }

  // Initial home position.
  (() => {
    const h = homeXY();
    setPos(h.x, h.y);
  })();
  window.addEventListener("resize", () => {
    // If pet was near the home corner, snap to new home; otherwise clamp.
    const h = homeXY();
    setPos(Math.min(posX, h.x), Math.min(posY, h.y));
  });

  // -- animator --------------------------------------------------------------
  let currentState = "idle";
  let currentFrame = 0;
  let frameCount = STATES.idle[1];
  let frameDuration = STATES.idle[2] / STATES.idle[1];
  let rowIndex = 0;
  let lastTick = 0;
  let oneShot = null;
  let prevState = null;
  let onOneShotEnd = null;

  function applyFrame() {
    const x = -currentFrame * DRAW_W;
    const y = -rowIndex * DRAW_H;
    sprite.style.backgroundPosition = `${x}px ${y}px`;
  }

  function setState(name, opts = {}) {
    const def = STATES[name];
    if (!def) return;
    if (currentState === name && !opts.force) return;
    currentState = name;
    rowIndex = def[0];
    frameCount = def[1];
    frameDuration = (opts.duration || def[2]) / def[1];
    currentFrame = 0;
    applyFrame();
    if (opts.tip !== undefined) tip.textContent = opts.tip;
    else tip.textContent = tipFor(name);
  }

  function tipFor(name) {
    return ({
      "idle": "嗨！",
      "running-right": "去捡 ✨",
      "running-left": "去捡 ✨",
      "waving": "拿到啦",
      "jumping": "Yeah!",
      "failed": "唉…",
      "waiting": "等等我",
      "running": "跑跑跑",
      "review": "在看在看",
    })[name] || "嗨！";
  }

  function playOnce(name, then = "idle", opts = {}) {
    prevState = then;
    oneShot = name;
    onOneShotEnd = opts.onEnd || null;
    setState(name, { ...opts, force: true });
  }

  function loop(ts) {
    if (!lastTick) lastTick = ts;
    if (ts - lastTick >= frameDuration) {
      lastTick = ts;
      currentFrame++;
      if (currentFrame >= frameCount) {
        if (oneShot) {
          oneShot = null;
          const cb = onOneShotEnd;
          onOneShotEnd = null;
          setState(prevState || "idle", { force: true });
          if (cb) cb();
        } else {
          currentFrame = 0;
        }
      }
      applyFrame();
    }
    // Walking integration.
    if (walkTarget) tickWalk(ts);
    rafId = requestAnimationFrame(loop);
  }

  // -- walking toward a target ----------------------------------------------
  let walkTarget = null;       // { x, y, onArrive }
  let lastWalkTs = 0;
  const WALK_SPEED = 220;       // px / sec

  function goto(x, y, onArrive) {
    walkTarget = { x, y, onArrive };
    lastWalkTs = 0;
    const dx = x - footPos().x;
    setState(dx >= 0 ? "running-right" : "running-left", { force: true });
  }

  function tickWalk(ts) {
    if (!walkTarget) return;
    if (!lastWalkTs) lastWalkTs = ts;
    const dt = (ts - lastWalkTs) / 1000;
    lastWalkTs = ts;
    const foot = footPos();
    const dx = walkTarget.x - foot.x;
    const dy = walkTarget.y - foot.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      // arrived
      const cb = walkTarget.onArrive;
      walkTarget = null;
      setState("idle", { force: true });
      if (cb) cb();
      return;
    }
    const step = Math.min(dist, WALK_SPEED * dt);
    const nx = posX + (dx / dist) * step;
    const ny = posY + (dy / dist) * step;
    setPos(nx, ny);

    // Update direction state if needed (without resetting frame each tick).
    const want = dx >= 0 ? "running-right" : "running-left";
    if (currentState !== want) {
      // smooth swap: keep frame index continuity within bounds.
      const def = STATES[want];
      currentState = want;
      rowIndex = def[0];
      frameCount = def[1];
      frameDuration = def[2] / def[1];
      if (currentFrame >= frameCount) currentFrame = 0;
      applyFrame();
      tip.textContent = tipFor(want);
    }
  }

  function home() {
    const h = homeXY();
    // foot anchor coords = top-left + offsets
    goto(h.x + DRAW_W / 2, h.y + DRAW_H * 0.92, () => {
      setState("idle", { force: true });
    });
  }

  // -- star drop -------------------------------------------------------------
  let activeStar = null;

  function dropStar(x, y) {
    if (activeStar) {
      // remove previous if still there
      activeStar.remove();
      activeStar = null;
    }
    const star = document.createElement("span");
    star.className = "chen-pet-star";
    star.textContent = "✨";
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    document.body.appendChild(star);
    activeStar = star;

    // walk pet over to it
    goto(x, y, () => {
      // collected!
      if (activeStar === star) {
        star.setAttribute("data-collected", "1");
        playOnce("waving", "idle", {
          tip: "拿到啦 ⭐",
          onEnd: () => {
            // return home shortly after
            setTimeout(() => {
              if (!walkTarget && currentState === "idle") home();
            }, 1400);
          },
        });
        setTimeout(() => {
          if (star.parentNode) star.remove();
          if (activeStar === star) activeStar = null;
        }, 460);
      }
    });
  }

  // -- pre-star ripple while long-pressing -----------------------------------
  function showPreStar(x, y) {
    const ring = document.createElement("span");
    ring.className = "chen-pet-pre-star";
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 320);
  }

  // -- input: drag pet & long-press to drop star ----------------------------
  const LONG_PRESS_MS = 280;
  const DRAG_THRESHOLD = 4;

  // 1) Pet drag
  let petPointer = null;   // { id, startX, startY, offsetX, offsetY, dragging, downTime }
  host.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    petPointer = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - posX,
      offsetY: e.clientY - posY,
      dragging: false,
      downTime: performance.now(),
    };
    host.setPointerCapture(e.pointerId);
    e.stopPropagation();
  });
  host.addEventListener("pointermove", (e) => {
    if (!petPointer || petPointer.id !== e.pointerId) return;
    const dx = e.clientX - petPointer.startX;
    const dy = e.clientY - petPointer.startY;
    if (!petPointer.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      petPointer.dragging = true;
      host.setAttribute("data-dragging", "1");
      walkTarget = null;        // cancel any walk
      setState("waiting", { force: true, tip: "拎起来了～" });
    }
    if (petPointer.dragging) {
      setPos(e.clientX - petPointer.offsetX, e.clientY - petPointer.offsetY);
    }
  });
  function endPet(e) {
    if (!petPointer || petPointer.id !== e.pointerId) return;
    const wasDrag = petPointer.dragging;
    host.removeAttribute("data-dragging");
    if (host.hasPointerCapture(petPointer.id)) host.releasePointerCapture(petPointer.id);
    petPointer = null;
    if (!wasDrag) {
      // tap → wave
      playOnce("waving", "idle");
    } else {
      // small landing bounce → idle
      playOnce("jumping", "idle");
    }
    e.stopPropagation();
  }
  host.addEventListener("pointerup", endPet);
  host.addEventListener("pointercancel", endPet);

  // Keyboard: Enter / Space → wave
  host.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      playOnce("waving", "idle");
    }
  });

  // 2) Long-press anywhere → drop star
  let pagePointer = null;       // { id, x0, y0, t0, timer, fired }
  function shouldIgnoreTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    if (target === host || host.contains(target)) return true;
    return !!target.closest(
      'a, button, input, textarea, select, label, summary, video, img, [role="button"], [contenteditable=""], [contenteditable="true"]'
    );
  }

  document.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (shouldIgnoreTarget(e.target)) return;
    pagePointer = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      t0: performance.now(),
      fired: false,
      ringTimer: 0,
    };
    // ripple feedback during press
    showPreStar(e.clientX, e.clientY);
    pagePointer.ringTimer = window.setInterval(() => {
      if (pagePointer) showPreStar(pagePointer.x0, pagePointer.y0);
    }, 140);
    pagePointer.timer = window.setTimeout(() => {
      if (!pagePointer || pagePointer.id !== e.pointerId) return;
      pagePointer.fired = true;
      window.clearInterval(pagePointer.ringTimer);
      dropStar(pagePointer.x0, pagePointer.y0);
    }, LONG_PRESS_MS);
  }, { passive: true });

  document.addEventListener("pointermove", (e) => {
    if (!pagePointer || pagePointer.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - pagePointer.x0, e.clientY - pagePointer.y0);
    if (moved > 6 && !pagePointer.fired) {
      // user moved too much → cancel long-press detection (treat as click/scroll)
      window.clearTimeout(pagePointer.timer);
      window.clearInterval(pagePointer.ringTimer);
      pagePointer = null;
    }
  }, { passive: true });

  function endPage(e) {
    if (!pagePointer || pagePointer.id !== e.pointerId) return;
    window.clearTimeout(pagePointer.timer);
    window.clearInterval(pagePointer.ringTimer);
    pagePointer = null;
  }
  document.addEventListener("pointerup", endPage, { passive: true });
  document.addEventListener("pointercancel", endPage, { passive: true });

  // -- lifecycle ------------------------------------------------------------
  if (document.readyState === "loading") {
    setState("waiting");
    document.addEventListener("DOMContentLoaded", () => setState("idle"));
  } else {
    setState("idle");
  }

  let rafId = requestAnimationFrame(loop);

  // -- public API -----------------------------------------------------------
  window.ChenPet = {
    setState,
    playOnce,
    dropStar,
    goto,
    home,
    states: Object.keys(STATES),
    el: host,
    destroy() {
      cancelAnimationFrame(rafId);
      host.remove();
      style.remove();
      if (activeStar) activeStar.remove();
      delete window.ChenPet;
    },
  };
})();
