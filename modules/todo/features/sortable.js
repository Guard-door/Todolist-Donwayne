/* ================================================================
   sortable.js — 可拔插拖拽排序模块（Edge 风格：空白位 + 链式单向滑动）

   接口：enableSortable(listEl, {
     onSortEnd(newOrder)  // 排序完成回调，newOrder = [id, id, ...]
     isSameGroup(a, b)    // 同组判定（可选）
     touchDelay: 200      // 长按触发时间
   })
   ================================================================ */

function enableSortable(listEl, options) {
  if (!listEl) return () => {};
  const opt = Object.assign({ touchDelay: 200 }, options);

  let dragId = null;
  let dragEl = null;
  let floating = null;
  let active = false;
  let lastSwapped = null;
  let touchTimer = null;
  let touchDragging = false;

  function getItems() {
    return Array.from(listEl.querySelectorAll('.todo-item:not(.drag-floating)'));
  }

  function indexOf(el) {
    return getItems().indexOf(el);
  }

  function isSameGroup(id1, id2) {
    if (!opt.isSameGroup) return true;
    return opt.isSameGroup(id1, id2);
  }

  /* ── 浮动克隆 ───────────────────────── */

  function createFloating(el, x, y) {
    const clone = el.cloneNode(true);
    clone.classList.add('drag-floating');
    const bg = getComputedStyle(el).backgroundColor;
    clone.style.cssText = [
      'position:fixed', `left:${x}px`, `top:${y}px`,
      `width:${el.offsetWidth}px`, 'z-index:500', 'pointer-events:none',
      'box-shadow:0 12px 40px rgba(0,0,0,0.22)', 'border-radius:10px',
      'transform:scale(1.02)', `background-color:${bg}`
    ].join(';');
    document.body.appendChild(clone);
    return clone;
  }

  function removeFloating() {
    if (floating?.parentNode) floating.parentNode.removeChild(floating);
    floating = null;
  }

  function clampFloatingY(y) {
    const sep = listEl.querySelector('.todo-separator');
    if (!sep || !dragEl) return y;
    const sepRect = sep.getBoundingClientRect();
    const isCompleted = dragEl.classList.contains('completed');
    if (isCompleted) {
      // 已完成不能拖到分隔线上方
      const minY = sepRect.bottom;
      if (y < minY) return minY;
    } else {
      // 未完成不能拖到分隔线下方
      const h = floating ? floating.offsetHeight : 56;
      const maxY = sepRect.top - h;
      if (y + h > maxY) return maxY;
    }
    return y;
  }

  /* ── 相邻交换 ───────────────────────── */

  function swapWithTarget(tgtEl) {
    const srcEl = dragEl;
    if (!srcEl || !tgtEl || srcEl === tgtEl) return;

    // 记录旧位置
    const oldTgtTop = tgtEl.getBoundingClientRect().top;

    // 先交换 DOM
    const p = srcEl.parentNode;
    const na = srcEl.nextSibling;
    const nb = tgtEl.nextSibling;
    if (na === tgtEl) p.insertBefore(tgtEl, srcEl);
    else if (nb === srcEl) p.insertBefore(srcEl, tgtEl);
    else { p.insertBefore(srcEl, nb); p.insertBefore(tgtEl, na); }

    // 新位置 = 目标元素被移到了空白位处
    const newTgtTop = tgtEl.getBoundingClientRect().top;
    const delta = oldTgtTop - newTgtTop;

    // FLIP：目标从旧位置滑入新位置
    tgtEl.style.transition = 'none';
    tgtEl.style.transform = `translateY(${delta}px)`;

    requestAnimationFrame(() => {
      tgtEl.style.transition = 'transform 0.35s ease';
      tgtEl.style.transform = '';
    });

    lastSwapped = tgtEl.dataset.id;
  }

  function findSwapTarget(dir) {
    if (!floating) return null;
    const items = getItems();
    const srcIdx = indexOf(dragEl);
    if (srcIdx === -1) return null;
    const floatRect = floating.getBoundingClientRect();

    // 向上：浮动顶部越过上方元素中线
    if (dir < 0 && srcIdx > 0) {
      const above = items[srcIdx - 1];
      if (!isSameGroup(dragId, above.dataset.id)) return null;
      const r = above.getBoundingClientRect();
      if (floatRect.top < r.top + r.height / 2) return above;
    }
    // 向下：浮动底部越过下方元素中线
    if (dir > 0 && srcIdx < items.length - 1) {
      const below = items[srcIdx + 1];
      if (!isSameGroup(dragId, below.dataset.id)) return null;
      const r = below.getBoundingClientRect();
      if (floatRect.bottom > r.top + r.height / 2) return below;
    }
    return null;
  }

  /* ── 清理 ───────────────────────────── */

  function cleanup() {
    removeFloating();
    if (dragEl) dragEl.style.opacity = '';
    dragId = null; dragEl = null; lastSwapped = null; active = false;
  }

  /* ── 桌面端 DnD ─────────────────────── */

  let lastClientY = 0;
  let lastDir = 0;

  function onDragStart(e) {
    dragId = this.dataset.id;
    dragEl = this;
    lastSwapped = null;
    active = true;
    lastClientY = e.clientY;
    lastDir = 0;
    this.style.opacity = '0';
    floating = createFloating(this, this.getBoundingClientRect().left, e.clientY - 30);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
  }

  function onDragOver(e) {
    e.preventDefault();
    if (!active || !dragId) return;
    e.dataTransfer.dropEffect = 'move';
    if (floating) floating.style.top = clampFloatingY(e.clientY - 30) + 'px';
    const dir = e.clientY - lastClientY;
    if ((dir > 0 && lastDir < 0) || (dir < 0 && lastDir > 0)) lastSwapped = null;
    if (dir) lastDir = dir;
    lastClientY = e.clientY;
    const target = findSwapTarget(dir);
    if (target && target.dataset.id !== lastSwapped) swapWithTarget(target);
  }

  function onDrop() {
    if (!active) return;
    removeFloating();
    if (dragEl) dragEl.style.opacity = '';
    dragId = null; dragEl = null; lastSwapped = null; active = false;
    const newOrder = getItems().map(el => el.dataset.id);
    if (opt.onSortEnd) opt.onSortEnd(newOrder);
  }

  /* ── 移动端 Touch ───────────────────── */

  function onTouchStart(e) {
    // 清理可能残留的状态
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    if (floating) { removeFloating(); }
    if (dragEl) { dragEl.style.opacity = ''; dragEl = null; }
    active = false; touchDragging = false;

    const el = this;
    const id = this.dataset.id;
    const cx = e.touches[0].clientX;
    const cy = e.touches[0].clientY;
    touchTimer = setTimeout(() => {
      touchTimer = null;
      touchDragging = true;
      dragId = id; dragEl = el; lastSwapped = null; active = true;
      el.style.opacity = '0';
      floating = createFloating(el, el.getBoundingClientRect().left, cy - 30);
      lastClientY = cy;
      lastDir = 0;
    }, opt.touchDelay);
  }

  function onTouchMove(e) {
    if (touchDragging) {
      e.preventDefault();
      if (floating) floating.style.top = clampFloatingY(e.touches[0].clientY - 30) + 'px';
      const cy = e.touches[0].clientY;
      const dir = cy - lastClientY;
      if ((dir > 0 && lastDir < 0) || (dir < 0 && lastDir > 0)) lastSwapped = null;
      if (dir) lastDir = dir;
      lastClientY = cy;
      const target = findSwapTarget(dir);
      if (target && target.dataset.id !== lastSwapped) swapWithTarget(target);
      return;
    }
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
  }

  function onTouchEnd() {
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; return; }
    if (touchDragging) {
      touchDragging = false;
      removeFloating();
      if (dragEl) dragEl.style.opacity = '';
      dragId = null; dragEl = null; lastSwapped = null; active = false;
      const newOrder = getItems().map(el => el.dataset.id);
      if (opt.onSortEnd) opt.onSortEnd(newOrder);
    }
  }

  /* ── 绑定 ───────────────────────────── */

  listEl.addEventListener('dragover', onDragOver);
  listEl.addEventListener('drop', onDrop);
  document.addEventListener('dragend', onDrop);
  listEl._sortableData = { onDragStart, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd };

  return () => { cleanup(); if (touchTimer) clearTimeout(touchTimer); };
}

function bindSortableItem(li, data) {
  if (!data || !li) return;
  li.draggable = true;
  li.addEventListener('dragstart', data.onDragStart);
  li.addEventListener('touchstart', data.onTouchStart, { passive: false });
  li.addEventListener('touchmove', data.onTouchMove, { passive: false });
  li.addEventListener('touchend', data.onTouchEnd);
  li.addEventListener('touchcancel', data.onTouchCancel);
}
