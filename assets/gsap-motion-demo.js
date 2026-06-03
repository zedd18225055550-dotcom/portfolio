(function () {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  const reduceQuery = "(prefers-reduced-motion: reduce)";
  const desktopQuery = "(min-width: 900px)";
  const anyViewportQuery = "(min-width: 0px)";
  const handoffKey = "chennn-gsap-demo-handoff";

  function injectDemoStyles() {
    if (document.getElementById("gsap-demo-dynamic-style")) return;
    const style = document.createElement("style");
    style.id = "gsap-demo-dynamic-style";
    style.textContent = `
      .gsap-route-veil {
        align-items: center;
        background: #050505;
        color: #f4f3ed;
        display: grid;
        inset: 0;
        justify-items: center;
        opacity: 0;
        pointer-events: none;
        position: fixed;
        z-index: 220;
      }

      .gsap-route-veil::before {
        background:
          radial-gradient(circle, rgb(var(--accent-rgb, 156 255 82) / 0.68) 0 0.12rem, transparent 0.13rem),
          linear-gradient(90deg, transparent 0 16%, var(--accent, #9cff52) 16% 36%, transparent 36%);
        background-size: 0.88rem 0.88rem, 100% 100%;
        content: "";
        inset: 0;
        opacity: 0.28;
        position: absolute;
        transform: skewY(-4deg);
      }

      .gsap-route-veil__copy {
        display: grid;
        gap: 0.55rem;
        max-width: min(34rem, 80vw);
        position: relative;
        text-align: center;
        text-transform: uppercase;
        z-index: 1;
      }

      .gsap-route-veil__copy small {
        color: var(--accent, #9cff52);
        font-size: 0.76rem;
        font-weight: 900;
        letter-spacing: 0.12em;
      }

      .gsap-route-veil__copy strong {
        font-size: clamp(2.2rem, 7vw, 6.5rem);
        font-weight: 560;
        line-height: 0.86;
      }

      .gsap-chapter-rail {
        display: grid;
        gap: 0.28rem;
        position: fixed;
        right: clamp(0.75rem, 1.45vw, 1.5rem);
        top: 50%;
        transform: translateY(-50%);
        z-index: 75;
      }

      .gsap-chapter-rail button {
        align-items: center;
        appearance: none;
        background: rgba(5, 5, 5, 0.72);
        border: 1px solid rgba(244, 243, 237, 0.2);
        border-radius: 999px;
        color: rgba(244, 243, 237, 0.64);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-size: 0.68rem;
        font-weight: 900;
        gap: 0.42rem;
        justify-content: flex-start;
        letter-spacing: 0.04em;
        min-height: 2.05rem;
        min-width: 2.05rem;
        overflow: hidden;
        padding: 0 0.64rem;
        text-transform: uppercase;
        transition: background-color 0.2s ease, color 0.2s ease, width 0.24s ease;
        width: 2.05rem;
      }

      .gsap-chapter-rail button span {
        opacity: 0;
        transition: opacity 0.18s ease;
        white-space: nowrap;
      }

      .gsap-chapter-rail button.is-active,
      .gsap-chapter-rail button:hover,
      .gsap-chapter-rail button:focus-visible {
        background: var(--accent, #9cff52);
        color: #050505;
        width: clamp(7.25rem, 10vw, 9.25rem);
      }

      .gsap-chapter-rail button.is-active span,
      .gsap-chapter-rail button:hover span,
      .gsap-chapter-rail button:focus-visible span {
        opacity: 1;
      }

      @media (max-width: 900px) {
        .gsap-chapter-rail {
          display: none;
        }
      }
    `;
    document.head.append(style);
  }

  function createRouteVeil(label, title) {
    const veil = document.createElement("div");
    veil.className = "gsap-route-veil";
    const copy = document.createElement("div");
    copy.className = "gsap-route-veil__copy";
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = title || "Project";
    copy.append(small, strong);
    veil.append(copy);
    document.body.append(veil);
    return veil;
  }

  function readHandoff() {
    try {
      const raw = window.sessionStorage.getItem(handoffKey);
      window.sessionStorage.removeItem(handoffKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function initProjectsDemo() {
    const hero = document.querySelector(".projects-poster-hero");
    const cards = gsap.utils.toArray(".project-card");
    if (!hero || !cards.length) return;

    injectDemoStyles();
    document.body.dataset.gsapDemo = "projects";

    mm.add(
      {
        isAnyViewport: anyViewportQuery,
        reduceMotion: reduceQuery,
        isDesktop: desktopQuery,
      },
      (context) => {
        const { reduceMotion, isDesktop } = context.conditions;
        if (reduceMotion) {
          gsap.set(".projects-poster-right, .project-card", { clearProps: "all" });
          return;
        }

        const heroTl = gsap.timeline({
          defaults: { duration: 0.9, ease: "power3.out" },
        });

        heroTl
          .from(".projects-poster-hero__image", {
            autoAlpha: 0,
            scale: 1.035,
            duration: 1.25,
          })
          .from(".projects-poster-status", { autoAlpha: 0, y: 28 }, "-=0.82")
          .from(".projects-poster-title span", { autoAlpha: 0, y: 54, stagger: 0.08 }, "-=0.72")
          .from(".projects-poster-chip", { autoAlpha: 0, y: 22, stagger: 0.055 }, "-=0.58");

        if (isDesktop) {
          gsap.to(".projects-poster-hero__image", {
            yPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: 0.8,
            },
          });
        }

        const medias = cards.map((card) => card.querySelector(".project-media")).filter(Boolean);
        const metas = cards.map((card) => card.querySelector(".project-meta")).filter(Boolean);
        const frames = cards.map((card) => card.querySelector(".project-frame--base")).filter(Boolean);

        gsap.set(medias, { autoAlpha: 0, clearProps: "transform" });
        gsap.set(metas, { autoAlpha: 0, y: 24 });
        gsap.set(frames, { autoAlpha: 0 });

        ScrollTrigger.batch(cards, {
          interval: 0.08,
          batchMax: 4,
          once: true,
          start: "top 86%",
          onEnter: (batch) => {
            batch.forEach((card, index) => {
              const media = card.querySelector(".project-media");
              const meta = card.querySelector(".project-meta");
              const frame = card.querySelector(".project-frame--base");
              const titleChars = card.querySelectorAll(".project-title .split-char");
              const tl = gsap.timeline({
                delay: index * 0.075,
                defaults: { ease: "power3.out" },
              });

              tl.to(media, {
                autoAlpha: 1,
                duration: 0.82,
                clearProps: "transform",
              })
                .to(frame, { autoAlpha: 1, duration: 0.42 }, "-=0.68")
                .to(meta, { autoAlpha: 1, y: 0, duration: 0.5 }, "-=0.44");

              if (titleChars.length) {
                tl.fromTo(
                  titleChars,
                  { yPercent: 72, autoAlpha: 0 },
                  { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: 0.012 },
                  "-=0.5",
                );
              }
            });
          },
        });

        cards.forEach((card) => {
          const hotFrame = card.querySelector(".project-frame--hot");
          const asset = card.querySelector(".project-asset--reveal, .project-object--reveal, .project-video");
          if (!hotFrame && !asset) return;

          card.addEventListener("pointerenter", () => {
            gsap.to(hotFrame, { autoAlpha: 1, duration: 0.28, overwrite: "auto" });
            gsap.to(asset, { scale: 1.025, duration: 0.62, ease: "power3.out", overwrite: "auto" });
          });
          card.addEventListener("pointerleave", () => {
            gsap.to(hotFrame, { autoAlpha: 0, duration: 0.32, overwrite: "auto" });
            gsap.to(asset, { scale: 1, duration: 0.72, ease: "power3.out", overwrite: "auto", clearProps: "scale" });
          });
        });

        initProjectFilterShuffle(cards);
        initProjectRouteHandoff(cards);
      },
    );
  }

  function initProjectFilterShuffle(cards) {
    const buttons = [...document.querySelectorAll("[data-filter]")];
    const filterToggle = document.querySelector(".filter-toggle");
    if (!buttons.length || document.body.dataset.gsapFilterReady === "true") return;
    document.body.dataset.gsapFilterReady = "true";
    const getCards = () => [...document.querySelectorAll(".project-card")];
    const getCardStreams = (card) => String(card.dataset.stream || card.dataset.category || "").split(/\s+/).filter(Boolean);

    buttons.forEach((button) => {
      button.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();

          const category = button.dataset.filter || "all";
          window.setProjectsStreamTheme?.(category);
          buttons.forEach((item) => item.classList.toggle("is-active", item === button));
          document.body.classList.remove("is-filter-open");
          if (filterToggle) filterToggle.textContent = "Filter⌄";

          const currentCards = getCards();
          gsap.killTweensOf(currentCards);

          const outgoing = currentCards.filter((card) => {
            const show = category === "all" || getCardStreams(card).includes(category);
            return !show && !card.classList.contains("is-hidden");
          });
          const incoming = currentCards.filter((card) => {
            const show = category === "all" || getCardStreams(card).includes(category);
            return show;
          });
          const incomingSet = new Set(incoming);
          incoming.forEach((card) => card.classList.remove("is-hidden"));

          if (outgoing.length) {
            gsap.to(outgoing, {
              autoAlpha: 0,
              y: 24,
              scale: 0.97,
              duration: 0.24,
              stagger: 0.018,
              ease: "power2.in",
              overwrite: true,
              onComplete: () => {
                outgoing.forEach((card) => {
                  if (!incomingSet.has(card)) card.classList.add("is-hidden");
                });
                incoming.forEach((card) => card.classList.remove("is-hidden"));
                gsap.fromTo(
                  incoming,
                  { autoAlpha: 0, y: 32, scale: 0.98 },
                  {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.56,
                    stagger: { each: 0.035, from: "start" },
                    ease: "power3.out",
                    clearProps: "opacity,visibility,transform",
                    onComplete: () => {
                      ScrollTrigger.refresh();
                      window.dispatchEvent(new Event("resize"));
                    },
                  },
                );
              },
            });
          } else {
            incoming.forEach((card) => card.classList.remove("is-hidden"));
            gsap.fromTo(
              incoming,
              { autoAlpha: 0.72, y: 18 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.48,
                stagger: { each: 0.024, from: "center" },
                ease: "power3.out",
                clearProps: "opacity,visibility,transform",
                onComplete: () => {
                  ScrollTrigger.refresh();
                  window.dispatchEvent(new Event("resize"));
                },
              },
            );
          }
        },
        { capture: true },
      );
    });
  }

  function initProjectRouteHandoff(cards) {
    if (document.body.dataset.gsapRouteReady === "true") return;
    document.body.dataset.gsapRouteReady = "true";

    cards.forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const href = card.getAttribute("href");
        if (!href || href === "#") return;

        event.preventDefault();
        const title = card.dataset.projectTitle || card.querySelector(".project-title")?.getAttribute("aria-label") || card.textContent.trim();
        try {
          window.sessionStorage.setItem(handoffKey, JSON.stringify({ title }));
        } catch (error) {}

        const veil = createRouteVeil("Opening case", title);
        gsap.timeline({
          defaults: { ease: "power3.inOut" },
          onComplete: () => {
            window.location.href = href;
          },
        })
          .set(veil, { autoAlpha: 1 })
          .fromTo(veil, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.42 })
          .from(".gsap-route-veil__copy > *", { y: 28, autoAlpha: 0, stagger: 0.045, duration: 0.28 }, "-=0.18");
      });
    });
  }

  function initProjectDetailDemo() {
    const caseHero = document.querySelector(".klook-hero");
    if (!caseHero) return;

    injectDemoStyles();
    document.body.dataset.gsapDemo = "project-detail";

    mm.add(
      {
        isAnyViewport: anyViewportQuery,
        reduceMotion: reduceQuery,
        isDesktop: desktopQuery,
      },
      (context) => {
        const { reduceMotion, isDesktop } = context.conditions;
        if (reduceMotion) {
          document.documentElement.classList.add("gsap-demo-ready");
          return;
        }
        const isCnyCase = document.body.classList.contains("is-cny-case");
        const handoff = readHandoff();

        gsap.set(".klook-kicker, .klook-title__top, .klook-title__bottom, .klook-hero-media", {
          willChange: "transform, opacity",
        });
        gsap.set(".klook-hero-media", { "--gsap-hero-dim": 0 });

        const heroTl = gsap.timeline({
          defaults: { duration: 0.95, ease: "power3.out" },
        });

        heroTl
          .from(".klook-kicker", { autoAlpha: 0, y: -18 })
          .from(".klook-title__top", { autoAlpha: 0, x: -84, skewX: -4 }, "-=0.68")
          .from(".klook-title__bottom", { autoAlpha: 0, x: 84, skewX: 4 }, "-=0.74");

        if (isCnyCase) {
          if (handoff) {
            gsap.set(".klook-hero-media", { autoAlpha: 1, "--gsap-hero-dim": 0.32 });
            heroTl.to(
              ".klook-hero-media",
              {
                "--gsap-hero-dim": 0,
                duration: 1.18,
                clearProps: "visibility",
                onComplete: () => gsap.set(".klook-hero-media", { "--gsap-hero-dim": 0 }),
              },
              0,
            );
          } else {
            heroTl.fromTo(
              ".klook-hero-media",
              { autoAlpha: 0, "--gsap-hero-dim": 0.32 },
              {
                autoAlpha: 1,
                "--gsap-hero-dim": 0,
                duration: 1.05,
                clearProps: "visibility",
                onComplete: () => gsap.set(".klook-hero-media", { "--gsap-hero-dim": 0 }),
              },
              "-=0.74",
            );
          }
        } else {
          heroTl.from(".klook-hero-media", { autoAlpha: 0, y: 60, scale: 0.9, rotation: 4 }, "-=0.8");
        }

        if (isDesktop && !isCnyCase) {
          gsap.to(".klook-hero-media", {
            yPercent: 8,
            rotation: "+=3",
            ease: "none",
            scrollTrigger: {
              trigger: caseHero,
              start: "top top",
              end: "bottom top",
              scrub: 0.9,
            },
          });

          gsap.to(".klook-title__top", {
            xPercent: -4,
            ease: "none",
            scrollTrigger: {
              trigger: caseHero,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });

          gsap.to(".klook-title__bottom", {
            xPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: caseHero,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });
        }

        if (handoff) {
          const veil = createRouteVeil("Case loaded", handoff.title);
          gsap.timeline({ onComplete: () => veil.remove() })
            .set(veil, { autoAlpha: 1, clipPath: "inset(0% 0 0 0)" })
            .to(veil, { autoAlpha: 0, duration: 0.5, ease: "power2.out", delay: 0.12 });
        }

        document.documentElement.classList.add("gsap-demo-ready");

        ScrollTrigger.batch(".klook-overview > *, .klook-meta > div, .klook-slider__copy", {
          interval: 0.08,
          batchMax: 5,
          once: true,
          start: "top 82%",
          onEnter: (batch) => {
            gsap.fromTo(
              batch,
              { autoAlpha: 0, y: 42 },
              { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.07, ease: "power3.out", overwrite: "auto" },
            );
          },
        });

        ScrollTrigger.batch(".klook-shot, .cny-stage-card, .cny-setting-card, .cny-showcase-card", {
          interval: 0.08,
          batchMax: 4,
          once: true,
          start: "top 86%",
          onEnter: (batch) => {
            gsap.fromTo(
              batch,
              { autoAlpha: 0, y: 58, rotation: (index) => (index % 2 ? 2.2 : -2.2), scale: 0.96 },
              { autoAlpha: 1, y: 0, rotation: 0, scale: 1, duration: 0.86, stagger: 0.08, ease: "power3.out" },
            );
          },
        });

        if (isDesktop) {
          gsap.utils.toArray(".klook-scroll-card__media").forEach((media) => {
            gsap.to(media, {
              y: -38,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: media,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.75,
              },
            });
          });
        }

        initChapterRail(isCnyCase);
      },
    );
  }

  function initChapterRail(isCnyCase) {
    if (document.querySelector(".gsap-chapter-rail")) return;
    const chapterDefs = isCnyCase
      ? [
          ["01", "Hero", ".klook-hero"],
          ["02", "IP", ".cny-making-section"],
          ["03", "Map", ".cny-map-setting-section"],
          ["04", "Output", ".cny-final-output, .klook-next"],
        ]
      : [
          ["01", "Hero", ".klook-hero"],
          ["02", "Overview", ".klook-overview"],
          ["03", "Media", ".klook-slider"],
          ["04", "Next", ".klook-next"],
        ];
    const chapters = chapterDefs
      .map(([index, label, selector]) => ({ index, label, element: document.querySelector(selector) }))
      .filter((chapter) => chapter.element);
    if (chapters.length < 2) return;

    const rail = document.createElement("nav");
    rail.className = "gsap-chapter-rail";
    rail.setAttribute("aria-label", "Case chapters");

    chapters.forEach((chapter) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `${chapter.index}<span>${chapter.label}</span>`;
      button.addEventListener("click", () => {
        chapter.element.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      rail.append(button);

      ScrollTrigger.create({
        trigger: chapter.element,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (!self.isActive) return;
          rail.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button));
        },
      });
    });

    rail.querySelector("button")?.classList.add("is-active");
    document.body.append(rail);
  }

  window.addEventListener("load", () => {
    initProjectsDemo();
    initProjectDetailDemo();
    ScrollTrigger.refresh();
  });
})();
