/*
 * 滚动揭示：单个 IntersectionObserver，元素按 DOM 顺序递增 48ms 延迟，上限 240ms。
 * 视图切换时 reset()，避免旧节点残留。
 */
(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var io = null;

  function ensure() {
    if (io) return io;
    io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { root: null, threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    return io;
  }

  App.reveal = {
    observeAll: function (root) {
      if (!root || App.utils.reducedMotion()) return;
      var observer = ensure();
      var nodes = root.querySelectorAll('.reveal:not(.is-in)');
      Array.prototype.forEach.call(nodes, function (el, i) {
        el.style.setProperty('--reveal-delay', Math.min(i * 48, 240) + 'ms');
        observer.observe(el);
      });
    },
    revealNow: function (root) {
      if (!root) return;
      Array.prototype.forEach.call(
        root.querySelectorAll('.reveal'),
        function (el) {
          el.classList.add('is-in');
        }
      );
    },
    reset: function () {
      if (io) {
        io.disconnect();
        io = null;
      }
    }
  };
})();
