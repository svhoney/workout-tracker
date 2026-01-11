// ==========================================
// Workout Tracker App
// ==========================================

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}

// ==========================================
// Data Layer
// ==========================================

const Storage = {
  get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get today's date as string
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// ==========================================
// Default Exercises
// ==========================================

const DEFAULT_EXERCISES = [
  // Weight Training
  { id: 'bench-press', name: 'Bench Press', category: 'weight', defaultSets: 3, defaultReps: 10 },
  { id: 'squat', name: 'Squat', category: 'weight', defaultSets: 3, defaultReps: 10 },
  { id: 'deadlift', name: 'Deadlift', category: 'weight', defaultSets: 3, defaultReps: 8 },
  { id: 'overhead-press', name: 'Overhead Press', category: 'weight', defaultSets: 3, defaultReps: 10 },
  { id: 'barbell-row', name: 'Barbell Row', category: 'weight', defaultSets: 3, defaultReps: 10 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'weight', defaultSets: 3, defaultReps: 12 },
  { id: 'bicep-curl', name: 'Bicep Curl', category: 'weight', defaultSets: 3, defaultReps: 12 },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'weight', defaultSets: 3, defaultReps: 12 },
  { id: 'leg-press', name: 'Leg Press', category: 'weight', defaultSets: 3, defaultReps: 12 },
  { id: 'leg-curl', name: 'Leg Curl', category: 'weight', defaultSets: 3, defaultReps: 12 },
  { id: 'calf-raise', name: 'Calf Raise', category: 'weight', defaultSets: 3, defaultReps: 15 },
  { id: 'dumbbell-fly', name: 'Dumbbell Fly', category: 'weight', defaultSets: 3, defaultReps: 12 },
  { id: 'shoulder-lateral-raise', name: 'Lateral Raise', category: 'weight', defaultSets: 3, defaultReps: 15 },

  // Cardio
  { id: 'running', name: 'Running', category: 'cardio', defaultSets: 1, defaultReps: 1 },
  { id: 'cycling', name: 'Cycling', category: 'cardio', defaultSets: 1, defaultReps: 1 },
  { id: 'rowing', name: 'Rowing', category: 'cardio', defaultSets: 1, defaultReps: 1 },
  { id: 'jump-rope', name: 'Jump Rope', category: 'cardio', defaultSets: 3, defaultReps: 100 },
  { id: 'stair-climber', name: 'Stair Climber', category: 'cardio', defaultSets: 1, defaultReps: 1 },

  // Bodyweight
  { id: 'push-ups', name: 'Push-ups', category: 'bodyweight', defaultSets: 3, defaultReps: 15 },
  { id: 'pull-ups', name: 'Pull-ups', category: 'bodyweight', defaultSets: 3, defaultReps: 8 },
  { id: 'dips', name: 'Dips', category: 'bodyweight', defaultSets: 3, defaultReps: 10 },
  { id: 'lunges', name: 'Lunges', category: 'bodyweight', defaultSets: 3, defaultReps: 12 },
  { id: 'plank', name: 'Plank', category: 'bodyweight', defaultSets: 3, defaultReps: 60 },
  { id: 'burpees', name: 'Burpees', category: 'bodyweight', defaultSets: 3, defaultReps: 10 },
  { id: 'mountain-climbers', name: 'Mountain Climbers', category: 'bodyweight', defaultSets: 3, defaultReps: 20 },
  { id: 'crunches', name: 'Crunches', category: 'bodyweight', defaultSets: 3, defaultReps: 20 },
];

// ==========================================
// App State
// ==========================================

let exercises = Storage.get('exercises') || [...DEFAULT_EXERCISES];
let workouts = Storage.get('workouts') || [];
let currentWorkout = Storage.get('currentWorkout') || null;
let currentFilter = 'all';
let editingExerciseIndex = null;
let progressChart = null;
let selectedWorkoutId = null;

// Initialize exercises if first run
if (!Storage.get('exercises')) {
  Storage.set('exercises', exercises);
}

// ==========================================
// Navigation
// ==========================================

const screens = {
  today: { title: "Today's Workout", init: initTodayScreen },
  exercises: { title: 'Exercises', init: initExercisesScreen },
  history: { title: 'History', init: initHistoryScreen },
  progress: { title: 'Progress', init: initProgressScreen }
};

function navigateTo(screenName) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === screenName);
  });

  // Update screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(`${screenName}-screen`).classList.add('active');

  // Update title
  document.getElementById('page-title').textContent = screens[screenName].title;

  // Initialize screen
  screens[screenName].init();
}

// Setup navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.screen));
});

// ==========================================
// Today Screen
// ==========================================

function initTodayScreen() {
  const noWorkout = document.getElementById('no-workout');
  const currentWorkoutEl = document.getElementById('current-workout');

  if (currentWorkout && currentWorkout.exercises.length > 0) {
    noWorkout.style.display = 'none';
    currentWorkoutEl.style.display = 'block';
    renderCurrentWorkout();
  } else if (currentWorkout) {
    noWorkout.style.display = 'none';
    currentWorkoutEl.style.display = 'block';
    renderCurrentWorkout();
  } else {
    noWorkout.style.display = 'block';
    currentWorkoutEl.style.display = 'none';
  }
}

function startWorkout() {
  currentWorkout = {
    id: generateId(),
    date: getTodayString(),
    exercises: []
  };
  Storage.set('currentWorkout', currentWorkout);
  initTodayScreen();
}

function renderCurrentWorkout() {
  const container = document.getElementById('workout-exercises');

  if (currentWorkout.exercises.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Add your first exercise</p></div>';
    return;
  }

  container.innerHTML = currentWorkout.exercises.map((ex, index) => {
    const setsHtml = ex.sets.map((set, setIndex) => `
      <div class="set-row">
        <span class="set-number">Set ${setIndex + 1}</span>
        <span class="set-details">${set.reps} reps ${set.weight ? `@ ${set.weight} lbs` : ''}</span>
      </div>
    `).join('');

    const totalSets = ex.sets.length;
    const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0));
    const summary = maxWeight > 0
      ? `${totalSets} sets, max ${maxWeight} lbs`
      : `${totalSets} sets`;

    return `
      <div class="workout-exercise">
        <div class="workout-exercise-header" onclick="openLogSets(${index})">
          <div>
            <div class="workout-exercise-name">${ex.name}</div>
            <div class="workout-exercise-summary">${summary}</div>
          </div>
          <button class="delete-btn" onclick="event.stopPropagation(); removeExerciseFromWorkout(${index})">×</button>
        </div>
        <div class="workout-sets">
          ${setsHtml}
        </div>
      </div>
    `;
  }).join('');
}

function showAddExercise() {
  const modal = document.getElementById('add-exercise-modal');
  const list = document.getElementById('modal-exercise-list');

  list.innerHTML = exercises.map(ex => `
    <div class="exercise-item" onclick="addExerciseToWorkout('${ex.id}')">
      <div class="exercise-info">
        <div class="exercise-name">${ex.name}</div>
        <span class="exercise-category category-${ex.category}">${ex.category}</span>
      </div>
    </div>
  `).join('');

  modal.classList.add('active');
}

function addExerciseToWorkout(exerciseId) {
  const exercise = exercises.find(e => e.id === exerciseId);
  if (!exercise) return;

  // Create default sets
  const sets = [];
  for (let i = 0; i < exercise.defaultSets; i++) {
    sets.push({ reps: exercise.defaultReps, weight: 0 });
  }

  currentWorkout.exercises.push({
    exerciseId: exercise.id,
    name: exercise.name,
    category: exercise.category,
    sets: sets
  });

  Storage.set('currentWorkout', currentWorkout);
  closeModal('add-exercise-modal');
  renderCurrentWorkout();
}

function removeExerciseFromWorkout(index) {
  currentWorkout.exercises.splice(index, 1);
  Storage.set('currentWorkout', currentWorkout);
  renderCurrentWorkout();
}

function openLogSets(exerciseIndex) {
  editingExerciseIndex = exerciseIndex;
  const exercise = currentWorkout.exercises[exerciseIndex];

  document.getElementById('log-sets-title').textContent = exercise.name;

  const container = document.getElementById('sets-container');
  container.innerHTML = '';

  exercise.sets.forEach((set, index) => {
    addSetRowHtml(container, index + 1, set.reps, set.weight);
  });

  document.getElementById('log-sets-modal').classList.add('active');
}

function addSetRowHtml(container, setNum, reps = 10, weight = 0) {
  const row = document.createElement('div');
  row.className = 'set-input-row';
  row.innerHTML = `
    <span class="set-num">${setNum}</span>
    <input type="number" class="reps-input" value="${reps}" min="1" inputmode="numeric" pattern="[0-9]*">
    <span class="input-label">reps</span>
    <input type="number" class="weight-input" value="${weight}" min="0" inputmode="decimal" pattern="[0-9]*">
    <span class="input-label">lbs</span>
    <button class="remove-set" onclick="removeSetRow(this)">×</button>
  `;
  container.appendChild(row);
}

function addSetRow() {
  const container = document.getElementById('sets-container');
  const setNum = container.children.length + 1;
  const lastRow = container.lastElementChild;
  const lastReps = lastRow ? lastRow.querySelector('.reps-input').value : 10;
  const lastWeight = lastRow ? lastRow.querySelector('.weight-input').value : 0;
  addSetRowHtml(container, setNum, lastReps, lastWeight);
}

function removeSetRow(button) {
  const container = document.getElementById('sets-container');
  if (container.children.length > 1) {
    button.closest('.set-input-row').remove();
    // Renumber sets
    Array.from(container.children).forEach((row, index) => {
      row.querySelector('.set-num').textContent = index + 1;
    });
  }
}

function saveSets() {
  const container = document.getElementById('sets-container');
  const sets = Array.from(container.querySelectorAll('.set-input-row')).map(row => ({
    reps: parseInt(row.querySelector('.reps-input').value) || 0,
    weight: parseFloat(row.querySelector('.weight-input').value) || 0
  }));

  currentWorkout.exercises[editingExerciseIndex].sets = sets;
  Storage.set('currentWorkout', currentWorkout);
  closeModal('log-sets-modal');
  renderCurrentWorkout();
}

function finishWorkout() {
  if (currentWorkout.exercises.length === 0) {
    alert('Add at least one exercise before finishing.');
    return;
  }

  workouts.unshift(currentWorkout);
  Storage.set('workouts', workouts);
  currentWorkout = null;
  Storage.set('currentWorkout', null);
  initTodayScreen();
}

// ==========================================
// Exercises Screen
// ==========================================

function initExercisesScreen() {
  renderExerciseList();
  setupFilterTabs();
}

function setupFilterTabs() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderExerciseList();
    });
  });
}

function renderExerciseList() {
  const list = document.getElementById('exercise-list');
  const filtered = currentFilter === 'all'
    ? exercises
    : exercises.filter(e => e.category === currentFilter);

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No exercises found</p></div>';
    return;
  }

  list.innerHTML = filtered.map(ex => `
    <div class="exercise-item">
      <div class="exercise-info">
        <div class="exercise-name">${ex.name}</div>
        <div class="exercise-meta">
          <span class="exercise-category category-${ex.category}">${ex.category}</span>
          ${ex.defaultSets} sets × ${ex.defaultReps} reps
        </div>
      </div>
      ${!DEFAULT_EXERCISES.find(d => d.id === ex.id) ?
        `<button class="delete-btn" onclick="deleteExercise('${ex.id}')">×</button>` : ''}
    </div>
  `).join('');
}

function showCreateExercise() {
  document.getElementById('create-exercise-form').reset();
  document.getElementById('create-exercise-modal').classList.add('active');
}

function createExercise(event) {
  event.preventDefault();

  const name = document.getElementById('exercise-name').value.trim();
  const category = document.getElementById('exercise-category').value;
  const defaultSets = parseInt(document.getElementById('default-sets').value) || 3;
  const defaultReps = parseInt(document.getElementById('default-reps').value) || 10;

  if (!name) return;

  const newExercise = {
    id: generateId(),
    name,
    category,
    defaultSets,
    defaultReps
  };

  exercises.push(newExercise);
  Storage.set('exercises', exercises);
  closeModal('create-exercise-modal');
  renderExerciseList();
}

function deleteExercise(id) {
  if (confirm('Delete this exercise?')) {
    exercises = exercises.filter(e => e.id !== id);
    Storage.set('exercises', exercises);
    renderExerciseList();
  }
}

// ==========================================
// History Screen
// ==========================================

function initHistoryScreen() {
  const list = document.getElementById('history-list');

  if (workouts.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No workout history yet</p></div>';
    return;
  }

  list.innerHTML = workouts.map(workout => {
    const exerciseNames = workout.exercises.map(e => e.name).join(', ');
    return `
      <div class="history-item" onclick="showWorkoutDetail('${workout.id}')">
        <div class="history-date">${formatDate(workout.date)}</div>
        <div class="history-exercises">${exerciseNames || 'No exercises'}</div>
      </div>
    `;
  }).join('');
}

function showWorkoutDetail(workoutId) {
  selectedWorkoutId = workoutId;
  const workout = workouts.find(w => w.id === workoutId);
  if (!workout) return;

  document.getElementById('workout-detail-title').textContent = formatDate(workout.date);

  const content = document.getElementById('workout-detail-content');
  content.innerHTML = workout.exercises.map(ex => {
    const setsHtml = ex.sets.map((set, i) =>
      `Set ${i + 1}: ${set.reps} reps${set.weight ? ` @ ${set.weight} lbs` : ''}`
    ).join('<br>');

    return `
      <div class="detail-exercise">
        <div class="detail-exercise-name">${ex.name}</div>
        <div class="detail-sets">${setsHtml}</div>
      </div>
    `;
  }).join('');

  document.getElementById('workout-detail-modal').classList.add('active');
}

function repeatWorkout() {
  const workout = workouts.find(w => w.id === selectedWorkoutId);
  if (!workout) return;

  currentWorkout = {
    id: generateId(),
    date: getTodayString(),
    exercises: workout.exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(s => ({ reps: s.reps, weight: s.weight }))
    }))
  };

  Storage.set('currentWorkout', currentWorkout);
  closeModal('workout-detail-modal');
  navigateTo('today');
}

// ==========================================
// Progress Screen
// ==========================================

function initProgressScreen() {
  populateExerciseSelect();
  initChart();
  updateChart();
}

function populateExerciseSelect() {
  const select = document.getElementById('exercise-select');
  const exercisesWithData = new Set();

  // Find exercises that have been logged
  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      exercisesWithData.add(ex.name);
    });
  });

  // Clear and repopulate
  select.innerHTML = '<option value="">Select Exercise</option>';
  exercisesWithData.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function initChart() {
  const ctx = document.getElementById('progress-chart').getContext('2d');

  if (progressChart) {
    progressChart.destroy();
  }

  progressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Progress',
        data: [],
        borderColor: '#6c5ce7',
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 6,
        pointBackgroundColor: '#6c5ce7'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: '#a0a0b0' }
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: '#a0a0b0' }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function updateChart() {
  const exerciseName = document.getElementById('exercise-select').value;
  const metric = document.getElementById('metric-select').value;
  const statsContainer = document.getElementById('progress-stats');

  if (!exerciseName) {
    progressChart.data.labels = [];
    progressChart.data.datasets[0].data = [];
    progressChart.update();
    statsContainer.innerHTML = '';
    return;
  }

  // Gather data for selected exercise
  const dataPoints = [];

  workouts.slice().reverse().forEach(workout => {
    const exercise = workout.exercises.find(e => e.name === exerciseName);
    if (exercise && exercise.sets.length > 0) {
      let value;
      switch (metric) {
        case 'weight':
          value = Math.max(...exercise.sets.map(s => s.weight || 0));
          break;
        case 'volume':
          value = exercise.sets.reduce((sum, s) => sum + (s.reps * (s.weight || 1)), 0);
          break;
        case 'reps':
          value = exercise.sets.reduce((sum, s) => sum + s.reps, 0);
          break;
      }
      if (value > 0) {
        dataPoints.push({
          date: workout.date,
          value
        });
      }
    }
  });

  // Update chart
  progressChart.data.labels = dataPoints.map(d => formatDate(d.date));
  progressChart.data.datasets[0].data = dataPoints.map(d => d.value);
  progressChart.data.datasets[0].label = metric === 'weight' ? 'Max Weight (lbs)'
    : metric === 'volume' ? 'Volume (lbs)' : 'Total Reps';
  progressChart.update();

  // Update stats
  if (dataPoints.length > 0) {
    const values = dataPoints.map(d => d.value);
    const latest = values[values.length - 1];
    const max = Math.max(...values);
    const first = values[0];
    const improvement = first > 0 ? (((latest - first) / first) * 100).toFixed(1) : 0;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${latest}</div>
        <div class="stat-label">Latest</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${max}</div>
        <div class="stat-label">Personal Best</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${dataPoints.length}</div>
        <div class="stat-label">Sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${improvement > 0 ? '+' : ''}${improvement}%</div>
        <div class="stat-label">Improvement</div>
      </div>
    `;
  } else {
    statsContainer.innerHTML = '<div class="empty-state"><p>No data for this exercise</p></div>';
  }
}

// ==========================================
// Modal Utilities
// ==========================================

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking backdrop
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});

// ==========================================
// Rest Timer
// ==========================================

let timerSeconds = 90;
let timerRemaining = 90;
let timerInterval = null;
let timerRunning = false;

function showTimer() {
  document.getElementById('rest-timer').classList.remove('hidden');
  resetTimerDisplay();
}

function hideTimer() {
  document.getElementById('rest-timer').classList.add('hidden');
  stopTimer();
}

function setTimer(seconds) {
  timerSeconds = seconds;
  timerRemaining = seconds;
  stopTimer();
  updateTimerDisplay();

  // Update active preset button
  document.querySelectorAll('.preset-btn').forEach(btn => {
    const btnSeconds = parseInt(btn.textContent.includes(':')
      ? btn.textContent.split(':')[0] * 60 + parseInt(btn.textContent.split(':')[1] || 0)
      : parseInt(btn.textContent) * (btn.textContent.includes('m') ? 60 : 1));
    btn.classList.toggle('active', btnSeconds === seconds);
  });
}

function adjustTimer(delta) {
  timerRemaining = Math.max(0, timerRemaining + delta);
  if (!timerRunning) {
    timerSeconds = timerRemaining;
  }
  updateTimerDisplay();
}

function toggleTimer() {
  if (timerRunning) {
    stopTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (timerRemaining <= 0) {
    timerRemaining = timerSeconds;
  }

  timerRunning = true;
  updateToggleButton();

  timerInterval = setInterval(() => {
    timerRemaining--;
    updateTimerDisplay();

    if (timerRemaining <= 0) {
      timerComplete();
    }
  }, 1000);
}

function stopTimer() {
  timerRunning = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  updateToggleButton();
}

function resetTimerDisplay() {
  timerRemaining = timerSeconds;
  updateTimerDisplay();
  updateToggleButton();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerRemaining / 60);
  const seconds = timerRemaining % 60;

  document.getElementById('timer-minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('timer-seconds').textContent = String(seconds).padStart(2, '0');

  const display = document.querySelector('.timer-display');
  display.classList.remove('warning', 'done');

  if (timerRemaining === 0) {
    display.classList.add('done');
  } else if (timerRemaining <= 10) {
    display.classList.add('warning');
  }
}

function updateToggleButton() {
  const btn = document.getElementById('timer-toggle');
  btn.classList.remove('running', 'done');

  if (timerRemaining === 0) {
    btn.textContent = 'Reset';
    btn.classList.add('done');
  } else if (timerRunning) {
    btn.textContent = 'Pause';
    btn.classList.add('running');
  } else {
    btn.textContent = 'Start';
  }
}

function timerComplete() {
  stopTimer();
  updateTimerDisplay();
  updateToggleButton();

  // Vibrate if supported
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }

  // Play sound
  playTimerSound();
}

function playTimerSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const playBeep = (freq, startTime, duration) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = freq;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  const now = audioContext.currentTime;
  playBeep(880, now, 0.15);
  playBeep(880, now + 0.2, 0.15);
  playBeep(1760, now + 0.4, 0.3);
}

// ==========================================
// Initialize App
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initTodayScreen();
});
