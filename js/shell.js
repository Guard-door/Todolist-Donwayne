/* ================================================================
   Shell — 模块加载、WiFi、离线横幅、Myday 侧边面板、PWA
   ================================================================ */

const APP_VERSION = '1.7.4';

/* ── 加载 Todo 模块 ───────────────────────────────────── */

function loadTodoModule() {
  fetch('modules/todo/index.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('app-content').innerHTML = html;
      const script = document.createElement('script');
      script.src = 'modules/todo/app.js';
      document.body.appendChild(script);
    })
    .catch(err => console.error('Todo 模块加载失败，请通过 http://localhost 访问:', err));
}

/* ── WiFi 图标（单一 SVG 动态绘制） ───────────────────── */

const topWifiIcon = document.getElementById('topWifiIcon');
const topSunBtn = document.getElementById('mydayToggle');

const WIFI_ONLINE = ''
  + '<svg class="top-wifi-icon online" viewBox="0 0 24 24" width="18" height="18">'
  + '<path d="M1 8.5C4.5 5 9 3 12 3s7.5 2 11 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>'
  + '<path d="M3.5 11C6 8.5 9 7 12 7s6 1.5 8.5 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>'
  + '<path d="M6.5 14C8 12.5 10 12 12 12s4 .5 5.5 2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>'
  + '<circle cx="12" cy="19" r="2" fill="currentColor"/>'
  + '</svg>';

const WIFI_OFFLINE = ''
  + '<svg class="top-wifi-icon offline" viewBox="0 0 24 24" width="18" height="18">'
  + '<path d="M1 8.5C4.5 5 9 3 12 3s7.5 2 11 5.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>'
  + '<path d="M3.5 11C6 8.5 9 7 12 7s6 1.5 8.5 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>'
  + '<path d="M6.5 14C8 12.5 10 12 12 12s4 .5 5.5 2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>'
  + '<circle cx="12" cy="19" r="2" fill="currentColor"/>'
  + '<line x1="4" y1="4" x2="20" y2="21" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
  + '</svg>';

function setWifiStatus(online) {
  topWifiIcon.innerHTML = online ? WIFI_ONLINE : WIFI_OFFLINE;
}

/* ── 离线横幅 ──────────────────────────────────────────── */

const offlineBanner = document.getElementById('offlineBanner');
const offlineMsg = document.getElementById('offlineMsg');

function showBanner(text, cls) {
  offlineBanner.className = 'offline-banner ' + cls;
  offlineMsg.textContent = text;
  offlineBanner.hidden = false;
  clearTimeout(offlineBanner._timer);
}

function hideBanner() {
  offlineBanner._timer = setTimeout(() => {
    offlineBanner.hidden = true;
  }, 2500);
}

function updateOnlineStatus() {
  if (navigator.onLine) {
    setWifiStatus(true);
    showBanner('已恢复连接', 'online');
    hideBanner();
  } else {
    setWifiStatus(false);
    showBanner('您已离线，数据将保存在本地', 'offline');
  }
}

setWifiStatus(navigator.onLine);
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

/* ── Myday 侧边面板 ───────────────────────────────────── */

const mydayOverlay = document.getElementById('mydayOverlay');
const mydayPanel = document.getElementById('mydayPanel');
const mydayList = document.getElementById('mydayList');
const mydayEmpty = document.querySelector('.myday-empty');

function openMyday() {
  if (!window.TodoModule) return;
  closeSettings();
  const hasItems = window.TodoModule.renderMydayList(mydayList);
  mydayEmpty.classList.toggle('hidden', hasItems);
  mydayOverlay.hidden = false;
  mydayPanel.classList.add('open');
  topSunBtn.classList.add('active');
}

function closeMyday() {
  mydayOverlay.hidden = true;
  mydayPanel.classList.remove('open');
  topSunBtn.classList.remove('active');
}

topSunBtn.addEventListener('click', () => {
  if (mydayPanel.classList.contains('open')) {
    closeMyday();
  } else {
    openMyday();
  }
});

mydayOverlay.addEventListener('click', closeMyday);

/* ── 设置面板 ────────────────────────────────────────── */

const settingsToggle = document.getElementById('settingsToggle');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsPanel = document.getElementById('settingsPanel');
document.getElementById('settingsVersion').textContent = 'v' + APP_VERSION;

function openSettings() {
  closeMyday();
  settingsOverlay.hidden = false;
  settingsPanel.classList.add('open');
}

function closeSettings() {
  settingsOverlay.hidden = true;
  settingsPanel.classList.remove('open');
}

settingsToggle.addEventListener('click', () => {
  if (settingsPanel.classList.contains('open')) closeSettings();
  else openSettings();
});

settingsOverlay.addEventListener('click', closeSettings);

/* ── PWA（仅在 https/http 下注册） ─────────────────────── */

function initPWA() {
  if (location.protocol === 'https:' || location.protocol === 'http:') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage('skipWaiting');
            }
          });
        });
      }).catch(() => {});
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        location.reload();
      });
    }
  }
}

/* ── 启动：加载 Todo → 初始化 PWA ───────────────────── */

loadTodoModule();
initPWA();
