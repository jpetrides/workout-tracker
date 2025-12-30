// Default exercise database with aliases
const DEFAULT_EXERCISES = {
    // Chest
    "Bench Press": ["bench", "flat bench", "barbell bench", "barbell bench press", "bb bench"],
    "Incline Bench Press": ["incline bench", "incline", "incline barbell"],
    "Decline Bench Press": ["decline bench", "decline", "decline barbell"],
    "Dumbbell Bench Press": ["db bench", "dumbbell bench", "db bench press"],
    "Incline Dumbbell Press": ["incline db", "incline dumbbell"],
    "Dumbbell Flyes": ["flyes", "db flyes", "flies", "dumbbell flies", "chest flyes"],
    "Cable Flyes": ["cable flies", "cable chest"],
    "Push-ups": ["pushups", "push up", "pushup"],
    "Chest Dips": ["dips", "dip", "chest dip"],

    // Back
    "Deadlift": ["deadlifts", "dead lift", "conventional deadlift", "dl"],
    "Barbell Row": ["bb row", "bent over row", "barbell rows", "bent row"],
    "Dumbbell Row": ["db row", "one arm row", "single arm row", "dumbbell rows"],
    "Pull-ups": ["pullups", "pull up", "pullup"],
    "Chin-ups": ["chinups", "chin up", "chinup"],
    "Lat Pulldown": ["lat pull down", "pulldown", "lat pulls"],
    "Seated Cable Row": ["cable row", "seated row", "cable rows"],
    "T-Bar Row": ["t bar", "tbar row"],
    "Face Pulls": ["face pull", "rear delt pull"],

    // Shoulders
    "Overhead Press": ["ohp", "shoulder press", "military press", "press"],
    "Dumbbell Shoulder Press": ["db press", "db shoulder press", "dumbbell press"],
    "Arnold Press": ["arnold", "arnold dumbbell press"],
    "Lateral Raises": ["lateral raise", "side raises", "side raise", "lat raise"],
    "Front Raises": ["front raise", "front delt raise"],
    "Rear Delt Flyes": ["rear delt", "reverse flyes", "rear flyes", "reverse flies"],
    "Upright Row": ["upright rows"],
    "Shrugs": ["shrug", "barbell shrugs", "dumbbell shrugs", "trap shrugs"],

    // Legs
    "Squats": ["squat", "back squat", "barbell squat"],
    "Front Squats": ["front squat"],
    "Leg Press": ["legpress"],
    "Leg Extension": ["leg extensions", "quad extension"],
    "Leg Curl": ["leg curls", "hamstring curl", "lying leg curl"],
    "Romanian Deadlift": ["rdl", "romanian", "stiff leg deadlift"],
    "Lunges": ["lunge", "walking lunges", "dumbbell lunges"],
    "Bulgarian Split Squat": ["bulgarian", "split squat"],
    "Calf Raises": ["calf raise", "standing calf", "seated calf"],
    "Hack Squat": ["hack squats"],

    // Arms - Biceps
    "Bicep Curls": ["curls", "bicep curl", "barbell curl", "bb curl"],
    "Dumbbell Curls": ["db curls", "dumbbell curl", "db bicep curl"],
    "Hammer Curls": ["hammer curl", "neutral grip curls"],
    "Preacher Curls": ["preacher curl", "preacher"],
    "Cable Curls": ["cable curl", "cable bicep curl"],
    "Concentration Curls": ["concentration curl"],
    "EZ Bar Curls": ["ez curl", "ez bar curl", "easy bar curl"],

    // Arms - Triceps
    "Tricep Pushdown": ["pushdown", "cable pushdown", "tricep pushdowns", "rope pushdown"],
    "Overhead Tricep Extension": ["overhead extension", "tricep extension", "skull crusher"],
    "Dumbbell Tricep Extension": ["db tricep extension"],
    "Close Grip Bench": ["close grip", "close grip bench press", "cgbp"],
    "Tricep Dips": ["tricep dip"],
    "Rope Extensions": ["rope extension", "rope overhead"],

    // Core
    "Plank": ["planks", "front plank"],
    "Side Plank": ["side planks"],
    "Crunches": ["crunch"],
    "Bicycle Crunches": ["bicycle crunch", "bicycle"],
    "Leg Raises": ["leg raise", "lying leg raise"],
    "Russian Twists": ["russian twist"],
    "Ab Wheel": ["ab roller", "rollout", "ab wheel rollout"],
    "Cable Crunches": ["cable crunch"],

    // Compound/Olympic
    "Clean and Jerk": ["clean jerk", "clean & jerk"],
    "Snatch": ["snatches"],
    "Power Clean": ["power cleans", "clean"],
    "Hang Clean": ["hang cleans"],

    // Cardio
    "Running": ["run", "jog", "jogging", "treadmill"],
    "Cycling": ["bike", "biking", "bicycle"],
    "Rowing": ["row machine", "erg", "rower"],
    "Jump Rope": ["jumping rope", "rope"],
    "Burpees": ["burpee"],
};

// Exercise manager class
class ExerciseManager {
    constructor() {
        this.customExercises = {};
        this.loadCustomExercises();
    }

    // Load custom exercises from IndexedDB
    async loadCustomExercises() {
        try {
            const stored = await storageManager.getCustomExercises();
            if (stored) {
                this.customExercises = stored;
            }
        } catch (error) {
            console.error('Error loading custom exercises:', error);
        }
    }

    // Get all exercises (default + custom)
    getAllExercises() {
        return { ...DEFAULT_EXERCISES, ...this.customExercises };
    }

    // Get list of all exercise names
    getExerciseNames() {
        return Object.keys(this.getAllExercises()).sort();
    }

    // Find exercise by name or alias
    findExercise(input) {
        const normalized = input.toLowerCase().trim();
        const allExercises = this.getAllExercises();

        // Check for exact match first
        for (const [name, aliases] of Object.entries(allExercises)) {
            if (name.toLowerCase() === normalized) {
                return name;
            }
        }

        // Check aliases
        for (const [name, aliases] of Object.entries(allExercises)) {
            if (aliases.some(alias => alias.toLowerCase() === normalized)) {
                return name;
            }
        }

        // Fuzzy match - check if input is contained in exercise name or vice versa
        for (const [name, aliases] of Object.entries(allExercises)) {
            const nameLower = name.toLowerCase();
            if (nameLower.includes(normalized) || normalized.includes(nameLower)) {
                return name;
            }

            // Check if input matches part of any alias
            for (const alias of aliases) {
                const aliasLower = alias.toLowerCase();
                if (aliasLower.includes(normalized) || normalized.includes(aliasLower)) {
                    return name;
                }
            }
        }

        // No match found - return the original input (will be treated as new exercise)
        return null;
    }

    // Add a new custom exercise
    async addExercise(name, aliases = []) {
        const normalizedName = this.capitalizeWords(name.trim());
        this.customExercises[normalizedName] = aliases.map(a => a.toLowerCase().trim());
        await this.saveCustomExercises();
        return normalizedName;
    }

    // Update an exercise's aliases
    async updateExercise(name, aliases) {
        const allExercises = this.getAllExercises();

        // Check if it's a default exercise
        if (DEFAULT_EXERCISES[name]) {
            // For default exercises, save the modification as custom
            this.customExercises[name] = aliases.map(a => a.toLowerCase().trim());
        } else {
            // Update custom exercise
            this.customExercises[name] = aliases.map(a => a.toLowerCase().trim());
        }

        await this.saveCustomExercises();
    }

    // Delete a custom exercise
    async deleteExercise(name) {
        // Can only delete custom exercises, not defaults
        if (this.customExercises[name]) {
            delete this.customExercises[name];
            await this.saveCustomExercises();
            return true;
        }
        return false;
    }

    // Save custom exercises to IndexedDB
    async saveCustomExercises() {
        try {
            await storageManager.saveCustomExercises(this.customExercises);
        } catch (error) {
            console.error('Error saving custom exercises:', error);
        }
    }

    // Utility: Capitalize first letter of each word
    capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    // Get aliases for an exercise
    getAliases(name) {
        const allExercises = this.getAllExercises();
        return allExercises[name] || [];
    }

    // Check if exercise is custom (not in defaults)
    isCustom(name) {
        return !DEFAULT_EXERCISES[name] && this.customExercises[name] !== undefined;
    }
}

// Global instance
const exerciseManager = new ExerciseManager();
