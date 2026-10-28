/*
 * Lightbox：原生 <dialog> + showModal()。
 * 白得四件事：顶层渲染、焦点陷阱、Esc 关闭、背景 inert。
 * 关键手法：切换时静默同步底层画册的 scrollLeft，因此关闭后天然停在正确的那一张。
 */
(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var U = App.utils;

  var dialog = null;
  var imgEl = null;
  var elTitle = null;
  var elSub = null;
  var elNum = null;

  var state = null; // { photos, seriesTitle, index, onIndex, trigger }
  var keyOff = null;

  function ensure() {
    if (dialog) return;
    dialog = document.getElementById('lightbox');
    imgEl = document.getElementById('lb-img');
    elTitle = document.getElementById('lb-title');
    elSub = document.getElementById('lb-sub');
    elNum = document.getElementById('lb-num');

    imgEl.setAttribute('data-cursor', 'media');

    document.getElementById('lb-close').addEventListener('click', close);
    document.getElementById('lb-prev').addEventListener('click', function () {
      step(-1);
    });
    document.getElementById('lb-next').addEventListener('click', function () {
      step(1);
    });

    /* 点击图片以外的空白区域关闭 */
    dialog.querySelector('.lb__imgwrap').addEventListener('click', function (e) {
      if (e.target === this) close();
    });

    dialog.addEventListener('close', teardown);
  }

  function lockScroll() {
    var w = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--sbw', w + 'px');
    document.documentElement.classList.add('is-locked');
  }

  function unlockScroll() {
    document.documentElement.classList.remove('is-locked');
  }

  function preload(i) {
    if (!state) return;
    var p = state.photos[(i + state.photos.length) % state.photos.length];
    if (!p) return;
    var im = new Image();
    im.src = p.src;
  }

  function render(i) {
    var n = state.photos.length;
    state.index = (i + n) % n;
    var photo = state.photos[state.index];

    imgEl.classList.remove('is-loaded');
    imgEl.src = photo.src;
    imgEl.alt = photo.alt || photo.title || '';

    /* 图片已在缓存里时 load 事件不会重复触发，这里直接补一次样式 */
    if (imgEl.complete && imgEl.naturalWidth) {
      requestAnimationFrame(function () {
        imgEl.classList.add('is-loaded');
      });
    } else {
      imgEl.addEventListener(
        'load',
        function () {
          imgEl.classList.add('is-loaded');
        },
        { once: true }
      );
    }

    elTitle.textContent = photo.title || '未命名';
    elSub.textContent = state.seriesTitle || '';
    elNum.textContent = U.pad2(state.index + 1) + ' / ' + U.pad2(n);

    preload(state.index + 1);
    preload(state.index - 1);

    if (state.onIndex) state.onIndex(state.index);
  }

  function step(delta) {
    if (!state) return;
    render(state.index + delta);
  }

  function teardown() {
    unlockScroll();
    if (keyOff) {
      keyOff();
      keyOff = null;
    }
    if (state && state.trigger && state.trigger.focus) {
      state.trigger.focus({ preventScroll: true });
    }
    state = null;
  }

  function open(opts) {
    ensure();
    if (dialog.open) return;

    state = {
      photos: opts.photos,
      seriesTitle: opts.seriesTitle,
      index: opts.index || 0,
      onIndex: opts.onIndex,
      trigger: opts.trigger || null
    };

    lockScroll();
    dialog.showModal();

    keyOff = App.keyboard.push({
      onKey: function (e) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          step(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          step(1);
        }
      }
    });

    render(state.index);
  }

  function close() {
    if (dialog && dialog.open) dialog.close();
  }

  App.lightbox = {
    open: open,
    close: close,
    isOpen: function () {
      return !!(dialog && dialog.open);
    }
  };
})();
