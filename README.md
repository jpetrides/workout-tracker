# Workout Tracker

A voice-powered Progressive Web App (PWA) for tracking workouts hands-free at the gym.

## Features

- **Voice Input**: Speak your workouts instead of typing (with manual fallback)
- **Exercise Database**: Pre-loaded with 70+ common exercises and aliases
- **Smart Matching**: Automatically matches exercise variations (e.g., "curls" → "Bicep Curls")
- **Workout History**: View all past workouts organized by date
- **Analytics**: Track progress with charts and statistics
- **Offline Support**: Works without internet connection
- **Data Export**: Download your workout data as JSON
- **PWA**: Install on your phone's home screen like a native app

## Getting Started

### Local Development

1. Open `index.html` in a web browser
2. That's it! No build process required.

For the best experience, use a local server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server
```

Then open `http://localhost:8000` in your browser.

### Deploying to GitHub Pages

1. Create a new repository on GitHub called `workout-tracker`

2. Initialize and push your code:
```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/workout-tracker.git
git push -u origin main
```

3. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: main / (root)
   - Click Save

4. Your app will be live at: `https://YOUR_USERNAME.github.io/workout-tracker/`

### Installing on iPhone

1. Open the deployed URL in **Safari** (must be Safari, not Chrome)
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "Workout Tracker"
5. Tap "Add"

The app icon will appear on your home screen and open full-screen like a native app.

## How to Use

### Voice Input
1. Tap the microphone button
2. Say your workout: *"Bench press, 3 sets, 10 reps, 185 pounds"*
3. Confirm the parsed data
4. Done!

**Note**: Voice recognition may not work on all browsers (especially Safari on iOS). Use the manual input form as a fallback.

### Manual Input
1. Type the exercise name (autocomplete will help)
2. Enter sets, reps, and weight
3. Tap "Add Exercise"

### Managing Exercises
- Go to the "Exercises" tab
- View all exercises and their aliases
- Add custom exercises
- Edit aliases for better voice recognition
- Only custom exercises can be deleted (defaults are protected)

### Analytics
- View total workouts, sets, and volume
- See your most frequently performed exercise
- Track progress for specific exercises over time
- View weekly volume trends

### Export Data
- Tap the download icon in the header
- Save your workout data as JSON
- Keep backups or share with other apps

## Project Structure

```
workout-tracker/
├── index.html          # Main app page
├── styles.css          # Styling
├── app.js             # Main app logic & UI
├── exercises.js       # Exercise database & matching
├── storage.js         # IndexedDB operations
├── voice.js           # Voice recognition
├── charts.js          # Analytics & charts
├── manifest.json      # PWA manifest
├── service-worker.js  # Offline support
└── README.md          # This file
```

## Browser Compatibility

- **Chrome/Edge**: Full support including voice input
- **Firefox**: Full support including voice input
- **Safari (Desktop)**: Full support including voice input
- **Safari (iOS)**: Limited voice support - use manual input
- **Chrome (iOS)**: Limited voice support - use manual input

## Data Storage

- All data is stored locally in your browser's IndexedDB
- No server or cloud storage required
- Data persists between sessions
- Export regularly to create backups

## Updating the App

When you update the code and redeploy:
1. Your workout data in IndexedDB will remain safe
2. The service worker will update automatically
3. Users may need to refresh the page once to see updates

## Future Enhancements

Ideas for future development:
- Timer for rest periods
- Workout templates/routines
- Photo attachments for form checks
- Social sharing
- Integration with fitness APIs
- Multiple weight units (kg/lbs toggle)

## Troubleshooting

**Voice input not working?**
- Use Safari on desktop or Chrome/Edge
- Ensure microphone permissions are granted
- Use manual input as fallback

**App not installing on iPhone?**
- Must use Safari browser (not Chrome)
- URL must be HTTPS (GitHub Pages provides this)

**Data disappeared?**
- Check if you're in private/incognito mode
- Browser data clearing removes IndexedDB
- Export data regularly as backup

## License

MIT License - Feel free to use and modify as needed.

## Contributing

This is a personal project, but feel free to fork and customize for your own use!
