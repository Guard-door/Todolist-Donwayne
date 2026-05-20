/* ================================================================
   Todo 模块 — 数据、渲染、CRUD、日历、长按菜单、Myday API
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
  // 迁移旧数据
  if (todos.length > 0 && (todos[0].text !== undefined || todos[0].done !== undefined || todos[0].dueDate !== undefined)) {
    save();
  }
  // 自动清理：删除 completed && deadline < today
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
let editingId = null; // 编辑模式下的任务 id

/* ── DOM 引用 ──────────────────────────────────────────── */

function $el(id) {
  const el = document.getElementById(id);
  if (!el) console.error('[Todo] 缺少 DOM 元素: #' + id);
  return el;
}

const todoList = $el('todoList');
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
const contextMenu = $el('contextMenu');
const ctxEdit = $el('ctxEdit');

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

/* ── 渲染 ──────────────────────────────────────────────── */

function render() {
  todoList.innerHTML = '';

  if (todos.length === 0) {
    emptyState.classList.remove('hidden');
    welcomeMsg.textContent = isFirstVisit ? 'Add To Work ✨' : 'All Done 🎉';
  } else {
    emptyState.classList.add('hidden');
  }

  // 排序：未完成在上，已完成在下
  const sorted = [...todos].sort((a, b) => a.completed - b.completed);
  let sepInserted = false;

  sorted.forEach(todo => {
    if (todo.completed && !sepInserted) {
      sepInserted = true;
      const sep = document.createElement('li');
      sep.className = 'todo-separator';
      sep.setAttribute('aria-hidden', 'true');
      todoList.appendChild(sep);
    }

    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    li.dataset.id = todo.id;
    li.draggable = true;
    li.addEventListener('dragstart', onDragStart);
    li.addEventListener('dragend', onDragEnd);
    li.addEventListener('dragover', onDragOver);
    li.addEventListener('drop', onDrop);
    li.addEventListener('touchstart', onTouchDnDStart, { passive: false });
    li.addEventListener('touchmove', onTouchDnDMove, { passive: false });
    li.addEventListener('touchend', onTouchDnDEnd);

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
    text.addEventListener('dblclick', () => startEditInline(todo.id, text));

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

    // 长按事件
    addLongPress(li, todo.id);

    todoList.appendChild(li);
  });
}

/* ── 拖拽排序 ────────────────────────────────────────── */

let dragSrcId = null;
let dragSrcEl = null;
let dragInsertIdx = -1;
let touchClone = null;
let touchStartY = 0;
let touchStartTime = 0;
let touchDragActive = false;
const indicator = document.createElement('div');
indicator.className = 'drag-indicator';
document.body.appendChild(indicator);

function getViewItems() {
  return [...todos].sort((a, b) => a.completed - b.completed);
}

function isSameGroup(id1, id2) {
  const v = getViewItems();
  const a = v.find(t => t.id === +id1);
  const b = v.find(t => t.id === +id2);
  if (!a || !b) return false;
  return a.completed === b.completed;
}

/* 从 clientY 计算应在哪个可见项之前插入 */
function insertIdxFromY(clientY) {
  const items = todoList.querySelectorAll('.todo-item:not(.drag-hidden)');
  let idx = 0;
  for (const el of items) {
    const r = el.getBoundingClientRect();
    if (clientY < r.top + r.height / 2) return idx;
    idx++;
  }
  return items.length;
}

/* 蓝色指示线定位 */
function moveIndicator(clientY) {
  const items = todoList.querySelectorAll('.todo-item:not(.drag-hidden)');
  if (items.length === 0) { indicator.style.display = 'none'; return; }
  const idx = insertIdxFromY(clientY);
  const listRect = todoList.getBoundingClientRect();
  if (idx >= items.length) {
    const last = items[items.length - 1];
    indicator.style.top = (last.getBoundingClientRect().bottom - listRect.top) + 'px';
  } else {
    indicator.style.top = (items[idx].getBoundingClientRect().top - listRect.top) + 'px';
  }
  indicator.style.left = '0';
  indicator.style.width = '100%';
  indicator.style.display = 'block';
}

function hideIndicator() {
  indicator.style.display = 'none';
}

/* ── 桌面端 ──────────────────────────────────────────── */

function onDragStart(e) {
  dragSrcId = this.dataset.id;
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcId);
  // 延迟隐藏源元素，让浏览器先截取拖拽图像
  requestAnimationFrame(() => { this.classList.add('drag-hidden'); });
}

function onDragEnd() {
  if (dragSrcEl) dragSrcEl.classList.remove('drag-hidden');
  hideIndicator();
  dragSrcId = null;
  dragSrcEl = null;
  dragInsertIdx = -1;
}

function onDragOver(e) {
  e.preventDefault();
  if (!dragSrcId) return;
  e.dataTransfer.dropEffect = 'move';
  if (dragSrcId !== this.dataset.id && isSameGroup(dragSrcId, this.dataset.id)) {
    moveIndicator(e.clientY);
  }
}

function onDrop(e) {
  e.preventDefault();
  if (!dragSrcId || dragSrcId === this.dataset.id) return;
  const idx = insertIdxFromY(e.clientY);
  commitReorder(dragSrcId, idx);
  if (dragSrcEl) dragSrcEl.classList.remove('drag-hidden');
  hideIndicator();
  dragSrcId = null;
  dragSrcEl = null;
}

/* ── 移动端触摸拖拽 ──────────────────────────────────── */

function onTouchDnDStart(e) {
  touchStartY = e.touches[0].clientY;
  touchStartTime = Date.now();
  touchDragActive = false;
}

function onTouchDnDMove(e) {
  if (touchDragActive) {
    e.preventDefault();
    touchClone.style.top = (e.touches[0].clientY - 30) + 'px';
    const idx = insertIdxFromY(e.touches[0].clientY);
    if (idx !== dragInsertIdx) {
      dragInsertIdx = idx;
      moveIndicator(e.touches[0].clientY);
    }
    return;
  }

  const dy = Math.abs(e.touches[0].clientY - touchStartY);
  const dt = Date.now() - touchStartTime;
  if (dy > 8 || dt > 400) {
    touchDragActive = true;
    clearTimeout(longPressTimer);
    longPressTimer = null;
    e.preventDefault();

    dragSrcId = this.dataset.id;
    dragSrcEl = this;
    this.classList.add('drag-hidden');

    const li = this;
    const rect = li.getBoundingClientRect();
    touchClone = li.cloneNode(true);
    touchClone.className = 'todo-item touch-clone';
    touchClone.style.cssText = `
      position:fixed; left:${rect.left}px; top:${e.touches[0].clientY - 30}px;
      width:${rect.width}px; z-index:500; pointer-events:none; opacity:0.5;
      box-shadow:0 8px 30px rgba(0,0,0,0.18); border-radius:10px;
      background:#fff;
    `;
    document.body.appendChild(touchClone);
  }
}

function onTouchDnDEnd() {
  if (touchDragActive) {
    if (touchClone) { document.body.removeChild(touchClone); touchClone = null; }
    if (dragSrcEl) dragSrcEl.classList.remove('drag-hidden');
    hideIndicator();
    if (dragSrcId && dragInsertIdx >= 0) {
      commitReorder(dragSrcId, dragInsertIdx);
    }
    dragSrcId = null;
    dragSrcEl = null;
    dragInsertIdx = -1;
    touchDragActive = false;
    return;
  }
}

/* ── 提交重排 ────────────────────────────────────────── */

function commitReorder(srcId, toViewIdx) {
  const view = getViewItems();
  const srcViewIdx = view.findIndex(t => t.id === +srcId);
  if (srcViewIdx === -1) return;

  // 限制同组
  let destViewIdx = toViewIdx;
  if (destViewIdx < 0) destViewIdx = 0;
  if (destViewIdx > view.length) destViewIdx = view.length;
  // 确保目标位置与源同组
  const srcCompleted = view[srcViewIdx].completed;
  if (destViewIdx > 0 && view[Math.min(destViewIdx - 1, view.length - 1)].completed !== srcCompleted) destViewIdx = srcViewIdx;
  if (destViewIdx < view.length && view[destViewIdx] && view[destViewIdx].completed !== srcCompleted) destViewIdx = srcViewIdx;
  if (destViewIdx === srcViewIdx) return;

  const srcArrIdx = findIndex(+srcId);
  const [moved] = todos.splice(srcArrIdx, 1);

  let insertArrIdx;
  if (destViewIdx === 0) {
    insertArrIdx = 0;
  } else {
    const anchor = view[destViewIdx > srcViewIdx ? destViewIdx : destViewIdx - 1];
    insertArrIdx = findIndex(anchor.id);
    if (destViewIdx <= srcViewIdx) insertArrIdx++;
    if (srcArrIdx < insertArrIdx) insertArrIdx--;
  }

  todos.splice(insertArrIdx, 0, moved);
  save();
  render();
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
  render();
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

/* ── 长按上下文菜单 ────────────────────────────────────── */

let longPressTimer = null;
let longPressId = null;

function addLongPress(el, id) {
  let started = false;

  function start(e) {
    started = false;
    longPressTimer = setTimeout(() => {
      if (touchMoved) return;
      started = true;
      longPressId = id;
      showContextMenu(e);
    }, 500);
  }

  function end() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  el.addEventListener('touchstart', (e) => {
    start(e.touches[0]);
  }, { passive: true });

  el.addEventListener('touchend', end);
  el.addEventListener('touchmove', end);
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    clearTimeout(longPressTimer);
    longPressId = id;
    showContextMenu(e);
  });
}

function showContextMenu(e) {
  const x = e.clientX || (e.touches && e.touches[0].clientX) || 100;
  const y = e.clientY || (e.touches && e.touches[0].clientY) || 200;
  contextMenu.style.left = Math.min(x, window.innerWidth - 140) + 'px';
  contextMenu.style.top = Math.min(y, window.innerHeight - 60) + 'px';
  contextMenu.hidden = false;
}

function hideContextMenu() {
  contextMenu.hidden = true;
  longPressId = null;
}

document.addEventListener('click', (e) => {
  if (contextMenu && !contextMenu.contains(e.target)) hideContextMenu();
});

if (ctxEdit) ctxEdit.addEventListener('click', () => {
  const id = longPressId;
  hideContextMenu();
  openModalForEdit(id);
});

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

/* ── 初始化 ────────────────────────────────────────────── */

render();

window.TodoModule = { getMydayTodos, renderMydayList, refresh: render };
