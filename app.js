const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
const loader = document.querySelector(".loader");
const progress = document.querySelector(".loader__progress");
const progressInner = document.querySelector(".loader__progress-inner");
const enterButton = document.querySelector(".enter-btn");
const quietButton = document.querySelector(".loader__btn--quiet");
const eyeEntryBurstLayer = document.querySelector(".eye-entry-burst-layer");
const eyesSvg = document.querySelector(".ip-eyes");
const eyeTargets = [...document.querySelectorAll(".eye-target")];
const worldStage = document.querySelector(".world-stage");
const cityGate = document.querySelector(".city-gate");
const worldLayer = document.querySelector(".world-layer");
const gateCopy = document.querySelector(".gate-copy");
const enterWorldGateButton = document.querySelector("[data-enter-world]");
const worldGateUi = document.querySelector(".world-gate-ui");
const gateScanlines = document.querySelector(".scanlines");
const gateVignette = document.querySelector(".vignette");
const gateGalleryCanvas = document.querySelector(".gallery-canvas");
const worldFieldCanvas = document.querySelector(".world-field-canvas");
const worldOrbit = document.querySelector(".world-orbit");
const worldCards = [...document.querySelectorAll(".world-card")];
const worldInterface = [
  document.querySelector(".world-header"),
  document.querySelector(".world-viewport"),
].filter(Boolean);
const worldTitle = document.querySelector(".world-details__title");
const worldAuthor = document.querySelector(".world-details__author span");
const worldViewButton = document.querySelector(".world-view-btn");
const worldModeButton = document.querySelector(".world-mode-btn");
const worldThemeButton = document.querySelector(".world-theme-btn");
const worldSoundButton = document.querySelector(".world-sound-btn");
const panels = [...document.querySelectorAll("[data-panel]")];
const panelTriggers = [...document.querySelectorAll("[data-panel-trigger]")];
const panelClosers = [...document.querySelectorAll("[data-panel-close]")];
const indexButtons = [...document.querySelectorAll("[data-card-jump]")];
const projectFilterButtons = [...document.querySelectorAll("[data-project-filter]")];
const projectPanelCards = [...document.querySelectorAll("[data-project-card]")];
const projectDetail = document.querySelector(".project-detail");
const projectDetailClose = document.querySelector(".project-detail__close");
const detailTitle = document.querySelector("[data-detail-title]");
const detailAuthor = document.querySelector("[data-detail-author]");
const detailKind = document.querySelector("[data-detail-kind]");
const detailYear = document.querySelector("[data-detail-year]");
const detailSummary = document.querySelector("[data-detail-summary]");
const detailMedia = document.querySelector(".project-detail__media");
const detailLink = document.querySelector("[data-detail-link]");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const directWorldEntry = new URLSearchParams(window.location.search).get("skipIntro") === "1";
const eyelids = {
  leftTop: document.querySelector(".eyelid-left-top"),
  leftBottom: document.querySelector(".eyelid-left-bottom"),
  rightTop: document.querySelector(".eyelid-right-top"),
  rightBottom: document.querySelector(".eyelid-right-bottom"),
};

const state = {
  ready: false,
  entered: false,
  mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  target: { x: 0, y: 0 },
  current: { x: 0, y: 0 },
  currentDistance: 0,
  openness: 1,
  blinking: false,
  magnetic: { x: 0, y: 0, targetX: 0, targetY: 0, active: false, radius: 70, strength: 8 },
  activeCard: worldCards.find((card) => card.classList.contains("is-active")) || worldCards[0],
  world: {
    viewMode: "orbit",
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    velocityX: 0,
    velocityY: 0,
    dragging: false,
    moved: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
  },
  orbit: {
    progress: 8,
    targetProgress: 8,
    velocity: 0,
  },
  field: {
    ready: false,
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    press: 0,
    pressVelocity: 0,
    pressX: window.innerWidth / 2,
    pressY: window.innerHeight / 2,
    trail: 0,
    lastOrbitProgress: 8,
    particles: [],
    nodes: [],
    three: {
      status: "idle",
      module: null,
      renderer: null,
      scene: null,
      camera: null,
      material: null,
      plane: null,
    },
  },
  gyro: {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  },
  gallery: {
    minTileWidth: 2440,
    minTileHeight: 1500,
    viewportPaddingX: 1160,
    viewportPaddingY: 700,
  },
  reducedMotion: reducedMotionQuery.matches,
  pendingWorldEntry: false,
  worldGate: {
    ready: false,
    entered: false,
    playing: false,
    timeline: null,
  },
};

const clamp = (min, value, max) => Math.max(min, Math.min(value, max));
const lerp = (start, end, amount) => start + (end - start) * amount;
const wrapCentered = (value, size) => ((((value + size / 2) % size) + size) % size) - size / 2;
const slugify = (text) =>
  String(text || "project")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function ensureWorldVeil() {
  let veil = document.querySelector(".fx-veil");
  if (!veil) {
    veil = document.createElement("div");
    veil.className = "fx-veil";
    document.body.appendChild(veil);
  }
  return veil;
}

function revealWorldCityGateWithVeil() {
  const veil = ensureWorldVeil();
  if (!window.gsap || state.reducedMotion) {
    finishEnterWorld();
    return;
  }

  window.gsap.killTweensOf(veil);
  veil.style.display = "";
  window.gsap.set(veil, { clipPath: "inset(100% 0 0 0)" });
  window.gsap.timeline({
    defaults: { ease: window.gsap.parseEase("fxVeil") ? "fxVeil" : "power3.inOut" },
    onComplete: () => {
      window.gsap.set(veil, { clipPath: "inset(0% 0 100% 0)" });
    },
  })
    .to(veil, {
      clipPath: "inset(0% 0 0 0)",
      duration: 0.58,
    })
    .call(finishEnterWorld)
    .to(veil, {
      clipPath: "inset(0% 0 100% 0)",
      duration: 0.62,
    }, "+=0.08");
}

function spawnEyeEntryBurst(event) {
  if (!eyeEntryBurstLayer || state.reducedMotion || state.entered || !loader.classList.contains("is-ready")) {
    return;
  }

  const originX = event.clientX || window.innerWidth / 2;
  const originY = event.clientY || window.innerHeight / 2;
  const burstItems = ["LUCK", "GO", "OPEN", "RUN", "WORLD", "SIGNAL", "CHENNN", "++"];
  const count = 14;

  for (let index = 0; index < count; index += 1) {
    const item = document.createElement("span");
    item.className = index % 4 === 0 ? "eye-entry-burst eye-entry-burst--label" : "eye-entry-burst";
    item.textContent = burstItems[Math.floor(Math.random() * burstItems.length)];
    item.style.setProperty("--burst-x", `${originX}px`);
    item.style.setProperty("--burst-y", `${originY}px`);
    item.style.setProperty("--burst-dx", `${(Math.random() - 0.5) * 360}px`);
    item.style.setProperty("--burst-dy", `${-70 - Math.random() * 230}px`);
    item.style.setProperty("--burst-scale", `${0.74 + Math.random() * 0.88}`);
    item.style.setProperty("--burst-rotate", `${(Math.random() - 0.5) * 120}deg`);
    eyeEntryBurstLayer.append(item);
    window.setTimeout(() => item.remove(), 1250);
  }
}

function mountMedia(slotSelector, src, parentLayer) {
  if (!src || !parentLayer) return null;
  const slot = document.querySelector(slotSelector);
  if (!slot) return null;

  const cleanSrc = String(src).split("?")[0].split("#")[0];
  const ext = cleanSrc.split(".").pop().toLowerCase();
  let media;

  if (["mp4", "mov", "webm"].includes(ext)) {
    media = document.createElement("video");
    media.autoplay = true;
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    media.preload = "auto";
    const source = document.createElement("source");
    source.src = src;
    source.type = ext === "mov" ? "video/quicktime" : `video/${ext}`;
    media.append(source);
    media.play?.().catch(() => {
      /* Muted background media can wait for user interaction. */
    });
  } else {
    media = document.createElement("img");
    media.src = src;
    media.alt = "";
    media.decoding = "async";
  }

  slot.replaceChildren(media);
  parentLayer.classList.add("has-video");
  window.gsap?.to(slot, { autoAlpha: 1, duration: 0.9, ease: "power2.out" });
  return media;
}

function completeWorldGate() {
  if (state.worldGate.entered) {
    return;
  }
  state.worldGate.playing = false;
  state.worldGate.entered = true;
  document.body.classList.remove("is-world-gate-active");
  document.body.classList.remove("is-world-gate-playing");
  document.body.classList.add("is-world-gate-complete");
  cityGate?.setAttribute("aria-hidden", "true");
  worldLayer?.setAttribute("aria-hidden", "false");
  worldGateUi?.setAttribute("aria-hidden", "true");
  worldInterface.forEach((element) => {
    element.style.pointerEvents = "";
  });
  if (window.gsap) {
    window.gsap.set(cityGate, { autoAlpha: 0 });
    window.gsap.set(worldLayer, { autoAlpha: 0.72, scale: 1, clearProps: "zIndex" });
    window.gsap.set([gateScanlines, gateVignette, gateCopy, enterWorldGateButton], { autoAlpha: 0 });
    window.gsap.set(worldInterface, { autoAlpha: 1, y: 0 });
  }
  requestAnimationFrame(updateOrbitLayout);
}

function isWorldGateBlocking() {
  return state.worldGate.ready && !state.worldGate.entered;
}

function playWorldGate() {
  if (state.worldGate.entered || state.worldGate.playing) {
    return;
  }

  state.worldGate.playing = true;
  document.body.classList.add("is-world-gate-playing");
  const timeline = state.worldGate.timeline || buildTimeline();
  if (!timeline) {
    completeWorldGate();
    return;
  }

  timeline.play(0);
  window.setTimeout(() => {
    if (!state.worldGate.entered) {
      completeWorldGate();
    }
  }, 3200);
}

function buildTimeline() {
  if (!worldStage || !cityGate || !worldLayer || !enterWorldGateButton || !window.gsap) {
    return null;
  }

  const { gsap } = window;
  const customEase = window.CustomEase;
  if (customEase) {
    gsap.registerPlugin(customEase);
    if (!gsap.parseEase("cinematicEnter")) {
      customEase.create("cinematicEnter", "0.25, 1, 0.5, 1");
    }
  }

  state.worldGate.timeline?.kill();
  gsap.killTweensOf([cityGate, worldLayer, gateCopy, enterWorldGateButton, gateGalleryCanvas, ...worldInterface]);
  document.body.classList.add("is-world-gate-active");
  document.body.classList.remove("is-world-gate-complete");
  cityGate.setAttribute("aria-hidden", "false");
  worldLayer.setAttribute("aria-hidden", "true");
  worldGateUi?.setAttribute("aria-hidden", "false");

  gsap.set(cityGate, { autoAlpha: 1, scale: 1.02, display: "block" });
  gsap.set(worldLayer, { autoAlpha: 0, scale: 0.95 });
  gsap.set([gateCopy, enterWorldGateButton], { autoAlpha: 1, y: 0 });
  gsap.set([gateScanlines, gateVignette], { autoAlpha: 1 });
  gsap.set(gateGalleryCanvas, {
    rotationX: 14,
    rotationY: -10,
    rotationZ: -2,
    scale: 1.2,
  });
  gsap.set(worldInterface, { autoAlpha: 0, y: 12 });

  state.worldGate.timeline = gsap.timeline({
    paused: true,
    defaults: { ease: "power2.out" },
    onComplete: completeWorldGate,
  });

  state.worldGate.timeline
    .addLabel("uiOut", 0)
    .to([gateCopy, enterWorldGateButton], {
      autoAlpha: 0,
      y: -20,
      duration: 0.6,
      ease: "power2.in",
      stagger: 0.05,
    }, "uiOut")
    .addLabel("cityPush", 0.2)
    .to(cityGate, {
      scale: 1.3,
      autoAlpha: 0,
      duration: 1.2,
      ease: gsap.parseEase("cinematicEnter") ? "cinematicEnter" : "power3.inOut",
    }, "cityPush")
    .addLabel("signalReveal", 0.3)
    .call(() => {
      worldLayer.setAttribute("aria-hidden", "false");
    }, null, "signalReveal")
    .to(worldLayer, {
      autoAlpha: 1,
      scale: 1,
      duration: 1.2,
      ease: gsap.parseEase("cinematicEnter") ? "cinematicEnter" : "power3.inOut",
    }, "signalReveal")
    .to(gateGalleryCanvas, {
      scale: 1,
      duration: 3,
      ease: "power2.out",
    }, "signalReveal")
    .addLabel("worldCards", 0.88)
    .to(worldInterface, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.03,
    }, "worldCards")
    .to(worldLayer, {
      autoAlpha: 0.72,
      duration: 0.8,
      ease: "power2.out",
    }, 1.68)
    .to([gateScanlines, gateVignette], {
      autoAlpha: 0,
      duration: 0.8,
      ease: "power2.out",
    }, 1.68)
    .call(completeWorldGate, null, 2.42);

  return state.worldGate.timeline;
}

function initWorldGate() {
  if (!worldStage || !cityGate || !worldLayer || !enterWorldGateButton) {
    return;
  }

  mountMedia(".media-slot--city", worldStage.dataset.cityMedia, cityGate);
  mountMedia(".media-slot--signal", worldStage.dataset.signalMedia, worldLayer);

  if (state.reducedMotion || !window.gsap) {
    state.worldGate.ready = true;
    completeWorldGate();
    return;
  }

  buildTimeline();
  state.worldGate.ready = true;
  enterWorldGateButton.addEventListener("click", (event) => {
    playSfx("enter", 0.58);
    playWorldGate(event);
  });
  enterWorldGateButton.addEventListener("pointerup", playWorldGate);
  enterWorldGateButton.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    playSfx("enter", 0.58);
    playWorldGate();
  });
}

function splitText(element) {
  if (!element || element.dataset.splitReady === "true") return;
  const text = element.textContent.trim();
  element.setAttribute("aria-label", text);
  element.textContent = "";
  [...text].forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "split-char";
    span.style.setProperty("--i", index);
    span.setAttribute("aria-hidden", "true");
    span.textContent = char === " " ? "\u00a0" : char;
    element.append(span);
  });
  element.dataset.splitReady = "true";
}

const worldThemeKey = "chennn-world-theme";
const worldDetailCopy = {
  "龙年 CNY": "龙年 CNY",
  "SOFT STUDIES": "柔软研究",
  "SUMMER ARCHIVE": "夏日档案",
  "WINDOW STUDY": "橱窗研究",
  "LIQUID SIGNAL": "液态信号",
  "DREAM LOOP": "梦境循环",
  "NEON NOTES": "霓虹札记",
  "ORBITAL TYPE": "轨道字体",
  "GLASS INDEX": "玻璃索引",
  "SIGNAL ROOM": "信号房间",
  "SOFT MACHINE": "柔软机器",
  "POSTER FIELD": "海报田野",
  "DREAM MAP": "梦境地图",
  "BLUE MARINE": "蓝色海洋",
  "AVATAR PACK": "头像套组",
  "SALE POSTER A": "促销海报 A",
  "SALE POSTER B": "促销海报 B",
  "FIELD POSTER": "场域海报",
  "PHONE FLOW": "手机流程",
  "SOFT OBJECT": "柔软物体",
  "APP SCENE": "应用场景",
  "DUAL DEVICE": "双屏设备",
  "MASCOT DROP": "角色投放",
};

const worldWallLayout = [
  { x: -950, y: -290, r: -1.1, s: 0.98, z: -18 },
  { x: -570, y: -290, r: 0.6, s: 0.98, z: -10 },
  { x: -190, y: -290, r: -0.45, s: 1, z: -4 },
  { x: 190, y: -290, r: 0.45, s: 1, z: -4 },
  { x: 570, y: -290, r: -0.7, s: 0.98, z: -10 },
  { x: 950, y: -290, r: 0.8, s: 0.98, z: -18 },
  { x: -760, y: -45, r: 0.5, s: 1.03, z: 16 },
  { x: -380, y: -45, r: -0.5, s: 1.03, z: 26 },
  { x: 0, y: -45, r: 0.35, s: 1.05, z: 36 },
  { x: 380, y: -45, r: -0.65, s: 1.03, z: 26 },
  { x: 760, y: -45, r: 0.5, s: 1.03, z: 16 },
  { x: -950, y: 200, r: -0.75, s: 1, z: -8 },
  { x: -570, y: 200, r: 0.7, s: 1, z: 8 },
  { x: -190, y: 200, r: -0.55, s: 1.02, z: 18 },
  { x: 190, y: 200, r: 0.55, s: 1.02, z: 18 },
  { x: 570, y: 200, r: -0.75, s: 1, z: 8 },
  { x: 950, y: 200, r: 0.85, s: 1, z: -8 },
  { x: -760, y: 445, r: 0.75, s: 0.96, z: -22 },
  { x: -380, y: 445, r: -0.7, s: 0.96, z: -12 },
  { x: 0, y: 445, r: 0.45, s: 0.98, z: -4 },
  { x: 380, y: 445, r: -0.55, s: 0.96, z: -12 },
  { x: 760, y: 445, r: 0.7, s: 0.96, z: -22 },
];

function readStoredTheme() {
  try {
    return window.localStorage.getItem(worldThemeKey);
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    window.localStorage.setItem(worldThemeKey, theme);
  } catch {
    // Storage can be unavailable in private or locked-down browser contexts.
  }
}

function setWorldTheme(theme) {
  const nextTheme = theme === "coral" ? "coral" : "lime";
  document.body.dataset.worldTheme = nextTheme;
  if (worldThemeButton) {
    worldThemeButton.textContent = nextTheme === "coral" ? "warm" : "tone";
    worldThemeButton.setAttribute("aria-pressed", String(nextTheme === "coral"));
  }
  writeStoredTheme(nextTheme);
}

function setProgress(percent, { immediate = false } = {}) {
  const y = 100 - clamp(0, percent, 100);

  if (immediate) {
    progress.style.transition = "none";
    progressInner.style.transition = "none";
  }

  progress.style.transform = `translateY(${y}%)`;
  progressInner.style.transform = `translateY(${-y}%)`;

  if (immediate) {
    requestAnimationFrame(() => {
      progress.style.transition = "";
      progressInner.style.transition = "";
    });
  }
}

function setEyelids(openness) {
  const open = clamp(0, openness, 1);
  // 圆形 mask（r=55, cy=115）：上界 ≈60，下界 ≈170
  // 上眼皮 SVG y=20 height=90 → 底部 y=110；位移到底部 < 60 需 ≥ 56%
  const top = -8 - open * 62;
  // 下眼皮 SVG y=125 height=90 → 顶部 y=125；位移到顶部 > 170 需 ≥ 50%
  const bottomLeft = 6 + open * 56;
  const bottomRight = 6 + open * 56;

  eyelids.leftTop.style.transform = `translateY(${top}%)`;
  eyelids.rightTop.style.transform = `translateY(${top}%)`;
  eyelids.leftBottom.style.transform = `translateY(${bottomLeft}%)`;
  eyelids.rightBottom.style.transform = `translateY(${bottomRight}%)`;
  // 注：hover 按钮时眼皮完全隐藏由 CSS `.loader.is-love .eyelid { opacity: 0 }` 接管。
}

function updateCenters() {
  const eyesRect = eyesSvg.getBoundingClientRect();
  const btnRect = enterButton.getBoundingClientRect();

  state.eyesCenter = {
    x: eyesRect.left + eyesRect.width / 2,
    y: eyesRect.top + eyesRect.height / 2,
  };
  state.buttonCenter = {
    x: btnRect.left + btnRect.width / 2,
    y: btnRect.top + btnRect.height / 2,
  };
  state.maxMovementX = eyesRect.width / 16;
  state.maxMovementY = eyesRect.width / 24;
}

function updateMouseTarget() {
  if (!state.ready || state.entered || !state.buttonCenter || !state.eyesCenter) {
    return;
  }

  const relativeX = (state.mouse.x - state.buttonCenter.x) / window.innerWidth;
  const eyeRelativeY = (state.mouse.y - state.eyesCenter.y) / window.innerHeight;
  const buttonRelativeY = (state.mouse.y - state.buttonCenter.y) / window.innerHeight;
  const distance = Math.hypot(relativeX * 2.8, buttonRelativeY * 3.4);

  state.target.x = clamp(-1, relativeX * 3, 1);
  state.target.y = clamp(-1.25, eyeRelativeY * 4, 1.25);
  state.currentDistance = lerp(state.currentDistance, distance, 0.14);
  state.openness = 1 - clamp(0, state.currentDistance * 1.35, 0.92);
}

function updateMagnetic() {
  if (isTouchDevice) {
    enterButton.style.transform = "translate(-50%, 0)";
    return;
  }

  if (!state.buttonCenter) {
    return;
  }

  const dx = state.mouse.x - state.buttonCenter.x;
  const dy = state.mouse.y - state.buttonCenter.y;
  const dist = Math.hypot(dx, dy);
  const R = state.magnetic.radius;

  if (dist < R && !state.entered && state.ready) {
    const falloff = 1 - dist / R;
    state.magnetic.targetX = (dx / (dist || 1)) * state.magnetic.strength * falloff;
    state.magnetic.targetY = (dy / (dist || 1)) * state.magnetic.strength * falloff;
    state.magnetic.active = true;
  } else {
    state.magnetic.targetX = 0;
    state.magnetic.targetY = 0;
    state.magnetic.active = false;
  }

  state.magnetic.x = lerp(state.magnetic.x, state.magnetic.targetX, 0.18);
  state.magnetic.y = lerp(state.magnetic.y, state.magnetic.targetY, 0.18);
  enterButton.style.transform = `translate(calc(-50% + ${state.magnetic.x}px), ${state.magnetic.y}px)`;
}

function updateWorld() {
  if (!worldStage) {
    return;
  }

  worldStage.style.setProperty("--cursor-x", `${state.mouse.x}px`);
  worldStage.style.setProperty("--cursor-y", `${state.mouse.y}px`);

  if (!state.entered) {
    return;
  }

  if (state.world.viewMode === "orbit" && !state.world.dragging && !state.reducedMotion) {
    state.orbit.targetProgress += state.orbit.velocity;
    state.orbit.velocity *= 0.92;
  } else if (!state.world.dragging && !state.reducedMotion) {
    state.world.targetX += state.world.velocityX;
    state.world.targetY += state.world.velocityY;
    state.world.velocityX *= 0.94;
    state.world.velocityY *= 0.94;
  } else if (state.reducedMotion) {
    state.world.velocityX = 0;
    state.world.velocityY = 0;
  }

  state.world.x = lerp(state.world.x, state.world.targetX, state.reducedMotion ? 1 : 0.16);
  state.world.y = lerp(state.world.y, state.world.targetY, state.reducedMotion ? 1 : 0.16);
  state.orbit.progress = lerp(state.orbit.progress, state.orbit.targetProgress, state.reducedMotion ? 1 : 0.13);

  const tiltX = clamp(-10, state.world.x * 0.025, 10);
  const tiltY = clamp(-8, state.world.y * -0.025, 8);
  state.gyro.targetX = (state.reducedMotion || isTouchDevice) ? 0 : clamp(-14, ((state.mouse.x / window.innerWidth) - 0.5) * 28, 14);
  state.gyro.targetY = (state.reducedMotion || isTouchDevice) ? 0 : clamp(-10, ((state.mouse.y / window.innerHeight) - 0.5) * -20, 10);
  state.gyro.x = lerp(state.gyro.x, state.gyro.targetX, state.reducedMotion ? 1 : 0.14);
  state.gyro.y = lerp(state.gyro.y, state.gyro.targetY, state.reducedMotion ? 1 : 0.14);
  worldStage.style.setProperty("--world-x", `${state.world.x}px`);
  worldStage.style.setProperty("--world-y", `${state.world.y}px`);
  worldStage.style.setProperty("--world-tilt-x", `${tiltX}deg`);
  worldStage.style.setProperty("--world-tilt-y", `${tiltY}deg`);
  worldStage.style.setProperty("--world-gyro-x", `${state.gyro.x}deg`);
  worldStage.style.setProperty("--world-gyro-y", `${state.gyro.y}deg`);
  worldStage.style.setProperty("--world-grid-gyro-x", `${state.gyro.y * 0.08}deg`);
  worldStage.style.setProperty("--world-grid-gyro-y", `${state.gyro.x * -0.08}deg`);
  worldStage.style.setProperty("--world-orbit-gyro-x", `${state.gyro.y * 0.55}deg`);
  worldStage.style.setProperty("--world-orbit-gyro-y", `${state.gyro.x * -0.62}deg`);
  worldStage.style.setProperty("--world-globe-gyro-x", `${tiltY * 0.6 + state.gyro.y * 0.9}deg`);
  worldStage.style.setProperty("--world-globe-gyro-y", `${tiltX * 0.6 + state.gyro.x * -0.95}deg`);

  if (state.world.viewMode === "orbit") {
    updateOrbitLayout();
  } else {
    updateGalleryWrap();
  }
}

function setupWorldGallery() {
  worldCards.forEach((card, index) => {
    const layout = worldWallLayout[index];
    const baseX = Number(layout?.x ?? card.dataset.x ?? 0);
    const baseY = Number(layout?.y ?? card.dataset.y ?? 0);
    const rotation = Number(layout?.r ?? card.dataset.r ?? 0);
    const scale = Number(layout?.s ?? 1);
    const depth = Number(layout?.z ?? 0);

    card.dataset.baseX = String(baseX);
    card.dataset.baseY = String(baseY);
    card.style.setProperty("--card-x", `${baseX}px`);
    card.style.setProperty("--card-y", `${baseY}px`);
    card.style.setProperty("--card-r", `${rotation}deg`);
    card.style.setProperty("--card-s", `${scale}`);
    card.style.setProperty("--card-z", `${depth}px`);
  });
}

function updateGalleryWrap() {
  if (!worldOrbit || !state.entered || state.world.viewMode === "orbit") {
    return;
  }

  const tileWidth = Math.max(state.gallery.minTileWidth, window.innerWidth + state.gallery.viewportPaddingX);
  const tileHeight = Math.max(state.gallery.minTileHeight, window.innerHeight + state.gallery.viewportPaddingY);

  worldCards.forEach((card) => {
    const baseX = Number(card.dataset.baseX || card.dataset.x || 0);
    const baseY = Number(card.dataset.baseY || card.dataset.y || 0);
    const visibleX = wrapCentered(baseX + state.world.x, tileWidth);
    const visibleY = wrapCentered(baseY + state.world.y, tileHeight);
    const nextX = visibleX - state.world.x;
    const nextY = visibleY - state.world.y;
    const lastX = Number(card.dataset.visibleX);
    const lastY = Number(card.dataset.visibleY);
    const hasLastPosition = Number.isFinite(lastX) && Number.isFinite(lastY);
    const isWrapping =
      hasLastPosition && (Math.abs(nextX - lastX) > tileWidth * 0.42 || Math.abs(nextY - lastY) > tileHeight * 0.42);

    if (isWrapping) {
      card.classList.add("is-wrapping");
      window.requestAnimationFrame(() => {
        card.classList.remove("is-wrapping");
      });
    }

    card.style.setProperty("--card-x", `${nextX}px`);
    card.style.setProperty("--card-y", `${nextY}px`);
    card.dataset.visibleX = String(nextX);
    card.dataset.visibleY = String(nextY);
  });
}

function resizeWorldField() {
  if (!worldFieldCanvas) {
    return;
  }

  const rect = worldFieldCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (state.field.width === width && state.field.height === height && state.field.dpr === dpr) {
    return;
  }

  state.field.width = width;
  state.field.height = height;
  state.field.dpr = dpr;
  if (state.field.three.status === "ready") {
    state.field.three.renderer.setPixelRatio(dpr);
    state.field.three.renderer.setSize(width, height, false);
    state.field.three.material.uniforms.uResolution.value.set(width, height);
    return;
  }

  worldFieldCanvas.width = Math.round(width * dpr);
  worldFieldCanvas.height = Math.round(height * dpr);
  const ctx = worldFieldCanvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.field.particles = Array.from({ length: isTouchDevice ? 18 : 34 }, (_, index) => ({
    x: (index * 137.5) % width,
    y: (index * 89.2) % height,
    speed: 0.18 + (index % 7) * 0.035,
    phase: index * 0.63,
  }));
  const nodeCols = Math.max(4, Math.ceil(width / 220));
  const nodeRows = Math.max(4, Math.ceil(height / 190));
  state.field.nodes = [];
  for (let row = 0; row < nodeRows; row += 1) {
    for (let col = 0; col < nodeCols; col += 1) {
      state.field.nodes.push({
        x: (col + 0.5) * (width / nodeCols),
        y: (row + 0.5) * (height / nodeRows),
        phase: row * 0.73 + col * 0.41,
        kind: (row + col) % 3,
      });
    }
  }
}

async function initThreeWorldField() {
  if (!worldFieldCanvas || state.field.three.status !== "idle" || state.reducedMotion) {
    return;
  }

  state.field.three.status = "loading";
  try {
    const THREE = await import("./assets/vendor/three.module.js");
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: worldFieldCanvas,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uPress: { value: 0 },
        uTrail: { value: 0 },
        uGyro: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uPointer;
        uniform float uPress;
        uniform float uTrail;
        uniform vec2 uGyro;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amp = 0.5;
          for (int i = 0; i < 5; i++) {
            value += noise(p) * amp;
            p = mat2(1.62, 1.12, -1.08, 1.58) * p + 0.17;
            amp *= 0.52;
          }
          return value;
        }

        float contour(float h, float density, float width) {
          float line = abs(fract(h * density) - 0.5);
          return smoothstep(width, 0.0, line);
        }

        float gridStar(vec2 uv) {
          vec2 cell = fract(uv * vec2(7.0, 5.0)) - 0.5;
          vec2 id = floor(uv * vec2(7.0, 5.0));
          float mask = step(0.46, hash(id));
          float cross = smoothstep(0.018, 0.0, abs(cell.x)) * smoothstep(0.16, 0.02, abs(cell.y));
          cross += smoothstep(0.018, 0.0, abs(cell.y)) * smoothstep(0.16, 0.02, abs(cell.x));
          return cross * mask;
        }

        float travelingContour(float h, vec2 p, float seed, float speed) {
          float line = contour(h + sin(seed + uTime * speed) * 0.05, 8.5 + seed, 0.032);
          float broken = smoothstep(0.58, 0.82, noise(p * 5.4 + vec2(seed, uTime * speed)));
          float window = smoothstep(0.12, 0.42, p.x + 0.55) * (1.0 - smoothstep(0.54, 0.94, p.x - 0.08));
          float pulse = 0.55 + 0.45 * sin(uTime * (0.9 + seed * 0.08) + seed);
          return line * broken * window * pulse;
        }

        void main() {
          vec2 uv = vUv;
          vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
          vec2 p = (uv - 0.5) * aspect;
          p.x += uGyro.x * 0.018;
          p.y += uGyro.y * 0.018;

          vec2 pointer = (uPointer - 0.5) * aspect;
          float d = distance(p, pointer);
          float dent = exp(-d * d * 8.0) * uPress;
          p += normalize(p - pointer + 0.0001) * dent * -0.08;

          float h = fbm(p * 2.1 + vec2(uTime * 0.018, -uTime * 0.012));
          h += fbm(p * 4.2 - vec2(uTime * 0.008, uTime * 0.014)) * 0.34;
          h -= dent * 0.5;

          float softLines = contour(h, 11.0, 0.045);
          float fineLines = contour(h + sin(p.x * 5.0) * 0.018, 21.0, 0.026);
          float stars = gridStar(uv + uGyro * 0.002);
          float scan = 0.0;
          scan += travelingContour(h, p, 0.7, 0.28);
          scan += travelingContour(h + 0.17, p + vec2(0.18, -0.12), 2.4, -0.19);
          scan += travelingContour(h - 0.11, p + vec2(-0.12, 0.2), 4.8, 0.36);
          scan *= uTrail * 1.18 + abs(uPress) * 0.42;

          float vignette = smoothstep(0.88, 0.22, length((uv - 0.5) * vec2(1.1, 1.0)));
          vec3 blueLine = vec3(0.38, 0.58, 0.70);
          vec3 lime = vec3(0.61, 1.0, 0.32);
          vec3 color = vec3(0.0);
          color += blueLine * softLines * 0.2;
          color += blueLine * fineLines * 0.11;
          color += vec3(0.86, 0.96, 1.0) * stars * 0.34;
          color += lime * scan * 0.46;
          color += lime * dent * 0.18;
          color += vec3(0.05, 0.12, 0.13) * fbm(p * 1.2 + uTime * 0.01) * 0.18;
          color *= vignette;

          float alpha = (softLines * 0.27 + fineLines * 0.13 + stars * 0.22 + scan * 0.42 + dent * 0.16) * vignette;
          alpha += 0.08 * vignette;
          gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.72));
        }
      `,
    });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    state.field.three = {
      status: "ready",
      module: THREE,
      renderer,
      scene,
      camera,
      material,
      plane,
    };
    resizeWorldField();
  } catch (error) {
    state.field.three.status = "failed";
    console.warn("Three field unavailable; using 2D field fallback.", error);
  }
}

function drawFieldLine(ctx, baseY, time, accent = false, phase = 0, pulse = 0) {
  const { width, height, press, pressX, pressY } = state.field;
  const step = accent ? 14 : 18;
  const amp = accent ? 24 + pulse * 11 : 18;

  ctx.beginPath();
  for (let x = -step; x <= width + step; x += step) {
    const wave =
      Math.sin(x * 0.0068 + baseY * 0.011 + time * (accent ? 0.0024 : 0.0014) + phase) * amp +
      Math.sin(x * 0.015 - time * (accent ? 0.0017 : 0.0009) + phase * 1.7) * (accent ? 14 : 8) +
      Math.sin((x + baseY) * 0.0032 + time * 0.0007 + phase * 2.1) * (accent ? 13 : 5);
    let y = baseY + wave;

    if (Math.abs(press) > 0.008) {
      const dx = x - pressX;
      const dy = y - pressY;
      const distance = Math.hypot(dx, dy);
      const pull = Math.exp(-(distance * distance) / 62000) * press;
      y += pull * 74;
    }

    if (x === -step) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}

function drawFieldNodes(ctx, time) {
  const { nodes, trail } = state.field;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  nodes.forEach((node, index) => {
    const driftX = Math.sin(time * 0.002 + node.phase) * 4;
    const driftY = Math.cos(time * 0.0017 + node.phase) * 3;
    const x = node.x + driftX;
    const y = node.y + driftY;
    const alpha = 0.08 + Math.sin(time * 0.006 + node.phase) * 0.025 + trail * 0.055;

    if (index % 2 === 0) {
      const next = nodes[index + 1];
      if (next && Math.abs(next.y - node.y) < 8) {
        ctx.strokeStyle = `rgba(188, 215, 226, ${alpha * 0.42})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(next.x - 8, next.y);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = `rgba(232, 246, 250, ${alpha})`;
    ctx.lineWidth = node.kind === 0 ? 1.2 : 0.85;
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 5, y);
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x, y + 5);
    if (node.kind === 1) {
      ctx.moveTo(x - 3.5, y - 3.5);
      ctx.lineTo(x + 3.5, y + 3.5);
      ctx.moveTo(x + 3.5, y - 3.5);
      ctx.lineTo(x - 3.5, y + 3.5);
    }
    ctx.stroke();
  });
  ctx.restore();
}

function renderWorldField() {
  if (!worldFieldCanvas || !state.entered) {
    return;
  }

  initThreeWorldField();
  resizeWorldField();
  if (state.field.three.status === "ready") {
    const { renderer, scene, camera, material } = state.field.three;
    state.field.time += state.reducedMotion ? 0.2 : 1;
    const progressDelta = Math.abs(state.orbit.progress - state.field.lastOrbitProgress);
    state.field.lastOrbitProgress = state.orbit.progress;
    state.field.trail = Math.max(state.field.trail * 0.88, Math.min(1, progressDelta * 0.48 + Math.abs(state.orbit.velocity) * 0.22));
    state.field.pressVelocity += (0 - state.field.press) * 0.035;
    state.field.pressVelocity *= 0.82;
    state.field.press += state.field.pressVelocity;
    if (Math.abs(state.field.press) < 0.006 && Math.abs(state.field.pressVelocity) < 0.006) {
      state.field.press = 0;
      state.field.pressVelocity = 0;
    }
    const uniforms = material.uniforms;
    uniforms.uTime.value = state.field.time * 0.016;
    uniforms.uPointer.value.set(
      clamp(0, state.field.pressX / Math.max(state.field.width, 1), 1),
      clamp(0, 1 - state.field.pressY / Math.max(state.field.height, 1), 1),
    );
    uniforms.uPress.value = state.world.viewMode === "orbit" ? state.field.press : 0;
    uniforms.uTrail.value = state.world.viewMode === "orbit" ? state.field.trail : 0;
    uniforms.uGyro.value.set(state.gyro.x / 14, state.gyro.y / 10);
    renderer.clear();
    if (state.world.viewMode === "orbit") {
      renderer.render(scene, camera);
    }
    return;
  }

  const ctx = worldFieldCanvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const { width, height } = state.field;
  state.field.time += state.reducedMotion ? 0.2 : 1;
  const progressDelta = Math.abs(state.orbit.progress - state.field.lastOrbitProgress);
  state.field.lastOrbitProgress = state.orbit.progress;
  state.field.trail = Math.max(state.field.trail * 0.88, Math.min(1, progressDelta * 0.48 + Math.abs(state.orbit.velocity) * 0.22));
  state.field.pressVelocity += (0 - state.field.press) * 0.035;
  state.field.pressVelocity *= 0.82;
  state.field.press += state.field.pressVelocity;
  if (Math.abs(state.field.press) < 0.006 && Math.abs(state.field.pressVelocity) < 0.006) {
    state.field.press = 0;
    state.field.pressVelocity = 0;
  }

  ctx.clearRect(0, 0, width, height);
  if (state.world.viewMode !== "orbit") {
    return;
  }

  const time = state.field.time;
  const cx = width * 0.5 + state.gyro.x * 5;
  const cy = height * 0.5 + state.gyro.y * 6;
  const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.68);
  glow.addColorStop(0, "rgba(156, 255, 82, 0.075)");
  glow.addColorStop(0.38, "rgba(39, 77, 96, 0.09)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.rotate(-0.16 + state.gyro.x * 0.002);
  ctx.translate(-width * 0.5, -height * 0.5);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  drawFieldNodes(ctx, time);

  for (let y = -60; y < height + 90; y += 32) {
    const lineMood = 0.16 + Math.sin(y * 0.017 + time * 0.0021) * 0.055;
    ctx.strokeStyle = `rgba(126, 164, 190, ${lineMood})`;
    ctx.lineWidth = 0.92;
    drawFieldLine(ctx, y, time, false, y * 0.013, 0);
  }

  const accentRows = [
    { y: height * 0.22, speed: 0.32, dash: [72, 34, 18, 48], phase: 0.3 },
    { y: height * 0.36, speed: 0.17, dash: [28, 26, 90, 42], phase: 1.8 },
    { y: height * 0.61, speed: 0.42, dash: [110, 54, 22, 38], phase: 3.4 },
    { y: height * 0.78, speed: 0.24, dash: [44, 32, 62, 56], phase: 4.9 },
  ];
  accentRows.forEach((row, index) => {
    const pulse = 0.5 + Math.sin(time * (0.009 + index * 0.0015) + row.phase) * 0.5;
    const energy = Math.max(state.field.trail, pulse * 0.3);
    ctx.strokeStyle = `rgba(156, 255, 82, ${0.09 + energy * 0.34})`;
    ctx.lineWidth = 1.35 + energy * 2.2;
    ctx.setLineDash(row.dash);
    ctx.lineDashOffset = -time * row.speed + Math.sin(time * 0.01 + row.phase) * 36;
    drawFieldLine(ctx, row.y + Math.sin(time * 0.003 + row.phase) * 34, time + index * 720, true, row.phase, energy);
  });
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  state.field.particles.forEach((particle) => {
    particle.x += particle.speed + state.field.trail * 1.2;
    particle.y += Math.sin(time * 0.015 + particle.phase) * 0.12;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y > height + 20) particle.y = -20;
    const alpha = 0.13 + Math.sin(time * 0.02 + particle.phase) * 0.05;
    ctx.fillStyle = `rgba(156, 255, 82, ${alpha})`;
    ctx.fillRect(particle.x, particle.y, 1.6, 1.6);
  });
  ctx.restore();

  if (Math.abs(state.field.press) > 0.01) {
    const pressAmount = Math.min(1, Math.abs(state.field.press));
    const isRebound = state.field.press < 0;
    const radius = 42 + (1 - pressAmount) * 180;
    const ring = ctx.createRadialGradient(state.field.pressX, state.field.pressY, 8, state.field.pressX, state.field.pressY, radius);
    ring.addColorStop(0, `rgba(0, 0, 0, ${isRebound ? 0 : 0.34 * pressAmount})`);
    ring.addColorStop(0.34, `rgba(156, 255, 82, ${(isRebound ? 0.16 : 0.11) * pressAmount})`);
    ring.addColorStop(0.68, `rgba(120, 165, 190, ${(isRebound ? 0.12 : 0.08) * pressAmount})`);
    ring.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = ring;
    ctx.fillRect(0, 0, width, height);
  }
}

function updateOrbitLayout() {
  if (!worldOrbit || !state.entered || !worldCards.length) {
    return;
  }

  const count = worldCards.length;
  const radius = clamp(330, Math.min(window.innerWidth, 1600) * 0.36, 690);
  const verticalGap = clamp(86, window.innerHeight * 0.132, 142);
  const angleStep = window.innerWidth < 760 ? 0.62 : 0.54;
  const depthRange = window.innerWidth < 760 ? 260 : 460;

  worldCards.forEach((card, index) => {
    const relative = wrapCentered(index - state.orbit.progress, count);
    const angle = relative * angleStep;
    const distance = Math.abs(relative);
    const x = Math.sin(angle) * radius;
    const y = relative * verticalGap;
    const z = (Math.cos(angle) - 1) * depthRange;
    const scale = clamp(0.52, 1.12 - distance * 0.054 + z / 2800, 1.18);
    const opacity = clamp(0.2, 1 - distance * 0.078, 1);
    const glass = clamp(0.5, 0.8 - distance * 0.035 - Math.max(0, -Math.cos(angle)) * 0.08, 0.84);
    const shell = clamp(0.1, 0.28 - distance * 0.016, 0.32);
    const rotateY = clamp(-82, angle * -76, 82);
    const rotateZ = clamp(-10, relative * -1.05, 10);
    const layer = Math.round(1000 + Math.cos(angle) * 150 - distance * 26);

    card.style.setProperty("--card-orbit-x", `${x}px`);
    card.style.setProperty("--card-orbit-y", `${y}px`);
    card.style.setProperty("--card-orbit-z", `${z}px`);
    card.style.setProperty("--card-orbit-ry", `${rotateY}deg`);
    card.style.setProperty("--card-orbit-rz", `${rotateZ}deg`);
    card.style.setProperty("--card-orbit-s", `${scale}`);
    card.style.setProperty("--card-orbit-o", `${opacity}`);
    card.style.setProperty("--card-orbit-glass", `${glass}`);
    card.style.setProperty("--card-orbit-shell", `${shell}`);
    card.style.zIndex = String(layer);
    card.classList.toggle("is-orbit-front", distance < 0.72);
    card.classList.toggle("is-orbit-back", distance > 4.5 || Math.cos(angle) < -0.15);
  });
}

function setWorldViewMode(mode) {
  const nextMode = mode === "orbit" ? "orbit" : "free";
  state.world.viewMode = nextMode;
  document.body.classList.toggle("is-world-orbit", nextMode === "orbit");
  document.body.classList.toggle("is-world-free", nextMode !== "orbit");

  if (nextMode === "orbit") {
    const activeIndex = Math.max(0, worldCards.indexOf(state.activeCard || worldCards[0]));
    state.orbit.targetProgress = activeIndex;
    state.orbit.progress = activeIndex;
    state.world.targetX = 0;
    state.world.targetY = 0;
    state.world.velocityX = 0;
    state.world.velocityY = 0;
    updateOrbitLayout();
  } else {
    worldCards.forEach((card) => {
      card.style.removeProperty("--card-orbit-x");
      card.style.removeProperty("--card-orbit-y");
      card.style.removeProperty("--card-orbit-z");
      card.style.removeProperty("--card-orbit-ry");
      card.style.removeProperty("--card-orbit-rz");
      card.style.removeProperty("--card-orbit-s");
      card.style.removeProperty("--card-orbit-o");
      card.style.removeProperty("--card-orbit-glass");
      card.style.removeProperty("--card-orbit-shell");
      card.style.zIndex = "";
      card.classList.remove("is-orbit-front", "is-orbit-back");
    });
    updateGalleryWrap();
  }

  if (worldModeButton) {
    worldModeButton.textContent = nextMode === "orbit" ? "free" : "orbit";
    worldModeButton.setAttribute("aria-pressed", String(nextMode === "orbit"));
    worldModeButton.setAttribute("aria-label", nextMode === "orbit" ? "Switch to free canvas mode" : "Switch to orbit mode");
  }
}

function renderEyes() {
  updateMagnetic();
  updateWorld();
  renderWorldField();
  updateMouseTarget();

  // 瞳孔跟随：用更高 lerp 系数 + 加载方向上的 ease，让响应更跟手且不僵硬
  // 0.18 比原来的 0.1 更敏捷；同时加 spring 余量让停止瞬间有自然回弹
  state.current.x = lerp(state.current.x, state.target.x, 0.18);
  state.current.y = lerp(state.current.y, state.target.y, 0.18);

  const x = state.current.x * state.maxMovementX;
  const y = state.current.y * state.maxMovementY;

  eyeTargets.forEach((eye) => {
    eye.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });

  if (!state.blinking) {
    setEyelids(state.openness);
  }

  requestAnimationFrame(renderEyes);
}

function blink() {
  if (!state.ready || state.entered || state.blinking || state.reducedMotion) {
    return;
  }

  state.blinking = true;
  setEyelids(0.03);

  window.setTimeout(() => {
    state.blinking = false;
    setEyelids(state.openness);
  }, 130);
}

function scheduleBlink() {
  const delay = 2500 + Math.random() * 1800;
  window.setTimeout(() => {
    blink();
    scheduleBlink();
  }, delay);
}

function revealReadyState({ immediate = false } = {}) {
  state.ready = true;
  loader.classList.add("is-ready");
  setProgress(100, { immediate });
  setEyelids(0);

  window.setTimeout(() => {
    updateCenters();
    setEyelids(1);
  }, 80);
}

function runIntro() {
  let value = 0;
  const tick = () => {
    value += 7 + Math.random() * 12;
    setProgress(value);

    if (value < 100) {
      window.setTimeout(tick, 120 + Math.random() * 80);
      return;
    }

    window.setTimeout(revealReadyState, 450);
  };

  window.setTimeout(tick, 250);
}

function finishEnterWorld() {
  state.pendingWorldEntry = false;
  document.body.classList.add("is-entered");

  window.setTimeout(() => {
    loader.classList.add("is-hidden");
  }, 120);

  if (worldModeButton && !state.reducedMotion) {
    window.setTimeout(() => {
      worldModeButton.classList.remove("is-world-mode-intro");
      void worldModeButton.offsetWidth;
      worldModeButton.classList.add("is-world-mode-intro");
      window.setTimeout(() => {
        worldModeButton.classList.remove("is-world-mode-intro");
      }, 1900);
    }, 520);
  }
}

function enterWorld({ muted = false, afterIpLoader = false } = {}) {
  if (state.entered) {
    return;
  }

  state.entered = true;
  state.pendingWorldEntry = afterIpLoader;
  if (!muted) {
    ensureBgm();
    playBgm();
    fadeBgmTo(0.22, 1.2);
  }
  document.body.dataset.audio = muted ? "muted" : "on";
  progressInner.style.transform = "translateY(0) scale(1.8)";
  loader.classList.add("is-entering");
  if (!afterIpLoader) {
    revealWorldCityGateWithVeil();
  }
}

window.addEventListener(
  "mousemove",
  (event) => {
    state.mouse.x = event.clientX;
    state.mouse.y = event.clientY;
  },
  { passive: true },
);

function updateTouchPosition(event) {
  if (event.touches && event.touches[0]) {
    state.mouse.x = event.touches[0].clientX;
    state.mouse.y = event.touches[0].clientY;
  }
}

// 触摸设备：用 touch 当鼠标，让瞳孔在移动端也能跟随手指
window.addEventListener("touchstart", updateTouchPosition, { passive: true });
window.addEventListener("touchmove", updateTouchPosition, { passive: true });

window.addEventListener("resize", () => {
  updateCenters();
  resizeWorldField();
  if (state.world.viewMode === "orbit") {
    updateOrbitLayout();
  } else {
    updateGalleryWrap();
  }
});

function startWorldDrag(event) {
  // 方案 A: 不在 .world-card 上抢指针，让 card 自己处理 click
  // 否则 stage.setPointerCapture 会导致后续 pointerup 派发到 stage 而非 card
  if (!state.entered || isWorldGateBlocking() || event.target.closest("button, a, .world-card")) {
    return;
  }

  state.world.dragging = true;
  state.world.moved = false;
  state.world.pointerId = event.pointerId;
  state.world.lastX = event.clientX;
  state.world.lastY = event.clientY;
  state.field.pressX = event.clientX;
  state.field.pressY = event.clientY;
  state.field.press = 1;
  state.field.pressVelocity = -0.035;
  state.world.velocityX = 0;
  state.world.velocityY = 0;
  document.body.classList.add("is-world-dragging");
  worldStage.setPointerCapture?.(event.pointerId);
}

function moveWorldDrag(event) {
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;

  if (!state.world.dragging || state.world.pointerId !== event.pointerId) {
    return;
  }

  const dx = event.clientX - state.world.lastX;
  const dy = event.clientY - state.world.lastY;
  if (Math.hypot(dx, dy) > 3) {
    state.world.moved = true;
  }
  state.world.lastX = event.clientX;
  state.world.lastY = event.clientY;
  if (state.world.viewMode === "orbit") {
    const delta = dx * -0.014 + dy * 0.006;
    state.orbit.targetProgress += delta;
    state.orbit.velocity = state.reducedMotion ? 0 : delta * 0.28;
    state.field.trail = Math.min(1, state.field.trail + Math.abs(delta) * 0.16);
    return;
  }

  state.world.targetX += dx * 1.18;
  state.world.targetY += dy * 1.04;
  state.world.velocityX = state.reducedMotion ? 0 : dx * 0.42;
  state.world.velocityY = state.reducedMotion ? 0 : dy * 0.36;
}

function endWorldDrag(event) {
  if (state.world.pointerId !== null && state.world.pointerId !== event.pointerId) {
    return;
  }

  state.world.dragging = false;
  state.world.pointerId = null;
  document.body.classList.remove("is-world-dragging");
  worldStage.releasePointerCapture?.(event.pointerId);
}

function setActiveWorldCard(card) {
  if (!card) {
    return;
  }

  state.activeCard = card;
  worldCards.forEach((item) => {
    item.classList.toggle("is-hovered", item === card);
    item.classList.toggle("is-active", item === card);
  });
  if (card?.dataset.title) {
    worldTitle.textContent = card.dataset.title;
  }
  if (card?.dataset.author) {
    worldAuthor.textContent = card.dataset.author;
  }
}

function closePanels() {
  panels.forEach((panel) => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  });
  document.body.classList.remove("has-open-panel");
}

function openPanel(name) {
  closeProjectDetail();
  panels.forEach((panel) => {
    const isTarget = panel.dataset.panel === name;
    panel.classList.toggle("is-open", isTarget);
    panel.setAttribute("aria-hidden", String(!isTarget));
  });
  document.body.classList.toggle("has-open-panel", Boolean(name));
}

function closeProjectDetail() {
  detailMedia?.querySelectorAll("video").forEach((video) => video.pause());
  projectDetail.classList.remove("is-open");
  projectDetail.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-open-detail");
}

function openProjectDetail(card) {
  if (!card) {
    return;
  }

  closePanels();
  setActiveWorldCard(card);
  const originalTitle = card.dataset.title || "PROJECT";
  detailTitle.textContent = worldDetailCopy[originalTitle] || originalTitle;
  detailAuthor.textContent = card.dataset.author || "CHENNN STUDIO";
  detailKind.textContent = `${card.dataset.kind || "Placeholder"} / ${originalTitle}`;
  detailYear.textContent = card.dataset.year || "2026";
  detailSummary.textContent =
    card.dataset.summary || "Placeholder detail page frame. Add case-study copy, gallery images, credits, launch links, and next project navigation here.";
  if (detailLink) {
    detailLink.href = `./project.html?project=${card.dataset.project || slugify(card.dataset.title)}&from=world`;
  }

  detailMedia.innerHTML = "";
  detailMedia.classList.remove("has-video");
  const visual = card.querySelector(".world-card__media, .world-card__photo");
  if (visual) {
    const style = getComputedStyle(visual);
    detailMedia.style.background = style.background;
  }
  if (card.dataset.videoSrc) {
    const sourceVideo = card.querySelector("video");
    const video = document.createElement("video");
    video.className = "project-detail__video";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = "metadata";
    if (sourceVideo?.poster) video.poster = sourceVideo.poster;
    video.src = card.dataset.videoSrc;
    detailMedia.classList.add("has-video");
    detailMedia.append(video);
    video.play?.().catch(() => {
      /* Muted autoplay can still be blocked in some browser contexts. */
    });
  }

  projectDetail.classList.add("is-open");
  projectDetail.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-open-detail");
}

// 切到上/下一张作品（详情页打开期间）
function navigateProjectDetail(direction) {
  if (!worldCards.length) return;
  const current = state.activeCard || worldCards[0];
  const idx = worldCards.indexOf(current);
  const len = worldCards.length;
  const nextIdx = (idx + direction + len) % len;
  const nextCard = worldCards[nextIdx];
  if (!nextCard) return;
  // 用 detail-flip 动画提示切换
  projectDetail.classList.remove("is-flipping-prev", "is-flipping-next");
  // 触发回流以重启动画
  void projectDetail.offsetWidth;
  projectDetail.classList.add(direction > 0 ? "is-flipping-next" : "is-flipping-prev");
  openProjectDetail(nextCard);
  setTimeout(() => {
    projectDetail.classList.remove("is-flipping-prev", "is-flipping-next");
  }, 520);
}

function jumpToCard(title) {
  const card = worldCards.find((item) => item.dataset.title === title);
  if (!card) {
    return;
  }

  closePanels();
  setActiveWorldCard(card);

  if (state.world.viewMode === "orbit") {
    state.orbit.targetProgress = worldCards.indexOf(card);
    state.orbit.velocity = 0;
    return;
  }

  const rect = card.getBoundingClientRect();
  const cardCenterX = rect.left + rect.width / 2;
  const cardCenterY = rect.top + rect.height / 2;
  state.world.targetX += (window.innerWidth / 2 - cardCenterX) * 0.75;
  state.world.targetY += (window.innerHeight / 2 - cardCenterY) * 0.65;
}

function filterProjects(category) {
  projectFilterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.projectFilter === category);
  });

  const isAll = category === "all";
  projectPanelCards.forEach((card) => {
    const categories = String(card.dataset.projectCard || "").split(/\s+/);
    card.classList.toggle("is-filtered-out", !isAll && !categories.includes(category));
  });
  worldCards.forEach((card) => {
    const categories = String(card.dataset.category || "").split(/\s+/);
    card.classList.toggle("is-dimmed", !isAll && !categories.includes(category));
  });
  document.body.classList.toggle("has-project-filter", !isAll);
}

function recordWorldFieldPress(event) {
  if (!state.entered || isWorldGateBlocking() || state.world.viewMode !== "orbit") {
    return;
  }

  state.field.pressX = event.clientX;
  state.field.pressY = event.clientY;
  state.field.press = 1;
  state.field.pressVelocity = -0.035;
}

worldStage.addEventListener("pointerdown", recordWorldFieldPress, { passive: true });
worldStage.addEventListener("pointerdown", startWorldDrag);
worldStage.addEventListener("pointermove", moveWorldDrag);
worldStage.addEventListener("pointerup", endWorldDrag);
worldStage.addEventListener("pointercancel", endWorldDrag);
worldStage.addEventListener("pointerleave", (event) => {
  if (state.world.dragging) {
    endWorldDrag(event);
  }
});
worldStage.addEventListener(
  "wheel",
  (event) => {
    if (!state.entered || document.body.classList.contains("has-open-panel") || document.body.classList.contains("has-open-detail")) {
      return;
    }

    if (isWorldGateBlocking()) {
      return;
    }

    event.preventDefault();
    if (state.world.viewMode === "orbit") {
      const delta = (event.deltaY + event.deltaX * 0.6) * 0.006;
      state.orbit.targetProgress += delta;
      state.orbit.velocity = state.reducedMotion ? 0 : delta * 0.16;
      state.field.trail = Math.min(1, state.field.trail + Math.min(0.7, Math.abs(event.deltaY) * 0.0025));
      return;
    }

    state.world.targetX -= event.deltaX * 0.55;
    state.world.targetY -= event.deltaY * 0.55;
    state.world.velocityX = state.reducedMotion ? 0 : -event.deltaX * 0.08;
    state.world.velocityY = state.reducedMotion ? 0 : -event.deltaY * 0.08;
  },
  { passive: false },
);

worldCards.forEach((card) => {
  if (!isTouchDevice) {
    card.addEventListener("mouseenter", () => setActiveWorldCard(card));
  }
  card.addEventListener("focusin", () => setActiveWorldCard(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      if (isWorldGateBlocking()) return;
      event.preventDefault();
      openProjectDetail(card);
    }
  });
  // 方案 B（双保险）：card 自己监听 pointerdown/pointerup —
  // 因为 startWorldDrag 已跳过 .world-card 不抢指针（方案 A），
  // 单击的 pointer 事件能直达 card；位移 < 6px 且时长 < 600ms 视为 click。
  let _pdX = 0, _pdY = 0, _pdT = 0;
  card.addEventListener("pointerdown", (e) => {
    _pdX = e.clientX;
    _pdY = e.clientY;
    _pdT = performance.now();
  });
  card.addEventListener("pointerup", (e) => {
    if (isWorldGateBlocking()) {
      return;
    }
    const dx = e.clientX - _pdX;
    const dy = e.clientY - _pdY;
    const dt = performance.now() - _pdT;
    if (Math.hypot(dx, dy) < 6 && dt < 600) {
      openProjectDetail(card);
    }
  });
});

// 方案 B 兜底：worldStage 上的 click 委托
// 关键修复：拖动结束后必须把 state.world.moved 重置为 false，否则一次拖动后
// 所有 click 都会被 "if (moved) return" 永久 block —— 这是之前点击不响应的真因。
let _stageClickGuard = false;
worldStage.addEventListener("click", (event) => {
  if (isWorldGateBlocking()) {
    return;
  }
  if (_stageClickGuard) {
    _stageClickGuard = false;
    return;
  }
  const card = event.target.closest(".world-card");
  if (!card) return;
  // 不再依赖 state.world.moved（不可靠且未重置），而是用上面的 _stageClickGuard
  openProjectDetail(card);
});
// 拖动结束时（hypot 累积 > 3）把 click 屏蔽一次，避免拖完手指松开误触发开 detail
worldStage.addEventListener("pointerup", () => {
  if (state.world.moved) {
    _stageClickGuard = true;
  }
  // 关键：重置 moved，下一次 pointerdown 才能干净开始
  state.world.moved = false;
}, true);

panelTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openPanel(trigger.dataset.panelTrigger);
  });
});

panelClosers.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    closePanels();
  });
});

indexButtons.forEach((button) => {
  button.addEventListener("click", () => jumpToCard(button.dataset.cardJump));
});

projectFilterButtons.forEach((button) => {
  button.addEventListener("click", () => filterProjects(button.dataset.projectFilter));
});

worldViewButton.addEventListener("click", () => openProjectDetail(state.activeCard));

projectDetailClose.addEventListener("click", closeProjectDetail);

// Project Detail 左右切换按钮 + 键盘快捷键
const projectDetailPrev = document.querySelector(".project-detail__nav--prev");
const projectDetailNext = document.querySelector(".project-detail__nav--next");
if (projectDetailPrev) {
  projectDetailPrev.addEventListener("click", () => navigateProjectDetail(-1));
}
if (projectDetailNext) {
  projectDetailNext.addEventListener("click", () => navigateProjectDetail(1));
}
document.addEventListener("keydown", (event) => {
  if (!document.body.classList.contains("has-open-detail")) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    navigateProjectDetail(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    navigateProjectDetail(1);
  } else if (event.key === "Escape") {
    closeProjectDetail();
  }
});

worldModeButton.addEventListener("click", () => {
  setWorldViewMode(state.world.viewMode === "orbit" ? "free" : "orbit");
});

worldThemeButton?.addEventListener("click", () => {
  setWorldTheme(document.body.dataset.worldTheme === "coral" ? "lime" : "coral");
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePanels();
    closeProjectDetail();
  }

  if (!state.entered || document.body.classList.contains("has-open-panel") || document.body.classList.contains("has-open-detail")) {
    return;
  }

  if (isWorldGateBlocking()) {
    return;
  }

  const keyMap = {
    ArrowLeft: [42, 0],
    ArrowRight: [-42, 0],
    ArrowUp: [0, 32],
    ArrowDown: [0, -32],
  };
  const delta = keyMap[event.key];
  if (delta) {
    event.preventDefault();
    if (state.world.viewMode === "orbit") {
      const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      state.orbit.targetProgress += direction * 0.58;
      state.orbit.velocity = state.reducedMotion ? 0 : direction * 0.03;
      return;
    }

    state.world.targetX += delta[0];
    state.world.targetY += delta[1];
    state.world.velocityX = state.reducedMotion ? 0 : delta[0] * 0.05;
    state.world.velocityY = state.reducedMotion ? 0 : delta[1] * 0.05;
  }
});

const handleReducedMotionChange = (event) => {
  state.reducedMotion = event.matches;
};
if (reducedMotionQuery.addEventListener) {
  reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
} else {
  reducedMotionQuery.addListener(handleReducedMotionChange);
}

if (!isTouchDevice) {
  enterButton.addEventListener("mouseenter", () => loader.classList.add("is-love"));
  enterButton.addEventListener("mouseleave", () => {
    loader.classList.remove("is-love");
    state.magnetic.targetX = 0;
    state.magnetic.targetY = 0;
  });
}

// ============ BGM trial ============
const audioEl = document.getElementById("bgm");
let isMuted = true;
let activeAudioTrackIndex = 1;
const audioTracks = [
  { id: "A", label: "Sound A", src: "./assets/audio/world-bgm-a.mp3" },
  { id: "B", label: "Sound B", src: "./assets/audio/world-bgm-b.mp3" },
];
const audioStateKey = "chennn:global-audio:v1";
const sfxTracks = {
  enter: "./assets/audio/sfx/enter-world-02.m4a",
  tick: "./assets/audio/sfx/ui-tick-02.m4a",
};

function updateAudioLabels() {
  quietButton.firstChild.nodeValue = `\n        ${isMuted ? "进入无声模式" : "进入有声模式"}\n        `;
  if (worldSoundButton) {
    const track = audioTracks[activeAudioTrackIndex];
    worldSoundButton.textContent = `${track.label} ${isMuted ? "off" : "on"}`;
    worldSoundButton.dataset.audioTrack = track.id;
    worldSoundButton.setAttribute("aria-label", isMuted ? "Turn sound on" : "Turn sound off");
  }
}

function persistAudioState() {
  try {
    window.localStorage.setItem(audioStateKey, JSON.stringify({
      enabled: !isMuted,
      track: audioTracks[activeAudioTrackIndex].id,
    }));
  } catch {
    /* Storage may be unavailable in private contexts. */
  }
}

function restoreAudioState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(audioStateKey) || "{}");
    const savedIndex = audioTracks.findIndex((track) => track.id === saved.track);
    if (savedIndex >= 0) {
      activeAudioTrackIndex = savedIndex;
    }
    isMuted = saved.enabled !== true;
  } catch {
    isMuted = true;
  }
}

function playSfx(kind, volume = 0.45) {
  if (isMuted) {
    return;
  }
  const src = sfxTracks[kind];
  if (!src) {
    return;
  }
  const sfxAudio = new Audio(src);
  sfxAudio.volume = volume;
  sfxAudio.play?.().catch(() => {});
}

function ensureBgm() {
  if (!audioEl) {
    return;
  }

  const track = audioTracks[activeAudioTrackIndex];
  const currentSrc = audioEl.getAttribute("src") || "";
  if (!currentSrc.endsWith(track.src.replace("./", ""))) {
    audioEl.src = track.src;
    audioEl.dataset.source = track.id;
    audioEl.load();
  }
  audioEl.loop = true;
  audioEl.volume = isMuted ? 0 : 0.22;
}

function fadeBgmTo(value, duration = 1.2) {
  ensureBgm();
  if (!audioEl) {
    return;
  }

  const startVolume = audioEl.volume;
  const start = performance.now();
  const durationMs = Math.max(duration * 1000, 1);

  function step(now) {
    const progressAmount = clamp(0, (now - start) / durationMs, 1);
    audioEl.volume = lerp(startVolume, value, progressAmount);
    if (progressAmount < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function playBgm() {
  ensureBgm();
  if (!audioEl) {
    return;
  }
  audioEl.play?.().catch(() => {
    isMuted = true;
    persistAudioState();
    updateAudioLabels();
    document.body.dataset.audio = "muted";
  });
}

function selectNextAudioTrack() {
  activeAudioTrackIndex = (activeAudioTrackIndex + 1) % audioTracks.length;
  if (!audioEl) {
    return;
  }
  const wasMuted = isMuted;
  audioEl.pause();
  audioEl.src = audioTracks[activeAudioTrackIndex].src;
  audioEl.dataset.source = audioTracks[activeAudioTrackIndex].id;
  audioEl.volume = wasMuted ? 0 : 0.22;
  if (!wasMuted) {
    playBgm();
  }
  persistAudioState();
  updateAudioLabels();
}

function setMuted(muted) {
  isMuted = muted;
  persistAudioState();
  updateAudioLabels();
  document.body.dataset.audio = isMuted ? "muted" : "on";

  if (isMuted) {
    if (audioEl) {
      fadeBgmTo(0, 0.35);
    }
    return;
  }

  playBgm();
  fadeBgmTo(0.22, 1.2);
}

enterButton.addEventListener("click", () => {
  if (!isMuted) {
    ensureBgm();
    playSfx("enter", 0.58);
    playBgm();
    fadeBgmTo(0.22, 1.2);
  }
  enterWorld({ muted: isMuted, afterIpLoader: false });
});

loader.addEventListener("pointerdown", (event) => {
  spawnEyeEntryBurst(event);
});

quietButton.addEventListener("click", () => {
  isMuted = !isMuted;
  setMuted(isMuted);
});

worldSoundButton?.addEventListener("click", () => {
  if (isMuted) {
    setMuted(false);
    return;
  }

  selectNextAudioTrack();
});

restoreAudioState();
setMuted(isMuted);
setWorldTheme("lime");
document.querySelectorAll(".site-panel--menu .site-panel__inner a").forEach(splitText);

setupWorldGallery();
setActiveWorldCard(worldCards[8] || state.activeCard);
setWorldViewMode("orbit");
initWorldGate();
// 初始把 active card 平移到屏幕中心（jumpToCard 通过相对位移实现，
// 因此放在 setupWorldGallery 之后、首帧 render 之前用一次 rAF 等布局稳定再调用）
requestAnimationFrame(() => {
  if (state.activeCard?.dataset?.title) {
    jumpToCard(state.activeCard.dataset.title);
  }
});
setProgress(0);
setEyelids(0);
requestAnimationFrame(renderEyes);
if (!state.reducedMotion) {
  scheduleBlink();
}
if (directWorldEntry) {
  state.ready = true;
  setProgress(100, { immediate: true });
  setEyelids(1);
  loader.classList.add("is-ready");
  window.setTimeout(() => {
    updateCenters();
    setEyelids(1);
  }, 80);
  requestAnimationFrame(updateOrbitLayout);
} else {
  runIntro();
}
