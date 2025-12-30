# Setup Instructions

## Quick Start

Your workout tracker is ready to use! Follow these steps:

### 1. Generate App Icons (Required for PWA)

Open `create-icons.html` in your browser and download both icon files:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

Save them in the root directory of this project.

**Alternative**: Create your own custom icons using any design tool and save them with these exact filenames.

### 2. Test Locally

Open `index.html` in your web browser, or use a local server:

```bash
# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

### 3. Try the Features

**Log a Workout:**
- Click the microphone button and say: "Bench press, 3 sets, 10 reps, 185 pounds"
- Or use the manual form below

**View History:**
- Click the "History" tab to see all past workouts

**Check Analytics:**
- Click the "Analytics" tab to view progress charts

**Manage Exercises:**
- Click the "Exercises" tab to add custom exercises or edit aliases

### 4. Deploy to GitHub Pages

```bash
# Create a repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/workout-tracker.git
git push -u origin main

# Enable GitHub Pages in repository settings:
# Settings → Pages → Source: main branch → Save
```

### 5. Install on Your iPhone

1. Open the GitHub Pages URL in Safari (must be Safari!)
2. Tap Share button → "Add to Home Screen"
3. The app installs like a native app

## Important Notes

- **Voice Input on iOS**: Safari on iPhone has limited Web Speech API support. Use the manual form as a fallback.
- **Data Storage**: All workout data is stored locally in IndexedDB (no cloud sync).
- **Offline Mode**: The app works offline after first visit thanks to service worker caching.
- **Backups**: Use the export button (download icon in header) to save your data as JSON.

## Troubleshooting

**Icons not showing?**
- Make sure `icon-192.png` and `icon-512.png` are in the root directory
- Check the browser console for errors

**Voice not working?**
- Try Chrome, Edge, or desktop Safari
- Ensure microphone permissions are granted
- Use manual input as fallback

**App not caching offline?**
- Service workers require HTTPS (works on localhost or GitHub Pages)
- Check Application tab in browser DevTools

## Next Steps

- Customize the exercise database in `exercises.js`
- Modify colors in `styles.css` (see `:root` CSS variables)
- Add new features as needed

Enjoy your workout tracker!
