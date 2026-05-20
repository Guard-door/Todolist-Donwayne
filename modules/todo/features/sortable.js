/* ================================================================
   sortable.js — 可拔插拖拽排序模块

   接口：enableSortable(listEl, {
     onSortEnd(newOrder)  // 排序完成回调，newOrder = [id, id, ...]
     isSameGroup(a, b)    // 同组判定（可选）
     touchDelay: 300      // 长按触发时间
   })

   数据流单向，不碰 localStorage/应用状态。
   ================================================================ */

function enableSortable(listEl, options) {
  if (!listEl) return () => {};
  const opt = Object.assign({ touchDelay: 300 }, options);

  let items = [];
  let dragId = null;
  let dragEl = null;
  let floating = null;
  let active = false;
  let lastSwapped = null;
  let touchTimer = null;
  let touchDragging = false;

  function refreshItems() {
    items = Array.from(listEl.querySelectorAll('.todo-item:not(.drag-floating)'));
  }

  function crossedMidline(clientY, el) {
    const r = el.getBoundingClientRect();
    return clientY < r.top + r.height / 2;
  }

  function isSameGroup(id1, id2) {
    if (!opt.isSameGroup) return true;
    return opt.isSameGroup(id1, id2);
  }

  /* ── 浮动克隆 ───────────────────────── */

  function createFloating(el, x, y) {
    const clone = el.cloneNode(true);
    clone.className = 'todo-item drag-floating';
    clone.style.cssText = [
      'position:fixed', `left:${x}px`, `top:${y}px`,
      `width:${el.offsetWidth}px`, 'z-index:500', 'pointer-events:none',
      'box-shadow:0 12px 40px rgba(0,0,0,0.22)', 'border-radius:10px',
      'background:#fff', 'transform:scale(1.02)'
    ].join(';');
    document.body.appendChild(clone);
    return clone;
  }

  function removeFloating() {
    if (floating?.parentNode) floating.parentNode.removeChild(floating);
    floating = null;
  }

  /* ── 交换 ───────────────────────────── */

  function performSwap(targetId) {
    if (!isSameGroup(dragId, targetId)) return;
    const srcEl = listEl.querySelector(`.todo-item[data-id="${dragId}"]`);
    const tgtEl = listEl.querySelector(`.todo-item[data-id="${targetId}"]`);
    if (!srcEl || !tgtEl || srcEl === tgtEl) return;

    // FLIP
    const rA = srcEl.getBoundingClientRect();
    const rB = tgtEl.getBoundingClientRect();
    srcEl.style.transition = 'none';
    tgtEl.style.transition = 'none';
    srcEl.style.transform = `translateY(${rB.top - rA.top}px)`;
    tgtEl.style.transform = `translateY(${rA.top - rB.top}px)`;

    // 交换 DOM
    const p = srcEl.parentNode;
    const na = srcEl.nextSibling;
    const nb = tgtEl.nextSibling;
    if (na === tgtEl) p.insertBefore(tgtEl, srcEl);
    else if (nb === srcEl) p.insertBefore(srcEl, tgtEl);
    else { p.insertBefore(srcEl, nb); p.insertBefore(tgtEl, na); }

    // 触发过渡
    requestAnimationFrame(() => {
      srcEl.style.transition = 'transform 0.25s ease';
      tgtEl.style.transition = 'transform 0.25s ease';
      srcEl.style.transform = '';
      tgtEl.style.transform = '';
    });

    lastSwapped = targetId;
  }

  /* ── 清理 ───────────────────────────── */

  function cleanup() {
    removeFloating();
    if (dragEl) dragEl.style.opacity = '';
    dragId = null; dragEl = null; lastSwapped = null; active = false;
  }

  /* ── 桌面端 DnD ─────────────────────── */

  function onDragStart(e) {
    refreshItems();
    dragId = this.dataset.id;
    dragEl = this;
    lastSwapped = null;
    active = true;
    this.style.opacity = '0';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
  }

  function onDragOver(e) {
    e.preventDefault();
    if (!active || !dragId) return;
    e.dataTransfer.dropEffect = 'move';
    const target = e.target?.closest?.('.todo-item');
    if (!target) return;
    const tid = target.dataset.id;
    if (!tid || tid === dragId || tid === lastSwapped) return;
    if (crossedMidline(e.clientY, target)) performSwap(tid);
  }

  function onDrop() {
    if (!active) return;
    const newOrder = Array.from(
      listEl.querySelectorAll('.todo-item:not(.drag-floating)')
    ).map(el => el.dataset.id);
    cleanup();
    if (opt.onSortEnd) opt.onSortEnd(newOrder);
  }

  /* ── 移动端 Touch ───────────────────── */

  function onTouchStart(e) {
    const el = this;
    const id = this.dataset.id;
    const cx = e.touches[0].clientX;
    const cy = e.touches[0].clientY;
    refreshItems();
    touchTimer = setTimeout(() => {
      touchTimer = null;
      touchDragging = true;
      dragId = id; dragEl = el; lastSwapped = null; active = true;
      el.style.opacity = '0';
      floating = createFloating(el, el.getBoundingClientRect().left, cy - 30);
    }, opt.touchDelay);
  }

  function onTouchMove(e) {
    if (touchDragging) {
      e.preventDefault();
      if (floating) floating.style.top = (e.touches[0].clientY - 30) + 'px';
      const fx = floating?.getBoundingClientRect().left + (floating?.offsetWidth || 0) / 2;
      const target = document.elementFromPoint(
        fx || e.touches[0].clientX, e.touches[0].clientY
      )?.closest?.('.todo-item');
      if (target?.dataset?.id && target.dataset.id !== dragId && target.dataset.id !== lastSwapped) {
        if (crossedMidline(e.touches[0].clientY, target)) performSwap(target.dataset.id);
      }
      return;
    }
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
  }

  function onTouchEnd() {
    if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    if (touchDragging) {
      const newOrder = Array.from(
        listEl.querySelectorAll('.todo-item:not(.drag-floating)')
      ).map(el => el.dataset.id);
      cleanup();
      touchDragging = false;
      if (opt.onSortEnd) opt.onSortEnd(newOrder);
    }
  }

  /* ── 绑定 ───────────────────────────── */

  listEl.addEventListener('dragover', onDragOver);
  listEl.addEventListener('drop', onDrop);
  document.addEventListener('dragend', onDrop);
  listEl._sortableData = { onDragStart, onTouchStart, onTouchMove, onTouchEnd };

  return () => { cleanup(); if (touchTimer) clearTimeout(touchTimer); };
}

function bindSortableItem(li, data) {
  if (!data || !li) return;
  li.draggable = true;
  li.addEventListener('dragstart', data.onDragStart);
  li.addEventListener('touchstart', data.onTouchStart, { passive: false });
  li.addEventListener('touchmove', data.onTouchMove, { passive: false });
  li.addEventListener('touchend', data.onTouchEnd);
}
