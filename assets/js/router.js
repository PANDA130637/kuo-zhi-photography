/*
 * hash 路由。每个视图都拿到自己的 scope，切换时统一 destroy，杜绝监听器与定时器泄漏。
 */
(function () {
  'use strict';

  var App = (window.App = window.App || {});

  var routes = [
    { re: /^\/?$/, view: 'home' },
    { re: /^\/series\/?$/, view: 'seriesList' },
    {
      re: /^\/series\/([^/]+)(?:\/(\d+))?\/?$/,
      view: 'seriesDetail',
      params: function (m) {
        return { id: decodeURIComponent(m[1]), index: m[2] ? parseInt(m[2], 10) - 1 : 0 };
      }
    },
    { re: /^\/about\/?$/, view: 'about' }
  ];

  var main = null;
  var currentKey = null;
  var currentScope = null;

  function parse(hash) {
    var path = (hash || '').replace(/^#/, '');
    if (path === '') path = '/';
    for (var i = 0; i < routes.length; i++) {
      var m = path.match(routes[i].re);
      if (m) {
        return {
          view: routes[i].view,
          params: routes[i].params ? routes[i].params(m) : {},
          key: path
        };
      }
    }
    return { view: 'notFound', params: {}, key: path };
  }

  function setNavCurrent(view, params) {
    var target = null;
    if (view === 'seriesList' || view === 'seriesDetail') target = 'series';
    else if (view === 'about') target = 'about';

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-nav]'),
      function (a) {
        a.classList.toggle('is-current', a.dataset.nav === target);
      }
    );
  }

  function setTitle(view) {
    var v = App.views[view];
    document.title =
      view === 'home' || !v || !v.title
        ? App.data.site.name
        : v.title + ' · ' + App.data.site.name;
  }

  function render() {
    var route = parse(location.hash);

    if (route.key === currentKey) return; // 同一路由不重复渲染
    currentKey = route.key;

    if (currentScope) currentScope.destroy();
    App.reveal.reset();

    main.innerHTML = '';
    /* body[data-view] 供 CSS 做整行为切换（如详情页隐藏常规导航与页脚） */
    document.body.dataset.view = route.view.replace(/[A-Z]/g, function (m) {
      return '-' + m.toLowerCase();
    });
    window.scrollTo(0, 0);

    var nextScope = App.utils.scope();
    currentScope = nextScope;

    var view = App.views[route.view] || App.views.notFound;
    setNavCurrent(route.view, route.params);
    setTitle(route.view);

    var el = view.render({ params: route.params, scope: nextScope });
    main.appendChild(el);

    App.reveal.observeAll(el);
  }

  App.router = {
    start: function () {
      main = document.getElementById('main');
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.addEventListener('hashchange', render);
      render();
    },
    refresh: function () {
      currentKey = null;
      render();
    }
  };
})();
