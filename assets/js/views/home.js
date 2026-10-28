(function () {
  'use strict';

  var App = (window.App = window.App || {});

  App.views = App.views || {};

  App.views.home = {
    title: '首页',
    render: function (ctx) {
      var wrap = document.createElement('div');
      wrap.appendChild(App.carousel.create(App.data.series, { scope: ctx.scope }));
      return wrap;
    }
  };
})();
