/*
 * 栈式键盘管理器。
 * 首页轮播、详情画册、Lightbox 都可能需要方向键；后注册的层压在栈顶，
 * 只有栈顶那一层会收到按键，因此无需在各处写「当前是哪个页面」的判断。
 */
(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var stack = [];

  function isTyping(target) {
    if (!target || !target.closest) return false;
    return !!target.closest('input, textarea, select, [contenteditable="true"]');
  }

  window.addEventListener('keydown', function (e) {
    if (e.defaultPrevented) return;
    if (isTyping(e.target)) return;

    for (var i = stack.length - 1; i >= 0; i--) {
      var layer = stack[i];
      if (layer.guard && layer.guard(e) === false) continue;
      layer.onKey(e);
      return;
    }
  });

  App.keyboard = {
    /**
     * 注册一层键盘上下文。
     * @returns {Function} off() —— 务必在 scope.own(off) 里登记
     */
    push: function (ctx) {
      stack.push(ctx);
      return function off() {
        var idx = stack.indexOf(ctx);
        if (idx > -1) stack.splice(idx, 1);
      };
    }
  };
})();
