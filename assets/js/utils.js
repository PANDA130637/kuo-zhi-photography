(function () {
  'use strict';

  var App = (window.App = window.App || {});

  var reduceMQ = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  /**
   * 极简 DOM 构造器：h('div', {class:'x'}, child, 'text')
   */
  function h(tag, attrs) {
    var node = document.createElement(tag);
    var rest = Array.prototype.slice.call(arguments, 2);

    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var val = attrs[key];
        if (val === null || val === undefined || val === false) return;
        if (key === 'style' && typeof val === 'object') {
          Object.keys(val).forEach(function (p) {
            node.style.setProperty(p, val[p]);
          });
        } else if (key === 'dataset') {
          Object.keys(val).forEach(function (p) {
            node.dataset[p] = val[p];
          });
        } else if (key === 'html') {
          node.innerHTML = val;
        } else if (key.slice(0, 2) === 'on' && typeof val === 'function') {
          node.addEventListener(key.slice(2).toLowerCase(), val);
        } else {
          node.setAttribute(key, val === true ? '' : val);
        }
      });
    }

    (function flatten(list) {
      list.forEach(function (child) {
        if (child === null || child === undefined || child === false) return;
        if (Array.isArray(child)) return flatten(child);
        node.appendChild(
          typeof child === 'string' || typeof child === 'number'
            ? document.createTextNode(String(child))
            : child
        );
      });
    })(rest);

    return node;
  }

  function svg(path, size, cls) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 24 24');
    el.setAttribute('width', size || 16);
    el.setAttribute('height', size || 16);
    el.setAttribute('fill', 'none');
    el.setAttribute('aria-hidden', 'true');
    if (cls) el.setAttribute('class', cls);
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', path);
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '1');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    el.appendChild(p);
    return el;
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments;
      var self = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(self, args);
      }, wait);
    };
  }

  /* rAF 节流：每帧最多写一次样式 */
  function rafThrottle(fn) {
    var queued = false;
    var lastArgs;
    return function () {
      lastArgs = arguments;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        fn.apply(null, lastArgs);
      });
    };
  }

  function reducedMotion() {
    return !!(reduceMQ && reduceMQ.matches);
  }

  /**
   * 视图作用域：所有监听器 / 定时器都登记在这里，视图卸载时统一销毁，杜绝泄漏与跨视图串扰。
   */
  function scope() {
    var disposers = [];

    return {
      on: function (el, type, handler, opts) {
        el.addEventListener(type, handler, opts);
        disposers.push(function () {
          el.removeEventListener(type, handler, opts);
        });
      },
      interval: function (fn, ms) {
        var id = setInterval(fn, ms);
        disposers.push(function () {
          clearInterval(id);
        });
        return id;
      },
      timeout: function (fn, ms) {
        var id = setTimeout(fn, ms);
        disposers.push(function () {
          clearTimeout(id);
        });
        return id;
      },
      media: function (mq, fn) {
        var m = window.matchMedia(mq);
        if (m.addEventListener) {
          m.addEventListener('change', fn);
          disposers.push(function () {
            m.removeEventListener('change', fn);
          });
        }
        return m;
      },
      observer: function (obs) {
        disposers.push(function () {
          obs.disconnect();
        });
      },
      own: function (fn) {
        disposers.push(fn);
      },
      add: function (disposer) {
        disposers.push(disposer);
      },
      destroy: function () {
        while (disposers.length) {
          try {
            disposers.pop()();
          } catch (e) {
            /* 单个清理失败不应阻断其余清理 */
          }
        }
      }
    };
  }

  /**
   * 图片加载后淡入；已在缓存中则立即显示。
   * 同时处理未填 w/h 的情况：用真实像素修正渲染比例。
   */
  function bindImage(imgEl, photo, frameEl) {
    function done() {
      if (frameEl && photo && (!photo.w || !photo.h) && imgEl.naturalWidth) {
        frameEl.style.setProperty(
          '--r',
          (imgEl.naturalWidth / imgEl.naturalHeight).toFixed(4)
        );
      }
      imgEl.classList.add('is-loaded');
    }
    if (imgEl.complete && imgEl.naturalWidth) {
      requestAnimationFrame(done);
    } else {
      imgEl.addEventListener('load', done, { once: true });
      imgEl.addEventListener(
        'error',
        function () {
          imgEl.classList.add('is-loaded');
        },
        { once: true }
      );
    }
  }

  App.utils = {
    h: h,
    svg: svg,
    clamp: clamp,
    pad2: pad2,
    debounce: debounce,
    rafThrottle: rafThrottle,
    reducedMotion: reducedMotion,
    scope: scope,
    bindImage: bindImage,
    reduceMQ: reduceMQ,
    ARROW_RIGHT: 'M4 12h15m0 0-6-6m6 6-6 6',
    ARROW_LEFT: 'M20 12H5m0 0 6-6m-6 6 6 6'
  };
})();
