(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var U = App.utils;

  function initShell() {
    var site = App.data.site;

    document.getElementById('nav-brand').textContent = site.name;
    document.getElementById('footer-copy').textContent = site.copyright;

    var links = document.getElementById('footer-links');
    site.links.forEach(function (l) {
      links.appendChild(
        U.h('a', { href: l.href, target: '_blank', rel: 'noopener noreferrer' }, l.label)
      );
    });
  }

  function initNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('nav-toggle');

    var onScroll = U.rafThrottle(function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '关闭' : '菜单';
    });

    window.addEventListener('hashchange', function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '菜单';
    });
  }

  function init() {
    if (!location.hash) {
      /* 不用 history API（file:// 下会抛 SecurityError），只改 hash */
      location.replace('#/');
    }
    initShell();
    initNav();
    App.cursor.init();
    App.router.start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
