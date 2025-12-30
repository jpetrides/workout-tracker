// IndexedDB Storage Manager
class StorageManager {
    constructor() {
        this.dbName = 'WorkoutTrackerDB';
        this.version = 1;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create workouts store
                if (!db.objectStoreNames.contains('workouts')) {
                    const workoutStore = db.createObjectStore('workouts', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    workoutStore.createIndex('date', 'date', { unique: false });
                    workoutStore.createIndex('exercise', 'exercise', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    // Ensure database is initialized
    async ensureDB() {
        if (!this.db) {
            await this.init();
        }
    }

    // Add a workout entry
    async addWorkout(workout) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workouts'], 'readwrite');
            const store = transaction.objectStore('workouts');

            const workoutData = {
                exercise: workout.exercise,
                sets: workout.sets,
                reps: workout.reps,
                weight: workout.weight || null,
                notes: workout.notes || '',
                date: workout.date || new Date().toISOString(),
                timestamp: Date.now()
            };

            const request = store.add(workoutData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all workouts
    async getAllWorkouts() {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workouts'], 'readonly');
            const store = transaction.objectStore('workouts');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get workouts for a specific date
    async getWorkoutsByDate(date) {
        await this.ensureDB();
        const allWorkouts = await this.getAllWorkouts();

        // Normalize date to YYYY-MM-DD format
        const targetDate = new Date(date).toISOString().split('T')[0];

        return allWorkouts.filter(workout => {
            const workoutDate = new Date(workout.date).toISOString().split('T')[0];
            return workoutDate === targetDate;
        });
    }

    // Get today's workouts
    async getTodaysWorkouts() {
        return this.getWorkoutsByDate(new Date());
    }

    // Get workouts grouped by date
    async getWorkoutsByDay() {
        const allWorkouts = await this.getAllWorkouts();
        const grouped = {};

        allWorkouts.forEach(workout => {
            const date = new Date(workout.date).toISOString().split('T')[0];
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(workout);
        });

        // Sort dates in descending order (most recent first)
        const sorted = {};
        Object.keys(grouped)
            .sort((a, b) => new Date(b) - new Date(a))
            .forEach(date => {
                sorted[date] = grouped[date];
            });

        return sorted;
    }

    // Update a workout
    async updateWorkout(id, updates) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workouts'], 'readwrite');
            const store = transaction.objectStore('workouts');
            const request = store.get(id);

            request.onsuccess = () => {
                const workout = request.result;
                if (!workout) {
                    reject(new Error('Workout not found'));
                    return;
                }

                // Update fields
                Object.assign(workout, updates);

                const updateRequest = store.put(workout);
                updateRequest.onsuccess = () => resolve(updateRequest.result);
                updateRequest.onerror = () => reject(updateRequest.error);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Delete a workout
    async deleteWorkout(id) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workouts'], 'readwrite');
            const store = transaction.objectStore('workouts');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Clear all workouts
    async clearAllWorkouts() {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workouts'], 'readwrite');
            const store = transaction.objectStore('workouts');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Get workouts for a specific exercise
    async getWorkoutsByExercise(exercise) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workouts'], 'readonly');
            const store = transaction.objectStore('workouts');
            const index = store.index('exercise');
            const request = index.getAll(exercise);

            request.onsuccess = () => {
                // Sort by date ascending
                const workouts = request.result.sort((a, b) =>
                    new Date(a.date) - new Date(b.date)
                );
                resolve(workouts);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Get analytics data
    async getAnalytics() {
        const allWorkouts = await this.getAllWorkouts();

        // Calculate total workouts (unique days)
        const uniqueDays = new Set(
            allWorkouts.map(w => new Date(w.date).toISOString().split('T')[0])
        );

        // Calculate total sets
        const totalSets = allWorkouts.reduce((sum, w) => sum + (w.sets || 0), 0);

        // Calculate total volume (sets * reps * weight)
        const totalVolume = allWorkouts.reduce((sum, w) => {
            const volume = (w.sets || 0) * (w.reps || 0) * (w.weight || 0);
            return sum + volume;
        }, 0);

        // Find most frequent exercise
        const exerciseCounts = {};
        allWorkouts.forEach(w => {
            exerciseCounts[w.exercise] = (exerciseCounts[w.exercise] || 0) + 1;
        });
        const favoriteExercise = Object.keys(exerciseCounts).reduce((a, b) =>
            exerciseCounts[a] > exerciseCounts[b] ? a : b
        , '-');

        // Get weekly volume data (last 8 weeks)
        const weeklyData = this.getWeeklyVolume(allWorkouts);

        return {
            totalWorkouts: uniqueDays.size,
            totalSets,
            totalVolume: Math.round(totalVolume),
            favoriteExercise,
            weeklyData
        };
    }

    // Get weekly volume data
    getWeeklyVolume(workouts) {
        const weeks = {};
        const now = new Date();
        const eightWeeksAgo = new Date(now.getTime() - (8 * 7 * 24 * 60 * 60 * 1000));

        workouts.forEach(workout => {
            const date = new Date(workout.date);
            if (date < eightWeeksAgo) return;

            // Get week number
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeks[weekKey]) {
                weeks[weekKey] = 0;
            }

            const volume = (workout.sets || 0) * (workout.reps || 0) * (workout.weight || 0);
            weeks[weekKey] += volume;
        });

        return weeks;
    }

    // Save custom exercises
    async saveCustomExercises(exercises) {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');

            const request = store.put({
                key: 'customExercises',
                value: exercises
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Get custom exercises
    async getCustomExercises() {
        await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get('customExercises');

            request.onsuccess = () => {
                resolve(request.result ? request.result.value : {});
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Export all data as JSON
    async exportData() {
        const workouts = await this.getAllWorkouts();
        const customExercises = await this.getCustomExercises();

        return {
            version: this.version,
            exportDate: new Date().toISOString(),
            workouts,
            customExercises
        };
    }

    // Import data from JSON
    async importData(data) {
        await this.ensureDB();

        // Import workouts
        if (data.workouts && Array.isArray(data.workouts)) {
            const transaction = this.db.transaction(['workouts'], 'readwrite');
            const store = transaction.objectStore('workouts');

            for (const workout of data.workouts) {
                // Remove id to let autoIncrement handle it
                const { id, ...workoutData } = workout;
                store.add(workoutData);
            }
        }

        // Import custom exercises
        if (data.customExercises) {
            await this.saveCustomExercises(data.customExercises);
        }
    }
}

// Global instance
const storageManager = new StorageManager();

// Initialize on load
storageManager.init().catch(console.error);
