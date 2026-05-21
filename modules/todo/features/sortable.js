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
  let touchStartX = 0;
  let touchStartY = 0;

  function getItems() {
    return Array.from(listEl.querySelectorAll('.todo-item:not(.drag-floating)'));
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
      if (y + h > sepRect.top) return sepRect.top - h;
    }
    return y;
  }

  /* ── 相邻交换 ───────────────────────── */

  function swapWithTarget(tgtEl) {
    const srcEl = dragEl;
    if (!srcEl || !tgtEl || srcEl === tgtEl) return;
    const list = listEl;
    if (!list.contains(srcEl) || !list.contains(tgtEl)) return;
    if (srcEl.parentNode !== tgtEl.parentNode) return;

    // 记录旧位置
    const oldTgtTop = tgtEl.getBoundingClientRect().top;

    // 交换 DOM
    const p = srcEl.parentNode;
    const na = srcEl.nextSibling;
    const nb = tgtEl.nextSibling;
    if (na === tgtEl) p.insertBefore(tgtEl, srcEl);
    else if (nb === srcEl) p.insertBefore(srcEl, tgtEl);
    else { p.insertBefore(srcEl, nb); p.insertBefore(tgtEl, na); }

    // FLIP
    const newTgtTop = tgtEl.getBoundingClientRect().top;
    const delta = oldTgtTop - newTgtTop;
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
    const srcIdx = items.indexOf(dragEl);
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

  function preventContextMenu(e) { e.preventDefault(); }

  function resetDragState() {
    removeFloating();
    document.body.style.touchAction = '';
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    if (dragEl) {
      dragEl.style.opacity = '';
      dragEl.removeEventListener('contextmenu', preventContextMenu);
    }
    dragId = null; dragEl = null; lastSwapped = null;
    active = false; touchDragging = false; touchStartX = 0; touchStartY = 0;
  }

  /* ── 自动滚屏 ──────────────────────── */

  function autoScroll(clientY) {
    const edge = 80;
    const viewH = window.innerHeight;
    const curScroll = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - viewH;
    if (clientY > viewH - edge && curScroll < maxScroll) {
      window.scrollBy(0, (clientY - (viewH - edge)) / edge * 6);
    } else if (clientY < edge && curScroll > 0) {
      window.scrollBy(0, -(edge - clientY) / edge * 6);
    }
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
    autoScroll(e.clientY);
    const target = findSwapTarget(dir);
    if (target && target.dataset.id !== lastSwapped) swapWithTarget(target);
  }

  function onDrop() {
    if (!active) return;
    const newOrder = getItems().map(el => el.dataset.id);
    resetDragState();
    if (opt.onSortEnd) opt.onSortEnd(newOrder);
  }

  /* ── 移动端 Touch ───────────────────── */

  function onTouchStart(e) {
    const el = this;
    const id = this.dataset.id;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchTimer = setTimeout(() => {
      touchTimer = null;
      try { navigator.vibrate(15); } catch (e) { /* no-op */ }
      el.addEventListener('contextmenu', preventContextMenu);
      document.body.style.touchAction = 'none';
      touchDragging = true;
      dragId = id; dragEl = el; lastSwapped = null; active = true;
      el.style.opacity = '0';
      floating = createFloating(el, el.getBoundingClientRect().left, touchStartY - 30);
      lastClientY = touchStartY;
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
      autoScroll(cy);
      const target = findSwapTarget(dir);
      if (target && target.dataset.id !== lastSwapped) swapWithTarget(target);
      return;
    }
    if (touchTimer) {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (dx * dx + dy * dy > 100) { clearTimeout(touchTimer); touchTimer = null; }
    }
  }

  function onTouchEnd() {
    if (touchTimer) { resetDragState(); return; }
    if (touchDragging) {
      const newOrder = getItems().map(el => el.dataset.id);
      resetDragState();
      if (opt.onSortEnd) opt.onSortEnd(newOrder);
    }
  }

  /* ── 绑定 ───────────────────────────── */

  listEl.addEventListener('dragover', onDragOver);
  listEl.addEventListener('drop', onDrop);
  document.addEventListener('dragend', onDrop);
  listEl._sortableData = { onDragStart, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd };

  return () => { resetDragState(); };
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
