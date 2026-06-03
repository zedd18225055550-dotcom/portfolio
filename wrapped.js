/* ============================================================
 * wrapped.js — Auto-generated from lu78-demo.html main <script>
 * Scoped to .home-wrapped section. All document.* queries
 * rewritten to WRAPPED_ROOT.* (the .home-wrapped element).
 * Source: lu78-demo.html line 990-1375.
 * ============================================================ */
(function () {
  const WRAPPED_ROOT = document.querySelector(".home-wrapped");
  if (!WRAPPED_ROOT) return; // home 之外的页面不执行

      (function labMenu() {
        const body = WRAPPED_ROOT;
        const trigger = WRAPPED_ROOT.querySelector(".explore");
        const menu = WRAPPED_ROOT.querySelector("#labMenu");
        const closeButton = WRAPPED_ROOT.querySelector(".lab-menu__close");
        if (!trigger || !menu || !closeButton) return;

        function setMenu(open) {
          body.classList.toggle("is-lab-menu-open", open);
          menu.setAttribute("aria-hidden", String(!open));
          trigger.setAttribute("aria-expanded", String(open));
        }

        trigger.addEventListener("click", () => {
          setMenu(!body.classList.contains("is-lab-menu-open"));
        });
        closeButton.addEventListener("click", () => setMenu(false));
        window.addEventListener("keydown", (event) => {
          if (event.key === "Escape") setMenu(false);
        });
      })();

      /* -----------------------------------------------------------
       *  COMPONENT 1 — Noteform Carousel (drag + snap + center-active)
       * ----------------------------------------------------------- */
      (function deckCarousel() {
        const track = WRAPPED_ROOT.querySelector("#deckTrack");
        const dotsHost = WRAPPED_ROOT.querySelector("#deckDots");
        if (!track || !dotsHost) return;

        // 原始卡片（基准）
        const originalCards = [...track.querySelectorAll(".deck-card")];
        const originalCount = originalCards.length;
        if (!originalCount) return;

        // 1) 克隆头尾各一份，做无缝循环：[clones-prev | originals | clones-next]
        // 当 scrollLeft 进入克隆区时，瞬间跳回原始区对应位置
        const clonesBefore = originalCards.map((c) => {
          const cl = c.cloneNode(true);
          cl.dataset.clone = "before";
          return cl;
        });
        const clonesAfter = originalCards.map((c) => {
          const cl = c.cloneNode(true);
          cl.dataset.clone = "after";
          return cl;
        });
        // 顺序插入：前克隆 → 原始 → 后克隆
        clonesBefore.forEach((cl) => track.insertBefore(cl, track.firstChild));
        clonesAfter.forEach((cl) => track.appendChild(cl));

        const allCards = [...track.querySelectorAll(".deck-card")];

        // 2) 生成 dots（仅基于原始卡片数量）
        const dots = originalCards.map((_, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.setAttribute("aria-label", `Go to card ${i + 1}`);
          b.addEventListener("click", () => {
            // 点击 dot 时跳到原始区对应卡片
            const target = allCards[originalCount + i];
            target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          });
          dotsHost.appendChild(b);
          return b;
        });

        // 3) is-active / near-left / near-right 由"距离 track 中心最近"的卡片决定
        let activeIdx = -1;
        function setActive(idx) {
          if (idx === activeIdx) return;
          activeIdx = idx;
          allCards.forEach((c, i) => {
            c.classList.toggle("is-active",     i === idx);
            c.classList.toggle("is-near-left",  i === idx - 1);
            c.classList.toggle("is-near-right", i === idx + 1);
          });
          // dot 仅显示原始区相对位置
          const dotIdx = ((idx - originalCount) % originalCount + originalCount) % originalCount;
          dots.forEach((d, i) => d.classList.toggle("is-active", i === dotIdx));
        }

        function pickActiveByCenter() {
          const trackRect = track.getBoundingClientRect();
          const trackCenter = trackRect.left + trackRect.width / 2;
          let best = -1;
          let bestDist = Infinity;
          allCards.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            const cardCenter = r.left + r.width / 2;
            const dist = Math.abs(cardCenter - trackCenter);
            if (dist < bestDist) { bestDist = dist; best = i; }
          });
          setActive(best);
        }

        // 4) 无缝循环：scrollLeft 进入前克隆区或后克隆区时，瞬间跳到对应原始区位置
        // 用原始区第一张和最后一张的中心 scrollLeft 作为"跳转锚点"
        function getCardScrollLeft(card) {
          // 让该 card 居中所需的 scrollLeft
          const trackRect = track.getBoundingClientRect();
          const r = card.getBoundingClientRect();
          const cardCenter = r.left + r.width / 2;
          const trackCenter = trackRect.left + trackRect.width / 2;
          return track.scrollLeft + (cardCenter - trackCenter);
        }

        function maybeWrap() {
          // 进入"前克隆区域"（即 activeIdx < originalCount）→ 跳到原始区对应卡
          // 进入"后克隆区域"（即 activeIdx >= originalCount * 2）→ 跳到原始区对应卡
          const trackRect = track.getBoundingClientRect();
          const trackCenter = trackRect.left + trackRect.width / 2;
          // 用最近的卡判断
          let nearestIdx = -1, nd = Infinity;
          allCards.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            const dist = Math.abs(r.left + r.width / 2 - trackCenter);
            if (dist < nd) { nd = dist; nearestIdx = i; }
          });
          if (nearestIdx < originalCount) {
            // 在前克隆区 → 跳到原始区对应位置
            const targetIdx = nearestIdx + originalCount;
            const targetLeft = getCardScrollLeft(allCards[targetIdx]);
            track.scrollTo({ left: targetLeft, behavior: "instant" });
          } else if (nearestIdx >= originalCount * 2) {
            const targetIdx = nearestIdx - originalCount;
            const targetLeft = getCardScrollLeft(allCards[targetIdx]);
            track.scrollTo({ left: targetLeft, behavior: "instant" });
          }
        }

        track.addEventListener("scroll", () => {
          window.requestAnimationFrame(pickActiveByCenter);
        }, { passive: true });
        window.addEventListener("resize", pickActiveByCenter);

        // 5) 鼠标拖动滑动（桌面）
        let isDown = false;
        let startX = 0;
        let startScroll = 0;
        let userInteracting = false;
        track.addEventListener("pointerdown", (e) => {
          if (e.pointerType === "touch") return;
          isDown = true;
          userInteracting = true;
          startX = e.clientX;
          startScroll = track.scrollLeft;
          track.classList.add("is-grabbing");
          track.setPointerCapture(e.pointerId);
        });
        track.addEventListener("pointermove", (e) => {
          if (!isDown) return;
          track.scrollLeft = startScroll - (e.clientX - startX);
        });
        const release = (e) => {
          if (!isDown) return;
          isDown = false;
          track.classList.remove("is-grabbing");
          try { track.releasePointerCapture(e.pointerId); } catch (_) {}
          // 拖动结束后吸附到最近卡片 + 检查是否需要无缝跳转
          const trackRect = track.getBoundingClientRect();
          const trackCenter = trackRect.left + trackRect.width / 2;
          let best = allCards[0], bestDist = Infinity;
          allCards.forEach((c) => {
            const r = c.getBoundingClientRect();
            const dist = Math.abs(r.left + r.width / 2 - trackCenter);
            if (dist < bestDist) { bestDist = dist; best = c; }
          });
          best.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          setTimeout(() => {
            maybeWrap();
            userInteracting = false;
          }, 600);
        };
        track.addEventListener("pointerup", release);
        track.addEventListener("pointercancel", release);
        track.addEventListener("pointerleave", release);

        // 6) 触控板横滑：用户操作时暂停自动滚动
        track.addEventListener("wheel", () => {
          userInteracting = true;
          clearTimeout(track._wheelTimer);
          track._wheelTimer = setTimeout(() => {
            userInteracting = false;
            maybeWrap();
          }, 800);
        }, { passive: true });

        // 7) Hover 暂停自动滚动
        let isHovering = false;
        track.addEventListener("pointerenter", () => { isHovering = true; });
        track.addEventListener("pointerleave", () => { isHovering = false; });
        // 鼠标 hover 在卡片上时也暂停（pointerenter 已覆盖，但卡片单独再保险）
        allCards.forEach((c) => {
          c.addEventListener("mouseenter", () => { isHovering = true; });
        });

        // 8) 自动丝滑左滑（核心需求）
        // 用 rAF 推 scrollLeft += speed/frame；hover 或 drag 时暂停
        // 90px/秒 — 产品轮播常用的"看得清又不拖泥带水"的丝滑节奏
        // 参考：Apple 官网 / Stripe / Linear 的 hero 轮播速度区间 80~110px/s
        const SPEED_PX_PER_SEC = 90;
        let lastT = performance.now();
        function autoTick(now) {
          const dt = Math.min(0.064, (now - lastT) / 1000);
          lastT = now;
          if (!isHovering && !isDown && !userInteracting) {
            track.scrollLeft += SPEED_PX_PER_SEC * dt;
            // 每帧检查一次循环锚点
            // 若进入后克隆区 → 跳回原始区相同视觉位置
            const trackRect = track.getBoundingClientRect();
            const trackCenter = trackRect.left + trackRect.width / 2;
            let nearestIdx = -1, nd = Infinity;
            allCards.forEach((c, i) => {
              const r = c.getBoundingClientRect();
              const dist = Math.abs(r.left + r.width / 2 - trackCenter);
              if (dist < nd) { nd = dist; nearestIdx = i; }
            });
            // 触发左跳的边界：进入了"后克隆区域"末端
            if (nearestIdx >= originalCount * 2) {
              const targetIdx = nearestIdx - originalCount;
              const targetLeft = getCardScrollLeft(allCards[targetIdx]);
              track.scrollTo({ left: targetLeft, behavior: "instant" });
            }
            // 用户向左拖动可能让位置进入前克隆区
            else if (nearestIdx < originalCount) {
              const targetIdx = nearestIdx + originalCount;
              const targetLeft = getCardScrollLeft(allCards[targetIdx]);
              track.scrollTo({ left: targetLeft, behavior: "instant" });
            }
          }
          window.requestAnimationFrame(autoTick);
        }

        // 9) 初始：滚到原始区第一张居中
        requestAnimationFrame(() => {
          const firstOriginal = allCards[originalCount];
          firstOriginal.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
          pickActiveByCenter();
          window.requestAnimationFrame((t) => { lastT = t; autoTick(t); });
        });
      })();

      /* -----------------------------------------------------------
       *  COMPONENT 2 — Parallax (scroll + mouse)
       * ----------------------------------------------------------- */
      (function parallax() {
        const wraps = WRAPPED_ROOT.querySelectorAll(".parallax");
        if (!wraps.length) return;
        const items = [];
        wraps.forEach((w) => {
          const layers = [...w.querySelectorAll("[data-speed]")];
          const hotDots = [...w.querySelectorAll(".parallax__hud-dot")];
          const mouse = { x: 0, y: 0, target: { x: 0, y: 0 } };
          const setDotHeat = (x, y) => {
            for (const dot of hotDots) {
              const d = dot.getBoundingClientRect();
              const cx = d.left + d.width / 2;
              const cy = d.top + d.height / 2;
              const heat = Math.max(0, 1 - Math.hypot(x - cx, y - cy) / 220);
              dot.style.setProperty("--hud-heat", heat.toFixed(3));
            }
          };
          const resetDotHeat = () => {
            for (const dot of hotDots) dot.style.setProperty("--hud-heat", "0");
          };
          items.push({ wrap: w, layers, mouse });
          w.addEventListener("mousemove", (e) => {
            const r = w.getBoundingClientRect();
            mouse.target.x = ((e.clientX - r.left) / r.width  - 0.5) * 2; // -1..1
            mouse.target.y = ((e.clientY - r.top)  / r.height - 0.5) * 2;
            setDotHeat(e.clientX, e.clientY);
          }, { passive: true });
          w.addEventListener("mouseleave", () => {
            mouse.target.x = 0;
            mouse.target.y = 0;
            resetDotHeat();
          });
        });

        let running = false;
        function tick() {
          running = false;
          const vh = window.innerHeight;
          for (const { wrap, layers, mouse } of items) {
            const rect = wrap.getBoundingClientRect();
            const progress = 1 - (rect.top + rect.height) / (vh + rect.height);
            const centered = (progress - 0.5) * 2;
            // ease mouse toward target
            mouse.x += (mouse.target.x - mouse.x) * 0.12;
            mouse.y += (mouse.target.y - mouse.y) * 0.12;
            for (const l of layers) {
              const speed = parseFloat(l.dataset.speed || "0");
              const mAmp  = parseFloat(l.dataset.mouse || "0");
              const ty = centered * speed * vh;
              const mx = mouse.x * mAmp;
              const my = mouse.y * mAmp;
              l.style.transform = `translate3d(${mx.toFixed(2)}px, ${(ty + my).toFixed(2)}px, 0)`;
            }
          }
          schedule();
        }
        function schedule() {
          if (running) return;
          running = true;
          window.requestAnimationFrame(tick);
        }
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        // continuous loop for mouse easing
        function pump() { schedule(); window.requestAnimationFrame(pump); }
        pump();
      })();

      /* -----------------------------------------------------------
       *  COMPONENT 3 — Page transition (spring)
       * ----------------------------------------------------------- */
      (function pageRouter() {
        // 03 解释块已删除，仅保留切页 sweep + 整页 spring 离/入场动画
        const links = WRAPPED_ROOT.querySelectorAll("[data-route]");
        const mask = WRAPPED_ROOT.querySelector("#routerMask");
        const main = WRAPPED_ROOT.querySelector("#page");
        if (!main) return;

        function setActive(route) {
          links.forEach((a) => a.classList.toggle("is-active", a.dataset.route === route));
        }
        function trigger(route) {
          setActive(route);
          main.classList.add("is-leaving");
          if (mask) mask.classList.add("is-on");
          window.setTimeout(() => {
            main.classList.remove("is-leaving");
            main.classList.add("is-entering");
            main.getBoundingClientRect();
            window.requestAnimationFrame(() => {
              main.classList.remove("is-entering");
              if (mask) mask.classList.remove("is-on");
            });
          }, 380);
        }

        links.forEach((a) => {
          a.addEventListener("click", (e) => {
            const target = a.dataset.route;
            e.preventDefault();
            history.replaceState(null, "", "#" + target);
            if (target === "hero") {
              setActive("hero");
              WRAPPED_ROOT.querySelector("#wrapped-hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
              return;
            }
            trigger(target);
          });
        });
      })();

      /* -----------------------------------------------------------
       *  COMPONENT 4 — Storyboard drag rail
       * ----------------------------------------------------------- */
      (function marquee() {
        const track = WRAPPED_ROOT.querySelector("#marqueeTrack");
        if (!track) return;
        const scroller = track.closest(".marquee-col");
        if (!scroller) return;
        const shell = scroller.closest(".storyboard-rail-shell");
        // Tangyuan storyboard frames in filename order.
        const items = [
          { img: "./assets/tangyuan_storyboard_21x9/frame_01.png", label: "frame 01 · tangyuan" },
          { img: "./assets/tangyuan_storyboard_21x9/frame_02.png", label: "frame 02 · tangyuan" },
          { img: "./assets/tangyuan_storyboard_21x9/frame_03.png", label: "frame 03 · tangyuan" },
          { img: "./assets/tangyuan_storyboard_21x9/frame_04.png", label: "frame 04 · tangyuan" },
          { img: "./assets/tangyuan_storyboard_21x9/frame_05.png", label: "frame 05 · tangyuan" },
          { img: "./assets/tangyuan_storyboard_21x9/frame_06.png", label: "frame 06 · tangyuan" },
          { img: "./assets/tangyuan_storyboard_21x9/frame_07.png", label: "frame 07 · tangyuan" },
          { img: "./assets/tangyuan_storyboard_21x9/frame_08.png", label: "frame 08 · tangyuan" },
          { img: "./assets/tangyuan_storyboard_21x9/frame_09.png", label: "frame 09 · tangyuan" },
        ];
        const html = items.map((it) =>
          `<div class="marquee-card" style="background-image:url('${it.img}'); background-size:cover; background-position:center;"><div class="meta">${it.label}</div></div>`
        );
        track.innerHTML = html.join("");
        scroller.tabIndex = 0;
        let startX = 0;
        let startScroll = 0;
        let dragging = false;
        scroller.addEventListener("pointerdown", (event) => {
          dragging = true;
          startX = event.clientX;
          startScroll = scroller.scrollLeft;
          scroller.classList.add("is-dragging");
          shell?.classList.add("is-dragging");
          scroller.setPointerCapture(event.pointerId);
        });
        scroller.addEventListener("pointermove", (event) => {
          if (!dragging) return;
          scroller.scrollLeft = startScroll - (event.clientX - startX);
        });
        const stopDrag = (event) => {
          if (!dragging) return;
          dragging = false;
          scroller.classList.remove("is-dragging");
          shell?.classList.remove("is-dragging");
          if (event && scroller.hasPointerCapture(event.pointerId)) {
            scroller.releasePointerCapture(event.pointerId);
          }
        };
        scroller.addEventListener("pointerup", stopDrag);
        scroller.addEventListener("pointercancel", stopDrag);
        scroller.addEventListener("pointerleave", stopDrag);
        scroller.addEventListener("wheel", (event) => {
          const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
          if (!delta) return;
          const maxScroll = scroller.scrollWidth - scroller.clientWidth;
          const next = Math.max(0, Math.min(maxScroll, scroller.scrollLeft + delta));
          if (next === scroller.scrollLeft) return;
          event.preventDefault();
          scroller.scrollLeft = next;
        }, { passive: false });
        scroller.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const direction = event.key === "ArrowRight" ? 1 : -1;
          scroller.scrollBy({ left: direction * scroller.clientWidth * 0.72, behavior: "smooth" });
        });
      })();

      /* -----------------------------------------------------------
       *  COMPONENT 5 — Bouncy title (split chars)
       * ----------------------------------------------------------- */
      (function bouncyTitle() {
        const t = WRAPPED_ROOT.querySelector("#bouncyTitle");
        if (!t) return;
        const text = t.textContent;
        const colors = ["lime", "white", "pink", "cyan", "white", "lime", "pink", "white", "cyan", "white", "white", "lime", "lime"];
        t.innerHTML = "";
        let idx = 0;
        for (const ch of text) {
          if (ch === " ") {
            t.appendChild(document.createTextNode("\u00A0\u00A0"));
            idx++;
            continue;
          }
          const span = document.createElement("span");
          span.className = "ch";
          span.dataset.color = colors[idx % colors.length];
          span.textContent = ch;
          t.appendChild(span);
          idx++;
        }
      })();
    
})();
