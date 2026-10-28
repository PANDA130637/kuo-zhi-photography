/*
 * 自定义光标：6px 实心圆点，悬停图片时缓变为 30px 细环（只改尺寸，不改颜色）。
 * 触屏 / 粗指针设备完全不注入；插拔鼠标时通过 media query 动态启停。
 */
(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var U = App.utils;

  var fineMQ = window.matchMedia
    ? window.matchMedia('(hover: hover) and (pointer: fine)')
    : { matches: false, addEventListener: function () {} };

  var dot = null;
  var enabled = false;
  var x = -100;
  var y = -100;

  function build() {
    dot = document.createElement('div');
    dot.className = 'cursor';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
  }

  var write = U.rafThrottle(function () {
    if (!dot) return;
    dot.style.setProperty('--cx', x + 'px');
    dot.style.setProperty('--cy', y + 'px');
  });

  function onMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse') {
      if (dot) dot.classList.remove('is-visible');
      return;
    }
    x = e.clientX;
    y = e.clientY;
    if (dot) dot.classList.add('is-visible');

    var overMedia =
      e.target && e.target.closest && e.target.closest('[data-cursor="media"]');
    dot.classList.toggle('is-over-media', !!overMedia);

    write();
  }

  function onLeave() {
    if (dot) dot.classList.remove('is-visible');
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    if (!dot) build();
    document.documentElement.classList.add('has-cursor');
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    document.documentElement.classList.remove('has-cursor');
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    if (dot && dot.parentNode) dot.parentNode.removeChild(dot);
    dot = null;
  }

  App.cursor = {
    init: function () {
      if (fineMQ.matches) enable();
      if (fineMQ.addEventListener) {
        fineMQ.addEventListener('change', function (e) {
          e.matches ? enable() : disable();
        });
      }
    }
  };
})();
