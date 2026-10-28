(function () {
  'use strict';

  var App = (window.App = window.App || {});

  App.views = App.views || {};

  App.views.seriesDetail = {
    render: function (ctx) {
      var series = App.data.find(ctx.params.id);
      if (!series) return App.views.notFound.render(ctx);

      document.title =
        series.title + ' · ' + App.data.site.name;

      return App.gallery.create(series, {
        scope: ctx.scope,
        startIndex: ctx.params.index || 0
      });
    }
  };
})();
