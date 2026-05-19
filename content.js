const WATCH_PATH = "/watch";
const GUIDE_WIDTH_PX = 240;
const GUIDE_GAP_PX = 16;
const RECOMMENDATIONS_WIDTH_PX = 400;
const STYLE_ID = "fix-youtube-guide-style";

let lastPath = window.location.pathname;
let listenersBound = false;
let sidebarOpen = isWatchPage();
const MANAGED_ATTR = "data-fixyt-managed";
let lastLayoutKey = "";
let theaterObserver = null;

function isWatchPage() {
  return window.location.pathname === WATCH_PATH;
}

function isTheaterMode() {
  const watchFlexy = document.querySelector("ytd-watch-flexy");
  if (watchFlexy) {
    if (watchFlexy.hasAttribute("theater") || watchFlexy.hasAttribute("theater-requested_")) {
      return true;
    }
  }

  const pageManager = document.getElementById("page-manager");
  if (pageManager && pageManager.classList.contains("theater")) {
    return true;
  }

  const moviePlayer = document.getElementById("movie_player");
  if (moviePlayer && moviePlayer.classList.contains("ytp-size-large")) {
    return true;
  }

  return false;
}

function isFullscreenMode() {
  return !!document.fullscreenElement;
}

function getGuideButton() {
  return document.getElementById("guide-button");
}

function ensureStyleTag() {
  let style = document.getElementById(STYLE_ID);
  if (style) {
    return style;
  }

  style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html[data-fixyt-watch="1"] #page-manager,
    html[data-fixyt-watch="1"] ytd-watch-flexy,
    html[data-fixyt-watch="1"] ytd-watch-flexy #columns,
    html[data-fixyt-watch="1"] ytd-watch-flexy #primary,
    html[data-fixyt-watch="1"] ytd-watch-flexy #primary-inner,
    html[data-fixyt-watch="1"] ytd-watch-flexy #secondary,
    html[data-fixyt-watch="1"] ytd-watch-flexy #player-container-outer {
      transition: none !important;
    }

    html[data-fixyt-watch="1"] tp-yt-app-drawer #scrim,
    html[data-fixyt-watch="1"] tp-yt-iron-overlay-backdrop {
      display: none !important;
    }

    html[data-fixyt-watch="1"] tp-yt-app-drawer {
      background: transparent !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) tp-yt-app-drawer {
      transform: none !important;
      visibility: visible !important;
      pointer-events: none !important;
      width: ${GUIDE_WIDTH_PX}px !important;
      min-width: ${GUIDE_WIDTH_PX}px !important;
      left: 0 !important;
      z-index: 2100 !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="0"] tp-yt-app-drawer,
    html[data-fixyt-watch="1"][data-fixyt-fullscreen="1"] tp-yt-app-drawer {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      pointer-events: none !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) #guide {
      display: block !important;
      position: fixed !important;
      left: 0 !important;
      width: ${GUIDE_WIDTH_PX}px !important;
      transform: none !important;
      visibility: visible !important;
      pointer-events: auto !important;
      background: var(--yt-spec-base-background, #0f0f0f) !important;
      border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
      overflow: hidden !important;
      z-index: 2100 !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="0"] #guide {
      display: none !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-mini-guide-renderer {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="0"] ytd-mini-guide-renderer {
      display: block !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) #page-manager.ytd-app {
      box-sizing: border-box !important;
      margin-left: ${GUIDE_WIDTH_PX + GUIDE_GAP_PX}px !important;
      width: calc(100% - ${GUIDE_WIDTH_PX + GUIDE_GAP_PX}px) !important;
      max-width: none !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #columns {
      max-width: none !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #primary-inner,
    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #primary {
      margin-left: 0 !important;
      margin-right: auto !important;
      max-width: none !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary {
      width: ${RECOMMENDATIONS_WIDTH_PX}px !important;
      min-width: ${RECOMMENDATIONS_WIDTH_PX}px !important;
      max-width: ${RECOMMENDATIONS_WIDTH_PX}px !important;
      margin-left: 16px !important;
      flex: 0 0 ${RECOMMENDATIONS_WIDTH_PX}px !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary ytd-compact-video-renderer,
    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary ytd-compact-radio-renderer,
    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary ytd-compact-playlist-renderer {
      max-width: ${RECOMMENDATIONS_WIDTH_PX}px !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary #thumbnail,
    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary a#thumbnail {
      max-width: 168px !important;
      width: 168px !important;
      min-width: 168px !important;
    }

    @media (max-width: 1312px) {
      html[data-fixyt-watch="1"] #guide {
        width: 220px !important;
      }

      html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) #page-manager.ytd-app {
        margin-left: 0 !important;
        width: 100% !important;
      }

      html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #columns {
        width: auto !important;
        margin-left: 0 !important;
      }

      html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary {
        width: auto !important;
        min-width: 0 !important;
        max-width: none !important;
        margin-left: 0 !important;
        flex: 1 1 auto !important;
      }

      html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary #thumbnail,
      html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary a#thumbnail {
        width: auto !important;
        min-width: 0 !important;
        max-width: none !important;
      }

      html[data-fixyt-watch="1"] ytd-watch-flexy #columns {
        max-width: none !important;
      }
    }
  `;

  document.documentElement.appendChild(style);
  return style;
}

function applyGuideState() {
  const app = document.querySelector("ytd-app");
  const drawer = document.querySelector("tp-yt-app-drawer");
  const guide = document.getElementById("guide");
  if (!app) {
    return;
  }

  if (isWatchPage() && sidebarOpen && !isTheaterMode() && !isFullscreenMode()) {
    app.setAttribute("guide-persistent-and-visible", "");
    app.setAttribute(MANAGED_ATTR, "1");
    if (drawer) {
      drawer.style.setProperty("display", "block", "important");
      drawer.removeAttribute("opened");
      drawer.setAttribute("persistent", "");
      drawer.style.setProperty("visibility", "visible", "important");
      drawer.setAttribute(MANAGED_ATTR, "1");
    }
    if (guide) {
      guide.removeAttribute("hidden");
      guide.setAttribute("opened", "");
      guide.setAttribute("persistent", "");
      guide.style.setProperty("display", "block", "important");
      guide.setAttribute(MANAGED_ATTR, "1");
    }
    return;
  }

  if (app.hasAttribute(MANAGED_ATTR)) {
    app.removeAttribute("guide-persistent-and-visible");
    app.removeAttribute(MANAGED_ATTR);
  }

  if (drawer && drawer.hasAttribute(MANAGED_ATTR)) {
    drawer.style.removeProperty("display");
    drawer.removeAttribute("persistent");
    drawer.removeAttribute("opened");
    drawer.style.removeProperty("visibility");
    drawer.removeAttribute(MANAGED_ATTR);
  }

  if (guide && guide.hasAttribute(MANAGED_ATTR)) {
    guide.removeAttribute("opened");
    guide.removeAttribute("persistent");
    guide.style.removeProperty("display");
    guide.removeAttribute("hidden");
    guide.removeAttribute(MANAGED_ATTR);
  }
}

function updateFlags() {
  const watchPage = isWatchPage();
  const theaterMode = watchPage && isTheaterMode();
  const fullscreenMode = watchPage && isFullscreenMode();
  document.documentElement.setAttribute("data-fixyt-watch", watchPage ? "1" : "0");
  document.documentElement.setAttribute(
    "data-fixyt-sidebar-open",
    watchPage && sidebarOpen ? "1" : "0"
  );
  document.documentElement.setAttribute("data-fixyt-theater", theaterMode ? "1" : "0");
  document.documentElement.setAttribute("data-fixyt-fullscreen", fullscreenMode ? "1" : "0");
}

function maybeResetNavigationState() {
  const currentPath = window.location.pathname;
  if (currentPath === lastPath) {
    return;
  }

  lastPath = currentPath;
  if (isWatchPage()) {
    sidebarOpen = true;
  }
}

function bindListeners() {
  if (listenersBound) {
    return;
  }

  document.addEventListener("click", (event) => {
    if (!event.isTrusted) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest("#guide-button");
    if (!button || !isWatchPage()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }

    sidebarOpen = !sidebarOpen;
    sync();
  }, true);

  const navigationEvents = [
    "yt-navigate-finish",
    "yt-page-data-updated",
    "popstate",
    "resize",
    "fullscreenchange"
  ];

  for (const eventName of navigationEvents) {
    window.addEventListener(eventName, sync, { passive: true });
  }
  listenersBound = true;
}

function refreshLayout() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  });
}

function startTheaterObserver() {
  if (theaterObserver) {
    theaterObserver.disconnect();
  }

  const watchFlexy = document.querySelector("ytd-watch-flexy");
  const moviePlayer = document.getElementById("movie_player");
  if (!watchFlexy && !moviePlayer) {
    theaterObserver = null;
    return;
  }

  theaterObserver = new MutationObserver(() => {
    sync();
  });

  if (watchFlexy) {
    theaterObserver.observe(watchFlexy, {
      attributes: true,
      attributeFilter: ["theater", "theater-requested_"]
    });
  }

  if (moviePlayer) {
    theaterObserver.observe(moviePlayer, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }
}

function sync() {
  maybeResetNavigationState();
  ensureStyleTag();
  startTheaterObserver();
  updateFlags();
  applyGuideState();

  const layoutKey = [
    isWatchPage() ? "watch" : "other",
    sidebarOpen ? "open" : "closed",
    isTheaterMode() ? "theater" : "normal",
    isFullscreenMode() ? "fullscreen" : "windowed"
  ].join(":");

  if (layoutKey !== lastLayoutKey) {
    lastLayoutKey = layoutKey;
    refreshLayout();
  }
}

bindListeners();
sync();
