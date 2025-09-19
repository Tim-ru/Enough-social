// Загружаем settings-manager.js как обычный скрипт
importScripts('settings-manager.js');

const TRACK_HOSTS = ["youtube.com", "m.youtube.com", "youtu.be", "twitter.com", "x.com"];
const TICK_SECONDS = 60; // 1 minute for background tracking
const DEFAULT_LIMIT_MIN = 90; // 90 minutes default limit

// Settings Manager instance
const settingsManager = SettingsManager.getInstance();

function isTrackedUrl(urlString) {
  try {
    const u = new URL(urlString);
    return TRACK_HOSTS.some(h => u.hostname === h || u.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

async function getState() {
  return new Promise(async resolve => {
    const currentLimit = await settingsManager.getTimeLimit();
    chrome.storage.local.get({
      totalTodaySeconds: 0,
      lastResetDate: localDateStr(),
      limitMinutes: currentLimit,
      remindedToday: false,
      snoozeUntil: 0,
      sessionStartTime: 0,
      lastActivityTime: 0
    }, resolve);
  });
}

function setState(patch) {
  return new Promise(resolve => chrome.storage.local.set(patch, resolve));
}

function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextLocalMidnightMs() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return +next;
}

async function ensureDailyResetSchedule() {
  await chrome.alarms.clear("midnight_reset");
  chrome.alarms.create("midnight_reset", { when: nextLocalMidnightMs() });
}

async function ensureTickSchedule() {
  // Every 1 minute for background tracking
  chrome.alarms.create("tick", { periodInMinutes: 1 });
}

async function resetToday() {
  await setState({
    totalTodaySeconds: 0,
    lastResetDate: localDateStr(),
    remindedToday: false,
    snoozeUntil: 0,
    sessionStartTime: 0,
    lastActivityTime: 0
  });
}

async function maybeDailyReset() {
  const s = await getState();
  const today = localDateStr();
  if (s.lastResetDate !== today) {
    await resetToday();
  }
}

async function minuteTick() {
  // Check idle state with shorter interval (30 sec)
  const idleState = await new Promise(resolve => chrome.idle.queryState(30, resolve));
  
  // If screen is locked - don't count time
  if (idleState === "locked") {
    return;
  }

  const focusedWin = await chrome.windows.getLastFocused({ populate: false }).catch(() => null);
  if (!focusedWin || !focusedWin.focused) {
    return;
  }

  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const activeTab = tabs?.[0];
  
  if (!activeTab || !activeTab.url || !isTrackedUrl(activeTab.url)) {
    return;
  }

  const s = await getState();
  const now = Date.now();

  // Count time only if:
  // 1. User is active (not idle for more than 30 sec) OR
  // 2. User is idle but window is focused and tab is active (watching content)
  const shouldCount = idleState === "active" || (idleState === "idle" && focusedWin.focused);
  
  if (shouldCount) {
    // Start new session if not started or if last activity was more than 5 minutes ago
    if (!s.sessionStartTime || (now - s.lastActivityTime) > 5 * 60 * 1000) {
      await setState({ 
        sessionStartTime: now,
        lastActivityTime: now
      });
    } else {
      // Update last activity time
      await setState({ lastActivityTime: now });
    }

    const total = (s.totalTodaySeconds || 0) + TICK_SECONDS;
    await setState({ totalTodaySeconds: total });

    const limitSec = (s.limitMinutes || await settingsManager.getTimeLimit()) * 60;
    
    // Update badge
    updateBadge(total, limitSec);
    
    // Note: Warning popup is now handled by popup.js for immediate response
  }
}

function updateBadge(totalSeconds, limitSeconds) {
  const remainingMinutes = Math.max(0, Math.ceil((limitSeconds - totalSeconds) / 60));
  
  if (remainingMinutes > 0) {
    chrome.action.setBadgeText({ text: remainingMinutes.toString() });
    chrome.action.setBadgeBackgroundColor({ 
      color: remainingMinutes > 30 ? "#10b981" : remainingMinutes > 10 ? "#f59e0b" : "#ef4444" 
    });
  } else {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
  }
}

function openWarnPopup() {
  const url = chrome.runtime.getURL("warn.html");
  
  chrome.windows.create({
    url: url,
    type: "popup",
    width: 600,
    height: 450,
    focused: true
  }).catch((error) => {
    console.error("Error creating popup window:", error);
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  await maybeDailyReset();
  await ensureTickSchedule();
  await ensureDailyResetSchedule();
  await updateBadgeOnStartup();
  
  // Initialize settings manager storage listener
  settingsManager.initializeStorageListener();
});

chrome.runtime.onStartup.addListener(async () => {
  await maybeDailyReset();
  await ensureTickSchedule();
  await ensureDailyResetSchedule();
  await updateBadgeOnStartup();
});

async function updateBadgeOnStartup() {
  const s = await getState();
  const limitSec = (s.limitMinutes || await settingsManager.getTimeLimit()) * 60;
  updateBadge(s.totalTodaySeconds || 0, limitSec);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tick") {
    await minuteTick();
  } else if (alarm.name === "midnight_reset") {
    await resetToday();
    await ensureDailyResetSchedule();
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "SNOOZE") {
      const minutes = Number(msg.minutes) || 15;
      const until = Date.now() + minutes * 60 * 1000;
      await setState({ snoozeUntil: until });
      sendResponse({ ok: true, until });
    } else if (msg?.type === "CLOSE_SITES") {
      const all = await chrome.tabs.query({});
      const toClose = all.filter(t => t.url && isTrackedUrl(t.url)).map(t => t.id).filter(Boolean);
      if (toClose.length) await chrome.tabs.remove(toClose);
      sendResponse({ ok: true, closed: toClose.length });
    } else if (msg?.type === "GET_STATS") {
      const s = await getState();
      const currentLimit = await settingsManager.getTimeLimit();
      sendResponse({
        ok: true,
        totalTodaySeconds: s.totalTodaySeconds || 0,
        limitMinutes: currentLimit,
        sessionStartTime: s.sessionStartTime || 0,
        lastActivityTime: s.lastActivityTime || 0
      });
    } else if (msg?.type === "RESET_COUNTER") {
      await setState({ 
        totalTodaySeconds: 0, 
        remindedToday: false, 
        snoozeUntil: 0,
        sessionStartTime: 0,
        lastActivityTime: 0
      });
      sendResponse({ ok: true });
    } else if (msg?.type === "FORCE_POPUP") {
      // Force show popup for testing
      await setState({ remindedToday: false });
      openWarnPopup();
      sendResponse({ ok: true });
    } else if (msg?.type === "RESET_REMINDER") {
      // Reset reminder flag to allow showing popup again
      await setState({ remindedToday: false, snoozeUntil: 0 });
      sendResponse({ ok: true });
    } else if (msg?.type === "TEST_TICK") {
      // Test minuteTick function
      await minuteTick();
      sendResponse({ ok: true });
    } else if (msg?.type === "CHECK_AND_SHOW_WARNING") {
      // Check if warning should be shown and show it immediately
      const s = await getState();
      const currentLimit = await settingsManager.getTimeLimit();
      const limitSec = currentLimit * 60;
      const now = Date.now();
      
      // Calculate precise time including current session
      let preciseTotalSeconds = s.totalTodaySeconds || 0;
      if (s.sessionStartTime && s.lastActivityTime && (now - s.lastActivityTime) < 5 * 60 * 1000) {
        const currentSessionSeconds = Math.floor((now - s.sessionStartTime) / 1000);
        preciseTotalSeconds = s.totalTodaySeconds + currentSessionSeconds;
      }
      
      const snoozed = s.snoozeUntil && now < s.snoozeUntil;
      
      if (!snoozed && preciseTotalSeconds >= limitSec && !s.remindedToday) {
        console.log(`Background: Timer exceeded! Total: ${preciseTotalSeconds}s, Limit: ${limitSec}s, RemindedToday: ${s.remindedToday}`);
        await setState({ remindedToday: true });
        openWarnPopup();
      }
      sendResponse({ ok: true });
    } else if (msg?.type === "OK") {
      sendResponse({ ok: true });
    }
  })();
  // Indicate that response is asynchronous
  return true;
});
