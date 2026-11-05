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
dateInput.type = 'text';
dateInput.placeholder = 'дд.мм.гггг';
dateInput.required = true;
dateInput.addEventListener('input', function(e) {
  let v = this.value.replace(/\D/g, ''); 
  if (v.length > 2 && v.length <= 4) {
    v = v.slice(0, 2) + '.' + v.slice(2);
  } 
  else if (v.length > 4) {
    v = v.slice(0, 2) + '.' + v.slice(2, 4) + '.' + v.slice(4, 8);
  }
  this.value = v;
});
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
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}
function renderTasks() {
  taskList.innerHTML = '';
  if (tasks.length === 0) {
    const emptyItem = createElement('li', 'task-list__empty', 'Задач пока нет');
    taskList.append(emptyItem);
    return;
  }
  for (const task of tasks) {
    const li = createElement('li', 'task-item');
    li.dataset.id = task.id;
    const titleEl = createElement('span', 'task-item__title', task.title);
    const dateEl = createElement('time', 'task-item__date', formatDate(task.date));
    dateEl.dateTime = task.date;
    li.append(titleEl, dateEl);
    taskList.append(li);
  }
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const date = dateInput.value;
  if (!title || !date) {
    return;
  }
  const newTask = {
    id: crypto.randomUUID(),
    title,
    date,
    completed: false
  };
  tasks.push(newTask);
  saveTasks();
  renderTasks();
  form.reset();
  titleInput.focus();
});
renderTasks();