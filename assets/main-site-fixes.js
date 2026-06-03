(function () {
  "use strict";

  const routeSelector = "a[data-fx-link][href]";
  let isRouting = false;

  function ensureVeil() {
    let veil = document.querySelector(".fx-veil");
    if (!veil) {
      veil = document.createElement("div");
      veil.className = "fx-veil";
      document.body.appendChild(veil);
    }
    return veil;
  }

  function cleanNavigate(href) {
    if (!href || isRouting) return;
    isRouting = true;
    const veil = ensureVeil();
    const go = () => {
      window.location.href = href;
    };

    if (!window.gsap) {
      go();
      return;
    }

    window.gsap.killTweensOf(veil);
    veil.style.display = "";
    window.gsap.set(veil, { clipPath: "inset(100% 0 0 0)" });
    window.gsap.to(veil, {
      clipPath: "inset(0% 0 0 0)",
      duration: 0.62,
      ease: window.gsap.parseEase("fxVeil") ? "fxVeil" : "power3.inOut",
      onComplete: go,
    });
  }

  function isInternalLink(anchor) {
    if (!anchor || anchor.target && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download")) return false;
    if (anchor.hasAttribute("data-no-transition")) return false;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#")) return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch {
      return false;
    }
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return false;
    return true;
  }

  function settleIncomingVeil() {
    const veil = ensureVeil();
    if (!window.gsap) {
      veil.style.clipPath = "inset(0% 0 100% 0)";
      return;
    }

    window.gsap.killTweensOf(veil);
    window.gsap.set(veil, { clipPath: "inset(0% 0 0 0)" });
    window.gsap.to(veil, {
      clipPath: "inset(0% 0 100% 0)",
      delay: 0.08,
      duration: 0.5,
      ease: window.gsap.parseEase("fxVeil") ? "fxVeil" : "power3.inOut",
    });
  }

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target.closest?.(routeSelector);
      if (!isInternalLink(anchor)) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      cleanNavigate(anchor.href);
    },
    true,
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      settleIncomingVeil();
    }, { once: true });
  } else {
    settleIncomingVeil();
  }
})();
