(() => {
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  class IpLoaderFx {
    constructor(loader, options = {}) {
      this.loader = loader;
      this.running = false;
      this.options = {
        autoStart: loader.dataset.autoStart !== "false",
        mode: loader.dataset.ipLoaderMode || "full",
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ...options,
      };
      this.body = document.body;
      this.replayButtons = [...document.querySelectorAll("[data-ip-loader-replay]")];
      this.loader.dataset.ipLoaderReady = "true";
      this.loader.__ipLoaderFx = this;
      this.bind();
      this.loader.dispatchEvent(new CustomEvent("ip-loader:ready", { bubbles: true }));
      if (this.options.autoStart) this.start();
    }

    bind() {
      this.replayButtons.forEach((button) => {
        button.addEventListener("click", () => this.start({ replay: true }));
      });
      this.loader.addEventListener("ip-loader:start", (event) => {
        this.start({
          mode: event.detail?.mode || this.options.mode,
          replay: Boolean(event.detail?.replay),
        });
      });
    }

    reset(mode = this.options.mode) {
      this.body.classList.add("is-ip-loading");
      this.body.classList.remove("is-ip-ready");
      this.loader.hidden = false;
      this.loader.classList.remove("is-awake", "is-love", "is-zoom", "is-flash", "is-complete", "is-full", "is-transition");
      this.loader.classList.add(`is-${mode}`);
    }

    async start({ replay = false, mode = this.options.mode } = {}) {
      if (this.running) return;
      this.running = true;
      this.reset(mode);

      if (this.options.reduced) {
        await wait(replay ? 60 : 120);
        this.complete();
        return;
      }

      if (mode === "transition") {
        await wait(replay ? 40 : 80);
        this.loader.classList.add("is-flash");

        await wait(1040);
        this.complete();
        return;
      }

      await wait(replay ? 90 : 220);
      this.loader.classList.add("is-awake");

      await wait(560);
      this.loader.classList.add("is-love");

      await wait(360);
      this.loader.classList.add("is-zoom");

      await wait(220);
      this.loader.classList.add("is-flash");

      await wait(1180);
      this.complete();
    }

    complete() {
      this.running = false;
      this.body.classList.remove("is-ip-loading");
      this.body.classList.add("is-ip-ready");
      this.loader.classList.add("is-complete");
      this.loader.dispatchEvent(new CustomEvent("ip-loader:complete", { bubbles: true }));
      window.setTimeout(() => {
        if (this.loader.classList.contains("is-complete")) this.loader.hidden = true;
      }, 560);
    }
  }

  window.ChennnIpLoader = IpLoaderFx;

  const initIpLoaders = () => {
    document.querySelectorAll("[data-ip-loader]").forEach((loader) => {
      if (loader.dataset.ipLoaderReady === "true" && loader.__ipLoaderFx) return;
      new IpLoaderFx(loader);
    });
  };

  initIpLoaders();
  window.addEventListener("DOMContentLoaded", initIpLoaders);
})();
