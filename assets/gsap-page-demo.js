(function () {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktopQuery = window.matchMedia("(min-width: 900px)");

  function injectStyles() {
    if (document.getElementById("gsap-page-demo-style")) return;
    const style = document.createElement("style");
    style.id = "gsap-page-demo-style";
    style.textContent = `
      .gsap-section-rail {
        align-self: start;
        display: grid;
        gap: 0.3rem;
        grid-column: 2;
        grid-row: 2 / span 5;
        justify-self: end;
        margin: 0;
        max-width: none;
        position: sticky;
        right: auto;
        top: clamp(5.5rem, 10vh, 7.25rem);
        transform: none;
        z-index: 75;
      }

      .gsap-section-rail button {
        align-items: center;
        appearance: none;
        background: rgba(5, 5, 5, 0.74);
        border: 1px solid rgba(244, 243, 237, 0.2);
        border-radius: 999px;
        color: rgba(244, 243, 237, 0.66);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-size: 0.68rem;
        font-weight: 900;
        gap: 0.44rem;
        letter-spacing: 0.04em;
        min-height: 2.05rem;
        min-width: 2.05rem;
        overflow: hidden;
        padding: 0 0.64rem;
        text-transform: uppercase;
        transition: background-color 0.2s ease, color 0.2s ease, width 0.24s ease;
        width: 2.05rem;
      }

      .gsap-section-rail span {
        opacity: 0;
        transition: opacity 0.18s ease;
        white-space: nowrap;
      }

      .gsap-section-rail button.is-active,
      .gsap-section-rail button:hover,
      .gsap-section-rail button:focus-visible {
        background: var(--world-accent, #9cff52);
        color: #050505;
        width: clamp(7.5rem, 10vw, 9.4rem);
      }

      .gsap-section-rail button.is-active span,
      .gsap-section-rail button:hover span,
      .gsap-section-rail button:focus-visible span {
        opacity: 1;
      }

      body.gsap-contact-demo .site-header--world {
        background: transparent !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        pointer-events: none;
      }

      body.gsap-contact-demo .site-header--world .brand,
      body.gsap-contact-demo .site-header--world .nav,
      body.gsap-contact-demo .site-header--world .explore-pill,
      body.gsap-contact-demo .site-header--world .menu-btn {
        pointer-events: auto;
      }

      body.gsap-contact-demo .site-header--world .nav a {
        color: rgba(244, 243, 237, 0.78) !important;
        text-shadow: 0 1px 14px rgba(5, 5, 5, 0.48) !important;
      }

      body.gsap-contact-demo .site-header--world .nav a.is-active,
      body.gsap-contact-demo .site-header--world .nav a.world-ip-entry {
        color: var(--accent, #9cff52) !important;
      }

      body.gsap-contact-demo .contact-stage::before {
        transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1);
      }

      body.gsap-contact-demo.is-contact-panel-minimized .contact-set {
        filter: blur(0.25rem) !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transform: translate3d(2.2rem, 0.8rem, 0) scale(0.72) rotate(-2.5deg) !important;
      }

      body[data-gsap-page-demo="services"] .svc-stage {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(7rem, 11rem);
        column-gap: clamp(1rem, 2vw, 2.5rem);
        overflow: visible;
        overflow-x: clip;
      }

      body[data-gsap-page-demo="services"] .svc-stage > :not(.gsap-section-rail) {
        grid-column: 1;
        margin-left: 0;
        margin-right: 0;
        max-width: none;
        width: 100%;
      }

      @media (max-width: 1080px) {
        body[data-gsap-page-demo="services"] .svc-stage {
          display: block;
        }

        .gsap-section-rail {
          display: none;
        }
      }
    `;
    document.head.append(style);
  }

  function initServicesDemo() {
    const blocks = gsap.utils.toArray(".svc-block");
    const hero = document.querySelector(".svc-poster-hero");
    if (!hero || !blocks.length) return;

    injectStyles();
    document.body.dataset.gsapPageDemo = "services";

    if (reduceMotion) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".svc-poster-hero__image", { autoAlpha: 0, scale: 1.025, duration: 1.05 })
      .from(".svc-poster-wordmark", { autoAlpha: 0, y: 30, duration: 0.72 }, "-=0.72")
      .from(".svc-poster-caption", { autoAlpha: 0, y: 24, duration: 0.62 }, "-=0.48")
      .from(".svc-poster-right > *", { autoAlpha: 0, y: 26, stagger: 0.055, duration: 0.58 }, "-=0.52");

    if (desktopQuery.matches) {
      gsap.to(".svc-poster-hero__image", {
        yPercent: 5,
        scale: 1.035,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.85,
        },
      });
    }

    gsap.set(".svc-index, .svc-block, .svc-cta", { autoAlpha: 0, y: 46 });
    ScrollTrigger.batch(".svc-index, .svc-block, .svc-cta", {
      interval: 0.08,
      batchMax: 3,
      once: true,
      start: "top 82%",
      onEnter: (batch) => {
        batch.forEach((element) => element.classList.add("is-visible"));
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          stagger: 0.08,
          ease: "power3.out",
          overwrite: "auto",
        });
      },
    });

    const railItems = [
      ["01", "Brand", "#brand"],
      ["02", "Website", "#website"],
      ["03", "Motion", "#motion"],
      ["04", "AI", "#ai"],
    ].map(([index, label, selector]) => ({ index, label, element: document.querySelector(selector) }))
      .filter((item) => item.element);

    if (railItems.length > 1 && !document.querySelector(".gsap-section-rail")) {
      const rail = document.createElement("nav");
      rail.className = "gsap-section-rail";
      rail.setAttribute("aria-label", "Service sections");
      railItems.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.innerHTML = `${item.index}<span>${item.label}</span>`;
        button.addEventListener("click", () => item.element.scrollIntoView({ behavior: "smooth", block: "start" }));
        rail.append(button);

        ScrollTrigger.create({
          trigger: item.element,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (!self.isActive) return;
            rail.querySelectorAll("button").forEach((node) => node.classList.toggle("is-active", node === button));
          },
        });
      });
      rail.querySelector("button")?.classList.add("is-active");
      (document.querySelector(".svc-stage") || document.body).append(rail);
    }
  }

  function initContactDemo() {
    const stage = document.querySelector(".contact-stage");
    const panel = document.querySelector(".contact-set");
    if (!stage || !panel) return;

    injectStyles();
    document.body.classList.add("gsap-contact-demo");
    document.body.dataset.gsapPageDemo = "contact";

    if (reduceMotion) return;

    gsap.set(".contact-set", { transformOrigin: "right center" });
    gsap.from(".contact-hero__video", {
      autoAlpha: 0,
      scale: 1.025,
      duration: 1.1,
      ease: "power3.out",
    });

    gsap.from(".contact-hero-caption", {
      autoAlpha: 0,
      y: 24,
      duration: 0.72,
      delay: 0.35,
      ease: "power3.out",
    });

    const showPanel = () => {
      gsap.killTweensOf(".contact-set");
      gsap.fromTo(
        ".contact-set",
        { autoAlpha: 0, x: 46, scale: 0.98 },
        {
          autoAlpha: 1,
          x: 0,
          scale: 1,
          duration: 0.72,
          ease: "power3.out",
          overwrite: "auto",
          clearProps: "opacity,visibility,transform",
        },
      );
    };

    const observer = new MutationObserver(() => {
      if (document.body.classList.contains("is-contact-panel-minimized")) {
        gsap.killTweensOf(".contact-set");
        gsap.set(".contact-set", { clearProps: "opacity,visibility,transform" });
        return;
      }
      if (document.body.classList.contains("is-contact-panel-shown") && !document.body.classList.contains("is-contact-panel-minimized")) {
        showPanel();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    if (document.body.classList.contains("is-contact-panel-shown") && !document.body.classList.contains("is-contact-panel-minimized")) {
      showPanel();
    }

    const peek = document.querySelector(".contact-panel-peek");
    const minimizePanel = () => {
      if (!document.body.classList.contains("is-contact-panel-shown")) return;
      gsap.killTweensOf(".contact-set");
      panel.removeAttribute("style");
      document.body.classList.add("is-contact-panel-minimized");
      peek?.setAttribute("aria-expanded", "false");
    };

    stage.addEventListener("click", (event) => {
      if (!document.body.classList.contains("is-contact-panel-shown")) return;
      if (document.body.classList.contains("is-contact-panel-minimized")) return;
      if (event.target.closest(".contact-panel-peek, a, button")) return;
      event.stopImmediatePropagation();
      minimizePanel();
    }, true);
  }

  window.addEventListener("load", () => {
    initServicesDemo();
    initContactDemo();
    ScrollTrigger.refresh();
  });
})();
