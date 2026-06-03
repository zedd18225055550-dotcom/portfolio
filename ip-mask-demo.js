(function () {
  "use strict";

  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  const scene = document.getElementById("scene");
  const layerBg = document.getElementById("layerBg");
  const layerMask = document.getElementById("layerMask");
  const layerCharacter = document.getElementById("layerCharacter");
  const characterImg = document.getElementById("characterImg");
  const revealImg = document.querySelector(".character-img--reveal");
  const maskSurface = document.getElementById("maskSurface");
  const maskEdge = document.getElementById("maskEdge");
  const maskTrail1 = document.getElementById("maskTrail1");
  const maskTrail2 = document.getElementById("maskTrail2");
  const maskOutline = document.getElementById("maskOutline");
  const skinLinks = [...document.querySelectorAll("[data-skin-link]")];
  const isSkinBackdrop = document.body.classList.contains("ip-doorway--skin");

  if (!scene || !layerBg || !layerMask || !layerCharacter || !characterImg || !maskSurface) {
    return;
  }

  const config = {
    parallax: {
      character: isSkinBackdrop ? 12 : 35,
      mask: isSkinBackdrop ? 12 : 18,
      bg: isSkinBackdrop ? 3 : 7
    },
    rotate: {
      characterX: isSkinBackdrop ? 1.8 : 5,
      characterY: isSkinBackdrop ? 2.4 : 5
    },
    inputClamp: isSkinBackdrop ? 0.42 : 0.5,
    characterScale: isSkinBackdrop ? 1.035 : 1,
    damping: 0.18,
    maskRadius: 160,
    maskRadiusExpanded: 600,
    maskGrow: 0.18,
    maskShrink: 0.06,
    settleEpsilon: 0.001
  };

  const pointer = {
    active: false,
    down: false,
    x: 0.5,
    y: 0.5,
    currentX: 0.5,
    currentY: 0.5,
    radius: 0,
    targetRadius: 0
  };

  let rafId = 0;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setPointerFromEvent(event) {
    const rect = scene.getBoundingClientRect();
    pointer.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    pointer.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    pointer.active = true;
    pointer.targetRadius = pointer.down ? config.maskRadiusExpanded : config.maskRadius;
    requestTick();
  }

  function requestTick() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(render);
  }

  function resetHiddenMask() {
    const emptyMask = "radial-gradient(circle 0px at 50% 50%, #000 0%, transparent 100%)";
    maskSurface.style.webkitMaskImage = emptyMask;
    maskSurface.style.maskImage = emptyMask;
    maskSurface.style.opacity = "0";

    [maskEdge, maskTrail1, maskTrail2, maskOutline].forEach((node) => {
      if (node) node.style.opacity = "0";
    });
  }

  function shouldContinue() {
    return (
      Math.abs(pointer.x - pointer.currentX) > config.settleEpsilon ||
      Math.abs(pointer.y - pointer.currentY) > config.settleEpsilon ||
      Math.abs(pointer.targetRadius - pointer.radius) > 0.5 ||
      pointer.down
    );
  }

  function render() {
    rafId = 0;

    pointer.currentX += (pointer.x - pointer.currentX) * config.damping;
    pointer.currentY += (pointer.y - pointer.currentY) * config.damping;

    const radiusEase = pointer.targetRadius > pointer.radius ? config.maskGrow : config.maskShrink;
    pointer.radius += (pointer.targetRadius - pointer.radius) * radiusEase;

    const nx = clamp(pointer.currentX - 0.5, -config.inputClamp, config.inputClamp);
    const ny = clamp(pointer.currentY - 0.5, -config.inputClamp, config.inputClamp);

    const characterX = -nx * config.parallax.character;
    const verticalFactor = isSkinBackdrop ? 0.45 : 1;
    const characterY = -ny * config.parallax.character * verticalFactor;
    const maskX = -nx * config.parallax.mask;
    const maskY = -ny * config.parallax.mask * verticalFactor;
    const bgX = isSkinBackdrop ? 0 : nx * config.parallax.bg;
    const bgY = isSkinBackdrop ? 0 : ny * config.parallax.bg;

    layerBg.style.transform = `translate3d(${bgX}px, ${bgY}px, 0)`;
    layerCharacter.style.transform = `translate3d(${characterX}px, ${characterY}px, 0)`;
    layerMask.style.transform = `translate3d(${maskX}px, ${maskY}px, 0)`;
    const characterTransform = `scale(${config.characterScale}) rotateX(${ny * config.rotate.characterX}deg) rotateY(${-nx * config.rotate.characterY}deg)`;
    characterImg.style.transform = characterTransform;
    if (revealImg) {
      revealImg.style.transform = characterTransform;
    }

    const r = Math.max(0, pointer.radius);

    if (r <= 1) {
      resetHiddenMask();
    } else {
      const pcx = pointer.currentX * 100;
      const pcy = pointer.currentY * 100;
      const solid = Math.max(0, r - 18);
      const mid = Math.max(0, r - 10);
      const gradient = `radial-gradient(circle ${r}px at ${pcx}% ${pcy}%, #000 0 ${solid}px, rgba(0,0,0,0.86) ${mid}px, transparent 100%)`;

      maskSurface.style.webkitMaskImage = gradient;
      maskSurface.style.maskImage = gradient;
      maskSurface.style.opacity = "1";
    }

    if (shouldContinue()) {
      requestTick();
    }
  }

  function onPointerEnter(event) {
    setPointerFromEvent(event);
  }

  function onPointerMove(event) {
    setPointerFromEvent(event);
  }

  function onPointerLeave() {
    if (pointer.down) return;
    pointer.active = false;
    pointer.targetRadius = 0;
    requestTick();
  }

  function onPointerDown(event) {
    pointer.down = true;
    pointer.targetRadius = config.maskRadiusExpanded;
    setPointerFromEvent(event);

    if (typeof scene.setPointerCapture === "function") {
      try {
        scene.setPointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture is best-effort; the window listener below keeps drag reveal alive.
      }
    }
  }

  function onPointerUp(event) {
    pointer.down = false;
    pointer.targetRadius = pointer.active ? config.maskRadius : 0;

    if (typeof scene.releasePointerCapture === "function") {
      try {
        scene.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore browsers that release capture automatically.
      }
    }

    requestTick();
  }

  if (!isTouchDevice) {
    scene.addEventListener("pointerenter", onPointerEnter, { passive: true });
    scene.addEventListener("pointermove", onPointerMove, { passive: true });
    scene.addEventListener("pointerleave", onPointerLeave, { passive: true });
    scene.addEventListener("pointerdown", onPointerDown);
    scene.addEventListener("pointerup", onPointerUp);
    scene.addEventListener("pointercancel", onPointerUp);

    window.addEventListener("pointermove", (event) => {
      if (pointer.down) setPointerFromEvent(event);
    }, { passive: true });

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  } else {
    let revealOpen = false;

    scene.addEventListener("click", (event) => {
      if (event.target.closest("a, button, [role='button']")) return;

      revealOpen = !revealOpen;

      if (revealOpen) {
        const rect = scene.getBoundingClientRect();
        pointer.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        pointer.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
        pointer.currentX = pointer.x;
        pointer.currentY = pointer.y;
        pointer.active = true;
        pointer.targetRadius = config.maskRadiusExpanded;
      } else {
        pointer.targetRadius = 0;
      }

      requestTick();
    });

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", (event) => {
        if (event.gamma == null || event.beta == null) return;
        const gamma = clamp(event.gamma / 45, -config.inputClamp, config.inputClamp);
        const beta = clamp((event.beta - 45) / 45, -config.inputClamp, config.inputClamp);
        pointer.x = 0.5 + gamma * 0.5;
        pointer.y = 0.5 + beta * 0.5;
        pointer.active = true;
        requestTick();
      }, { passive: true });
    }
  }

  if (skinLinks.length) {
    skinLinks.forEach((skinLink) => {
    skinLink.addEventListener("click", () => {
      const href = skinLink.getAttribute("data-skin-link") || "./ip-skin-page.html";
      const loader = document.querySelector("[data-ip-loader]");

      if (!loader || !loader.__ipLoaderFx) {
        window.location.href = href;
        return;
      }

      loader.dispatchEvent(new CustomEvent("ip-loader:start", {
        bubbles: true,
        detail: {
          mode: "transition",
          replay: true
        }
      }));

      window.setTimeout(() => {
        window.location.href = href;
      }, 760);
    });
    });
  }

  resetHiddenMask();
  requestTick();
})();
