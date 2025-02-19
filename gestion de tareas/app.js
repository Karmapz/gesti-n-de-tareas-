// DOM Elements

const loginForm = document.getElementById('login-form');
const dashboard = document.getElementById('dashboard');
const userNameDisplay = document.getElementById('dashboard-user-name');
const userAvatar = document.getElementById('user-avatar');
const newTaskBtn = document.getElementById('new-task-btn');
const newTaskModal = document.getElementById('new-task-modal');
const newTaskForm = document.getElementById('new-task-form');
const closeModalBtn = document.querySelector('.close-modal');
const projectsList = document.getElementById('projects-list');
const tasksTableBody = document.getElementById('tasks-table-body');
const addProjectBtn = document.getElementById('add-project-btn');
const filterProject = document.getElementById('filter-project');
const filterPriority = document.getElementById('filter-priority');
const filterStatus = document.getElementById('filter-status');
const toggleCompletedBtn = document.getElementById('toggle-completed');
const calendarContainer = document.getElementById('calendar-container');

// Application State
let currentUser = null;
let tasks = [];
let projects = [];
let showCompleted = true;

// Helper Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Local Storage Functions
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('projects', JSON.stringify(projects));
}

function loadFromLocalStorage() {
    const storedTasks = localStorage.getItem('tasks');
    const storedProjects = localStorage.getItem('projects');
    if (storedTasks) tasks = JSON.parse(storedTasks);
    if (storedProjects) projects = JSON.parse(storedProjects);
}

// Login and Logout
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    currentUser = username;
    localStorage.setItem('currentUser', currentUser);
    showDashboard();
});

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLoginForm();
}

function showLoginForm() {
    loginForm.classList.remove('hidden');
    dashboard.classList.add('hidden');
}

function showDashboard() {
    loginForm.classList.add('hidden');
    dashboard.classList.remove('hidden');
    userNameDisplay.textContent = currentUser;
    userAvatar.src = `https://ui-avatars.com/api/?name=${currentUser}&background=random`;
    loadFromLocalStorage();
    renderProjects();
    renderTasks();
    updateStatistics();
    renderCalendar();
}

// Task Management
newTaskBtn.addEventListener('click', () => {
    newTaskModal.style.display = 'block';
});

closeModalBtn.addEventListener('click', () => {
    newTaskModal.style.display = 'none';
});

newTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskName = document.getElementById('task-name').value;
    const taskDescription = document.getElementById('task-description').value;
    const taskProject = document.getElementById('task-project').value;
    const taskDueDate = document.getElementById('task-due-date').value;
    const taskPriority = document.getElementById('task-priority').value;
    const taskAssignee = document.getElementById('task-assignee').value;
    const taskTags = document.getElementById('task-tags').value.split(',').map(tag => tag.trim());

    const newTask = {
        id: generateId(),
        name: taskName,
        description: taskDescription,
        project: taskProject,
        dueDate: taskDueDate,
        priority: taskPriority,
        status: 'todo',
        assignee: taskAssignee,
        tags: taskTags,
        subtasks: [],
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveToLocalStorage();
    renderTasks();
    updateStatistics();
    newTaskModal.style.display = 'none';
    newTaskForm.reset();
});

function renderTasks() {
    tasksTableBody.innerHTML = '';
    const filteredTasks = tasks.filter(task => {
        if (!showCompleted && task.status === 'completed') return false;
        if (filterProject.value !== 'all' && task.project !== filterProject.value) return false;
        if (filterPriority.value !== 'all' && task.priority !== filterPriority.value) return false;
        if (filterStatus.value !== 'all' && task.status !== filterStatus.value) return false;
        return true;
    });

    filteredTasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} onchange="toggleTaskStatus('${task.id}')"></td>
            <td>${task.name}</td>
            <td>${task.project}</td>
            <td>${formatDate(task.dueDate)}</td>
            <td><span class="tag ${task.priority}">${task.priority}</span></td>
            <td><span class="tag ${task.status}">${task.status}</span></td>
            <td>${task.assignee}</td>
            <td>
                <button onclick="editTask('${task.id}')"><i class="fas fa-edit"></i></button>
                <button onclick="deleteTask('${task.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tasksTableBody.appendChild(row);
    });
}

function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = task.status === 'completed' ? 'todo' : 'completed';
        saveToLocalStorage();
        renderTasks();
        updateStatistics();
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById('task-name').value = task.name;
        document.getElementById('task-description').value = task.description;
        document.getElementById('task-project').value = task.project;
        document.getElementById('task-due-date').value = task.dueDate;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-assignee').value = task.assignee;
        document.getElementById('task-tags').value = task.tags.join(', ');

        newTaskModal.style.display = 'block';
        newTaskForm.onsubmit = (e) => {
            e.preventDefault();
            task.name = document.getElementById('task-name').value;
            task.description = document.getElementById('task-description').value;
            task.project = document.getElementById('task-project').value;
            task.dueDate = document.getElementById('task-due-date').value;
            task.priority = document.getElementById('task-priority').value;
            task.assignee = document.getElementById('task-assignee').value;
            task.tags = document.getElementById('task-tags').value.split(',').map(tag => tag.trim());

            saveToLocalStorage();
            renderTasks();
            updateStatistics();
            newTaskModal.style.display = 'none';
            newTaskForm.reset();
            newTaskForm.onsubmit = null;
        };
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveToLocalStorage();
        renderTasks();
        updateStatistics();
    }
}

// Project Management
addProjectBtn.addEventListener('click', () => {
    const projectName = prompt('Enter project name:');
    if (projectName) {
        const newProject = {
            id: generateId(),
            name: projectName,
            color: '#' + Math.floor(Math.random()*16777215).toString(16)
        };
        projects.push(newProject);
        saveToLocalStorage();
        renderProjects();
        updateProjectSelect();
    }
});

function renderProjects() {
    projectsList.innerHTML = '';
    projects.forEach(project => {
        const li = document.createElement('li');
        li.className = 'project-item';
        li.innerHTML = `
            <span class="project-color" style="background-color: ${project.color};"></span>
            <span class="project-name">${project.name}</span>
            <span class="project-tag">${tasks.filter(t => t.project === project.name).length} tasks</span>
            <button class="delete-project-btn" onclick="deleteProject('${project.id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        projectsList.appendChild(li);
    });
}
function updateProjectSelect() {
    const projectSelects = document.querySelectorAll('#task-project, #filter-project');
    projectSelects.forEach(select => {
        select.innerHTML = `
            <option value="all">Todos los proyectos</option>
            <option value="Sin proyecto">Sin proyecto</option>
        `;
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.name;
            option.textContent = project.name;
            select.appendChild(option);
        });
    });
}

// Statistics
function updateStatistics() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const urgentTasks = tasks.filter(t => t.priority === 'urgent').length;
    const inProgressTasks = tasks.filter(t => t.status === 'progress').length;

    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('total-progress').style.width = `${(completedTasks / totalTasks) * 100}%`;
    document.getElementById('total-completed').textContent = `${Math.round((completedTasks / totalTasks) * 100)}% completed`;
    document.getElementById('urgent-tasks').textContent = urgentTasks;
    document.getElementById('in-progress-tasks').textContent = inProgressTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
}

// Calendar
function renderCalendar() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

    calendarContainer.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        calendarContainer.appendChild(emptyDay);
    }

    for (let day = 1; day <= lastDay; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const tasksForDay = tasks.filter(task => task.dueDate === dateString);

        if (tasksForDay.length > 0) {
            dayElement.classList.add('has-tasks');
        }

        dayElement.innerHTML = `
            <span class="day-number">${day}</span>
            ${tasksForDay.length > 0 ? `<span class="task-count">${tasksForDay.length}</span>` : ''}
        `;

        calendarContainer.appendChild(dayElement);
    }
}

// Event Listeners for Filters
filterProject.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', renderTasks);
filterStatus.addEventListener('change', renderTasks);

toggleCompletedBtn.addEventListener('click', () => {
    showCompleted = !showCompleted;
    toggleCompletedBtn.textContent = showCompleted ? 'Hide Completed' : 'Show Completed';
    renderTasks();
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        showDashboard();
    } else {
        showLoginForm();
    }
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === newTaskModal) {
        newTaskModal.style.display = 'none';
    }
});

// Drag and drop functionality for tasks
let draggedTask = null;

tasksTableBody.addEventListener('dragstart', (e) => {
    draggedTask = e.target.closest('tr');
    e.dataTransfer.setData('text/plain', draggedTask.dataset.taskId);
    setTimeout(() => {
        draggedTask.style.display = 'none';
    }, 0);
});

tasksTableBody.addEventListener('dragend', () => {
    draggedTask.style.display = '';
    draggedTask = null;
});

tasksTableBody.addEventListener('dragover', (e) => {
    e.preventDefault();
    const tr = e.target.closest('tr');
    if (tr && tr !== draggedTask) {
        const rect = tr.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        tr.parentNode.insertBefore(draggedTask, next ? tr.nextSibling : tr);
    }
});

tasksTableBody.addEventListener('drop', (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text');
    const task = tasks.find(t => t.id === taskId);
    const index = tasks.indexOf(task);
    tasks.splice(index, 1);
    const newIndex = Array.from(tasksTableBody.children).indexOf(draggedTask);
    tasks.splice(newIndex, 0, task);
    saveToLocalStorage();
    renderTasks();
});

// Error handling
function handleError(error) {
    console.error('An error occurred:', error);
    alert('An error occurred. Please try again.');
}

// Wrap all main functions with try-catch
function safeExecute(fn) {
    return function(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            handleError(error);
        }
    };
}


// Apply safeExecute to main functions
renderTasks = safeExecute(renderTasks);
renderProjects = safeExecute(renderProjects);
updateStatistics = safeExecute(updateStatistics);
renderCalendar = safeExecute(renderCalendar);

// Añade estas funciones a tu archivo app.js

async function fetchCalendarData(year = null, month = null) {
    try {
        let url = 'http://localhost:5000/api/calendar';
        if (year && month) {
            url += `?year=${year}&month=${month}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        return null;
    }
}

// Agrega al state
let currentCalendarDate = new Date();
let isCalendarOpen = false;

// Modifica renderCalendar existente
function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    document.getElementById('currentMonth').textContent = 
        currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Empty days
    for (let i = 0; i < firstDay; i++) {
        calendarDays.appendChild(createCalendarDay(''));
    }

    // Actual days
    for (let day = 1; day <= lastDate; day++) {
        const date = new Date(year, month, day);
        const tasksForDay = getTasksForDate(date);
        calendarDays.appendChild(createCalendarDay(day, date, tasksForDay));
    }
}

function createCalendarDay(dayNumber, date, tasks) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    if (dayNumber) {
        dayElement.classList.add('has-date');
        if (isToday(date)) dayElement.classList.add('today');
        
        dayElement.innerHTML = `
            <div class="day-number">${dayNumber}</div>
            <div class="day-tasks">
                ${tasks.map(task => `
                    <div class="task-dot ${task.priority}"></div>
                `).join('')}
            </div>
        `;
        
        dayElement.addEventListener('click', () => showTasksForDate(date));
    }
    return dayElement;
}

function getTasksForDate(date) {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => 
        new Date(task.dueDate).toISOString().split('T')[0] === dateString
    );
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
}

// Calendar Navigation
function prevMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

// Calendar Modal
function openCalendar() {
    isCalendarOpen = true;
    document.getElementById('calendarModal').style.display = 'block';
    document.body.classList.add('blur-effect');
    renderCalendar();
}

function closeCalendar() {
    isCalendarOpen = false;
    document.getElementById('calendarModal').style.display = 'none';
    document.body.classList.remove('blur-effect');
}

// Actualiza el event listener para el botón View Calendar
document.querySelector('.view-calendar-btn').addEventListener('click', openCalendar);

// Modifica el event listener del formulario para actualizar el calendario
document.getElementById('new-task-form').addEventListener('submit', function() {
    if (isCalendarOpen) {
        renderCalendar();
    }
});

// Agrega esta función para mostrar tareas
function showTasksForDate(date) {
    const tasks = getTasksForDate(date);
    const taskList = tasks.map(task => `• ${task.name} (${task.priority})`).join('\n');
    alert(`Tasks for ${date.toLocaleDateString()}:\n\n${taskList}`);
}

// Manejar clic en el Calendar del sidebar
document.getElementById('sidebar-calendar').addEventListener('click', function(e) {
    e.preventDefault();
    
    // Remover clase active de todos los items
    document.querySelectorAll('.main-nav li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Agregar clase active al item clickeado
    this.parentElement.classList.add('active');
    
    // Abrir calendario
    openCalendar();
});

// Actualizar estado al cerrar calendario
function closeCalendar() {
    isCalendarOpen = false;
    document.getElementById('calendarModal').style.display = 'none';
    document.body.classList.remove('blur-effect');
    
    // Remover clase active del ítem
    document.querySelectorAll('.main-nav li').forEach(item => {
        if (item.querySelector('#sidebar-calendar')) {
            item.classList.remove('active');
        }
    });
}

function deleteProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (confirm(`¿Estás seguro de querer eliminar el proyecto "${project.name}"?`)) {
        // Eliminar el proyecto
        projects = projects.filter(p => p.id !== projectId);
        
        // Actualizar tareas asociadas
        tasks.forEach(task => {
            if (task.project === project.name) {
                task.project = 'Sin proyecto';
            }
        });
        
        saveToLocalStorage();
        renderProjects();
        renderTasks();
        updateProjectSelect();
        updateStatistics();
    }
}