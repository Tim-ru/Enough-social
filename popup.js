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
      const { totalTodaySeconds, limitMinutes, sessionStartTime, lastActivityTime } = res;
      const limitSeconds = limitMinutes * 60;
      
      // Calculate precise time including current session
      let preciseTotalSeconds = totalTodaySeconds;
      const now = Date.now();
      
      // If there's an active session, add the current session time
      if (sessionStartTime && lastActivityTime && (now - lastActivityTime) < 5 * 60 * 1000) {
        const currentSessionSeconds = Math.floor((now - sessionStartTime) / 1000);
        // Add current session time to get precise seconds
        preciseTotalSeconds = totalTodaySeconds + currentSessionSeconds;
      }
      
      const percentage = Math.min((preciseTotalSeconds / limitSeconds) * 100, 100);
      
      // Check if timer has exceeded and show warning popup immediately
      if (preciseTotalSeconds >= limitSeconds) {
        console.log(`Popup: Timer exceeded! Total: ${preciseTotalSeconds}s, Limit: ${limitSeconds}s`);
        // Request to show warning popup if not already shown
        await request({ type: "CHECK_AND_SHOW_WARNING" });
      }
      
      // Update time display
      const timeDisplay = document.getElementById("timeDisplay");
      const timeRemaining = formatTimeRemaining(preciseTotalSeconds, limitSeconds);
      timeDisplay.textContent = timeRemaining;
      
      // Update progress bar
      const progressFill = document.getElementById("progressFill");
      progressFill.style.width = `${percentage}%`;
      
      // Update progress percentage
      const progressPercent = document.getElementById("progressPercent");
      progressPercent.textContent = `${Math.round(percentage)}%`;
      
      // Update details
      const details = document.getElementById("details");
      details.textContent = `Spent: ${formatTime(preciseTotalSeconds)} / ${limitMinutes} min limit`;
      
      // Update badge
      const remainingMinutes = Math.max(0, Math.ceil((limitSeconds - preciseTotalSeconds) / 60));
      chrome.action.setBadgeText({ text: remainingMinutes > 0 ? remainingMinutes.toString() : "!" });
      chrome.action.setBadgeBackgroundColor({ 
        color: remainingMinutes > 30 ? "#10b981" : remainingMinutes > 10 ? "#f59e0b" : "#ef4444" 
      });
      
      // Update colors based on status
      if (preciseTotalSeconds >= limitSeconds) {
        timeDisplay.className = "time-display time-exceeded";
      } else if (percentage >= 80) {
        timeDisplay.className = "time-display time-warning";
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

// Debug buttons for testing
document.getElementById("testWarnBtn").addEventListener("click", async () => {
  await request({ type: "FORCE_POPUP" });
});

document.getElementById("resetReminderBtn").addEventListener("click", async () => {
  await request({ type: "RESET_REMINDER" });
  await updateDisplay();
});

document.getElementById("testTickBtn").addEventListener("click", async () => {
  await request({ type: "TEST_TICK" });
});

// Settings Manager instance
const settingsManager = SettingsManager.getInstance();

// Settings UI elements
const settingsSection = document.getElementById("settingsSection");
const timeLimitInput = document.getElementById("timeLimitInput");
const validationMessage = document.getElementById("validationMessage");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");

// Show/hide settings section
document.getElementById("settingsBtn").addEventListener("click", async () => {
  if (settingsSection.style.display === "none") {
    await loadCurrentSettings();
    settingsSection.style.display = "block";
  } else {
    settingsSection.style.display = "none";
  }
});

// Close settings
closeSettingsBtn.addEventListener("click", () => {
  settingsSection.style.display = "none";
});

// Load current settings
async function loadCurrentSettings() {
  try {
    const currentLimit = await settingsManager.getTimeLimit();
    timeLimitInput.value = currentLimit;
    hideValidationMessage();
  } catch (error) {
    console.error("Error loading settings:", error);
    showValidationMessage("Error loading current settings");
  }
}

// Save settings
saveSettingsBtn.addEventListener("click", async () => {
  const newLimit = parseInt(timeLimitInput.value);
  
  if (isNaN(newLimit)) {
    showValidationMessage("Please enter a valid number");
    return;
  }
  
  const result = await settingsManager.setTimeLimit(newLimit);
  
  if (result.success) {
    hideValidationMessage();
    // Update display with new limit
    await updateDisplay();
    // Show success feedback
    showSuccessMessage();
  } else {
    showValidationMessage(result.error || "Failed to save settings");
  }
});

// Reset to default
resetSettingsBtn.addEventListener("click", async () => {
  if (confirm("Reset time limit to default (90 minutes)?")) {
    const result = await settingsManager.resetToDefault();
    
    if (result.success) {
      await loadCurrentSettings();
      await updateDisplay();
      hideValidationMessage();
    } else {
      showValidationMessage(result.error || "Failed to reset settings");
    }
  }
});

// Real-time validation
timeLimitInput.addEventListener("input", () => {
  const value = parseInt(timeLimitInput.value);
  const validation = settingsManager.validateTimeLimit(value);
  
  if (!validation.valid && timeLimitInput.value !== "") {
    showValidationMessage(validation.error);
  } else {
    hideValidationMessage();
  }
});

// Helper functions for validation messages
function showValidationMessage(message) {
  validationMessage.textContent = message;
  validationMessage.classList.add("show");
}

function hideValidationMessage() {
  validationMessage.classList.remove("show");
}

// Helper function for success message
function showSuccessMessage() {
  const successMessage = document.getElementById("successMessage");
  successMessage.classList.add("show");
  setTimeout(() => {
    successMessage.classList.remove("show");
  }, 3000);
}

// Update display when popup opens
updateDisplay();

// Update every 1 second while popup is open for accurate time display
setInterval(updateDisplay, 1000);
