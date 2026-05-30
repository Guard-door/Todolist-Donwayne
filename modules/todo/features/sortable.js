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

  let itemLeft = 0;

  const instance = new Sortable(listEl, {

    animation: 200,
    delay: opt.touchDelay,
    delayOnTouchOnly: true,
    direction: 'vertical',
    draggable: '.todo-item',
    filter: 'input, button, .todo-delete',
    preventOnFilter: false,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    fallbackClass: 'sortable-fallback',
    forceFallback: true,
    fallbackOnBody: true,

    onStart(evt) {
      try { navigator.vibrate(15); } catch (e) { /* no-op */ }
      itemLeft = evt.item.getBoundingClientRect().left;
      const fb = document.querySelector('.sortable-fallback');
      if (fb) fb.style.setProperty('left', itemLeft + 'px', 'important');
    },

    onEnd() {
      if (!opt.onSortEnd) return;
      const newOrder = Array.from(listEl.querySelectorAll('.todo-item'))
        .map(el => el.dataset.id);
      opt.onSortEnd(newOrder);
    },
  });

  listEl._sortableInstance = instance;
  return () => instance.destroy();
}
