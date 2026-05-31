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
    filter: 'input, button, .todo-delete',
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
      if (fb) fb.style.display = 'none';

      // 自己创建镜像，left 固定，只跟手指垂直移动
      const item = evt.item;
      const rect = item.getBoundingClientRect();
      customMirror = item.cloneNode(true);
      customMirror.classList.add('drag-custom-mirror');
      customMirror.style.cssText = [
        'position:fixed',
        `left:${rect.left}px`,
        `top:${rect.top}px`,
        `width:${item.offsetWidth}px`,
        'z-index:9999',
        'pointer-events:none',
        'box-shadow:0 12px 40px rgba(0,0,0,0.22)',
        'opacity:1!important',
        'visibility:visible!important',
      ].join(';');
      document.body.appendChild(customMirror);

      moveHandler = (e) => {
        if (customMirror) customMirror.style.top = (e.clientY - 30) + 'px';
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
