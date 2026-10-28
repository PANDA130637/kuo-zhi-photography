(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var U = App.utils;

  App.views = App.views || {};

  App.views.about = {
    title: '关于',
    render: function () {
      var about = App.data.site.about;

      var intro = U.h(
        'div',
        { class: 'about__intro lede' },
        about.intro.map(function (text, i) {
          return U.h('p', { class: 'reveal' }, text);
        })
      );

      var blocks = about.groups.map(function (group) {
        var items = group.items.map(function (pair) {
          return U.h('li', {}, U.h('span', {}, pair[0]), U.h('span', {}, pair[1]));
        });
        return U.h(
          'div',
          { class: 'about__block reveal' },
          U.h('p', { class: 'about__label' }, group.label),
          U.h('ul', { class: 'about__list' }, items)
        );
      });

      return U.h(
        'section',
        { class: 'page' },
        U.h(
          'header',
          { class: 'page__head' },
          U.h('h1', { class: 'page__title' }, '关于'),
          U.h('p', { class: 'mono' }, '城市 · 校园 · 自然光')
        ),
        U.h('div', { class: 'about__grid' }, intro, U.h('div', {}, blocks))
      );
    }
  };
})();
