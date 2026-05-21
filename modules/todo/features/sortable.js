/* ================================================================
   sortable.js — 可拔插拖拽排序模块（Pointer Events 统一鼠标/触摸）

   接口：enableSortable(listEl, {
     onSortEnd(newOrder)  // 排序完成回调，newOrder = [id, id, ...]
     isSameGroup(a, b)    // 同组判定（可选）
     touchDelay: 200      // 长按触发时间
   })
   ================================================================ */

function enableSortable(listEl, options) {
  if (!listEl) return () => {};
  const opt = Object.assign({ touchDelay: 200 }, options);

  let isDragReady = false;
  let isDragging = false;
  let pointerId = null;
  let dragEl = null;
  let floating = null;
  let dragId = null;
  let lastSwapped = null;
  let startX = 0;
  let startY = 0;
  let lastClientY = 0;
  let lastDir = 0;
  let touchTimer = null;
  let isTouch = false;

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
      const minY = sepRect.bottom;
      if (y < minY) return minY;
    } else {
      const h = floating ? floating.offsetHeight : 56;
      if (y + h > sepRect.top) return sepRect.top - h;
    }
    return y;
  }

  /* ── 相邻交换 ───────────────────────── */

  function swapWithTarget(tgtEl) {
    const srcEl = dragEl;
    if (!srcEl || !tgtEl || srcEl === tgtEl) return;
    if (!listEl.contains(srcEl) || !listEl.contains(tgtEl)) return;
    if (srcEl.parentNode !== tgtEl.parentNode) return;

    const oldTgtTop = tgtEl.getBoundingClientRect().top;

    const p = srcEl.parentNode;
    const na = srcEl.nextSibling;
    const nb = tgtEl.nextSibling;
    if (na === tgtEl) p.insertBefore(tgtEl, srcEl);
    else if (nb === srcEl) p.insertBefore(srcEl, tgtEl);
    else { p.insertBefore(srcEl, nb); p.insertBefore(tgtEl, na); }

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

    if (dir < 0 && srcIdx > 0) {
      const above = items[srcIdx - 1];
      if (!isSameGroup(dragId, above.dataset.id)) return null;
      const r = above.getBoundingClientRect();
      if (floatRect.top < r.top + r.height / 2) return above;
    }
    if (dir > 0 && srcIdx < items.length - 1) {
      const below = items[srcIdx + 1];
      if (!isSameGroup(dragId, below.dataset.id)) return null;
      const r = below.getBoundingClientRect();
      if (floatRect.bottom > r.top + r.height / 2) return below;
    }
    return null;
  }

  /* ── 清理 ───────────────────────────── */

  function activateDrag() {
    isDragReady = false;
    isDragging = true;
    try { dragEl.setPointerCapture(pointerId); } catch (e) {}
    if (isTouch) {
      dragEl.style.touchAction = 'none';
    }
    dragEl.style.opacity = '0';
    floating = createFloating(dragEl, dragEl.getBoundingClientRect().left, startY - 30);
    lastClientY = startY;
    lastDir = 0;
  }

  function resetDragState() {
    removeFloating();
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    if (dragEl) {
      dragEl.style.opacity = '';
      dragEl.style.touchAction = '';
      try { dragEl.releasePointerCapture(pointerId); } catch (e) {}
    }
    isDragReady = false;
    isDragging = false;
    pointerId = null;
    dragEl = null;
    dragId = null;
    lastSwapped = null;
    startX = 0; startY = 0;
    isTouch = false;
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

  /* ── Pointer Events 统一处理 ────────── */

  function onPointerDown(e) {
    if (isDragReady || isDragging) return;
    if (!e.isPrimary) return;

    dragEl = e.currentTarget;
    dragId = dragEl.dataset.id;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastClientY = e.clientY;
    lastDir = 0;
    lastSwapped = null;
    isTouch = e.pointerType === 'touch';

    isDragReady = true;

    if (isTouch) {
      touchTimer = setTimeout(() => {
        touchTimer = null;
        try { navigator.vibrate(15); } catch (e) { /* no-op */ }
        activateDrag();
      }, opt.touchDelay);
    }
  }

  function onPointerMove(e) {
    if (!isDragReady && !isDragging) return;
    if (e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (isDragReady && !isTouch) {
      if (dx * dx + dy * dy > 9) activateDrag();
      return;
    }

    if (isDragReady && isTouch) {
      if (dx * dx + dy * dy > 100) {
        clearTimeout(touchTimer); touchTimer = null;
        resetDragState();
      }
      return;
    }

    if (isDragging) {
      e.preventDefault();
      if (floating) floating.style.top = clampFloatingY(e.clientY - 30) + 'px';
      const dir = e.clientY - lastClientY;
      if ((dir > 0 && lastDir < 0) || (dir < 0 && lastDir > 0)) lastSwapped = null;
      if (dir) lastDir = dir;
      lastClientY = e.clientY;
      autoScroll(e.clientY);
      const target = findSwapTarget(dir);
      if (target && target.dataset.id !== lastSwapped) swapWithTarget(target);
    }
  }

  function onPointerUp(e) {
    if (e.pointerId !== pointerId) return;
    if (isDragReady) { resetDragState(); return; }
    if (isDragging) {
      const newOrder = getItems().map(el => el.dataset.id);
      resetDragState();
      if (opt.onSortEnd) opt.onSortEnd(newOrder);
    }
  }

  function onPointerCancel(e) {
    if (e.pointerId !== pointerId) return;
    resetDragState();
  }

  /* ── 数据导出 ───────────────────────── */

  listEl._sortableData = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };

  return () => { resetDragState(); };
}

function bindSortableItem(li, data) {
  if (!data || !li) return;
  li.addEventListener('pointerdown', data.onPointerDown);
  li.addEventListener('pointermove', data.onPointerMove);
  li.addEventListener('pointerup', data.onPointerUp);
  li.addEventListener('pointercancel', data.onPointerCancel);
}
