function fmt(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}min`;
}

async function request(message) {
  return new Promise(resolve => chrome.runtime.sendMessage(message, resolve));
}

async function renderStats() {
  const res = await request({ type: "GET_STATS" });
  if (res?.ok) {
    const txt = `Today you spent ${fmt(res.totalTodaySeconds)} (limit ${res.limitMinutes} min).`;
    document.getElementById("stats").textContent = txt;
  } else {
    document.getElementById("stats").textContent = "Failed to get statistics.";
  }
}

document.getElementById("snooze").addEventListener("click", async () => {
  await request({ type: "SNOOZE", minutes: 15 });
  window.close();
});

document.getElementById("close").addEventListener("click", async () => {
  await request({ type: "CLOSE_SITES" });
  window.close();
});

document.getElementById("ok").addEventListener("click", async () => {
  await request({ type: "OK" });
  window.close();
});

renderStats();
