# Enough Social: YouTube/Twitter Timer (MV3)

A simple Chrome extension that tracks active time spent on YouTube and Twitter/X, showing a popup reminder after 90 minutes.

## Installation

### For Users
1. Download/unzip the project folder
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the extension folder

### For Developers
```bash
git clone <repository-url>
cd reminder-widget
# Load as unpacked extension in Chrome
```

## How it works
- Every minute, the service worker checks:
  - If the window is active and user is not idle
  - If the active tab is YouTube/Twitter/X
- If yes, adds 60 seconds to the daily counter
- When the limit (90 min) is reached, opens popup `warn.html`
- Counter resets at midnight

## Features
- **Badge Display**: Shows remaining minutes on the extension icon
- **Popup Interface**: Click the extension icon to view detailed stats
- **Smart Tracking**: Only counts time when window is focused and user is active
- **Daily Reset**: Automatically resets at midnight
- **Snooze Function**: Remind me in 15 minutes option

## File Structure
```
├── manifest.json      # Extension manifest
├── background.js      # Service worker (main logic)
├── popup.html         # Extension popup interface
├── popup.js           # Popup logic
├── warn.html          # Warning popup
├── warn.js            # Warning popup logic
└── README.md          # This file
```

## Settings
- Default limit is 90 minutes. Can be changed in `DEFAULT_LIMIT_MIN` in `background.js`

## Development

### Building the Extension
```bash
# Using npm (recommended)
npm run build        # Create ZIP file
npm run build:clean  # Remove old ZIP and create new one
npm run package      # Clean build with success message

# Using bash script
./build.sh

# Manual command
zip -r enough-social-extension.zip . -x "*.DS_Store" "*.git*" "build.sh" "*.md" "node_modules/*" "*.log" "package.json"
```

### Development Workflow
1. Make changes to extension files
2. Test by reloading unpacked extension in Chrome
3. Run `npm run build` to create ZIP for distribution
4. Upload to Chrome Web Store or share ZIP file

## Deployment

### Chrome Web Store
1. Run `npm run build` to create ZIP file
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Upload the `enough-social-extension.zip` file
4. Fill in store listing details and privacy practices
5. Submit for review

### Manual Distribution
- Share the project folder for users to load as unpacked extension
- Or share the `enough-social-extension.zip` file created by build script

## Security
- Extension doesn't require host_permissions and doesn't inject content scripts
- Uses only standard Chrome APIs: tabs, storage, alarms, idle, windows
- All data stored locally in chrome.storage.local
- No data sent to external servers
- Open source code for verification and modification

## License
MIT License - feel free to modify and distribute
