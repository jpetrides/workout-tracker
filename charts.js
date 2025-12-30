// Charts Manager for Analytics
class ChartsManager {
    constructor() {
        this.progressChart = null;
        this.volumeChart = null;
    }

    // Initialize charts
    init() {
        this.initProgressChart();
        this.initVolumeChart();
    }

    // Initialize progress chart (exercise-specific)
    initProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        this.progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Max Weight',
                    data: [],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' lbs';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Weight (lbs)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    }

    // Initialize volume chart (weekly)
    initVolumeChart() {
        const ctx = document.getElementById('volumeChart');
        if (!ctx) return;

        this.volumeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total Volume',
                    data: [],
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toLocaleString() + ' lbs';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Volume (lbs)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Week'
                        }
                    }
                }
            }
        });
    }

    // Update progress chart for specific exercise
    async updateProgressChart(exercise) {
        if (!this.progressChart || !exercise) return;

        const workouts = await storageManager.getWorkoutsByExercise(exercise);

        // Group by date and find max weight for each day
        const dailyMax = {};
        workouts.forEach(workout => {
            const date = new Date(workout.date).toISOString().split('T')[0];
            const weight = workout.weight || 0;

            if (!dailyMax[date] || weight > dailyMax[date]) {
                dailyMax[date] = weight;
            }
        });

        // Sort by date
        const dates = Object.keys(dailyMax).sort();
        const weights = dates.map(date => dailyMax[date]);

        // Format dates for display
        const labels = dates.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // Update chart
        this.progressChart.data.labels = labels;
        this.progressChart.data.datasets[0].data = weights;
        this.progressChart.data.datasets[0].label = `${exercise} - Max Weight`;
        this.progressChart.update();
    }

    // Update volume chart
    async updateVolumeChart(weeklyData) {
        if (!this.volumeChart) return;

        // Sort weeks chronologically
        const weeks = Object.keys(weeklyData).sort();
        const volumes = weeks.map(week => Math.round(weeklyData[week]));

        // Format week labels
        const labels = weeks.map(week => {
            const date = new Date(week);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // Update chart
        this.volumeChart.data.labels = labels;
        this.volumeChart.data.datasets[0].data = volumes;
        this.volumeChart.update();
    }

    // Update all analytics
    async updateAnalytics() {
        const analytics = await storageManager.getAnalytics();

        // Update stats cards
        document.getElementById('totalWorkouts').textContent = analytics.totalWorkouts;
        document.getElementById('totalSets').textContent = analytics.totalSets;
        document.getElementById('totalVolume').textContent = analytics.totalVolume.toLocaleString();
        document.getElementById('favoriteExercise').textContent = analytics.favoriteExercise;

        // Update volume chart
        await this.updateVolumeChart(analytics.weeklyData);

        // Populate exercise selector
        await this.updateExerciseSelector();
    }

    // Update exercise selector dropdown
    async updateExerciseSelector() {
        const select = document.getElementById('exerciseSelect');
        if (!select) return;

        // Get all unique exercises from workouts
        const allWorkouts = await storageManager.getAllWorkouts();
        const exercises = [...new Set(allWorkouts.map(w => w.exercise))].sort();

        // Clear and repopulate
        select.innerHTML = '<option value="">Select an exercise</option>';
        exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            option.textContent = exercise;
            select.appendChild(option);
        });

        // Set up change handler
        select.onchange = async (e) => {
            const exercise = e.target.value;
            if (exercise) {
                await this.updateProgressChart(exercise);
            } else {
                // Clear chart
                this.progressChart.data.labels = [];
                this.progressChart.data.datasets[0].data = [];
                this.progressChart.update();
            }
        };
    }

    // Destroy charts (cleanup)
    destroy() {
        if (this.progressChart) {
            this.progressChart.destroy();
            this.progressChart = null;
        }
        if (this.volumeChart) {
            this.volumeChart.destroy();
            this.volumeChart = null;
        }
    }
}

// Global instance
const chartsManager = new ChartsManager();
