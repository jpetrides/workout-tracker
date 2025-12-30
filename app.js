// Main App Controller
class WorkoutApp {
    constructor() {
        this.currentTab = 'log';
        this.modal = null;
        this.editingWorkoutId = null;
    }

    // Initialize the app
    async init() {
        // Wait for storage to be ready
        await storageManager.init();
        await exerciseManager.loadCustomExercises();

        // Initialize UI elements
        this.setupTabs();
        this.setupVoiceInput();
        this.setupManualForm();
        this.setupModal();
        this.setupExport();
        this.setupExerciseAutocomplete();

        // Load initial data
        await this.loadTodaysWorkouts();
        await this.loadHistory();

        // Initialize charts
        chartsManager.init();

        console.log('Workout Tracker initialized');
    }

    // Setup tab navigation
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;

                // Update active states
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(`${tabName}-tab`).classList.add('active');

                this.currentTab = tabName;

                // Load data for specific tabs
                if (tabName === 'history') {
                    this.loadHistory();
                } else if (tabName === 'analytics') {
                    chartsManager.updateAnalytics();
                } else if (tabName === 'exercises') {
                    this.loadExercisesList();
                }
            });
        });
    }

    // Setup voice input
    setupVoiceInput() {
        const voiceBtn = document.getElementById('voiceBtn');

        voiceBtn.addEventListener('click', () => {
            if (!voiceManager.isSupported) {
                this.showNotification('Voice input not supported. Please use manual entry.', 'error');
                return;
            }

            if (voiceManager.isListening) {
                voiceManager.stop();
            } else {
                voiceManager.start(
                    (result) => this.handleVoiceResult(result),
                    (error) => this.handleVoiceError(error)
                );
            }
        });
    }

    // Handle voice recognition result
    handleVoiceResult(result) {
        console.log('Parsed workout:', result);

        // Show confirmation modal
        this.showWorkoutConfirmation(result);
    }

    // Handle voice recognition error
    handleVoiceError(error) {
        console.error('Voice error:', error);
        if (error === 'not_supported') {
            this.showNotification('Voice input not supported on this device', 'error');
        } else {
            this.showNotification('Could not understand. Please try again.', 'error');
        }
    }

    // Show workout confirmation modal
    showWorkoutConfirmation(workout) {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalConfirm = document.getElementById('modalConfirm');

        modalTitle.textContent = 'Confirm Workout Entry';

        modalBody.innerHTML = `
            <div class="form-group">
                <label>Exercise</label>
                <input type="text" id="confirmExercise" value="${workout.exercise || ''}" class="form-group input">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Sets</label>
                    <input type="number" id="confirmSets" value="${workout.sets || ''}" class="form-group input">
                </div>
                <div class="form-group">
                    <label>Reps</label>
                    <input type="number" id="confirmReps" value="${workout.reps || ''}" class="form-group input">
                </div>
            </div>
            <div class="form-group">
                <label>Weight (lbs)</label>
                <input type="number" id="confirmWeight" value="${workout.weight || ''}" class="form-group input">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <input type="text" id="confirmNotes" value="" class="form-group input">
            </div>
        `;

        modalConfirm.onclick = () => this.confirmWorkout();
        this.openModal();
    }

    // Confirm and save workout
    async confirmWorkout() {
        const exercise = document.getElementById('confirmExercise').value.trim();
        const sets = parseInt(document.getElementById('confirmSets').value);
        const reps = parseInt(document.getElementById('confirmReps').value);
        const weight = parseFloat(document.getElementById('confirmWeight').value) || null;
        const notes = document.getElementById('confirmNotes').value.trim();

        if (!exercise || !sets || !reps) {
            this.showNotification('Please fill in exercise, sets, and reps', 'error');
            return;
        }

        try {
            await storageManager.addWorkout({
                exercise,
                sets,
                reps,
                weight,
                notes
            });

            this.closeModal();
            this.showNotification('Workout logged!', 'success');
            await this.loadTodaysWorkouts();
        } catch (error) {
            console.error('Error saving workout:', error);
            this.showNotification('Error saving workout', 'error');
        }
    }

    // Setup manual form
    setupManualForm() {
        const form = document.getElementById('manualForm');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const exercise = document.getElementById('exerciseInput').value.trim();
            const sets = parseInt(document.getElementById('setsInput').value);
            const reps = parseInt(document.getElementById('repsInput').value);
            const weight = parseFloat(document.getElementById('weightInput').value) || null;
            const notes = document.getElementById('notesInput').value.trim();

            if (!exercise || !sets || !reps) {
                this.showNotification('Please fill in exercise, sets, and reps', 'error');
                return;
            }

            // Match exercise from database
            const matchedExercise = exerciseManager.findExercise(exercise) || exercise;

            try {
                await storageManager.addWorkout({
                    exercise: matchedExercise,
                    sets,
                    reps,
                    weight,
                    notes
                });

                this.showNotification('Workout logged!', 'success');
                form.reset();
                await this.loadTodaysWorkouts();
            } catch (error) {
                console.error('Error saving workout:', error);
                this.showNotification('Error saving workout', 'error');
            }
        });
    }

    // Setup exercise autocomplete
    setupExerciseAutocomplete() {
        const datalist = document.getElementById('exerciseList');
        const exercises = exerciseManager.getExerciseNames();

        exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            datalist.appendChild(option);
        });
    }

    // Load today's workouts
    async loadTodaysWorkouts() {
        const container = document.getElementById('todayList');
        const workouts = await storageManager.getTodaysWorkouts();

        if (workouts.length === 0) {
            container.innerHTML = '<p class="empty-state">No exercises logged yet</p>';
            return;
        }

        container.innerHTML = workouts.map(workout => this.createWorkoutItemHTML(workout)).join('');

        // Setup delete and edit buttons
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteWorkout(parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editWorkout(parseInt(btn.dataset.id)));
        });
    }

    // Create workout item HTML
    createWorkoutItemHTML(workout) {
        return `
            <div class="workout-item">
                <div class="workout-item-header">
                    <div class="workout-item-name">${workout.exercise}</div>
                    <div class="workout-item-actions">
                        <button class="edit-btn" data-id="${workout.id}">Edit</button>
                        <button class="delete-btn" data-id="${workout.id}">Delete</button>
                    </div>
                </div>
                <div class="workout-item-details">
                    ${workout.sets} sets × ${workout.reps} reps
                    ${workout.weight ? ` @ ${workout.weight} lbs` : ''}
                </div>
                ${workout.notes ? `<div class="workout-item-notes">${workout.notes}</div>` : ''}
            </div>
        `;
    }

    // Load workout history
    async loadHistory() {
        const container = document.getElementById('historyList');
        const workoutsByDay = await storageManager.getWorkoutsByDay();

        if (Object.keys(workoutsByDay).length === 0) {
            container.innerHTML = '<p class="empty-state">No workout history yet</p>';
            return;
        }

        const html = Object.entries(workoutsByDay).map(([date, workouts]) => {
            const dateObj = new Date(date);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const workoutsHTML = workouts.map(w => this.createWorkoutItemHTML(w)).join('');

            return `
                <div class="history-day">
                    <div class="history-day-header">${formattedDate}</div>
                    ${workoutsHTML}
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Setup delete and edit buttons
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteWorkout(parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editWorkout(parseInt(btn.dataset.id)));
        });

        // Setup clear all button
        document.getElementById('clearHistoryBtn').onclick = () => this.clearAllHistory();
    }

    // Edit workout
    async editWorkout(id) {
        const allWorkouts = await storageManager.getAllWorkouts();
        const workout = allWorkouts.find(w => w.id === id);

        if (!workout) return;

        this.editingWorkoutId = id;

        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalConfirm = document.getElementById('modalConfirm');

        modalTitle.textContent = 'Edit Workout';

        modalBody.innerHTML = `
            <div class="form-group">
                <label>Exercise</label>
                <input type="text" id="editExercise" value="${workout.exercise}" class="form-group input">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Sets</label>
                    <input type="number" id="editSets" value="${workout.sets}" class="form-group input">
                </div>
                <div class="form-group">
                    <label>Reps</label>
                    <input type="number" id="editReps" value="${workout.reps}" class="form-group input">
                </div>
            </div>
            <div class="form-group">
                <label>Weight (lbs)</label>
                <input type="number" id="editWeight" value="${workout.weight || ''}" class="form-group input">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <input type="text" id="editNotes" value="${workout.notes || ''}" class="form-group input">
            </div>
        `;

        modalConfirm.onclick = () => this.saveEditedWorkout();
        this.openModal();
    }

    // Save edited workout
    async saveEditedWorkout() {
        const exercise = document.getElementById('editExercise').value.trim();
        const sets = parseInt(document.getElementById('editSets').value);
        const reps = parseInt(document.getElementById('editReps').value);
        const weight = parseFloat(document.getElementById('editWeight').value) || null;
        const notes = document.getElementById('editNotes').value.trim();

        if (!exercise || !sets || !reps) {
            this.showNotification('Please fill in exercise, sets, and reps', 'error');
            return;
        }

        try {
            await storageManager.updateWorkout(this.editingWorkoutId, {
                exercise,
                sets,
                reps,
                weight,
                notes
            });

            this.closeModal();
            this.editingWorkoutId = null;
            this.showNotification('Workout updated!', 'success');
            await this.loadTodaysWorkouts();
            await this.loadHistory();
        } catch (error) {
            console.error('Error updating workout:', error);
            this.showNotification('Error updating workout', 'error');
        }
    }

    // Delete workout
    async deleteWorkout(id) {
        if (!confirm('Delete this workout entry?')) return;

        try {
            await storageManager.deleteWorkout(id);
            this.showNotification('Workout deleted', 'success');
            await this.loadTodaysWorkouts();
            await this.loadHistory();
        } catch (error) {
            console.error('Error deleting workout:', error);
            this.showNotification('Error deleting workout', 'error');
        }
    }

    // Clear all history
    async clearAllHistory() {
        if (!confirm('Delete ALL workout history? This cannot be undone!')) return;

        try {
            await storageManager.clearAllWorkouts();
            this.showNotification('History cleared', 'success');
            await this.loadTodaysWorkouts();
            await this.loadHistory();
        } catch (error) {
            console.error('Error clearing history:', error);
            this.showNotification('Error clearing history', 'error');
        }
    }

    // Load exercises list (for management)
    async loadExercisesList() {
        const container = document.getElementById('exercisesList');
        const searchInput = document.getElementById('exerciseSearch');
        const addBtn = document.getElementById('addExerciseBtn');

        const allExercises = exerciseManager.getAllExercises();
        let filteredExercises = Object.entries(allExercises);

        const renderList = () => {
            if (filteredExercises.length === 0) {
                container.innerHTML = '<p class="empty-state">No exercises found</p>';
                return;
            }

            container.innerHTML = filteredExercises.map(([name, aliases]) => {
                const isCustom = exerciseManager.isCustom(name);
                return `
                    <div class="exercise-item">
                        <div class="exercise-item-content">
                            <div class="exercise-item-name">${name}</div>
                            <div class="exercise-item-aliases">
                                Aliases: ${aliases.join(', ') || 'none'}
                            </div>
                        </div>
                        <div class="exercise-item-actions">
                            <button class="edit-exercise-btn" data-name="${name}">Edit</button>
                            ${isCustom ? `<button class="delete-exercise-btn" data-name="${name}">Delete</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            // Setup buttons
            container.querySelectorAll('.edit-exercise-btn').forEach(btn => {
                btn.addEventListener('click', () => this.editExercise(btn.dataset.name));
            });

            container.querySelectorAll('.delete-exercise-btn').forEach(btn => {
                btn.addEventListener('click', () => this.deleteExercise(btn.dataset.name));
            });
        };

        // Search functionality
        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase();
            filteredExercises = Object.entries(allExercises).filter(([name, aliases]) => {
                return name.toLowerCase().includes(query) ||
                       aliases.some(alias => alias.includes(query));
            });
            renderList();
        };

        // Add exercise button
        addBtn.onclick = () => this.addNewExercise();

        renderList();
    }

    // Add new exercise
    addNewExercise() {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalConfirm = document.getElementById('modalConfirm');

        modalTitle.textContent = 'Add Exercise';

        modalBody.innerHTML = `
            <div class="form-group">
                <label>Exercise Name</label>
                <input type="text" id="newExerciseName" class="form-group input" placeholder="e.g., Cable Crossover">
            </div>
            <div class="form-group">
                <label>Aliases (comma-separated)</label>
                <input type="text" id="newExerciseAliases" class="form-group input" placeholder="e.g., crossover, cable cross">
            </div>
        `;

        modalConfirm.onclick = async () => {
            const name = document.getElementById('newExerciseName').value.trim();
            const aliasesStr = document.getElementById('newExerciseAliases').value.trim();
            const aliases = aliasesStr ? aliasesStr.split(',').map(a => a.trim()) : [];

            if (!name) {
                this.showNotification('Please enter exercise name', 'error');
                return;
            }

            try {
                await exerciseManager.addExercise(name, aliases);
                this.closeModal();
                this.showNotification('Exercise added!', 'success');
                await this.loadExercisesList();
                this.setupExerciseAutocomplete();
            } catch (error) {
                console.error('Error adding exercise:', error);
                this.showNotification('Error adding exercise', 'error');
            }
        };

        this.openModal();
    }

    // Edit exercise
    editExercise(name) {
        const aliases = exerciseManager.getAliases(name);

        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalConfirm = document.getElementById('modalConfirm');

        modalTitle.textContent = 'Edit Exercise';

        modalBody.innerHTML = `
            <div class="form-group">
                <label>Exercise Name</label>
                <input type="text" id="editExerciseName" class="form-group input" value="${name}" readonly>
            </div>
            <div class="form-group">
                <label>Aliases (comma-separated)</label>
                <input type="text" id="editExerciseAliases" class="form-group input" value="${aliases.join(', ')}">
            </div>
        `;

        modalConfirm.onclick = async () => {
            const aliasesStr = document.getElementById('editExerciseAliases').value.trim();
            const newAliases = aliasesStr ? aliasesStr.split(',').map(a => a.trim()) : [];

            try {
                await exerciseManager.updateExercise(name, newAliases);
                this.closeModal();
                this.showNotification('Exercise updated!', 'success');
                await this.loadExercisesList();
            } catch (error) {
                console.error('Error updating exercise:', error);
                this.showNotification('Error updating exercise', 'error');
            }
        };

        this.openModal();
    }

    // Delete exercise
    async deleteExercise(name) {
        if (!confirm(`Delete exercise "${name}"?`)) return;

        try {
            const success = await exerciseManager.deleteExercise(name);
            if (success) {
                this.showNotification('Exercise deleted', 'success');
                await this.loadExercisesList();
                this.setupExerciseAutocomplete();
            } else {
                this.showNotification('Cannot delete default exercises', 'error');
            }
        } catch (error) {
            console.error('Error deleting exercise:', error);
            this.showNotification('Error deleting exercise', 'error');
        }
    }

    // Setup export functionality
    setupExport() {
        document.getElementById('exportBtn').addEventListener('click', async () => {
            try {
                const data = await storageManager.exportData();
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `workout-data-${new Date().toISOString().split('T')[0]}.json`;
                a.click();

                URL.revokeObjectURL(url);
                this.showNotification('Data exported!', 'success');
            } catch (error) {
                console.error('Error exporting data:', error);
                this.showNotification('Error exporting data', 'error');
            }
        });
    }

    // Modal functions
    setupModal() {
        this.modal = document.getElementById('modal');

        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.classList.add('active');
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.editingWorkoutId = null;
    }

    // Show notification (simple version)
    showNotification(message, type = 'info') {
        // For now, just use alert - could be improved with toast notifications
        if (type === 'error') {
            alert('Error: ' + message);
        } else {
            console.log(message);
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', async () => {
    app = new WorkoutApp();
    await app.init();
});
