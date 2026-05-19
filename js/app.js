const STORAGE_KEY = 'todo-app-data';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

let todos = load();

// 首次使用：localStorage 无数据
const isFirstVisit = todos === null;
if (isFirstVisit) {
  todos = [];
}

const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const welcomeMsg = document.getElementById('welcomeMsg');
const statsEl = document.getElementById('stats');
const clearDoneBtn = document.getElementById('clearDone');

let currentFilter = 'all';

function getFilteredTodos() {
  const query = searchInput.value.trim().toLowerCase();
  return todos.filter(todo => {
    if (currentFilter === 'active' && todo.done) return false;
    if (currentFilter === 'done' && !todo.done) return false;
    if (currentFilter === 'myday' && !todo.myDay) return false;
    if (query && !todo.text.toLowerCase().includes(query)) return false;
    return true;
  });
}

function findIndex(id) {
  return todos.findIndex(t => t.id === id);
}

function formatTime(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function render() {
  todoList.innerHTML = '';

  const filtered = getFilteredTodos();
  const hasQuery = searchInput.value.trim().length > 0;

  if (todos.length === 0) {
    emptyState.classList.remove('hidden');
    welcomeMsg.textContent = isFirstVisit
      ? '暂无任务，添加一条吧 ✨'
      : '所有任务都完成啦 🎉';
    clearDoneBtn.hidden = true;
  } else if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    if (currentFilter === 'myday' && !hasQuery) {
        welcomeMsg.textContent = '还没有标记"我的一天"任务';
      } else {
        welcomeMsg.textContent = hasQuery ? '没有匹配的任务' : '没有符合筛选的任务';
      }
    clearDoneBtn.hidden = false;
  } else {
    emptyState.classList.add('hidden');
    const hasCompleted = todos.some(t => t.done);
    clearDoneBtn.hidden = !hasCompleted;
  }

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggle(todo.id));

    const body = document.createElement('div');
    body.className = 'todo-body';

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;
    text.addEventListener('dblclick', () => startEdit(todo.id, text));

    const time = document.createElement('span');
    time.className = 'todo-time';
    time.textContent = formatTime(todo.createdAt);

    body.append(text, time);

    const starBtn = document.createElement('button');
    starBtn.className = 'todo-star' + (todo.myDay ? ' active' : '');
    starBtn.textContent = todo.myDay ? '★' : '☆';
    starBtn.setAttribute('aria-label', '加入我的一天');
    starBtn.addEventListener('click', () => toggleMyDay(todo.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'todo-delete';
    delBtn.textContent = '×';
    delBtn.setAttribute('aria-label', '删除任务');
    delBtn.addEventListener('click', () => remove(todo.id));

    li.append(checkbox, body, starBtn, delBtn);
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
  const todo = {
    id: Date.now(),
    text,
    done: false,
    myDay: false,
    createdAt: new Date().toISOString(),
  };
  todos.push(todo);
  save();
  render();
  todoInput.value = '';
  todoInput.focus();
}

function toggle(id) {
  const i = findIndex(id);
  if (i === -1) return;
  todos[i].done = !todos[i].done;
  save();
  render();
}

function remove(id) {
  const i = findIndex(id);
  if (i === -1) return;
  todos.splice(i, 1);
  save();
  render();
}

function edit(id, newText) {
  const i = findIndex(id);
  if (i === -1) return;
  todos[i].text = newText;
  save();
  render();
}

function clearDone() {
  todos = todos.filter(t => !t.done);
  save();
  render();
}

function toggleMyDay(id) {
  const i = findIndex(id);
  if (i === -1) return;
  todos[i].myDay = !todos[i].myDay;
  save();
  render();
}

function startEdit(id, span) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'todo-edit-input';
  input.value = span.textContent;

  function commit() {
    const trimmed = input.value.trim();
    if (trimmed && trimmed !== span.textContent) {
      edit(id, trimmed);
    } else {
      render();
    }
  }

  function cancel() {
    render();
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  });

  input.addEventListener('blur', () => {
    cancel();
  });

  span.replaceWith(input);
  input.focus();
  input.select();
}

addBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  add(text);
});

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addBtn.click();
  }
});

clearDoneBtn.addEventListener('click', clearDone);

searchInput.addEventListener('input', render);

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

/* === 在线/离线状态横幅 === */
const offlineBanner = document.getElementById('offlineBanner');
const offlineMsg = document.getElementById('offlineMsg');

function showBanner(text, cls) {
  offlineBanner.className = 'offline-banner ' + cls;
  offlineMsg.textContent = text;
  offlineBanner.hidden = false;
  clearTimeout(offlineBanner._timer);
}

function hideBanner() {
  offlineBanner._timer = setTimeout(() => {
    offlineBanner.hidden = true;
  }, 2500);
}

function updateOnlineStatus() {
  if (navigator.onLine) {
    showBanner('已恢复连接', 'online');
    hideBanner();
  } else {
    showBanner('您已离线，数据将保存在本地', 'offline');
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
