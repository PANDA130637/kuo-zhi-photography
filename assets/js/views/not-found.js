(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var U = App.utils;

  App.views = App.views || {};

  App.views.notFound = {
    title: '未找到',
    render: function () {
      return U.h(
        'section',
        { class: 'notfound' },
        U.h('h1', { class: 'page__title' }, '没有找到'),
        U.h('p', { class: 'mono' }, '这个系列不存在或已被移除'),
        U.h(
          'p',
          {},
          U.h('a', { class: 'arrow-link', href: '#/series' }, '返回系列总览',
            U.svg(U.ARROW_RIGHT, 15))
        )
      );
    }
  };
})();
