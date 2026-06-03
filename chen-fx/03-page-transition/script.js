/* =============================================================
 *  CHEN-FX · 03 Page Transition · script · v2.1
 *  Spring page transition (MPA-first, SPA-compatible)
 *
 *  使用：
 *    <body class="chen-page">
 *    <link rel="stylesheet" href="chen-fx/03-page-transition/style.css">
 *    <script src="chen-fx/03-page-transition/script.js"></script>
 *
 *  自动行为：
 *    - 拦截所有同源 <a> 点击（除 [target=_blank] / 锚点 / data-no-transition）
 *    - 当前页：加 .is-leaving + 触发 .chen-page-sweep.is-on
 *    - 等 LEAVE_DURATION ms 后真正跳转 location.href
 *    - 新页加载完：自动加 .is-entering，下一帧移除（触发 q 弹动画）
 *    - 也兼容 SPA：监听 popstate/hashchange 不做事，但导出 chenFx.go(url)
 *
 *  v2.1 新增：MPA 切页白闪修复
 *    [问题] MPA 跨页瞬间，旧 doc 销毁、新 doc 还没 paint，浏览器显示 <html> 默认白底
 *    [Fix1] 把当前页 body 计算后的背景色实时镜像到 <html> 上
 *    [Fix2] 跳转前把背景色写进 sessionStorage，新页 boot 立刻读取并贴到 <html>
 *    [Fix3] 跳转前把页面 backgroundColor 改成"上一页色"避免短暂白底
 * ============================================================= */

(function () {
  "use strict";

  // ---------- config ----------
  var LEAVE_DURATION = 380;   // ms · 与 CSS --chen-page-duration-out 大致对齐
  var SWEEP_DELAY    = 60;    // ms · 扫光比 leave 略晚开始
  var ENTER_FRAMES   = 2;     // 入场前空帧数
  var SS_KEY         = "chen-page-bg"; // sessionStorage key
  var SS_INK_KEY     = "chen-page-ink"; // 文字色（避免文字闪白）

  // ---------- 跨页背景接力（关键防白闪） ----------
  /*  MPA 切页时，浏览器在销毁旧 document 和绘制新 document 之间会有一段
   *  "paint hold"（典型 30-150ms），期间页面只剩 <html> 元素的背景色 —
   *  默认是白。这就是用户看到的"啪一下白闪"。
   *
   *  修复策略：把当前 body 的计算背景色镜像到 <html> 上。这样即使 paint hold
   *  期间所有正文都没了，<html> 还是当前页色，肉眼不再有色变。
   *
   *  额外：跳转前把这个色写进 sessionStorage，下一页 boot 第一刻就读取并贴到 <html>，
   *  在新页 styles.css 加载完之前先用上一页色顶住，新页 paint 出来后无缝接管。
   */
  function readBodyBg() {
    try {
      var cs = window.getComputedStyle(document.body);
      var bg = cs.backgroundColor;
      // body 是透明的话，往上找 .chen-page 或者 :root
      if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") {
        bg = window.getComputedStyle(document.documentElement).backgroundColor;
      }
      var ink = cs.color || "";
      return { bg: bg, ink: ink };
    } catch (e) {
      return { bg: "", ink: "" };
    }
  }

  function syncHtmlBg() {
    var st = readBodyBg();
    if (st.bg && st.bg !== "rgba(0, 0, 0, 0)" && st.bg !== "transparent") {
      document.documentElement.style.backgroundColor = st.bg;
    }
    return st;
  }

  function applyIncomingBg() {
    // 新页 boot 第一帧：从 sessionStorage 读取上一页色，立刻贴到 <html>
    // 这样在 styles.css 加载完之前，浏览器已经有合理底色，不再白闪。
    try {
      var bg = sessionStorage.getItem(SS_KEY);
      if (bg) {
        document.documentElement.style.backgroundColor = bg;
      }
      // 用完即清（如果不清，刷新页面会一直保留）
      sessionStorage.removeItem(SS_KEY);
      sessionStorage.removeItem(SS_INK_KEY);
    } catch (e) {}
  }

  function persistBgForNextPage() {
    var st = readBodyBg();
    try {
      if (st.bg) sessionStorage.setItem(SS_KEY, st.bg);
      if (st.ink) sessionStorage.setItem(SS_INK_KEY, st.ink);
    } catch (e) {}
  }

  // ---------- bootstrap sweep mask ----------
  function ensureSweep() {
    var s = document.querySelector(".chen-page-sweep");
    if (!s) {
      s = document.createElement("div");
      s.className = "chen-page-sweep";
      document.body.appendChild(s);
    }
    return s;
  }

  // ---------- entering animation on initial load ----------
  function playEnter() {
    var page = document.querySelector(".chen-page");
    if (!page) return;
    page.classList.add("is-entering");
    // 强制 reflow 让起始态先生效
    page.getBoundingClientRect();
    // 下两帧后移除 → 触发 transition 到默认态
    var i = 0;
    function step() {
      if (++i < ENTER_FRAMES) {
        requestAnimationFrame(step);
        return;
      }
      page.classList.remove("is-entering");
    }
    requestAnimationFrame(step);
  }

  // ---------- leave & navigate ----------
  function leaveAndNavigate(href, replace) {
    var page = document.querySelector(".chen-page");
    var sweep = ensureSweep();
    // 关键：跳转前把当前 bg 镜像到 <html> 并写进 sessionStorage
    syncHtmlBg();
    persistBgForNextPage();
    if (page) page.classList.add("is-leaving");
    setTimeout(function () { sweep.classList.add("is-on"); }, SWEEP_DELAY);
    setTimeout(function () {
      if (replace) location.replace(href);
      else location.href = href;
    }, LEAVE_DURATION);
  }

  // ---------- link interception ----------
  function isInternal(a) {
    if (!a || !a.getAttribute) return false;
    if (a.target && a.target !== "" && a.target !== "_self") return false;
    if (a.hasAttribute("data-no-transition")) return false;
    if (a.hasAttribute("download")) return false;
    var href = a.getAttribute("href");
    if (!href) return false;
    if (href.charAt(0) === "#") return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return false; }
    if (url.origin !== location.origin) return false;
    // 同页且只有 hash 不同 → 不拦截
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
    return true;
  }

  function onClick(e) {
    if (e.defaultPrevented) return;
    // 修饰键打开新标签 → 不拦
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || !isInternal(a)) return;
    e.preventDefault();
    leaveAndNavigate(a.href, false);
  }

  // ---------- 早期 boot：在 DOM 还没解析完就贴 <html> 背景 ----------
  /*  本脚本即使被放在 <body> 末尾，也能在 styles.css 之前赶上贴 <html> 色，
   *  因为 sessionStorage 同步读取，没有网络延迟。
   *  推荐做法：把本脚本放进 <head> 末尾（不加 defer 不加 async），
   *  那样切页瞬间几乎不再有任何白闪。
   */
  applyIncomingBg();

  function init() {
    document.addEventListener("click", onClick, false);
    // pageshow 兼容浏览器后退（bfcache）：再次播放入场
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) {
        applyIncomingBg();
        playEnter();
      }
    });
    // 同步一次 <html> bg（覆盖 boot 时还没 styles.css 的情况）
    syncHtmlBg();
    playEnter();
  }

  // ---------- public API ----------
  window.chenFx = window.chenFx || {};
  window.chenFx.go = function (href, replace) { leaveAndNavigate(href, !!replace); };
  window.chenFx.playEnter = playEnter;
  window.chenFx.syncHtmlBg = syncHtmlBg;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
