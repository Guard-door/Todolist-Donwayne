/* ================================================================
   sortable.js — 拖拽排序封装（底层 SortableJS）

   接口：enableSortable(listEl, {
     onSortEnd(newOrder)   // newOrder = [id, id, ...]
     touchDelay: 200       // 长按触发时间
   })
   ================================================================ */

function enableSortable(listEl, options) {
  if (!listEl) return () => {};
  const opt = Object.assign({ touchDelay: 200 }, options);

  let customMirror = null;
  let moveHandler = null;

  const instance = new Sortable(listEl, {

    animation: 200,
    delay: opt.touchDelay,
    delayOnTouchOnly: true,
    direction: 'vertical',
    draggable: '.todo-item',
    filter: 'input, button, .todo-delete, .edit-trigger',
    preventOnFilter: false,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    fallbackClass: 'sortable-fallback',
    forceFallback: true,
    fallbackOnBody: true,

    onStart(evt) {
      try { navigator.vibrate(15); } catch (e) { /* no-op */ }

      // 隐藏 SortableJS 镜像
      const fb = document.querySelector('.sortable-fallback');
      if (fb) fb.style.visibility = 'hidden';

      // 自己创建镜像：left 固定，只跟手指垂直移动
      // 用 ghost 占位元素取位置（evt.item 可能已被 SortableJS display:none）
      const item = evt.item;
      const ghost = listEl.querySelector('.sortable-ghost');
      const refEl = ghost || item;
      const rect = refEl.getBoundingClientRect();
      const isCompleted = item.classList.contains('completed');

      // 手动构建干净镜像：不克隆、不 regex，完全可控
      customMirror = document.createElement('li');
      customMirror.className = 'todo-item drag-custom-mirror' + (isCompleted ? ' completed' : '');
      customMirror.dataset.id = item.dataset.id;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'todo-checkbox';
      cb.checked = item.querySelector('.todo-checkbox')?.checked || false;

      const body = document.createElement('div');
      body.className = 'todo-body';

      const text = document.createElement('span');
      text.className = 'todo-text';
      text.textContent = item.querySelector('.todo-text')?.textContent || '';

      const deadlineEl = item.querySelector('.todo-deadline');
      if (deadlineEl) {
        const dl = document.createElement('span');
        dl.className = deadlineEl.className;
        dl.textContent = deadlineEl.textContent;
        body.append(text, dl);
      } else {
        body.append(text);
      }

      const del = document.createElement('button');
      del.className = 'todo-delete';
      del.textContent = '×';

      customMirror.append(cb, body, del);
      customMirror.style.cssText = [
        `position:fixed`,
        `left:${rect.left}px`,
        `top:${rect.top}px`,
        `width:${item.offsetWidth}px`,
        `z-index:150`,
        `pointer-events:none`,
        `box-shadow:0 12px 40px rgba(0,0,0,0.22)`,
      ].join(';');
      document.body.appendChild(customMirror);

      moveHandler = (e) => {
        if (!customMirror) return;
        let top = e.clientY - 30;

        // 不超出导航栏
        if (top < 60) top = 60;
        if (top + customMirror.offsetHeight > window.innerHeight - 60) {
          top = window.innerHeight - 60 - customMirror.offsetHeight;
        }

        // 不跨分隔线
        const sep = document.getElementById('todoSeparator');
        if (sep && !sep.hidden) {
          const h = customMirror.offsetHeight;
          const sr = sep.getBoundingClientRect();
          if (isCompleted) {
            if (top < sr.bottom) top = sr.bottom;
          } else {
            if (top + h > sr.top) top = sr.top - h;
          }
        }

        customMirror.style.top = top + 'px';
      };
      document.addEventListener('pointermove', moveHandler, { passive: true });
    },

    onEnd() {
      if (moveHandler) {
        document.removeEventListener('pointermove', moveHandler);
        moveHandler = null;
      }
      if (customMirror) {
        customMirror.remove();
        customMirror = null;
      }
      if (!opt.onSortEnd) return;
      const newOrder = Array.from(listEl.querySelectorAll('.todo-item'))
        .map(el => el.dataset.id);
      opt.onSortEnd(newOrder);
    },
  });

  listEl._sortableInstance = instance;
  return () => {
    if (moveHandler) document.removeEventListener('pointermove', moveHandler);
    if (customMirror) customMirror.remove();
    instance.destroy();
  };
}
