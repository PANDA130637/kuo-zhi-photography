/*
 * 首页 Hero：系列封面轮播。
 * opacity 淡入淡出 600ms（不做横向位移），5.5s 自动播放，悬停暂停、移出恢复并重置计时。
 */
(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var U = App.utils;

  var INTERVAL = 5500;

  function create(list, opts) {
    opts = opts || {};
    var scope = opts.scope;

    var slides = [];
    var dots = [];
    var current = 0;
    var timer = null;
    var hovered = false;

    var slideWrap = U.h('div', { class: 'hero__slides' });
    var dotsWrap = U.h('div', { class: 'hero__dots' });

    list.forEach(function (series, i) {
      var portrait = App.data.isPortrait(series.cover);

      var img = U.h('img', {
        src: series.cover.src,
        alt: '《' + series.title + '》系列封面',
        draggable: 'false',
        loading: i === 0 ? 'eager' : 'lazy',
        decoding: 'async',
        fetchpriority: i === 0 ? 'high' : 'auto',
        'data-cursor': 'media'
      });
      U.bindImage(img, series.cover, null);

      var media = U.h('div', { class: 'hero__media' }, img);

      var slide = U.h(
        'div',
        {
          class:
            'hero__slide' +
            (portrait ? ' hero__slide--portrait' : '') +
            (i === 0 ? ' is-active' : '')
        },
        media,
        U.h('div', { class: 'hero__scrim' }),
        U.h('a', {
          class: 'hero__hit',
          href: '#/series/' + series.id,
          'aria-label': '进入系列《' + series.title + '》'
        }),
        U.h(
          'div',
          { class: 'hero__info' },
          U.h('h2', { class: 'hero__title' }, series.title),
          U.h(
            'p',
            { class: 'mono hero__meta' },
            series.year + ' · ' + U.pad2(series.photos.length) + ' 张'
          ),
          U.h(
            'span',
            { class: 'arrow-link hero__enter' },
            '进入系列',
            U.svg(U.ARROW_RIGHT, 15)
          )
        )
      );

      slideWrap.appendChild(slide);
      slides.push(slide);

      var dot = U.h('button', {
        class: 'hero__dot',
        type: 'button',
        'aria-label': '第 ' + (i + 1) + ' 张：' + series.title,
        'aria-current': i === 0 ? 'true' : 'false'
      });
      dotsWrap.appendChild(dot);
      dots.push(dot);

      scope.on(dot, 'click', function (e) {
        e.preventDefault();
        goTo(i);
        restart();
      });
    });

    var hero = U.h('section', { class: 'hero' }, slideWrap, dotsWrap);

    function paint(next) {
      slides.forEach(function (s, i) {
        s.classList.toggle('is-active', i === next);
      });
      dots.forEach(function (d, i) {
        d.setAttribute('aria-current', i === next ? 'true' : 'false');
      });
      current = next;
    }

    function goTo(i) {
      var total = slides.length;
      paint(((i % total) + total) % total);
    }

    function tick() {
      goTo(current + 1);
    }

    function start() {
      if (timer || !slides.length) return;
      if (hovered || U.reducedMotion() || document.hidden) return;
      timer = setInterval(tick, INTERVAL);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    /* 恢复时重置计时，否则鼠标一移开就会立刻切换 */
    function restart() {
      stop();
      start();
    }

    scope.own(stop);

    scope.on(hero, 'mouseenter', function () {
      hovered = true;
      stop();
    });
    scope.on(hero, 'mouseleave', function () {
      hovered = false;
      restart();
    });
    scope.on(hero, 'focusin', stop);
    scope.on(hero, 'focusout', restart);
    scope.on(document, 'visibilitychange', function () {
      document.hidden ? stop() : restart();
    });

    /* 移动端左右滑动切换 */
    var touchStart = null;
    scope.on(
      hero,
      'touchstart',
      function (e) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      },
      { passive: true }
    );
    scope.on(
      hero,
      'touchend',
      function (e) {
        if (!touchStart) return;
        var t = e.changedTouches[0];
        var dx = t.clientX - touchStart.x;
        var dy = t.clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          goTo(current + (dx < 0 ? 1 : -1));
          restart();
        }
      },
      { passive: true }
    );

    scope.own(
      App.keyboard.push({
        onKey: function (e) {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goTo(current - 1);
            restart();
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            goTo(current + 1);
            restart();
          }
        },
        guard: function () {
          return !App.lightbox.isOpen();
        }
      })
    );

    requestAnimationFrame(start);

    return hero;
  }

  App.carousel = { create: create };
})();
