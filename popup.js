function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatTimeRemaining(totalSeconds, limitSeconds) {
  const remaining = limitSeconds - totalSeconds;
  if (remaining <= 0) {
    return `+${formatTime(Math.abs(remaining))} over limit`;
  } else {
    return `${formatTime(remaining)} remaining`;
  }
}

async function request(message) {
  return new Promise(resolve => chrome.runtime.sendMessage(message, resolve));
}

async function updateDisplay() {
  try {
    const res = await request({ type: "GET_STATS" });
    if (res?.ok) {
      const { totalTodaySeconds, limitMinutes } = res;
      const limitSeconds = limitMinutes * 60;
      const percentage = Math.min((totalTodaySeconds / limitSeconds) * 100, 100);
      
      // Update time display
      const timeDisplay = document.getElementById("timeDisplay");
      const timeRemaining = formatTimeRemaining(totalTodaySeconds, limitSeconds);
      timeDisplay.textContent = timeRemaining;
      
      // Update progress bar
      const progressFill = document.getElementById("progressFill");
      progressFill.style.width = `${percentage}%`;
      
      // Update details
      const details = document.getElementById("details");
      details.textContent = `Spent: ${formatTime(totalTodaySeconds)} / ${limitMinutes} min limit`;
      
      // Update badge
      const remainingMinutes = Math.max(0, Math.ceil((limitSeconds - totalTodaySeconds) / 60));
      chrome.action.setBadgeText({ text: remainingMinutes > 0 ? remainingMinutes.toString() : "!" });
      chrome.action.setBadgeBackgroundColor({ 
        color: remainingMinutes > 30 ? "#10b981" : remainingMinutes > 10 ? "#f59e0b" : "#ef4444" 
      });
      
      // Update colors based on status
      if (totalTodaySeconds >= limitSeconds) {
        timeDisplay.className = "time-display time-exceeded";
      } else {
        timeDisplay.className = "time-display time-remaining";
      }
    } else {
      document.getElementById("timeDisplay").textContent = "Error loading data";
    }
  } catch (error) {
    console.error("Error updating display:", error);
    document.getElementById("timeDisplay").textContent = "Error";
  }
}

// Event listeners
document.getElementById("resetBtn").addEventListener("click", async () => {
  if (confirm("Reset today's timer? This will clear all tracked time.")) {
    await request({ type: "RESET_COUNTER" });
    await updateDisplay();
  }
});

document.getElementById("closeSitesBtn").addEventListener("click", async () => {
  if (confirm("Close all YouTube/Twitter tabs?")) {
    await request({ type: "CLOSE_SITES" });
    window.close();
  }
});

document.getElementById("settingsBtn").addEventListener("click", () => {
  // For now, just show current settings
  alert("Settings: 90 minutes daily limit\n\nTo change the limit, modify DEFAULT_LIMIT_MIN in background.js");
});

// Update display when popup opens
updateDisplay();

// Update every 5 seconds while popup is open
setInterval(updateDisplay, 5000);
