let timeLeft;
let timerId = null;
let isRunning = false;

// Add these at the top of your script
const themeColors = {
    pomodoro: {
        background: 'url("bg/hachi.png")',
        timerBox: 'url("bg/hachi.png")'
    },
    'short-break': {
        background: 'url("bg/chii.png")',
        timerBox: 'url("bg/chii.png")'
    },
    'long-break': {
        background: 'url("bg/usa.png")',
        timerBox: 'url("bg/usa.png")'
    }
};

// Add color theme functionality
document.querySelectorAll('.color-btn').forEach(button => {
    button.addEventListener('click', () => {
        const color = button.dataset.color;
        const lighterColor = getLighterColor(color);
        
        document.documentElement.style.setProperty('--theme-color', color);
        document.documentElement.style.setProperty('--theme-color-light', lighterColor);
        
        // Update active button colors
        updateActiveButtonColors(color);
    });
});

function getLighterColor(color) {
    // Simple function to create a lighter version of the color
    return color + '80'; // Adding 50% opacity
}

function updateActiveButtonColors(color) {
    const style = document.createElement('style');
    style.textContent = `
        body .timer-options button.active {
            background-color: ${color};
        }
    `;
    document.head.appendChild(style);
}

// Initialize timer durations
let timerDurations = {
    pomodoro: 25,
    'short-break': 5,
    'long-break': 15
};

function setTimer(minutes, mode) {
    timerDurations[mode] = minutes;
    timeLeft = minutes * 60;
    updateDisplay();
    resetTimer();
    updateTheme(mode);
    updateTitle(timeLeft, mode);
}

function updateTheme(mode) {
    // Remove all theme classes from body
    document.body.classList.remove('pomodoro', 'short-break', 'long-break');
    // Add the selected theme class
    document.body.classList.add(mode);
    
    // Apply background images
    document.body.style.backgroundImage = themeColors[mode].background;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    
    // Update active state of buttons
    const buttons = document.querySelectorAll('.timer-options button');
    buttons.forEach(button => {
        if (button.getAttribute('onclick').includes(mode)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function toggleTimer() {
    const button = document.getElementById('mainButton');
    if (!isRunning) {
        startTimer();
        button.textContent = 'PAUSE';
    } else {
        pauseTimer();
        button.textContent = 'START';
    }
}

// Add notification handling at the start of your script
let notificationPermission = false;

// Function to request notification permission
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return;
    }

    Notification.requestPermission().then(permission => {
        notificationPermission = permission === "granted";
    });
}

// Function to send notification
function sendNotification(mode) {
    if (!notificationPermission) return;

    const notificationOptions = {
        icon: '/favicon.ico', // Add a path to your favicon or timer icon if you have one
        silent: false
    };

    if (mode === 'pomodoro') {
        new Notification("Time for a quick break!", notificationOptions);
    } else {
        new Notification("Time to focus!", notificationOptions);
    }
}

// Add at the start of your script
class SoundManager {
    constructor() {
        this.audio = new Audio();
        this.currentSound = 'una'; // Set default sound
        this.volume = 0.5;
        this.isTesting = false;
        this.repeatCount = 1;
        this.currentRepeat = 0;
        this.availableSounds = [
            { value: 'una', label: 'Una' },
            { value: 'unawa', label: 'Unawa' },
            { value: 'unayaha', label: 'Unayaha' },
            { value: 'uwa', label: 'Uwa' },
            { value: 'yaha', label: 'Yaha' },
            { value: 'oi', label: 'Oi' }
        ];
        
        this.initializeSoundSettings();
    }

    initializeSoundSettings() {
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        const alarmSelect = document.getElementById('alarmSound');
        const testButton = document.getElementById('testSound');
        const repeatSlider = document.getElementById('repeatSlider');
        const repeatValue = document.getElementById('repeatValue');

        // Populate alarm sound options
        this.availableSounds.forEach(sound => {
            const option = document.createElement('option');
            option.value = sound.value;
            option.textContent = sound.label;
            alarmSelect.appendChild(option);
        });

        // Set initial values
        volumeSlider.value = this.volume * 100;
        volumeValue.textContent = `${Math.round(this.volume * 100)}%`;
        alarmSelect.value = this.currentSound;
        repeatSlider.value = this.repeatCount;
        repeatValue.textContent = `${this.repeatCount}x`;

        // Add event listeners
        volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            volumeValue.textContent = `${e.target.value}%`;
            this.audio.volume = this.volume;
        });

        alarmSelect.addEventListener('change', (e) => {
            this.currentSound = e.target.value;
            this.loadSound();
        });

        testButton.addEventListener('click', () => {
            this.isTesting = true; // Set flag when testing
            this.playSound();
        });

        repeatSlider.addEventListener('input', (e) => {
            this.repeatCount = parseInt(e.target.value);
            repeatValue.textContent = `${this.repeatCount}x`;
        });

        // Load initial sound
        this.loadSound();
    }

    loadSound() {
        this.audio.src = `alarms/${this.currentSound}.mp3`;
        this.audio.volume = this.volume;
    }

    playSound() {
        this.audio.currentTime = 0;
        this.currentRepeat = 0;
        this.playNextRepeat();
    }

    playNextRepeat() {
        this.audio.play();
        
        if (!this.isTesting) {
            this.audio.onended = () => {
                this.currentRepeat++;
                if (this.currentRepeat < this.repeatCount) {
                    this.playNextRepeat();
                } else {
                    this.currentRepeat = 0;
                }
            };
        } else {
            this.audio.onended = () => {
                this.isTesting = false;
            };
        }
    }

    stopSound() {
        if (this.isTesting) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isTesting = false;
            this.currentRepeat = 0;
        }
    }
}

// Initialize sound manager
const soundManager = new SoundManager();

// Add at the start of your script
let autoBreakEnabled = false;
let autoPomodoroEnabled = false;

// Add to your initialization code
function initializeSettings() {
    // Initialize auto-switch settings
    const autoBreakSwitch = document.getElementById('autoBreakSwitch');
    const autoPomodoroSwitch = document.getElementById('autoPomodoroSwitch');

    autoBreakSwitch.addEventListener('change', (e) => {
        autoBreakEnabled = e.target.checked;
    });

    autoPomodoroSwitch.addEventListener('change', (e) => {
        autoPomodoroEnabled = e.target.checked;
    });
}

function saveSettings() {
    // Save timer durations
    const pomodoroTime = parseInt(document.getElementById('pomodoroTime').value);
    const shortBreakTime = parseInt(document.getElementById('shortBreakTime').value);
    const longBreakTime = parseInt(document.getElementById('longBreakTime').value);
    
    timerDurations = {
        pomodoro: pomodoroTime,
        'short-break': shortBreakTime,
        'long-break': longBreakTime
    };
    
    // Apply current theme
    const currentMode = document.body.classList[0];
    setTimer(timerDurations[currentMode], currentMode);
    
    // Sound settings are automatically saved through the SoundManager
    
    // Save auto-switch settings
    autoBreakEnabled = document.getElementById('autoBreakSwitch').checked;
    autoPomodoroEnabled = document.getElementById('autoPomodoroSwitch').checked;
    
    toggleSettings();
}

// Initialize with 25 minutes
setTimer(25, 'pomodoro');

// Add this to your window.onload or at the end of your script
initializeSettings();

// Add this to your window.onload or at the end of your script
requestNotificationPermission();

// Add these functions to manage the title
function updateTitle(time, mode) {
    const timeString = `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
    const message = mode === 'pomodoro' ? 'Time to focus!' : 'Time for a break!';
    document.title = `${timeString} - ${message}`;
}

// Also add click outside listener to close settings
document.addEventListener('click', (e) => {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsButton = document.getElementById('settingsButton');
    
    // If click is outside settings panel and settings button, and panel is open
    if (!settingsPanel.contains(e.target) && 
        !settingsButton.contains(e.target) && 
        settingsPanel.classList.contains('show')) {
        toggleSettings();
    }
});

// Modify the startTimer function
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        document.body.classList.add('timer-running');
        timerId = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                const currentMode = document.body.classList[0];
                sendNotification(currentMode);
                soundManager.playSound();
                resetTimer();
                const button = document.getElementById('mainButton');
                button.textContent = 'START';
                updateTitle(timerDurations[currentMode] * 60, currentMode);

                // Handle auto-switching
                if (currentMode === 'pomodoro' && autoBreakEnabled) {
                    // Auto-switch to short break
                    setTimeout(() => {
                        setTimer(timerDurations['short-break'], 'short-break');
                        startTimer();
                    }, 1000);
                } else if ((currentMode === 'short-break' || currentMode === 'long-break') && autoPomodoroEnabled) {
                    // Auto-switch to pomodoro
                    setTimeout(() => {
                        setTimer(timerDurations.pomodoro, 'pomodoro');
                        startTimer();
                    }, 1000);
                }
            }
        }, 1000);
    }
}

// Modify the pauseTimer function
function pauseTimer() {
    clearInterval(timerId);
    isRunning = false;
    document.body.classList.remove('timer-running');
}

// Modify the resetTimer function
function resetTimer() {
    pauseTimer();
    const currentMode = document.body.classList[0];
    updateTitle(timeLeft, currentMode);
    updateDisplay();
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = timeString;
    
    // Update title with current time and message
    const currentMode = document.body.classList[0];
    updateTitle(timeLeft, currentMode);
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('show');
    
    // If settings panel is being closed, stop any playing test sound
    if (!panel.classList.contains('show')) {
        soundManager.stopSound();
    }
}