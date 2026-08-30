const WATCH_PATH = "/watch";
const GUIDE_WIDTH_PX = 240;
const GUIDE_GAP_PX = 16;
const RECOMMENDATIONS_WIDTH_PX = 400;
const STYLE_ID = "fix-youtube-guide-style";

let lastPath = window.location.pathname;
let listenersBound = false;
let sidebarOpen = isWatchPage();
let sidebarAutoCollapsed = false;
let lastSingleColumnState = null;
const MANAGED_ATTR = "data-fixyt-managed";
let lastLayoutKey = "";
let theaterObserver = null;

function isWatchPage() {
  return window.location.pathname === WATCH_PATH;
}

function isSingleColumnLayout() {
  const watchFlexy = document.querySelector("ytd-watch-flexy");
  return !!watchFlexy && watchFlexy.hasAttribute("is-single-column");
}

function isSidebarVisible() {
  return sidebarOpen && !sidebarAutoCollapsed;
}

function updateResponsiveSidebarState() {
  if (!isWatchPage()) {
    sidebarAutoCollapsed = false;
    lastSingleColumnState = null;
    return;
  }

  const singleColumn = isSingleColumnLayout();
  if (lastSingleColumnState === null || singleColumn !== lastSingleColumnState) {
    sidebarAutoCollapsed = singleColumn;
    lastSingleColumnState = singleColumn;
  }
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
    html[data-fixyt-watch="1"] {
      --fixyt-guide-width: ${GUIDE_WIDTH_PX}px;
      --fixyt-gap: ${GUIDE_GAP_PX}px;
      --fixyt-page-offset: calc(var(--fixyt-guide-width) + var(--fixyt-gap));
      --fixyt-panel-width: min(${RECOMMENDATIONS_WIDTH_PX}px, 30vw);
    }

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
      width: var(--fixyt-guide-width) !important;
      min-width: 0 !important;
      left: 0 !important;
      overflow: hidden !important;
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
      box-sizing: border-box !important;
      width: var(--fixyt-guide-width) !important;
      min-width: 0 !important;
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
      margin-left: var(--fixyt-page-offset) !important;
      width: max(0px, calc(100% - var(--fixyt-page-offset))) !important;
      max-width: none !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #columns {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      margin: 0 !important;
      justify-content: flex-start !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy {
      --ytd-watch-flexy-width-ratio: 16 !important;
      --ytd-watch-flexy-height-ratio: 9 !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #primary {
      box-sizing: border-box !important;
      width: auto !important;
      min-width: 0 !important;
      margin-left: 0 !important;
      margin-right: auto !important;
      max-width: none !important;
      padding-right: var(--fixyt-gap) !important;
      flex: 1 1 0% !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #primary-inner {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #player,
    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #player-container-outer,
    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #player-container-inner {
      width: 100% !important;
      min-width: 0 !important;
      max-width: var(--ytd-watch-flexy-max-player-width) !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #player {
      margin-inline: auto !important;
      background: #000 !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #movie_player .html5-video-container {
      width: 100% !important;
      height: 100% !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #movie_player video.html5-main-video {
      width: 100% !important;
      height: 100% !important;
      left: 0 !important;
      top: 0 !important;
      object-fit: contain !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy:not([split-scroll][fixed-panel-expanded]):not([split-scroll][fixed-panel-watch-next]) #secondary {
      width: var(--fixyt-panel-width) !important;
      min-width: 0 !important;
      max-width: var(--fixyt-panel-width) !important;
      margin-left: var(--fixyt-gap) !important;
      flex: 0 1 var(--fixyt-panel-width) !important;
      overflow: hidden !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary ytd-compact-video-renderer,
    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary ytd-compact-radio-renderer,
    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary ytd-compact-playlist-renderer {
      max-width: var(--fixyt-panel-width) !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary #thumbnail,
    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy #secondary a#thumbnail {
      max-width: min(168px, 100%) !important;
      width: min(168px, 100%) !important;
      min-width: 0 !important;
    }

    html[data-fixyt-watch="1"][data-fixyt-sidebar-open="1"]:not([data-fixyt-theater="1"]):not([data-fixyt-fullscreen="1"]) ytd-watch-flexy[split-scroll]:is([fixed-panel-expanded], [fixed-panel-watch-next]) #primary {
      width: max(0px, calc(100vw - var(--ytd-watch-flexy-scrollbar-width, 15px) - var(--fixyt-gap) - var(--ytd-watch-flexy-sidebar-width, 400px) - var(--fixyt-page-offset))) !important;
      flex: 0 0 auto !important;
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

  if (isWatchPage() && isSidebarVisible() && !isTheaterMode() && !isFullscreenMode()) {
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
    watchPage && isSidebarVisible() ? "1" : "0"
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
    sidebarAutoCollapsed = false;
    lastSingleColumnState = null;
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

    if (sidebarAutoCollapsed) {
      sidebarOpen = true;
      sidebarAutoCollapsed = false;
    } else {
      sidebarOpen = !sidebarOpen;
    }
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
      attributeFilter: ["theater", "theater-requested_", "is-single-column", "is-two-columns_"]
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
  updateResponsiveSidebarState();
  updateFlags();
  applyGuideState();

  const layoutKey = [
    isWatchPage() ? "watch" : "other",
    isSidebarVisible() ? "open" : "closed",
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
