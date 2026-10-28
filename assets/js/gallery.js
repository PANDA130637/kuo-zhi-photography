/*
 * 横向画册：像翻相册一样逐张浏览。
 * 支持：scroll-snap、鼠标拖拽、滚轮转横向、键盘方向键、左右箭头、触摸原生滑动、Lightbox。
 *
 * 尺寸策略（关键）：高度/宽度双约束，任意构图都不裁切
 *   --h: min(var(--gh), calc(var(--gw) / var(--r)));  width: calc(var(--h) * var(--r));
 */
(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var U = App.utils;

  var DRAG_START = 8; // 进入拖拽的位移阈值
  var CLICK_SLOP = 6; // 位移超过它就不再算「点击」

  function groupByOrientation(photos) {
    var wide = [];
    var tall = [];
    photos.forEach(function (p) {
      (App.data.isPortrait(p) ? tall : wide).push(p);
    });
    return { wide: wide, tall: tall };
  }

  function create(series, opts) {
    opts = opts || {};
    var scope = opts.scope;
    var grouped = groupByOrientation(series.photos);
    var photos = grouped.wide.concat(grouped.tall);
    var n = photos.length;

    /* ---------- DOM ---------- */

    var barBack = U.h(
      'a',
      { class: 'arrow-link album__back', href: '#/series' },
      U.svg(U.ARROW_LEFT, 15),
      '系列'
    );

    var bar = U.h(
      'div',
      { class: 'album__bar glass' },
      barBack,
      U.h('div', { class: 'album__bar-title display--zh' }, series.title),
      U.h(
        'p',
        { class: 'mono album__bar-meta' },
        series.year + ' · ' + U.pad2(n) + ' 张'
      )
    );

    var headSpacer = U.h('div', { class: 'gallery__spacer', 'aria-hidden': 'true' });
    var tailSpacer = U.h('div', { class: 'gallery__spacer', 'aria-hidden': 'true' });

    var track = U.h('div', { class: 'gallery__track' }, headSpacer);
    var figures = [];

    function addFigure(photo, index) {
      var frame = U.h('div', { class: 'gallery__frame shot', 'data-cursor': 'media' });

      var imgEl = U.h('img', {
        src: photo.src,
        alt: photo.alt || photo.title || '',
        draggable: 'false',
        loading: index < 2 ? 'eager' : 'lazy',
        decoding: 'async'
      });
      U.bindImage(imgEl, photo, frame);
      frame.appendChild(imgEl);

      /* 比例变量必须挂在 item 上——尺寸公式在 .gallery__item 里读取它，再继承给 frame */
      var fig = U.h(
        'figure',
        {
          class: 'gallery__item',
          dataset: { index: String(index) },
          style: { '--r': App.data.ratio(photo).toFixed(4) }
        },
        frame,
        U.h(
          'figcaption',
          { class: 'gallery__cap' },
          U.h('span', { class: 'gallery__cap-title' }, photo.title || '未命名'),
          U.h(
            'span',
            {},
            [photo.location, photo.year].filter(Boolean).join(' · ')
          ),
          U.h(
            'span',
            { class: 'gallery__cap-num' },
            U.pad2(index + 1) + ' / ' + U.pad2(n)
          )
        )
      );
      track.appendChild(fig);
      figures.push(fig);
    }

    /* 横构图组 → 分隔板 → 竖构图组；序号仍按全系列连续编号 */
    var cursor = 0;
    grouped.wide.forEach(function (p) {
      addFigure(p, cursor++);
    });

    if (grouped.wide.length && grouped.tall.length) {
      track.appendChild(
        U.h(
          'div',
          { class: 'gallery__divider', 'aria-hidden': 'true' },
          U.h('span', {}, '竖构图 · ' + U.pad2(grouped.tall.length) + ' 张')
        )
      );
    }

    grouped.tall.forEach(function (p) {
      addFigure(p, cursor++);
    });

    var scroller = U.h(
      'div',
      {
        class: 'gallery',
        tabindex: '0',
        role: 'region',
        'aria-label': '《' + series.title + '》横向画册，共 ' + n + ' 张'
      },
      track
    );
    track.appendChild(tailSpacer);

    var arrowPrev = U.h(
      'button',
      { class: 'album__arrow album__arrow--prev', type: 'button', 'aria-label': '上一张' },
      U.svg(U.ARROW_LEFT, 20)
    );
    var arrowNext = U.h(
      'button',
      { class: 'album__arrow album__arrow--next', type: 'button', 'aria-label': '下一张' },
      U.svg(U.ARROW_RIGHT, 20)
    );

    var stage = U.h(
      'div',
      { class: 'album__stage' },
      scroller,
      arrowPrev,
      arrowNext
    );

    var progressBar = U.h('span', { class: 'album__progress-bar' });
    var progress = U.h('div', { class: 'album__progress' }, progressBar);

    var root = U.h('section', { class: 'album' }, bar, stage, progress);

    /* ---------- 尺寸与居中 ---------- */

    function offsetWithin(el) {
      var sr = scroller.getBoundingClientRect();
      var er = el.getBoundingClientRect();
      return er.left - sr.left + scroller.scrollLeft;
    }

    function centerOf(fig) {
      return offsetWithin(fig) - (scroller.clientWidth - fig.offsetWidth) / 2;
    }

    function layoutSpacers() {
      if (!figures.length) return;
      var cw = scroller.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var first = figures[0].offsetWidth;
      var last = figures[figures.length - 1].offsetWidth;
      /* 减去 gap，让第一张图在 scrollLeft=0 时恰好居中（进度条也从 0% 开始） */
      headSpacer.style.width = Math.max((cw - first) / 2 - gap, 24) + 'px';
      tailSpacer.style.width = Math.max((cw - last) / 2 - gap, 24) + 'px';
    }

    /* ---------- 索引状态 ---------- */

    var current = 0;

    function nearestIndex() {
      var mid = scroller.scrollLeft + scroller.clientWidth / 2;
      var best = 0;
      var bestDist = Infinity;
      for (var i = 0; i < figures.length; i++) {
        var f = figures[i];
        var d = Math.abs(offsetWithin(f) + f.offsetWidth / 2 - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      return best;
    }

    function behavior() {
      return U.reducedMotion() ? 'auto' : 'smooth';
    }

    function scrollToIndex(i, mode) {
      var target = U.clamp(i, 0, figures.length - 1);
      var fig = figures[target];
      if (!fig) return;
      scroller.scrollTo({
        left: centerOf(fig),
        behavior: mode || behavior()
      });
      current = target;
      syncUI();
    }

    var syncUI = U.rafThrottle(function () {
      var max = scroller.scrollWidth - scroller.clientWidth;
      var ratio = max > 0 ? scroller.scrollLeft / max : 0;
      progressBar.style.width = (U.clamp(ratio, 0, 1) * 100).toFixed(3) + '%';
      arrowPrev.disabled = scroller.scrollLeft <= 2;
      arrowNext.disabled = scroller.scrollLeft >= max - 2;
    });

    function onScroll() {
      var i = nearestIndex();
      if (i !== current) current = i;
      syncUI();
    }

    /* ---------- 拖拽 ---------- */

    var pointerId = null;
    var startX = 0;
    var startScroll = 0;
    var dragging = false;
    var moved = 0;
    var snapTimer = null;

    function onPointerDown(e) {
      if (e.pointerType === 'touch') return; // 触摸交给原生滚动
      if (e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = scroller.scrollLeft;
      dragging = false;
      moved = 0;
    }

    function onPointerMove(e) {
      if (pointerId === null || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) < DRAG_START) return;
        dragging = true;
        scroller.classList.add('is-dragging'); // 拖拽期间必须临时关闭 snap
        try {
          scroller.setPointerCapture(pointerId);
        } catch (err) {
          /* 某些浏览器在极少数情况下会抛，忽略 */
        }
      }
      e.preventDefault();
      scroller.scrollLeft = startScroll - dx;
      moved = Math.max(moved, Math.abs(dx));
    }

    function snapToNearest() {
      var target = nearestIndex();
      scrollToIndex(target, behavior());

      function settle() {
        scroller.classList.remove('is-dragging');
        current = target;
      }

      if ('onscrollend' in window) {
        scroller.addEventListener('scrollend', settle, { once: true });
      } else {
        clearTimeout(snapTimer);
        snapTimer = setTimeout(settle, 420); // Safari < 26.2 的兜底
      }
    }

    function onPointerUp(e) {
      if (pointerId === null || (e && e.pointerId !== pointerId)) return;
      try {
        if (scroller.hasPointerCapture && scroller.hasPointerCapture(pointerId)) {
          scroller.releasePointerCapture(pointerId);
        }
      } catch (err) {
        /* 忽略 */
      }
      pointerId = null;
      if (!dragging) return; // 未进入拖拽：保留点击语义
      dragging = false;
      snapToNearest();
    }

    /* 拖拽过就把这次 click 判抵消，不打开 Lightbox */
    function onClickCapture(e) {
      if (moved > CLICK_SLOP) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      var item = e.target.closest ? e.target.closest('.gallery__item') : null;
      if (!item) return;
      e.preventDefault();
      openLightbox(parseInt(item.dataset.index, 10), item.querySelector('img'));
    }

    function openLightbox(i, trigger) {
      App.lightbox.open({
        photos: photos,
        seriesTitle: series.title,
        index: i,
        trigger: trigger,
        onIndex: function (idx) {
          scrollToIndex(idx, 'auto'); // 静默同步：关闭 Lightbox 后天然停在正确的位置
        }
      });
    }

    /* ---------- 滚轮转横向 ----------
     * 离散鼠标滚轮的单个刻度会立刻被 mandatory snap 拉回，必须走
     * 「手势会话累加器 + 冷却期」：累计一段滚动就换一张，惯性尾巴在冷却期被吞掉。 */

    var wheelAcc = 0;
    var wheelLastTs = 0;
    var wheelLockUntil = 0;
    var WHEEL_GESTURE_GAP = 150;
    var WHEEL_STEP = 60;
    var WHEEL_COOLDOWN = 320;

    function onWheel(e) {
      if (e.ctrlKey) return; // 捏合缩放放行
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // 触控板横扫交给原生

      var max = scroller.scrollWidth - scroller.clientWidth;
      var atStart = scroller.scrollLeft <= 1 && e.deltaY < 0;
      var atEnd = scroller.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return; // 到边不拦截，页面继续滚

      e.preventDefault();

      var now = performance.now();
      if (now - wheelLastTs > WHEEL_GESTURE_GAP) wheelAcc = 0; // 新手势，重置累加
      wheelLastTs = now;

      if (now < wheelLockUntil) return; // 冷却期吞掉惯性尾巴
      wheelAcc += e.deltaY;

      if (Math.abs(wheelAcc) >= WHEEL_STEP) {
        scrollToIndex(current + (wheelAcc > 0 ? 1 : -1));
        wheelAcc = 0;
        wheelLockUntil = now + WHEEL_COOLDOWN;
      }
    }

    /* ---------- 键盘 ---------- */

    scope.own(
      App.keyboard.push({
        onKey: function (e) {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollToIndex(current - 1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollToIndex(current + 1);
          } else if (e.key === 'Home') {
            e.preventDefault();
            scrollToIndex(0);
          } else if (e.key === 'End') {
            e.preventDefault();
            scrollToIndex(figures.length - 1);
          }
        },
        guard: function () {
          return !App.lightbox.isOpen();
        }
      })
    );

    /* ---------- 绑定 ---------- */

    scope.on(scroller, 'pointerdown', onPointerDown);
    scope.on(scroller, 'pointermove', onPointerMove);
    scope.on(scroller, 'pointerup', onPointerUp);
    scope.on(scroller, 'pointercancel', onPointerUp);
    scope.on(scroller, 'click', onClickCapture, true);
    scope.on(scroller, 'wheel', onWheel, { passive: false });
    scope.on(scroller, 'scroll', U.rafThrottle(onScroll), { passive: true });

    scope.on(arrowPrev, 'click', function () {
      scrollToIndex(current - 1);
    });
    scope.on(arrowNext, 'click', function () {
      scrollToIndex(current + 1);
    });

    var onResize = U.debounce(function () {
      var keep = current;
      layoutSpacers();
      scrollToIndex(keep, 'auto');
    }, 120);
    scope.on(window, 'resize', onResize);

    scope.own(function () {
      clearTimeout(snapTimer);
    });

    /* ---------- 初始化 ---------- */

    if (!U.reducedMotion()) {
      root.classList.add('album__enter');
      figures.forEach(function (fig, i) {
        fig.style.setProperty('--i-delay', Math.min(i * 55, 330) + 'ms');
      });
    }

    requestAnimationFrame(function () {
      layoutSpacers();
      scrollToIndex(opts.startIndex || 0, 'auto');
      scroller.focus({ preventScroll: true });
    });

    return root;
  }

  App.gallery = { create: create };
})();
