(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var U = App.utils;

  App.views = App.views || {};

  App.views.seriesList = {
    title: '系列',
    render: function (ctx) {
      var list = App.data.series;
      var totalPhotos = list.reduce(function (sum, s) {
        return sum + s.photos.length;
      }, 0);

      var grid = U.h('div', { class: 'series-grid' });

      list.forEach(function (series) {
        var img = U.h('img', {
          src: series.cover.thumb || series.cover.src,
          alt: '《' + series.title + '》系列封面',
          loading: 'lazy',
          decoding: 'async',
          'data-cursor': 'media'
        });
        U.bindImage(img, series.cover, null);

        var media = U.h(
          'div',
          {
            class: 'series-card__media shot',
            style: { '--r': App.data.ratio(series.cover).toFixed(4) }
          },
          img
        );

        var card = U.h(
          'a',
          { class: 'series-card reveal glow', href: '#/series/' + series.id },
          media,
          U.h(
            'div',
            { class: 'series-card__body' },
            U.h('h2', { class: 'series-card__title' }, series.title),
            U.h(
              'p',
              { class: 'mono' },
              series.year + ' · ' + U.pad2(series.photos.length) + ' 张'
            ),
            U.h('p', { class: 'series-card__desc' }, series.description)
          )
        );

        grid.appendChild(card);
      });

      return U.h(
        'section',
        { class: 'page' },
        U.h(
          'header',
          { class: 'page__head' },
          U.h('h1', { class: 'page__title' }, '系列'),
          U.h(
            'p',
            { class: 'mono' },
            '共 ' + U.pad2(list.length) + ' 个系列 · ' + U.pad2(totalPhotos) + ' 张'
          )
        ),
        grid
      );
    }
  };
})();
