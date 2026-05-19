const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const statsEl = document.getElementById('stats');
const clearDoneBtn = document.getElementById('clearDone');

const STORAGE_KEY = 'todo-app-data';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

let todos = load();

function render() {
  todoList.innerHTML = '';

  if (todos.length === 0) {
    emptyState.classList.remove('hidden');
    clearDoneBtn.hidden = true;
  } else {
    emptyState.classList.add('hidden');
    const hasCompleted = todos.some(t => t.done);
    clearDoneBtn.hidden = !hasCompleted;
  }

  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggle(index));

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'todo-delete';
    delBtn.textContent = '×';
    delBtn.setAttribute('aria-label', '删除任务');
    delBtn.addEventListener('click', () => remove(index));

    li.append(checkbox, span, delBtn);
    todoList.appendChild(li);
  });

  updateStats();
}

function updateStats() {
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  statsEl.textContent = total === 0
    ? '0 项任务'
    : `${done}/${total} 项已完成`;
}

function add(text) {
  todos.push({ text, done: false });
  save();
  render();
}

function toggle(index) {
  todos[index].done = !todos[index].done;
  save();
  render();
}

function remove(index) {
  todos.splice(index, 1);
  save();
  render();
}

function clearDone() {
  todos = todos.filter(t => !t.done);
  save();
  render();
}

addBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  add(text);
  todoInput.value = '';
  todoInput.focus();
});

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addBtn.click();
  }
});

clearDoneBtn.addEventListener('click', clearDone);

render();
