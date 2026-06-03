(function () {
  "use strict";

  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  const body = document.body;
  const stage = document.querySelector("[data-skin-stage]");
  const title = document.querySelector("[data-bounce-title]");
  const showcase = document.querySelector("[data-skin-showcase]");
  const image = document.querySelector("[data-skin-showcase-image]");
  const media = document.querySelector(".skin-showcase__media");
  const titleNode = document.querySelector("[data-skin-showcase-title]");
  const kickerNode = document.querySelector("[data-skin-kicker]");
  const previousButton = document.querySelector("[data-skin-prev]");
  const nextButton = document.querySelector("[data-skin-next]");
  const enterDetailButton = document.querySelector("[data-skin-enter-detail]");
  const philosophyButton = document.querySelector("[data-skin-philosophy]");
  const shrinkButton = document.querySelector("[data-skin-shrink]");

  const slides = [
    {
      src: "./assets/ip-mask-demo/skin-card-kungfu-ref.png",
      title: "TANGYUAN<br />FOREST CAMPING",
      kicker: "Forest bonfire",
      alt: "Forest camping Tangyuan skin"
    },
    {
      src: "./assets/ip-mask-demo/skin-card-galaxy-ref.png",
      title: "TANGYUAN<br />GALAXY RUNNER",
      kicker: "Galaxy runner",
      alt: "Galaxy Tangyuan skin"
    },
    {
      src: "./assets/ip-mask-demo/skin-card-surf-ref.png",
      title: "TANGYUAN<br />WAVE RIDER",
      kicker: "Wave rider",
      alt: "Surf Tangyuan skin"
    },
    {
      src: "./assets/ip-mask-demo/skin-card-sheriff-ref.png",
      title: "TANGYUAN<br />DESERT SHERIFF",
      kicker: "Desert sheriff",
      alt: "Sheriff Tangyuan skin"
    }
  ];

  let currentIndex = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let isPointerDown = false;
  let hasDragged = false;

  function splitTitle() {
    if (!title || title.dataset.split === "true") return;

    let index = 0;
    Array.from(title.children).forEach((line) => {
      const text = line.textContent || "";
      line.textContent = "";
      line.setAttribute("data-title-line", "");

      Array.from(text).forEach((letter) => {
        const span = document.createElement("span");
        span.className = letter === " " ? "char char--space" : "char";
        span.style.setProperty("--i", String(index));
        span.textContent = letter === " " ? "\u00a0" : letter;
        line.appendChild(span);
        index += letter === " " ? 0.4 : 1;
      });
    });

    title.dataset.split = "true";
  }

  function setMode(mode) {
    const isDetail = mode === "detail";
    body.classList.toggle("skin-mode-detail", isDetail);
    if (!isDetail) {
      body.classList.remove("skin-mode-expanded");
    }
  }

  function setSlide(nextIndex) {
    if (!image || !titleNode || !kickerNode) return;

    currentIndex = (nextIndex + slides.length) % slides.length;
    const slide = slides[currentIndex];

    if (media) media.classList.add("is-switching");

    window.setTimeout(() => {
      image.src = slide.src;
      image.alt = slide.alt;
      titleNode.innerHTML = slide.title;
      kickerNode.textContent = slide.kicker;

      if (media) media.classList.remove("is-switching");
    }, 160);
  }

  function isInteractiveTarget(target) {
    return Boolean(target.closest("a, button, [role='button']"));
  }

  function onPointerDown(event) {
    if (!stage || isInteractiveTarget(event.target)) return;

    isPointerDown = true;
    hasDragged = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    stage.classList.add("is-dragging");

    if (typeof stage.setPointerCapture === "function") {
      try {
        stage.setPointerCapture(event.pointerId);
      } catch (error) {
        // Safari may reject capture for synthetic pointers; dragging still works without it.
      }
    }
  }

  function onPointerMove(event) {
    if (!isPointerDown) return;

    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;

    if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy)) {
      hasDragged = true;
    }
  }

  function onPointerUp(event) {
    if (!isPointerDown) return;

    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;
    isPointerDown = false;

    if (stage) stage.classList.remove("is-dragging");

    if (typeof stage.releasePointerCapture === "function") {
      try {
        stage.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore automatic capture release.
      }
    }

    if (hasDragged && Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      setMode("detail");
    }
  }

  splitTitle();

  if (stage && !isTouchDevice) {
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);
  }

  if (previousButton) {
    previousButton.addEventListener("click", () => setSlide(currentIndex - 1));
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => setSlide(currentIndex + 1));
  }

  if (enterDetailButton) {
    enterDetailButton.addEventListener("click", () => {
      setMode("detail");
    });
  }

  if (philosophyButton) {
    philosophyButton.addEventListener("click", () => {
      body.classList.add("skin-mode-expanded");
    });
  }

  if (shrinkButton) {
    shrinkButton.addEventListener("click", () => {
      body.classList.add("skin-shrink-twirl");
      body.classList.remove("skin-mode-expanded");
      window.setTimeout(() => body.classList.remove("skin-shrink-twirl"), 520);
    });
  }

  if (showcase) {
    showcase.addEventListener("dblclick", () => {
      body.classList.toggle("skin-mode-expanded");
    });
  }

  const params = new URLSearchParams(window.location.search);
  const requestedSlide = Number.parseInt(params.get("slide") || "0", 10);
  if (Number.isFinite(requestedSlide) && requestedSlide > 0) {
    setSlide(requestedSlide);
  }

  if (params.get("mode") === "detail") {
    setMode("detail");
  }

  if (params.get("mode") === "expanded") {
    setMode("detail");
    body.classList.add("skin-mode-expanded");
  }
})();
