# Workout Tracker

A voice-powered Progressive Web App (PWA) for tracking workouts hands-free at the gym.

**Live Demo**: https://jpetrides.github.io/workout-tracker/
**Repository**: https://github.com/jpetrides/workout-tracker

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [File Structure & Technical Details](#file-structure--technical-details)
- [Data Models](#data-models)
- [How It Works](#how-it-works)
- [Deployment](#deployment)
- [Common Development Tasks](#common-development-tasks)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

---

## Features

- ✅ **Voice Input**: Speak workouts with Web Speech API (Chrome/Edge/Firefox/Safari Desktop)
- ✅ **Manual Fallback**: Text-based form for iOS Safari and other browsers
- ✅ **70+ Exercise Database**: Pre-loaded exercises with alias matching
- ✅ **Smart Exercise Matching**: "curls" → "Bicep Curls", "bench" → "Bench Press"
- ✅ **Workout History**: View/edit/delete all past workouts by date
- ✅ **Analytics Dashboard**: Progress charts, stats, weekly volume tracking
- ✅ **Exercise Management**: Add custom exercises, edit aliases, delete custom entries
- ✅ **Data Export**: Download workout data as JSON
- ✅ **Offline-First PWA**: Works without internet after first visit
- ✅ **Installable**: Add to iPhone/Android home screen like native app

---

## Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/jpetrides/workout-tracker.git
cd workout-tracker

# Option 1: Open index.html directly in browser

# Option 2: Use local server (recommended for service worker testing)
python -m http.server 8000
# Visit: http://localhost:8000
```

### Deploy to GitHub Pages

```bash
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/workout-tracker.git
git push -u origin main

# Enable GitHub Pages:
# Settings → Pages → Source: main branch → Save
# Live at: https://YOUR_USERNAME.github.io/workout-tracker/
```

### Install on iPhone

1. Open GitHub Pages URL in **Safari** (must be Safari!)
2. Tap Share → "Add to Home Screen"
3. App installs with icon, works offline

---

## Architecture Overview

### Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), no frameworks
- **UI**: HTML5, CSS3 with CSS Grid/Flexbox
- **Storage**: IndexedDB (via native API, no libraries)
- **Voice**: Web Speech API (SpeechRecognition)
- **Charts**: Chart.js 4.4.0 (via CDN)
- **PWA**: Service Worker for offline caching
- **Hosting**: GitHub Pages (static hosting)

### Design Patterns

- **Singleton Classes**: Each module (`StorageManager`, `ExerciseManager`, `VoiceManager`, etc.) uses singleton pattern with global instances
- **Event-Driven**: UI interactions trigger async operations with callbacks
- **Async/Await**: All IndexedDB operations use promises/async-await
- **Mobile-First**: Responsive design starting from 320px width

### Key Architectural Decisions

1. **No Build Process**: Pure vanilla JS for simplicity and easy debugging
2. **No Backend**: 100% client-side, data stored in IndexedDB
3. **IndexedDB over LocalStorage**: Supports larger datasets, structured queries, better performance
4. **Relative Paths**: `./` paths for GitHub Pages subdirectory compatibility
5. **Defensive Deletion**: Default exercises can't be deleted, only custom ones

---

## File Structure & Technical Details

### `index.html` (Main App Structure)

**Purpose**: Single-page app with tabbed interface

**Key Sections**:
- Header with app title and export button
- Navigation tabs: Log, History, Analytics, Exercises
- Tab contents (hidden/shown via CSS classes)
- Modal dialog for confirmations and edits
- Script loading order (important!):
  1. Chart.js (CDN)
  2. exercises.js (defines DEFAULT_EXERCISES and ExerciseManager)
  3. storage.js (IndexedDB StorageManager)
  4. voice.js (VoiceManager)
  5. charts.js (ChartsManager)
  6. app.js (main WorkoutApp coordinator)
  7. Service worker registration

**Important Notes**:
- Uses `list` attribute on exercise input for autocomplete
- Modal structure supports reusable confirm/edit dialogs
- Service worker registered only if supported

---

### `styles.css` (Styling)

**Purpose**: Mobile-first responsive design

**CSS Variables** (`:root`):
```css
--primary: #2563eb        (buttons, accents)
--primary-dark: #1d4ed8   (button hover)
--secondary: #64748b      (secondary buttons)
--success: #10b981        (charts, success states)
--danger: #ef4444         (delete, errors)
--background: #f8fafc     (page background)
--surface: #ffffff        (cards, modals)
--text: #0f172a           (primary text)
--text-secondary: #64748b (labels, meta info)
--border: #e2e8f0         (borders)
```

**Layout Strategy**:
- Flexbox for header and navigation
- CSS Grid for stats cards and form rows
- Mobile breakpoint: 640px

**Key Classes**:
- `.tab-content.active` - Shows/hides tab sections
- `.modal.active` - Shows/hides modal overlay
- `.voice-btn.listening` - Pulsing animation during voice input
- `.workout-item` - Reusable card component for workout entries

---

### `exercises.js` (Exercise Database)

**Purpose**: Exercise matching and management

**Data Structure**:
```javascript
DEFAULT_EXERCISES = {
  "Exercise Name": ["alias1", "alias2", "alias3"],
  "Bench Press": ["bench", "flat bench", "barbell bench"],
  ...70+ exercises
}
```

**ExerciseManager Class**:

```javascript
class ExerciseManager {
  customExercises = {}  // User-added exercises (stored in IndexedDB)

  // Key Methods:
  getAllExercises()           // Merges default + custom
  findExercise(input)         // Matches input to exercise name
  addExercise(name, aliases)  // Adds custom exercise
  updateExercise(name, aliases) // Updates aliases
  deleteExercise(name)        // Deletes custom (not default)
}
```

**Matching Algorithm** (`findExercise`):
1. Exact name match (case-insensitive)
2. Exact alias match (case-insensitive)
3. Fuzzy match: check if input contains exercise name or vice versa
4. Check aliases with partial matching
5. Return `null` if no match (treated as new exercise)

**Example**:
- Input: "bench" → Matches "Bench Press" (via alias)
- Input: "db curl" → Matches "Dumbbell Curls" (via alias "db curls")
- Input: "Cable Crossover" → No match → Returns null → User can add it

---

### `storage.js` (IndexedDB Manager)

**Purpose**: Persistent local storage for workouts and settings

**Database Schema**:
```javascript
Database: WorkoutTrackerDB (version 1)

ObjectStore: "workouts"
- keyPath: "id" (auto-increment)
- Indexes:
  - "date" (for filtering by date)
  - "exercise" (for filtering by exercise name)

ObjectStore: "settings"
- keyPath: "key"
- Stores: customExercises (exercise customizations)
```

**Workout Entry Model**:
```javascript
{
  id: 123,                    // Auto-generated
  exercise: "Bench Press",    // Normalized name
  sets: 3,                    // Number
  reps: 10,                   // Number
  weight: 185,                // Number (lbs) or null
  notes: "felt strong",       // String or empty
  date: "2025-12-30T10:30:00.000Z", // ISO timestamp
  timestamp: 1735558200000    // Unix timestamp (for sorting)
}
```

**StorageManager Class Methods**:

```javascript
// CRUD Operations
await addWorkout(workout)           // Add new workout
await getAllWorkouts()              // Get all workouts
await getWorkoutsByDate(date)       // Get workouts for specific date
await getTodaysWorkouts()           // Convenience for today
await updateWorkout(id, updates)    // Update existing workout
await deleteWorkout(id)             // Delete single workout
await clearAllWorkouts()            // Delete all (dangerous!)

// Queries
await getWorkoutsByDay()            // Returns { "2025-12-30": [...workouts], ... }
await getWorkoutsByExercise(name)   // Get all entries for one exercise
await getAnalytics()                // Computed stats

// Settings
await saveCustomExercises(obj)      // Save custom exercise database
await getCustomExercises()          // Load custom exercises

// Export/Import
await exportData()                  // Returns full JSON export
await importData(data)              // Restores from JSON
```

**Analytics Calculation**:
- **totalWorkouts**: Count of unique workout days
- **totalSets**: Sum of all sets
- **totalVolume**: Sum of (sets × reps × weight) for all workouts
- **favoriteExercise**: Exercise with most entries
- **weeklyData**: Last 8 weeks of volume, grouped by week start date

---

### `voice.js` (Voice Recognition)

**Purpose**: Parse voice input into workout data

**VoiceManager Class**:

```javascript
class VoiceManager {
  recognition = null          // SpeechRecognition instance
  isListening = false         // Current state
  isSupported = true/false    // Browser capability

  // Methods:
  checkSupport()              // Detects Web Speech API
  start(onResult, onError)    // Begin listening
  stop()                      // Stop listening
  parseWorkoutInput(text)     // Parse speech → workout object
}
```

**Voice Parsing Logic** (`parseWorkoutInput`):

```javascript
Input: "Bench press, 3 sets, 10 reps, 185 pounds"

1. Extract labeled numbers:
   - /(\d+)\s*sets?/ → sets = 3
   - /(\d+)\s*reps?/ → reps = 10
   - /(\d+)\s*pounds?|lbs/ → weight = 185

2. If no labels, assume order: sets, reps, weight
   - "bench 3 10 185" → sets=3, reps=10, weight=185

3. Extract exercise name:
   - Remove all number phrases
   - Remove connecting words (at, with, for)
   - Remaining text = exercise name

4. Match exercise using ExerciseManager.findExercise()

Output: { exercise: "Bench Press", sets: 3, reps: 10, weight: 185 }
```

**Browser Support**:
- Chrome/Edge: Full support (webkitSpeechRecognition)
- Firefox: Full support (SpeechRecognition)
- Safari Desktop: Full support
- Safari iOS: **Limited/No support** (known limitation)
- Chrome iOS: No support (uses Safari engine)

---

### `charts.js` (Analytics & Visualization)

**Purpose**: Chart.js wrapper for progress tracking

**ChartsManager Class**:

```javascript
class ChartsManager {
  progressChart = null    // Line chart (exercise progress)
  volumeChart = null      // Bar chart (weekly volume)

  init()                           // Initialize both charts
  updateProgressChart(exercise)    // Update with exercise data
  updateVolumeChart(weeklyData)    // Update with volume data
  updateAnalytics()                // Refresh all analytics
  destroy()                        // Cleanup
}
```

**Progress Chart** (Line Chart):
- X-axis: Dates
- Y-axis: Max weight per day for selected exercise
- Shows progression over time for one exercise
- User selects exercise from dropdown

**Volume Chart** (Bar Chart):
- X-axis: Week start dates (last 8 weeks)
- Y-axis: Total volume (sum of sets × reps × weight)
- Shows overall training volume trends

**Stats Cards**:
- Total Workouts (unique days)
- Total Sets (sum of all sets)
- Total Volume (sum of all volume calculations)
- Favorite Exercise (most frequent)

---

### `app.js` (Main Application Logic)

**Purpose**: Coordinates all modules, handles UI interactions

**WorkoutApp Class Structure**:

```javascript
class WorkoutApp {
  currentTab = 'log'
  modal = null
  editingWorkoutId = null

  // Lifecycle
  async init()                  // Initialize everything

  // Tab Management
  setupTabs()                   // Tab switching

  // Voice Input
  setupVoiceInput()             // Voice button click handler
  handleVoiceResult(result)     // Process voice recognition result
  handleVoiceError(error)       // Handle voice errors

  // Manual Input
  setupManualForm()             // Form submission handler
  setupExerciseAutocomplete()   // Populate datalist with exercises

  // Workout Display
  loadTodaysWorkouts()          // Load and render today's workouts
  loadHistory()                 // Load and render all history
  createWorkoutItemHTML(workout) // Generate workout card HTML

  // CRUD Operations
  confirmWorkout()              // Save workout from modal
  editWorkout(id)               // Show edit modal
  saveEditedWorkout()           // Save edits
  deleteWorkout(id)             // Delete with confirmation
  clearAllHistory()             // Delete all with confirmation

  // Exercise Management
  loadExercisesList()           // Load exercises tab
  addNewExercise()              // Show add modal
  editExercise(name)            // Show edit modal
  deleteExercise(name)          // Delete custom exercise

  // Export
  setupExport()                 // Export button handler

  // Modal
  setupModal()                  // Modal event listeners
  openModal() / closeModal()    // Modal visibility
  showWorkoutConfirmation(workout) // Show confirmation modal

  // Utilities
  showNotification(msg, type)   // Simple alert (could be improved)
}
```

**Initialization Flow**:
1. `DOMContentLoaded` event fires
2. Create `WorkoutApp` instance
3. `app.init()` runs:
   - Initialize IndexedDB (`storageManager.init()`)
   - Load custom exercises (`exerciseManager.loadCustomExercises()`)
   - Setup UI event listeners
   - Load today's workouts
   - Load history
   - Initialize charts
4. App is ready for interaction

**Data Flow Example** (Voice Input):
1. User taps microphone button
2. `setupVoiceInput()` handler calls `voiceManager.start()`
3. Web Speech API listens and returns transcript
4. `voiceManager.parseWorkoutInput()` parses transcript
5. `handleVoiceResult()` receives parsed data
6. `showWorkoutConfirmation()` displays modal with parsed data
7. User confirms
8. `confirmWorkout()` saves to IndexedDB via `storageManager.addWorkout()`
9. `loadTodaysWorkouts()` refreshes the UI

---

### `manifest.json` (PWA Manifest)

**Purpose**: Define app metadata for installation

```json
{
  "name": "Workout Tracker",
  "short_name": "Workout",
  "start_url": "./",              // Relative for GitHub Pages
  "display": "standalone",         // Full-screen, no browser UI
  "background_color": "#f8fafc",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192" },
    { "src": "icon-512.png", "sizes": "512x512" }
  ]
}
```

**Critical Settings**:
- `start_url: "./"` - Uses relative path (not `/`) for GitHub Pages subdirectory
- `display: "standalone"` - Hides browser chrome when installed
- Icons required: 192x192 and 512x512 PNG files

---

### `service-worker.js` (Offline Support)

**Purpose**: Cache assets for offline usage

**Cache Strategy**: Cache-first with network fallback

```javascript
CACHE_NAME = 'workout-tracker-v2'

urlsToCache = [
  './',                  // Relative paths for GitHub Pages
  './index.html',
  './styles.css',
  './app.js',
  './exercises.js',
  './storage.js',
  './voice.js',
  './charts.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
]
```

**Lifecycle**:
1. **Install**: Cache all resources in `urlsToCache`
2. **Activate**: Delete old cache versions
3. **Fetch**: Serve from cache if available, else fetch from network and cache

**Version Bumping**: Increment `CACHE_NAME` when updating assets to force new cache

---

## Data Models

### Workout Entry
```javascript
{
  id: Number,           // Auto-increment primary key
  exercise: String,     // Normalized exercise name
  sets: Number,         // Required
  reps: Number,         // Required
  weight: Number|null,  // Optional (null if bodyweight)
  notes: String,        // Optional notes
  date: String,         // ISO 8601 timestamp
  timestamp: Number     // Unix timestamp for sorting
}
```

### Custom Exercise
```javascript
{
  "Exercise Name": ["alias1", "alias2", ...]
}

// Stored in IndexedDB settings store:
{
  key: "customExercises",
  value: { "Cable Crossover": ["crossover", "cable cross"], ... }
}
```

### Export Format
```javascript
{
  version: 1,
  exportDate: "2025-12-30T10:30:00.000Z",
  workouts: [ ...all workout entries ],
  customExercises: { ...custom exercise object }
}
```

---

## How It Works

### Voice Input Flow

1. User taps microphone button
2. `VoiceManager.start()` called
3. Browser requests microphone permission (first time)
4. `SpeechRecognition` starts listening
5. User speaks: "Bench press, 3 sets, 10 reps, 185 pounds"
6. `SpeechRecognition.onresult` fires with transcript
7. `parseWorkoutInput()` parses:
   - Extracts numbers with regex
   - Identifies sets/reps/weight from keywords or position
   - Removes number phrases to get exercise name
   - Matches exercise via `ExerciseManager.findExercise()`
8. Parsed data returned to `app.handleVoiceResult()`
9. Modal shown with pre-filled data for confirmation
10. User confirms → `storageManager.addWorkout()`
11. UI refreshes with new workout

### Exercise Matching

```javascript
Input: "curls"

1. Exact match on name? "Curls" vs "Bicep Curls" → No
2. Exact match on aliases? "curls" in ["curls", "bicep curl", ...] → YES!
3. Return: "Bicep Curls"

Input: "cable cross"

1. Exact match? No
2. Alias match? No
3. Fuzzy match: "cable cross" contains "cable" AND "cross"?
   - Check "Cable Flyes" aliases: ["cable flies", "cable chest"]
   - Check "Cable Curls" aliases: ["cable curl"]
   - Check all... no clean match
4. Return: null (user can add as new exercise)
```

### Analytics Calculation

```javascript
Weekly Volume Calculation:

1. Get all workouts from last 8 weeks
2. For each workout:
   - Calculate volume: sets × reps × weight
   - Get week start date (Sunday of that week)
   - Add to weekly total
3. Return: { "2025-12-24": 50000, "2025-12-17": 48000, ... }

Used in bar chart to show volume trends
```

### Offline Behavior

**First Visit**:
- Service worker installs
- All assets cached
- IndexedDB initialized (empty)

**Subsequent Visits (Online)**:
- Assets served from cache (instant load)
- New data fetched if cache stale
- IndexedDB operations work normally

**Offline**:
- All assets served from cache
- IndexedDB operations work (local storage)
- Can log workouts, view history, see analytics
- No external dependencies except Chart.js (also cached)

**Back Online**:
- Service worker checks for updates
- New version auto-downloaded and activated
- User sees update on next refresh

---

## Deployment

### GitHub Pages Setup

**Current Deployment**: https://jpetrides.github.io/workout-tracker/

**Steps**:
1. Push to `main` branch
2. GitHub Actions automatically builds Pages
3. Live in 1-2 minutes

**Path Configuration**:
- GitHub Pages serves from: `https://username.github.io/repo-name/`
- Manifest uses `start_url: "./"` (relative, not absolute)
- Service worker uses `'./'` paths (not `'/'`)
- This ensures app works in subdirectory

**Updating**:
```bash
# Make changes
git add .
git commit -m "Description of changes"
git push

# Wait 1-2 minutes for GitHub Pages rebuild
# Users may need to hard refresh (Cmd+Shift+R) to see changes
```

### Custom Domain (Optional)

To use custom domain:
1. Add `CNAME` file with domain name
2. Configure DNS:
   - A record: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - Or CNAME: username.github.io
3. Enable HTTPS in GitHub Pages settings
4. Update `start_url` in manifest.json to `"/"`
5. Update service worker paths to `"/"`

---

## Common Development Tasks

### Adding a New Exercise

**Option 1: Via UI** (Recommended for users)
1. Go to Exercises tab
2. Click "Add Exercise"
3. Enter name and aliases
4. Saved to IndexedDB as custom exercise

**Option 2: Add to Default List** (Recommended for common exercises)
1. Edit `exercises.js`
2. Add to `DEFAULT_EXERCISES` object:
   ```javascript
   "New Exercise": ["alias1", "alias2"],
   ```
3. Commit and push

### Modifying the Color Scheme

Edit CSS variables in `styles.css`:
```css
:root {
  --primary: #your-color;
  --primary-dark: #your-darker-color;
  ...
}
```

### Adding a New Tab

1. **HTML**: Add tab button and content section
2. **CSS**: Style the new tab content
3. **JavaScript**: Update `setupTabs()` in `app.js`
4. Add data loading logic for the tab

### Changing Analytics Charts

Edit `charts.js`:
- Modify chart configuration in `initProgressChart()` or `initVolumeChart()`
- Update data queries in `storage.js` if needed
- Chart.js docs: https://www.chartjs.org/docs/latest/

### Adding Import Functionality

Currently only export is implemented. To add import:

1. **UI**: Add import button in header
2. **File Input**: Create `<input type="file" accept=".json">`
3. **Handler**:
   ```javascript
   async handleImport(file) {
     const json = await file.text();
     const data = JSON.parse(json);
     await storageManager.importData(data);
     await loadAllData();
   }
   ```
4. Update `storageManager.importData()` to merge data instead of replacing

### Bumping Service Worker Cache

When updating assets:
1. Edit `service-worker.js`
2. Change `CACHE_NAME` from `'workout-tracker-v2'` to `'workout-tracker-v3'`
3. Old cache will be deleted on activation
4. New cache will be created with updated assets

### Adding Rest Timer Feature

Example implementation:
1. Add timer UI to Log tab
2. Create `timer.js` module:
   ```javascript
   class TimerManager {
     duration = 60; // seconds
     remaining = 60;
     interval = null;

     start(onTick, onComplete) { ... }
     pause() { ... }
     reset() { ... }
   }
   ```
3. Integrate with workout completion
4. Add notification/sound when timer completes

---

## Troubleshooting

### Voice Recognition Issues

**Problem**: Voice input not working
**Solutions**:
- Check browser: Chrome/Edge/Firefox/Safari Desktop only
- Check permissions: Microphone must be allowed
- Check HTTPS: Voice API requires secure context
- iOS Safari: Known limitation, use manual input

**Problem**: Voice parsing incorrect
**Solutions**:
- Edit `voice.js` → `parseWorkoutInput()` regex patterns
- Add more aliases to exercises
- Improve speech clarity: "Three sets" vs "3 sets"

### PWA Installation Issues

**Problem**: "Add to Home Screen" not appearing
**Solutions**:
- Use Safari on iOS (not Chrome)
- Ensure HTTPS (GitHub Pages provides this)
- Check manifest.json is valid
- Check icons exist (icon-192.png, icon-512.png)

**Problem**: Icon not updating after change
**Solutions**:
- Remove app from home screen
- Clear Safari cache
- Re-add to home screen

**Problem**: Wrong start URL (missing /workout-tracker/)
**Solutions**:
- Ensure `manifest.json` has `"start_url": "./"`
- Ensure `service-worker.js` uses relative paths
- Hard refresh after pushing changes

### Data Loss Issues

**Problem**: Workouts disappeared
**Causes**:
- Cleared Safari website data
- Private browsing mode
- Different browser/device

**Prevention**:
- Export data regularly (download icon)
- Educate users: "Clear History" ≠ "Clear Website Data"
- Add backup reminder to UI

**Problem**: Can't delete default exercise
**Solution**: This is intentional. Edit `exercises.js` to remove from `DEFAULT_EXERCISES`

### Performance Issues

**Problem**: App slow with many workouts
**Solutions**:
- IndexedDB handles thousands of entries efficiently
- Consider pagination in History tab if >1000 workouts
- Lazy load workout cards
- Optimize `getWorkoutsByDay()` query

**Problem**: Charts rendering slowly
**Solutions**:
- Limit data points (e.g., last 100 entries)
- Use Chart.js decimation plugin
- Debounce chart updates

---

## Future Enhancements

### High Priority
- [ ] **Import Data**: Allow JSON import to restore backups
- [ ] **Rest Timer**: Count down between sets
- [ ] **Workout Templates**: Save and reuse workout routines
- [ ] **Kg/Lbs Toggle**: Support multiple weight units

### Medium Priority
- [ ] **Exercise Photos**: Attach form check photos to workouts
- [ ] **Personal Records**: Track PRs (1RM, max volume, etc.)
- [ ] **Calendar View**: Visual calendar with workout days highlighted
- [ ] **Search**: Search workouts by exercise, date, notes
- [ ] **Dark Mode**: Theme toggle

### Low Priority
- [ ] **Social Sharing**: Share workouts to social media
- [ ] **Cloud Sync**: Optional cloud backup (Firebase/Supabase)
- [ ] **Multi-User**: Support multiple profiles
- [ ] **API Integrations**: Sync with Fitbit, Apple Health, etc.
- [ ] **Advanced Analytics**: 1RM calculators, volume load, tonnage

---

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari Desktop | Safari iOS | Chrome iOS |
|---------|--------|------|---------|----------------|------------|------------|
| Core App | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voice Input | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |

**Notes**:
- iOS Chrome/Edge use Safari engine, inherit Safari limitations
- Voice input fallback to manual form works everywhere
- PWA install on Chrome iOS possible but limited

---

## Data Persistence & Privacy

### What Gets Stored Locally

**IndexedDB** (persists until manually cleared):
- All workout entries
- Custom exercises and aliases

**Service Worker Cache** (refreshes on updates):
- HTML, CSS, JavaScript files
- Chart.js library
- App icons

### What Does NOT Get Stored

- No personal information collected
- No analytics/tracking
- No cookies
- No server communication (100% offline after first load)

### Data Security

- All data stored locally on device
- No transmission to servers
- Export creates local JSON file
- User has full control over data

### GDPR Compliance

- No data collection = no GDPR concerns
- Users can delete all data (Clear All button)
- Export allows data portability

---

## Development Guidelines

### Code Style

- **JavaScript**: ES6+, async/await for promises
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: Document complex logic, not obvious code
- **Error Handling**: Try/catch on all async operations
- **Console Logs**: Keep for debugging, can be removed in production

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "Add new feature: description"
git push origin feature/new-feature

# Merge to main
git checkout main
git merge feature/new-feature
git push origin main
```

### Testing Checklist

Before pushing:
- [ ] Test voice input (Chrome/Edge)
- [ ] Test manual form submission
- [ ] Test edit/delete workout
- [ ] Test export data
- [ ] Test offline mode (disable network in DevTools)
- [ ] Test PWA install (Safari iOS)
- [ ] Test on mobile viewport
- [ ] Check browser console for errors
- [ ] Verify service worker updates correctly

---

## Dependencies

### External Libraries

1. **Chart.js 4.4.0**
   - Purpose: Analytics charts
   - Source: CDN (https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js)
   - License: MIT
   - Why: Most popular, easy to use, well-documented

### No Other Dependencies

- Pure vanilla JavaScript
- No npm, webpack, babel
- No jQuery, React, Vue, etc.
- No CSS frameworks (custom CSS)

---

## Version History

**v2** (2025-12-30)
- Fixed PWA paths for GitHub Pages subdirectory
- Changed manifest start_url from "/" to "./"
- Updated service worker cache paths to relative

**v1** (2025-12-29)
- Initial release
- Voice input with manual fallback
- 70+ exercise database
- IndexedDB storage
- Analytics with Chart.js
- PWA with offline support
- Export functionality

---

## License

MIT License - Free to use, modify, and distribute.

---

## Credits

**Author**: Joe Petrides
**Repository**: https://github.com/jpetrides/workout-tracker
**Built with**: Claude Code (Anthropic AI Assistant)

---

## Support

For bugs or feature requests:
- Open an issue on GitHub
- Or fork and submit a pull request

For questions about the code:
- Refer to this README
- Check inline code comments
- Review commit history for context

---

**Last Updated**: December 30, 2025
