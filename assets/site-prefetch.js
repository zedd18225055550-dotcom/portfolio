(function () {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
  if (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || "")) return;

  const routes = {
    "/": [
      ["document", "./home.html?skipIntro=1"],
      ["image", "./assets/marathon/index-hero-marathon-cny.png"]
    ],
    "/index.html": [
      ["document", "./home.html?skipIntro=1"],
      ["image", "./assets/marathon/index-hero-marathon-cny.png"]
    ],
    "/home.html": [
      ["document", "./projects.html?skipIntro=1"],
      ["image", "./assets/marathon/projects-hero-marathon-bg-clean.png"]
    ],
    "/projects.html": [
      ["document", "./project.html?project=summer-gala-2026"],
      ["image", "./assets/projects/summer-gala-2026/fengmian.png"]
    ],
    "/project.html": [],
    "/works.html": [
      ["document", "./projects.html?skipIntro=1"],
      ["image", "./assets/marathon/projects-hero-marathon-bg-clean.png"]
    ],
    "/about.html": [
      ["document", "./services.html"]
    ],
    "/services.html": [
      ["document", "./contact.html?skipIntro=1"],
      ["image", "./assets/marathon/contact-hero-marathon-bg.png"]
    ],
    "/contact.html": [
      ["document", "./home.html?skipIntro=1"],
      ["image", "./assets/marathon/index-hero-marathon-cny.png"]
    ]
  };

  const seen = new Set();
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const targets = routes[pathname] || [];
  const idle = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 1800));

  function addPrefetch(as, href) {
    if (!href || seen.has(href) || document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
    seen.add(href);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.as = as;
    if (as === "font") {
      link.type = "font/woff2";
      link.crossOrigin = "anonymous";
    }
    document.head.appendChild(link);
  }

  window.addEventListener("load", () => {
    idle(() => {
      addPrefetch("font", "./assets/fonts/SmileySans-Oblique-2.woff2");
      targets.forEach(([as, href]) => addPrefetch(as, href));
    }, { timeout: 5000 });
  }, { once: true });
})();
