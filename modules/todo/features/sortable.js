/* ================================================================
   sortable.js — 可拔插拖拽排序模块

   使用：enableSortable(listEl, {
     onSortEnd(newOrder) { ... },     // 排序完成回调
     isSameGroup(a, b) { ... },       // 同组判定（可选，默认允许）
     itemHeight: 56,                  // 占位符高度（可选，自动检测）
     touchDelay: 300,                 // 长按触发时间（可选）
   })

   返回 destroy() 函数以移除拖拽能力。
   ================================================================ */

function enableSortable(listEl, options) {
  if (!listEl) { console.error('[Sortable] 缺少列表元素'); return () => {}; }
  const opt = Object.assign({ touchDelay: 300 }, options);

  const placeholder = document.createElement('li');
  placeholder.className = 'sortable-placeholder';
  placeholder.style.cssText = 'border:2px dashed #4a90d9;border-radius:10px;pointer-events:none;display:none;box-sizing:border-box;';

  let items = [];         // 当前可见的 DOM 元素列表（刷新）
  let dragId = null;      // 被拖元素 id
  let dragEl = null;      // 被拖 DOM 元素
  let floating = null;    // 跟随指针的浮动克隆
  let active = false;     // 是否正在拖拽
  let gapIdx = -1;        // 当前悬停的间隙索引
  let touchTimer = null;  // 移动端长按计时器
  let touchDragging = false;

  function refreshItems() {
    items = Array.from(listEl.querySelectorAll('.todo-item:not(.sortable-placeholder):not(.drag-floating)'));
  }

  function getGaps() {
    const gaps = [];
    const listRect = listEl.getBoundingClientRect();
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (i === 0) gaps.push({ idx: 0, y: r.top - listRect.top }); // 第一个元素上方
      gaps.push({ idx: i + 1, y: r.bottom - listRect.top });        // 元素下方
    }
    return gaps;
  }

  function nearestGap(clientY) {
    const listRect = listEl.getBoundingClientRect();
    const localY = clientY - listRect.top;
    const gaps = getGaps();
    let best = gaps[0];
    let bestDist = Infinity;
    for (const g of gaps) {
      const d = Math.abs(localY - g.y);
      if (d < bestDist) { bestDist = d; best = g; }
    }
    return best;
  }

  function updatePlaceholder(idx) {
    if (idx === gapIdx) return;
    gapIdx = idx;

    // 移除旧占位
    if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);

    // 计算占位高度
    const h = dragEl ? dragEl.offsetHeight : opt.itemHeight || 56;
    placeholder.style.height = h + 'px';
    placeholder.style.display = 'block';

    // 插入到正确位置
    if (idx >= items.length) {
      listEl.appendChild(placeholder);
    } else {
      listEl.insertBefore(placeholder, items[idx]);
    }

    // FLIP 动画：让受影响的元素平滑移位
    const affected = [];
    for (let i = idx; i < items.length; i++) {
      if (items[i] !== dragEl) affected.push(items[i]);
    }
    const prevTransforms = new Map();
    for (const el of affected) {
      prevTransforms.set(el, el.getBoundingClientRect().top);
    }
    requestAnimationFrame(() => {
      for (const el of affected) {
        const newTop = el.getBoundingClientRect().top;
        const oldTop = prevTransforms.get(el);
        const delta = oldTop - newTop;
        if (Math.abs(delta) > 0.5) {
          el.style.transition = 'none';
          el.style.transform = `translateY(${delta}px)`;
          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.25s ease';
            el.style.transform = '';
          });
        }
      }
    });
  }

  function hidePlaceholder() {
    placeholder.style.display = 'none';
    if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    gapIdx = -1;
  }

  function makeFloating(el, x, y) {
    const clone = el.cloneNode(true);
    clone.className = 'todo-item drag-floating';
    clone.style.cssText = `
      position:fixed; left:${x}px; top:${y}px;
      width:${el.offsetWidth}px; z-index:500; pointer-events:none;
      box-shadow:0 12px 40px rgba(0,0,0,0.22); border-radius:10px;
      background:#fff; transform:scale(1.02);
    `;
    document.body.appendChild(clone);
    return clone;
  }

  function removeFloating() {
    if (floating?.parentNode) floating.parentNode.removeChild(floating);
    floating = null;
  }

  function cleanup() {
    removeFloating();
    hidePlaceholder();
    if (dragEl) { dragEl.style.opacity = ''; dragEl = null; }
    dragId = null;
    active = false;
    touchDragging = false;
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    refreshItems();
  }

  function start(id, el, cx, cy) {
    refreshItems();
    dragId = id;
    dragEl = el;
    active = true;
    el.style.opacity = '0.3'; // 源位置变淡留白
    floating = makeFloating(el, el.getBoundingClientRect().left, cy - 30);
  }

  function onMove(clientY) {
    if (!active) return;
    if (floating) floating.style.top = (clientY - 30) + 'px';
    const gap = nearestGap(clientY);
    if (gap && gap.idx !== gapIdx) {
      updatePlaceholder(gap.idx);
    }
  }

  function end() {
    if (!active) return;
    const newGap = gapIdx >= 0 ? gapIdx : items.indexOf(dragEl);
    cleanup();

    if (opt.onSortEnd && dragId) {
      // 计算新顺序
      const itemEls = Array.from(listEl.querySelectorAll('.todo-item:not(.sortable-placeholder):not(.drag-floating)'));
      const newOrder = itemEls.map(el => el.dataset.id);
      opt.onSortEnd(newOrder, dragId, newGap);
    }
  }

  /* ── 桌面端 DnD ───────────────────── */

  function onDragStart(e) {
    refreshItems();
    dragId = this.dataset.id;
    dragEl = this;
    active = true;
    this.style.opacity = '0.3';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
  }

  function onDragEnd(e) {
    end();
  }

  function onDragOver(e) {
    e.preventDefault();
    if (!active) return;
    e.dataTransfer.dropEffect = 'move';
    onMove(e.clientY);
  }

  function onDrop(e) {
    e.preventDefault();
    end();
  }

  /* ── 移动端 Touch ──────────────────── */

  function onTouchStart(e) {
    const el = this;
    const id = this.dataset.id;
    const cx = e.touches[0].clientX;
    const cy = e.touches[0].clientY;
    refreshItems();
    touchTimer = setTimeout(() => {
      touchTimer = null;
      touchDragging = true;
      start(id, el, cx, cy);
    }, opt.touchDelay);
  }

  function onTouchMove(e) {
    if (touchDragging) {
      e.preventDefault();
      onMove(e.touches[0].clientY);
    } else if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
    }
  }

  function onTouchEnd() {
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    if (touchDragging) end();
  }

  /* ── 绑定事件 ──────────────────────── */

  function bind() {
    listEl.addEventListener('dragover', onDragOver);
    listEl.addEventListener('drop', onDrop);
    document.addEventListener('dragend', onDragEnd);
  }

  function unbind() {
    listEl.removeEventListener('dragover', onDragOver);
    listEl.removeEventListener('drop', onDrop);
    document.removeEventListener('dragend', onDragEnd);
  }

  bind();
  listEl._sortableData = { onDragStart, onTouchStart, onTouchMove, onTouchEnd, unbind };
  return () => { cleanup(); unbind(); };
}

// 辅助：给单个元素绑定事件（由 app.js 在 render 时调用）
function bindSortableItem(li, data) {
  if (!data || !li) return;
  li.draggable = true;
  li.addEventListener('dragstart', data.onDragStart);
  li.addEventListener('touchstart', data.onTouchStart, { passive: false });
  li.addEventListener('touchmove', data.onTouchMove, { passive: false });
  li.addEventListener('touchend', data.onTouchEnd);
}

// 辅助：解绑
function unbindSortableItem(li, data) {
  if (!data || !li) return;
  li.draggable = false;
  li.removeEventListener('dragstart', data.onDragStart);
  li.removeEventListener('touchstart', data.onTouchStart);
  li.removeEventListener('touchmove', data.onTouchMove);
  li.removeEventListener('touchend', data.onTouchEnd);
}
