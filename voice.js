// Voice Recognition Manager
class VoiceManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = this.checkSupport();
        this.onResultCallback = null;
        this.onErrorCallback = null;
    }

    // Check if Web Speech API is supported
    checkSupport() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    // Initialize speech recognition
    init() {
        if (!this.isSupported) {
            console.warn('Speech recognition not supported in this browser');
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Voice input:', transcript);
            this.handleResult(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            if (this.onErrorCallback) {
                this.onErrorCallback(event.error);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateUI();
        };

        return true;
    }

    // Start listening
    start(onResult, onError) {
        if (!this.isSupported) {
            if (onError) {
                onError('not_supported');
            }
            return false;
        }

        if (!this.recognition) {
            this.init();
        }

        this.onResultCallback = onResult;
        this.onErrorCallback = onError;

        try {
            this.recognition.start();
            this.isListening = true;
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Error starting recognition:', error);
            if (onError) {
                onError(error.message);
            }
            return false;
        }
    }

    // Stop listening
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateUI();
        }
    }

    // Handle speech result
    handleResult(transcript) {
        const parsed = this.parseWorkoutInput(transcript);
        if (this.onResultCallback) {
            this.onResultCallback(parsed);
        }
    }

    // Parse workout input from speech
    parseWorkoutInput(text) {
        const normalized = text.toLowerCase().trim();

        // Initialize result object
        const result = {
            exercise: '',
            sets: null,
            reps: null,
            weight: null,
            raw: text
        };

        // Remove common filler words
        let cleaned = normalized.replace(/\b(um|uh|like|you know)\b/g, '');

        // Extract numbers
        const numbers = cleaned.match(/\d+/g);

        // Try to extract exercise name
        // Pattern: "exercise name, X sets, Y reps, Z pounds/lbs"
        // Or: "X sets Y reps Z pounds exercise name"

        // Look for keywords
        const setsMatch = cleaned.match(/(\d+)\s*(?:sets?|x)/i);
        const repsMatch = cleaned.match(/(\d+)\s*(?:reps?|repetitions?)/i);
        const weightMatch = cleaned.match(/(\d+)\s*(?:pounds?|lbs?|kilos?|kg)/i);

        if (setsMatch) result.sets = parseInt(setsMatch[1]);
        if (repsMatch) result.reps = parseInt(repsMatch[1]);
        if (weightMatch) result.weight = parseInt(weightMatch[1]);

        // If we didn't find labeled numbers, assume order: sets, reps, weight
        if (!result.sets && !result.reps && !result.weight && numbers) {
            if (numbers.length >= 1) result.sets = parseInt(numbers[0]);
            if (numbers.length >= 2) result.reps = parseInt(numbers[1]);
            if (numbers.length >= 3) result.weight = parseInt(numbers[2]);
        }

        // Extract exercise name by removing number-related phrases
        let exerciseName = cleaned
            .replace(/\d+\s*(?:sets?|x)/gi, '')
            .replace(/\d+\s*(?:reps?|repetitions?)/gi, '')
            .replace(/\d+\s*(?:pounds?|lbs?|kilos?|kg)/gi, '')
            .replace(/\d+/g, '')
            .replace(/[,]/g, '')
            .trim();

        // Remove common connecting words
        exerciseName = exerciseName
            .replace(/\b(at|with|for|of|and)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Try to match exercise from database
        const matchedExercise = exerciseManager.findExercise(exerciseName);
        result.exercise = matchedExercise || this.capitalizeWords(exerciseName);

        return result;
    }

    // Update UI based on listening state
    updateUI() {
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceText = document.getElementById('voiceText');

        if (!voiceBtn || !voiceText) return;

        if (this.isListening) {
            voiceBtn.classList.add('listening');
            voiceText.textContent = 'Listening...';
        } else {
            voiceBtn.classList.remove('listening');
            voiceText.textContent = this.isSupported ? 'Tap to speak' : 'Type manually below';
        }
    }

    // Utility: Capitalize words
    capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }
}

// Global instance
const voiceManager = new VoiceManager();
