/* ================================================================
   Todo 模块 — 数据、渲染、CRUD、日历、Myday API
   ================================================================ */

const STORAGE_KEY = 'todo_data';

/* ── 数据层 ────────────────────────────────────────────── */

function migrate(todo) {
  return {
    id: todo.id,
    content: todo.content || todo.text || '',
    completed: todo.completed !== undefined ? todo.completed : (todo.done || false),
    deadline: todo.deadline || todo.dueDate || null,
  };
}

const loadDate = new Date();
const loadDateStr = `${loadDate.getFullYear()}-${String(loadDate.getMonth()+1).padStart(2,'0')}-${String(loadDate.getDate()).padStart(2,'0')}`;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.map(migrate);
  } catch { return null; }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

let todos = load();
const isFirstVisit = todos === null;
if (isFirstVisit) {
  todos = [];
} else {
  if (todos.length > 0 && (todos[0].text !== undefined || todos[0].done !== undefined || todos[0].dueDate !== undefined)) {
    save();
  }
  const before = todos.length;
  todos = todos.filter(t => {
    if (!t.completed) return true;
    if (!t.deadline) return true;
    return t.deadline >= loadDateStr;
  });
  if (todos.length < before) save();
}

/* ── 状态 ──────────────────────────────────────────────── */

let selectedDeadline = null;
let editingId = null;

/* ── DOM 引用 ──────────────────────────────────────────── */

function $el(id) {
  const el = document.getElementById(id);
  if (!el) console.error('[Todo] 缺少 DOM 元素: #' + id);
  return el;
}

const activeList = $el('activeList');
const completedList = $el('completedList');
const todoSeparator = $el('todoSeparator');
const emptyState = $el('emptyState');
const welcomeMsg = $el('welcomeMsg');
const fabBtn = $el('fabBtn');
const modalOverlay = $el('modalOverlay');
const modalTitle = document.querySelector('.modal-title');
const modalContent = $el('modalContent');
const ddlToggle = $el('ddlToggle');
const ddlCalendar = $el('ddlCalendar');
const calTitle = $el('calTitle');
const calDays = $el('calDays');
const calPrev = $el('calPrev');
const calNext = $el('calNext');
const calPrevYear = $el('calPrevYear');
const calNextYear = $el('calNextYear');
const ddlClear = $el('ddlClear');
const modalCancel = $el('modalCancel');
const modalConfirm = $el('modalConfirm');

/* ── 工具函数 ──────────────────────────────────────────── */

function findIndex(id) { return todos.findIndex(t => t.id === id); }

function isToday(dateStr) {
  if (!dateStr) return false;
  return dateStr === loadDateStr;
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return dateStr < loadDateStr;
}

function formatDeadline(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return y + '/' + (+m) + '/' + (+d);
}

/* ── 构建单个 Todo 元素 ──────────────────────────────── */

function buildItemEl(todo) {
  const li = document.createElement('li');
  li.className = 'todo-item' + (todo.completed ? ' completed' : '');
  li.dataset.id = todo.id;

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'todo-checkbox';
  cb.checked = todo.completed;
  cb.addEventListener('change', () => toggle(todo.id));

  const body = document.createElement('div');
  body.className = 'todo-body';

  const text = document.createElement('span');
  text.className = 'todo-text';
  text.textContent = todo.content;
  text.addEventListener('click', () => startEditInline(todo.id, text));

  if (todo.deadline) {
    const dl = document.createElement('span');
    dl.className = 'todo-deadline' + (isOverdue(todo.deadline) ? ' overdue' : '');
    dl.textContent = formatDeadline(todo.deadline);
    body.append(text, dl);
  } else {
    body.append(text);
  }

  const del = document.createElement('button');
  del.className = 'todo-delete';
  del.textContent = '×';
  del.setAttribute('aria-label', '删除任务');
  del.addEventListener('click', () => remove(todo.id));

  li.append(cb, body, del);
  return li;
}

/* ── 分隔线 ────────────────────────────────────────────── */

function updateSeparator() {
  const hasActive = activeList.querySelectorAll('.todo-item').length > 0;
  const hasCompleted = completedList.querySelectorAll('.todo-item').length > 0;
  todoSeparator.hidden = !(hasActive && hasCompleted);
}

/* ── 渲染 ──────────────────────────────────────────────── */

function render() {
  destroySortables();

  activeList.innerHTML = '';
  completedList.innerHTML = '';

  if (todos.length === 0) {
    emptyState.classList.remove('hidden');
    welcomeMsg.textContent = isFirstVisit ? 'Add To Work ✨' : 'All Done 🎉';
    todoSeparator.hidden = true;
    return;
  }

  emptyState.classList.add('hidden');

  const sorted = [...todos].sort((a, b) => a.completed - b.completed);
  sorted.forEach(todo => {
    const li = buildItemEl(todo);
    (todo.completed ? completedList : activeList).appendChild(li);
  });

  updateSeparator();
  initSortable();
}

/* ── CRUD ──────────────────────────────────────────────── */

function add(content, deadline) {
  todos.push({ id: Date.now(), content, completed: false, deadline: deadline || null });
  save();
  render();
}

function toggle(id) {
  const i = findIndex(id);
  if (i === -1) return;
  todos[i].completed = !todos[i].completed;
  save();

  const isNowCompleted = todos[i].completed;
  const sourceList = isNowCompleted ? activeList : completedList;
  const targetList = isNowCompleted ? completedList : activeList;

  let el = sourceList.querySelector(`[data-id="${id}"]`);
  if (!el) { render(); return; }

  // FLIP: First
  const oldRect = el.getBoundingClientRect();

  // 更新元素状态
  el.classList.toggle('completed', isNowCompleted);
  el.querySelector('.todo-checkbox').checked = isNowCompleted;

  // 移除 → 插入目标列表顶部
  sourceList.removeChild(el);
  targetList.insertBefore(el, targetList.firstChild);

  // FLIP: Last + Invert
  const newRect = el.getBoundingClientRect();
  const dx = oldRect.left - newRect.left;
  const dy = oldRect.top - newRect.top;
  el.style.transition = 'none';
  el.style.transform = `translate(${dx}px, ${dy}px)`;

  // FLIP: Play
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.transform = '';
      el.addEventListener('transitionend', () => {
        el.style.transition = '';
      }, { once: true });
    });
  });

  updateSeparator();
}

function remove(id) {
  const i = findIndex(id);
  if (i === -1) return;
  todos.splice(i, 1);
  save();
  render();
}

function update(id, content, deadline) {
  const i = findIndex(id);
  if (i === -1) return;
  todos[i].content = content;
  todos[i].deadline = deadline || null;
  save();
  render();
}

/* ── 原地编辑（双击） ──────────────────────────────────── */

function startEditInline(id, span) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'todo-edit-input';
  input.value = span.textContent;

  function commit() {
    const v = input.value.trim();
    if (v && v !== span.textContent) {
      const i = findIndex(id);
      if (i !== -1) { todos[i].content = v; save(); }
    }
    render();
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); render(); }
  });
  input.addEventListener('blur', () => render());

  span.replaceWith(input);
  input.focus();
  input.select();
}

/* ── 日历面板 ────────────────────────────────────────── */

let calYear, calMonth;

function todayStr() {
  return loadDateStr;
}

function isPast(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}` < loadDateStr;
}

function buildCalendar() {
  calTitle.textContent = `${calYear}年 ${calMonth}月`;
  calDays.innerHTML = '';

  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calDays.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cal-day';
    cell.textContent = d;

    const ds = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    if (isPast(calYear, calMonth, d)) cell.classList.add('past');
    if (ds === todayStr()) cell.classList.add('today');
    if (ds === selectedDeadline) cell.classList.add('selected');

    if (!isPast(calYear, calMonth, d)) {
      cell.addEventListener('click', () => {
        selectedDeadline = ds;
        ddlToggle.textContent = formatDeadline(selectedDeadline);
        ddlToggle.classList.add('set');
        ddlClear.hidden = false;
        ddlCalendar.hidden = true;
      });
    }

    calDays.appendChild(cell);
  }
}

calPrev.addEventListener('click', () => {
  if (calMonth === 1) { calMonth = 12; calYear--; }
  else { calMonth--; }
  buildCalendar();
});

calNext.addEventListener('click', () => {
  if (calMonth === 12) { calMonth = 1; calYear++; }
  else { calMonth++; }
  buildCalendar();
});

calPrevYear.addEventListener('click', () => { calYear--; buildCalendar(); });
calNextYear.addEventListener('click', () => { calYear++; buildCalendar(); });

ddlClear.addEventListener('click', (e) => {
  e.stopPropagation();
  selectedDeadline = null;
  ddlToggle.textContent = 'DDL';
  ddlToggle.classList.remove('set');
  ddlClear.hidden = true;
  ddlCalendar.hidden = true;
});

ddlToggle.addEventListener('click', () => {
  if (ddlCalendar.hidden) {
    if (selectedDeadline) {
      const [y, m] = selectedDeadline.split('-');
      calYear = +y;
      calMonth = +m;
    } else {
      const now = new Date();
      calYear = now.getFullYear();
      calMonth = now.getMonth() + 1;
    }
    buildCalendar();
    ddlCalendar.hidden = false;
  } else {
    ddlCalendar.hidden = true;
  }
});

/* ── 模态框 ────────────────────────────────────────────── */

function openModal() {
  editingId = null;
  modalTitle.textContent = 'Add Task';
  modalContent.value = '';
  selectedDeadline = null;
  ddlToggle.textContent = 'DDL';
  ddlToggle.classList.remove('set');
  ddlClear.hidden = true;
  ddlCalendar.hidden = true;
  modalConfirm.textContent = '添加';
  modalOverlay.hidden = false;
  modalContent.focus();
}

function openModalForEdit(id) {
  const todo = todos[findIndex(id)];
  if (!todo) return;
  editingId = id;
  modalTitle.textContent = 'Edit Task';
  modalContent.value = todo.content;
  selectedDeadline = todo.deadline;
  if (todo.deadline) {
    ddlToggle.textContent = formatDeadline(todo.deadline);
    ddlToggle.classList.add('set');
    ddlClear.hidden = false;
  } else {
    ddlToggle.textContent = 'DDL';
    ddlToggle.classList.remove('set');
    ddlClear.hidden = true;
  }
  ddlCalendar.hidden = true;
  modalConfirm.textContent = '保存';
  modalOverlay.hidden = false;
  modalContent.focus();
}

function closeModal() { modalOverlay.hidden = true; }

function submitModal() {
  const content = modalContent.value.trim();
  if (!content) return;
  if (editingId) {
    update(editingId, content, selectedDeadline);
  } else {
    add(content, selectedDeadline);
  }
  closeModal();
}

fabBtn.addEventListener('click', openModal);
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
modalConfirm.addEventListener('click', submitModal);
modalContent.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); submitModal(); }
});

/* ── Myday API（供 Shell 调用）─────────────────────────── */

function getMydayTodos() {
  return todos.filter(t => !t.completed && isToday(t.deadline));
}

function renderMydayList(container) {
  container.innerHTML = '';
  const list = getMydayTodos();
  if (list.length === 0) return false;

  list.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'myday-item' + (todo.completed ? ' completed' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.style.cssText = 'width:18px;height:18px;accent-color:#4a90d9;cursor:pointer;flex-shrink:0';
    cb.checked = todo.completed;
    cb.addEventListener('change', () => { toggle(todo.id); renderMydayList(container); });

    const span = document.createElement('span');
    span.className = 'myday-item-text';
    span.textContent = todo.content;

    li.append(cb, span);
    container.appendChild(li);
  });
  return true;
}

/* ── 拖拽排序 ────────────────────────────────────────── */

function destroySortables() {
  if (activeList._sortableInstance) { activeList._sortableInstance.destroy(); activeList._sortableInstance = null; }
  if (completedList._sortableInstance) { completedList._sortableInstance.destroy(); completedList._sortableInstance = null; }
}

function rebuildTodos() {
  const aIds = Array.from(activeList.querySelectorAll('.todo-item')).map(el => el.dataset.id);
  const cIds = Array.from(completedList.querySelectorAll('.todo-item')).map(el => el.dataset.id);
  const allIds = [...aIds, ...cIds];

  const map = new Map(todos.map(t => [String(t.id), t]));
  const newTodos = [];
  for (const id of allIds) {
    const t = map.get(id);
    if (t) { newTodos.push(t); map.delete(id); }
  }
  for (const [, t] of map) { newTodos.push(t); }
  todos = newTodos;
  save();
}

function initSortable() {
  if (!activeList || !completedList) return;

  enableSortable(activeList, {
    onSortEnd() { rebuildTodos(); },
  });

  enableSortable(completedList, {
    onSortEnd() { rebuildTodos(); },
  });
}

/* ── 初始化 ────────────────────────────────────────────── */

render();

window.TodoModule = { getMydayTodos, renderMydayList, refresh: render };
