const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = 'css/style.css';
document.head.appendChild(styleLink);

function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

const app = createElement('div', 'app');
const header = createElement('header', 'header');
const title = createElement('h1', 'header__title', 'To-Do List');
header.append(title);
const main = createElement('main', 'main');

const form = createElement('form', 'task-form');
const titleInput = createElement('input', 'task-form__input');
titleInput.type = 'text';
titleInput.placeholder = 'Название задачи';
titleInput.required = true;

const dateInput = createElement('input', 'task-form__date');
dateInput.type = 'date';
dateInput.required = true;

const addButton = createElement('button', 'task-form__btn', 'Добавить');
addButton.type = 'submit';
form.append(titleInput, dateInput, addButton);

const toolbar = createElement('div', 'toolbar');
const searchInput = createElement('input', 'toolbar__search');
searchInput.type = 'search';
searchInput.placeholder = 'Поиск по названию';

const filterSelect = createElement('select', 'toolbar__filter');
const filterOptions = [
  { value: 'all',    label: 'Все задачи' },
  { value: 'active', label: 'Невыполненные' },
  { value: 'done',   label: 'Выполненные' }
];
filterOptions.forEach(({ value, label }) => {
  const option = createElement('option', null, label);
  option.value = value;
  filterSelect.append(option);
});

const sortSelect = createElement('select', 'toolbar__sort');
const sortOptions = [
  { value: 'none', label: 'Без сортировки' },
  { value: 'asc',  label: 'Дата: сначала ранние' },
  { value: 'desc', label: 'Дата: сначала поздние' }
];
sortOptions.forEach(({ value, label }) => {
  const option = createElement('option', null, label);
  option.value = value;
  sortSelect.append(option);
});
toolbar.append(searchInput, filterSelect, sortSelect);

const taskList = createElement('ul', 'task-list');
main.append(form, toolbar, taskList);
app.append(header, main);
document.body.append(app);

const STORAGE_KEY = 'tasks';
let tasks = loadTasks();
let editingTaskId = null;
let draggedItemId = null;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Не удалось прочитать задачи из localStorage:', error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}
function getVisibleTasks() {
  let result = [...tasks];

  const query = searchInput.value.trim().toLowerCase();
  if (query) {
    result = result.filter(task => task.title.toLowerCase().includes(query));
  }

  const filter = filterSelect.value;
  if (filter === 'active') {
    result = result.filter(task => !task.completed);
  } else if (filter === 'done') {
    result = result.filter(task => task.completed);
  }

  const sort = sortSelect.value;
  if (sort === 'asc') {
    result.sort((a, b) => a.date.localeCompare(b.date));
  } else if (sort === 'desc') {
    result.sort((a, b) => b.date.localeCompare(a.date));
  }

  return result;
}

searchInput.addEventListener('input', renderTasks);
filterSelect.addEventListener('change', renderTasks);
sortSelect.addEventListener('change', renderTasks);

function renderTasks() {
  taskList.innerHTML = '';
  const visibleTasks = getVisibleTasks();

  if (visibleTasks.length === 0) {
    const text = tasks.length === 0 ? 'Задач пока нет' : 'Ничего не найдено';
    const emptyItem = createElement('li', 'task-list__empty', text);
    taskList.append(emptyItem);
    return;
  }

  for (const task of visibleTasks) {
    const li = createElement('li', 'task-item');
    li.draggable = true;
    
    li.addEventListener('dragstart', () => {
      draggedItemId = task.id;
      li.classList.add('task-item--dragging');
    });

    li.addEventListener('dragend', () => {
      draggedItemId = null;
      li.classList.remove('task-item--dragging');
    });

    li.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    li.addEventListener('drop', (event) => {
      event.preventDefault();
      if (draggedItemId && draggedItemId !== task.id) {
        reorderTasks(draggedItemId, task.id);
      }
    });
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('task-item--done');
    if (task.id === editingTaskId) {
      li.classList.add('task-item--editing');
      
      const editTitle = createElement('input', 'task-item__edit-input');
      editTitle.type = 'text';
      editTitle.value = task.title;

      const editDate = createElement('input', 'task-item__edit-date');
      editDate.type = 'date';
      editDate.value = task.date;

      const saveBtn = createElement('button', 'task-item__save-btn', 'Сохранить');
      saveBtn.type = 'button';
      saveBtn.addEventListener('click', () => saveEdit(task.id, editTitle.value, editDate.value));

      const cancelBtn = createElement('button', 'task-item__cancel-btn', 'Отмена');
      cancelBtn.type = 'button';
      cancelBtn.addEventListener('click', cancelEdit);

      li.append(editTitle, editDate, saveBtn, cancelBtn);
      taskList.append(li);
      continue;
    }
    const checkbox = createElement('input', 'task-item__checkbox');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskCompleted(task.id));

    const titleEl = createElement('span', 'task-item__title', task.title);

    const dateEl = createElement('time', 'task-item__date', formatDate(task.date));
    dateEl.dateTime = task.date;

    const editBtn = createElement('button', 'task-item__edit', 'edit');
    editBtn.type = 'button';
    editBtn.title = 'Редактировать задачу';
    editBtn.addEventListener('click', () => startEdit(task.id));

    const deleteBtn = createElement('button', 'task-item__delete', '✕');
    deleteBtn.type = 'button';
    deleteBtn.title = 'Удалить задачу';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.append(checkbox, titleEl, dateEl, editBtn, deleteBtn);
    taskList.append(li);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const date = dateInput.value;
  if (!title || !date) return;

  tasks.push({
    id: crypto.randomUUID(),
    title,
    date,
    completed: false
  });
  
  saveTasks();
  renderTasks();
  form.reset();
  titleInput.focus();
});

function toggleTaskCompleted(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}
function reorderTasks(draggedId, targetId) {
  const draggedIndex = tasks.findIndex(t => t.id === draggedId);
  const targetIndex = tasks.findIndex(t => t.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) return;
  const [draggedTask] = tasks.splice(draggedIndex, 1);
  tasks.splice(targetIndex, 0, draggedTask);

  saveTasks();
  renderTasks();
}

function startEdit(id) {
  editingTaskId = id;
  renderTasks();
}

function cancelEdit() {
  editingTaskId = null;
  renderTasks();
}

function saveEdit(id, newTitle, newDate) {
  if (!newTitle.trim() || !newDate) return;
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.title = newTitle.trim();
    task.date = newDate;
  }
  editingTaskId = null;
  saveTasks();
  renderTasks();
}

renderTasks();