// ============ STATE MANAGEMENT ============
const appState = {
    sessionActive: false,
    sessionPaused: false,
    timeElapsed: 0,
    totalTime: 1500, // 25 minutes in seconds
    currentSession: 'study',
    currentTreeLevel: 1,
    todayStats: {
        focusTime: 0,
        sessionsCompleted: 0,
        treesGrown: 0,
        totalTrees: 0
    },
    settings: {
        focusDuration: 25,
        breakDuration: 5,
        notificationTime: 2,
        soundEnabled: true
    },
    schedule: [],
    notes: {},
    appsLog: [],
    timerInterval: null,
    notificationShown: false
};

// Tree data with 3D SVG representations
const TREES = {
    study: [
        { name: 'Sapling', level: 1, color: '#7cb342', symbol: '🌱' },
        { name: 'Young Tree', level: 2, color: '#8bc34a', symbol: '🌿' },
        { name: 'Tree', level: 3, color: '#9ccc65', symbol: '🌳' },
        { name: 'Mighty Oak', level: 4, color: '#52b788', symbol: '🌲' },
        { name: 'Ancient Forest', level: 5, color: '#2d5016', symbol: '🎋' }
    ],
    work: [
        { name: 'Sprout', level: 1, color: '#ff9800', symbol: '🌱' },
        { name: 'Seedling', level: 2, color: '#ff9100', symbol: '🌿' },
        { name: 'Sapling', level: 3, color: '#ff8500', symbol: '🌳' },
        { name: 'Redwood', level: 4, color: '#ff7500', symbol: '🌲' },
        { name: 'Ancient Redwood', level: 5, color: '#ff6500', symbol: '🎋' }
    ],
    creative: [
        { name: 'Bud', level: 1, color: '#e91e63', symbol: '🌱' },
        { name: 'Blooming Flower', level: 2, color: '#ec407a', symbol: '🌸' },
        { name: 'Flowering Tree', level: 3, color: '#f06292', symbol: '🌺' },
        { name: 'Blossom Paradise', level: 4, color: '#f48fb1', symbol: '🌼' },
        { name: 'Cherry Blossom', level: 5, color: '#f8bbd0', symbol: '🌸' }
    ],
    exercise: [
        { name: 'Sprout', level: 1, color: '#00bcd4', symbol: '🌱' },
        { name: 'Growing Plant', level: 2, color: '#00acc1', symbol: '🌿' },
        { name: 'Palm Tree', level: 3, color: '#0097a7', symbol: '🌴' },
        { name: 'Coconut Tree', level: 4, color: '#00838f', symbol: '🌴' },
        { name: 'Tropical Paradise', level: 5, color: '#006064', symbol: '🏝️' }
    ]
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadSettings();
    loadSchedule();
    loadDailyStats();
    setupEventListeners();
    updateTreeDisplay();
    initAchievements();
    startAppMonitoring();
    startScheduleChecker();
});

function initializeApp() {
    // Load from localStorage
    const saved = localStorage.getItem('forestAppState');
    if (saved) {
        Object.assign(appState, JSON.parse(saved));
    }
    
    // Reset daily stats if new day
    const lastDate = localStorage.getItem('lastSessionDate');
    const today = new Date().toDateString();
    if (lastDate !== today) {
        appState.todayStats = { focusTime: 0, sessionsCompleted: 0, treesGrown: 0, totalTrees: 0 };
        localStorage.setItem('lastSessionDate', today);
    }
}

function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Session buttons
    document.querySelectorAll('.session-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
            e.target.closest('.session-btn').classList.add('active');
            appState.currentSession = e.target.closest('.session-btn').dataset.session;
        });
    });

    // Modal close on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// ============ THEME TOGGLE ============
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isDark = !document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const icon = document.getElementById('themeToggle');
    icon.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// Load theme from localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
}

// ============ TIMER LOGIC ============
function startSession() {
    if (!appState.sessionActive) {
        appState.sessionActive = true;
        appState.sessionPaused = false;
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'flex';
        document.getElementById('resetBtn').disabled = true;
        
        // Start growing animation
        document.getElementById('treeSVG').classList.add('growing');
        
        appState.timerInterval = setInterval(updateTimer, 1000);
        showNotification('🌱 Focus session started!');
    }
}

function pauseSession() {
    appState.sessionPaused = !appState.sessionPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (appState.sessionPaused) {
        clearInterval(appState.timerInterval);
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        document.getElementById('treeSVG').classList.remove('growing');
    } else {
        appState.timerInterval = setInterval(updateTimer, 1000);
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        document.getElementById('treeSVG').classList.add('growing');
    }
}

function resetSession() {
    clearInterval(appState.timerInterval);
    appState.sessionActive = false;
    appState.sessionPaused = false;
    appState.timeElapsed = 0;
    document.getElementById('startBtn').style.display = 'flex';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('treeSVG').classList.remove('growing');
    updateTimerDisplay();
}

function updateTimer() {
    if (appState.sessionActive && !appState.sessionPaused) {
        appState.timeElapsed++;
        updateTimerDisplay();
        
        // Check for 2-hour notification
        if (appState.timeElapsed === appState.settings.notificationTime * 3600 && !appState.notificationShown) {
            showNotification(`⏰ You've been focusing for ${appState.settings.notificationTime} hours!`);
            appState.notificationShown = true;
            if (appState.settings.soundEnabled) playSound();
        }
        
        // Update tree level based on time
        updateTreeLevel();
        
        // Complete session at 25 minutes
        if (appState.timeElapsed >= appState.settings.focusDuration * 60) {
            completeSession();
        }
    }
}

function updateTimerDisplay() {
    const remaining = appState.settings.focusDuration * 60 - appState.timeElapsed;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    document.getElementById('timerDisplay').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateTreeLevel() {
    // Tree grows every 5 minutes
    const level = Math.floor(appState.timeElapsed / 300) + 1;
    appState.currentTreeLevel = Math.min(level, 5);
    updateTreeDisplay();
}

function completeSession() {
    clearInterval(appState.timerInterval);
    appState.sessionActive = false;
    appState.sessionPaused = false;
    appState.timeElapsed = 0;
    appState.notificationShown = false;
    document.getElementById('startBtn').style.display = 'flex';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('treeSVG').classList.remove('growing');
    
    // Update stats
    appState.todayStats.focusTime += appState.settings.focusDuration;
    appState.todayStats.sessionsCompleted++;
    appState.todayStats.treesGrown++;
    appState.todayStats.totalTrees++;
    
    updateTimerDisplay();
    updateStatsDisplay();
    saveState();
    
    showNotification(`🌳 Session complete! Tree grown!`);
    playSound();
}

// ============ TREE DISPLAY ============
function updateTreeDisplay() {
    const trees = TREES[appState.currentSession];
    const currentTree = trees[appState.currentTreeLevel - 1];
    
    document.getElementById('treeLevel').textContent = `Level ${currentTree.level}`;
    document.getElementById('treeName').textContent = currentTree.name;
    
    // Draw SVG tree
    const svg = document.getElementById('treeSVG');
    svg.innerHTML = drawTree(appState.currentTreeLevel, currentTree.color);
}

function drawTree(level, color) {
    const trunk = `<rect x="85" y="120" width="30" height="60" fill="#8B4513" rx="5"/>`;
    
    const canopies = [
        // Level 1: Sapling
        `<circle cx="100" cy="100" r="25" fill="${color}"/>`,
        
        // Level 2: Young Tree
        `<circle cx="100" cy="90" r="30" fill="${color}"/>
         <circle cx="75" cy="110" r="20" fill="${color}"/>
         <circle cx="125" cy="110" r="20" fill="${color}"/>`,
        
        // Level 3: Tree
        `<circle cx="100" cy="80" r="35" fill="${color}"/>
         <circle cx="65" cy="105" r="25" fill="${color}"/>
         <circle cx="135" cy="105" r="25" fill="${color}"/>
         <circle cx="100" cy="120" r="20" fill="${color}"/>`,
        
        // Level 4: Mighty Tree
        `<circle cx="100" cy="70" r="40" fill="${color}"/>
         <circle cx="60" cy="100" r="30" fill="${color}"/>
         <circle cx="140" cy="100" r="30" fill="${color}"/>
         <circle cx="80" cy="130" r="25" fill="${color}"/>
         <circle cx="120" cy="130" r="25" fill="${color}"/>`,
        
        // Level 5: Ancient Tree
        `<circle cx="100" cy="60" r="45" fill="${color}"/>
         <circle cx="55" cy="95" r="35" fill="${color}"/>
         <circle cx="145" cy="95" r="35" fill="${color}"/>
         <circle cx="70" cy="130" r="30" fill="${color}"/>
         <circle cx="130" cy="130" r="30" fill="${color}"/>
         <circle cx="100" cy="140" r="25" fill="${color}"/>`
    ];
    
    const selectedCanopy = canopies[Math.min(level - 1, 4)];
    return trunk + selectedCanopy;
}

// ============ STATS ============
function updateStatsDisplay() {
    const hours = Math.floor(appState.todayStats.focusTime / 60);
    const minutes = appState.todayStats.focusTime % 60;
    document.getElementById('todayFocusTime').textContent = `${hours}h ${minutes}m`;
    document.getElementById('todaySessions').textContent = appState.todayStats.sessionsCompleted;
    document.getElementById('totalTreesGrown').textContent = appState.todayStats.treesGrown;
    document.getElementById('forestCount').textContent = appState.todayStats.totalTrees;
}

function loadDailyStats() {
    updateStatsDisplay();
}

// ============ NOTES ============
function saveNotes() {
    const notes = document.getElementById('notesInput').value;
    const date = new Date().toDateString();
    appState.notes[date] = notes;
    localStorage.setItem('forestAppNotes', JSON.stringify(appState.notes));
    showNotification('📝 Notes saved!');
}

// ============ APPS LOG ============
function startAppMonitoring() {
    // Monitor window focus (which app user is on)
    let lastApp = 'Forest Focus';
    
    setInterval(() => {
        if (appState.sessionActive && !appState.sessionPaused) {
            if (document.hidden) {
                lastApp = 'Away from Focus';
            } else {
                lastApp = 'Forest Focus';
            }
            
            // Log to apps
            if (!appState.appsLog.includes(lastApp)) {
                appState.appsLog.push({
                    app: lastApp,
                    time: new Date().toLocaleTimeString(),
                    focused: true
                });
            }
            
            updateAppsLog();
        }
    }, 60000); // Check every minute
}

function updateAppsLog() {
    const logDiv = document.getElementById('appsLog');
    if (appState.appsLog.length === 0) {
        logDiv.innerHTML = '<p style="color: var(--accent); text-align: center;">No apps detected yet</p>';
        return;
    }
    
    logDiv.innerHTML = appState.appsLog.map(log => `
        <div style="padding: 10px; background: rgba(82,183,136,0.1); border-radius: 8px; margin-bottom: 8px;">
            <div style="font-weight: 600; color: var(--secondary);">${log.app}</div>
            <div style="font-size: 0.85em; color: var(--accent);">${log.time}</div>
        </div>
    `).join('');
}

// ============ SCHEDULE ============
function saveSchedule() {
    const type = document.getElementById('scheduleType').value;
    const time = document.getElementById('scheduleTime').value;
    const days = Array.from(document.querySelectorAll('#scheduleModal input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    if (!time || days.length === 0) {
        showNotification('⚠️ Please select time and days');
        return;
    }
    
    appState.schedule.push({ type, time, days });
    localStorage.setItem('forestAppSchedule', JSON.stringify(appState.schedule));
    closeModal('scheduleModal');
    updateScheduleDisplay();
    showNotification('📅 Schedule saved!');
}

function updateScheduleDisplay() {
    const listDiv = document.getElementById('scheduleList');
    if (appState.schedule.length === 0) {
        listDiv.innerHTML = '<p style="color: var(--accent); text-align: center;">No scheduled sessions</p>';
        return;
    }
    
    listDiv.innerHTML = appState.schedule.map((sched, i) => `
        <div style="padding: 10px; background: rgba(82,183,136,0.1); border-radius: 8px; margin-bottom: 8px;">
            <div style="font-weight: 600; color: var(--secondary);">${sched.type.toUpperCase()} - ${sched.time}</div>
            <div style="font-size: 0.85em; color: var(--accent);">${sched.days.join(', ')}</div>
            <button class="control-btn btn-danger" style="margin-top: 8px; font-size: 0.8em; padding: 8px;" 
                onclick="deleteSchedule(${i})">Delete</button>
        </div>
    `).join('');
}

function deleteSchedule(index) {
    appState.schedule.splice(index, 1);
    localStorage.setItem('forestAppSchedule', JSON.stringify(appState.schedule));
    updateScheduleDisplay();
}

function loadSchedule() {
    const saved = localStorage.getItem('forestAppSchedule');
    if (saved) {
        appState.schedule = JSON.parse(saved);
        updateScheduleDisplay();
    }
}

function startScheduleChecker() {
    setInterval(() => {
        const now = new Date();
        const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
        const currentTime = now.toTimeString().slice(0, 5);
        
        appState.schedule.forEach(sched => {
            if (sched.days.includes(currentDay) && sched.time === currentTime) {
                showNotification(`⏰ Time for your ${sched.type} session!`);
                if (appState.settings.soundEnabled) playSound();
            }
        });
    }, 60000); // Check every minute
}

// ============ SETTINGS ============
function saveSettings() {
    appState.settings.focusDuration = parseInt(document.getElementById('focusDuration').value);
    appState.settings.breakDuration = parseInt(document.getElementById('breakDuration').value);
    appState.settings.notificationTime = parseInt(document.getElementById('notificationTime').value);
    appState.settings.soundEnabled = document.getElementById('soundEnabled').value === 'true';
    
    appState.totalTime = appState.settings.focusDuration * 60;
    
    localStorage.setItem('forestAppSettings', JSON.stringify(appState.settings));
    closeModal('settingsModal');
    updateTimerDisplay();
    showNotification('⚙️ Settings saved!');
}

function loadSettings() {
    const saved = localStorage.getItem('forestAppSettings');
    if (saved) {
        appState.settings = JSON.parse(saved);
    }
    
    document.getElementById('focusDuration').value = appState.settings.focusDuration;
    document.getElementById('breakDuration').value = appState.settings.breakDuration;
    document.getElementById('notificationTime').value = appState.settings.notificationTime;
    document.getElementById('soundEnabled').value = appState.settings.soundEnabled;
}

// ============ MODAL FUNCTIONS ============
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ============ TAB SWITCHING ============
function switchTab(event, tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// ============ ACHIEVEMENTS ============
function initAchievements() {
    const achievements = [
        { id: 'first', name: '🌱 First Tree', desc: 'Grow your first tree', locked: appState.todayStats.treesGrown === 0 },
        { id: 'tenTree', name: '🌲 10 Trees', desc: 'Grow 10 trees', locked: appState.todayStats.totalTrees < 10 },
        { id: 'marathon', name: '🏃 Marathon', desc: 'Focus for 2+ hours', locked: appState.todayStats.focusTime < 120 },
        { id: 'everyday', name: '🔥 Every Day', desc: 'Session every day for 7 days', locked: true },
        { id: 'creative', name: '🎨 Creative', desc: 'Grow 5 creative trees', locked: true }
    ];
    
    const achievementsList = document.getElementById('achievementsList');
    achievementsList.innerHTML = achievements.map(ach => `
        <div style="padding: 10px; background: rgba(82,183,136,${ach.locked ? '0.1' : '0.3'}); 
            border-radius: 8px; text-align: center; opacity: ${ach.locked ? '0.5' : '1'};">
            <div style="font-size: 1.5em; margin-bottom: 5px;">${ach.name.split(' ')[0]}</div>
            <div style="font-size: 0.75em; color: var(--accent);">${ach.desc}</div>
        </div>
    `).join('');
}

// ============ NOTIFICATIONS ============
function showNotification(message) {
    const notification = document.getElementById('notification');
    document.getElementById('notificationText').textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ============ SOUND ============
function playSound() {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// ============ SAVE STATE ============
function saveState() {
    localStorage.setItem('forestAppState', JSON.stringify(appState));
}

// Save state every 30 seconds
setInterval(saveState, 30000);

// Save state before unload
window.addEventListener('beforeunload', saveState);
