/*
 * 全站唯一的数据文件。
 * 新增一个系列 = 在 SERIES 里加一个对象；首页轮播 / 系列总览 / 系列详情会自动更新，无需改动任何视图代码。
 *
 * 当前这批照片：2026.06.25–06.27，Canon EOS R50 + RF-S 18-45mm，来自 assets/img/baoding/。
 *   assets/img/baoding/NN.jpg          长边 2000 —— 画册与大图用
 *   assets/img/baoding/thumbs/NN.jpg   长边 1000 —— 系列总览封面用
 * w/h 是主图的真实像素尺寸，同时决定渲染比例与横竖方向，不需要额外的 orientation 字段。
 *
 * 文案说明：每张的拍摄时刻取自原图 EXIF，alt 描述取自像素统计（亮度/色相占比/暗部比例），
 * 因此没有任何"看图猜测"的成分——需要写具体地点或景物时，直接改 title / location / alt 即可。
 */
(function () {
  'use strict';

  /* ============================================================
   * 资源工厂
   * ============================================================ */

  /**
   * 本地照片。
   * @param {string} name 文件名（不含目录），如 '01.jpg'
   * @param {number} w 主图像素宽
   * @param {number} h 主图像素高
   */
  function local(name, w, h) {
    return {
      src: 'assets/img/baoding/' + name,
      thumb: 'assets/img/baoding/thumbs/' + name,
      w: w,
      h: h
    };
  }

  /* 网络占位图工厂：临时补位时使用（当前系列全部走本地图） */
  var SIZE = {
    L32: [1600, 1067],
    L169: [1600, 900],
    P32: [1067, 1600],
    P169: [900, 1600]
  };

  function img(id, size, faces) {
    var w = size[0];
    var h = size[1];
    var crop = faces ? 'faces,entropy' : 'entropy';
    return {
      src:
        'https://images.unsplash.com/' +
        id +
        '?auto=format&fit=crop&crop=' +
        crop +
        '&w=' +
        w +
        '&h=' +
        h +
        '&q=74',
      w: w,
      h: h
    };
  }

  /* ============================================================
   * 站点信息
   * ============================================================ */

  var SITE = {
    name: '阔之神来之眼',
    copyright: '© 2026 阔之神来之眼',
    about: {
      intro: [
        '一台 Canon EOS R50，一支 18-45mm 的套机头，三天时间。',
        '这里是 2026 年 6 月 25 日到 27 日留下的三十四张：两个傍晚和一个深夜，一个上午，还有从正午走到下午的一段路。'
      ],
      groups: [
        {
          label: '器材',
          items: [
            ['机身', 'Canon EOS R50'],
            ['镜头', 'RF-S 18-45mm F4.5-6.3 IS STM']
          ]
        },
        {
          label: '这次拍摄',
          items: [
            ['时间', '2026.06.25 – 06.27'],
            ['地点', '河北 · 保定'],
            ['张数', '34'],
            ['后期', '仅基础影调校正 · 输出长边 2000px']
          ]
        }
      ]
    },
    links: [
      { label: 'Instagram', href: 'https://www.instagram.com/' },
      { label: '500px', href: 'https://500px.com/' }
    ]
  };

  /* ============================================================
   * 按拍摄时间切分的三个系列
   * ============================================================ */

  var SERIES = [
    {
      id: 'landscape',
      title: '风景',
      year: '2026.06.25–26',
      description: '两个傍晚与一个深夜，天色每一帧都不一样。',
      cover: local('02.jpg', 2000, 1333),
      photos: [
        {
          ...local('01.jpg', 2000, 1123),
          title: '晴午',
          location: '保定',
          year: '06.25 17:05',
          alt: '大面积蓝天占满画面，中间偏暗的部分带着一点暖色'
        },
        {
          ...local('02.jpg', 2000, 1333),
          title: '暮蓝',
          location: '保定',
          year: '06.25 19:44',
          alt: '整幅压成深蓝，下方近三成是沉入暗部的轮廓'
        },
        {
          ...local('03.jpg', 2000, 1333),
          title: '蓝墨',
          location: '保定',
          year: '06.25 19:46',
          alt: '蓝色几乎铺满画面，比前一张更沉，看不到亮部'
        },
        {
          ...local('04.jpg', 2000, 1333),
          title: '橙昏',
          location: '保定',
          year: '06.26 19:04',
          alt: '暖橙为主调，画面最亮的部分几乎顶到过曝'
        },
        {
          ...local('05.jpg', 1333, 2000),
          title: '夜',
          location: '保定',
          year: '06.26 21:46',
          alt: '近八成是低饱和的灰暗画面，几乎没有亮部'
        },
        {
          ...local('06.jpg', 1333, 2000),
          title: '夜 · 二',
          location: '保定',
          year: '06.26 21:46',
          alt: '同样极暗的夜，灰调略多于前一张'
        }
      ]
    },

    {
      id: 'campus',
      title: '大学',
      year: '2026.06.27 上午',
      description: '早上八点到十点十分，在校园里走的一段路。',
      cover: local('12.jpg', 2000, 1333),
      photos: [
        {
          ...local('07.jpg', 1333, 2000),
          title: '08:25',
          location: '保定',
          year: '2026',
          alt: '灰白调占了近七成，饱和度很低'
        },
        {
          ...local('08.jpg', 1333, 2000),
          title: '08:27',
          location: '保定',
          year: '2026',
          alt: '绿色占三分之一，混着偏冷的青绿'
        },
        {
          ...local('09.jpg', 2000, 1333),
          title: '08:29',
          location: '保定',
          year: '2026',
          alt: '过半画面是成片的绿色植被'
        },
        {
          ...local('10.jpg', 2000, 1333),
          title: '08:37',
          location: '保定',
          year: '2026',
          alt: '明暗反差大，两成以上的面积落在深阴影里'
        },
        {
          ...local('11.jpg', 2000, 1333),
          title: '08:48',
          location: '保定',
          year: '2026',
          alt: '大面积灰白，掺着少量冷绿和天光'
        },
        {
          ...local('12.jpg', 2000, 1333),
          title: '08:55',
          location: '保定',
          year: '2026',
          alt: '全组最通透的一张，亮度高，天空占了明显比重'
        },
        {
          ...local('13.jpg', 2000, 1333),
          title: '09:40',
          location: '保定',
          year: '2026',
          alt: '绿与灰为主，中间露出一小块天'
        },
        {
          ...local('14.jpg', 2000, 1333),
          title: '09:41',
          location: '保定',
          year: '2026',
          alt: '明暗对比最强烈的一张：绿、蓝、暖橙各占一块'
        },
        {
          ...local('15.jpg', 2000, 1333),
          title: '09:42',
          location: '保定',
          year: '2026',
          alt: '大片绿色里混入少量暖红'
        },
        {
          ...local('16.jpg', 2000, 1333),
          title: '09:54',
          location: '保定',
          year: '2026',
          alt: '蓝色占三分之一，其后是灰与绿'
        },
        {
          ...local('17.jpg', 2000, 1333),
          title: '10:13',
          location: '保定',
          year: '2026',
          alt: '树影落下，绿、灰与天蓝混在一起'
        }
      ]
    },

    {
      id: 'street',
      title: '保定街头',
      year: '2026.06.27 日间',
      description: '从上午的最后一小时，走到下午四点，都在街上。',
      cover: local('21.jpg', 2000, 1333),
      photos: [
        {
          ...local('18.jpg', 2000, 1333),
          title: '10:51',
          location: '保定',
          year: '2026',
          alt: '光线偏暗，灰与绿各占一半'
        },
        {
          ...local('19.jpg', 2000, 1333),
          title: '12:08',
          location: '保定',
          year: '2026',
          alt: '半幅是蓝与灰，曝光靠高感补偿起来的'
        },
        {
          ...local('20.jpg', 2000, 1333),
          title: '12:19',
          location: '保定',
          year: '2026',
          alt: '灰与绿各占近四成'
        },
        {
          ...local('21.jpg', 2000, 1333),
          title: '12:25',
          location: '保定',
          year: '2026',
          alt: '横构图，过半是高饱和的红，是全组颜色最沉的一张'
        },
        {
          ...local('22.jpg', 1333, 2000),
          title: '12:25',
          location: '保定',
          year: '2026',
          alt: '竖构图，灰色打底，红色占第二大块'
        },
        {
          ...local('23.jpg', 2000, 1333),
          title: '12:26',
          location: '保定',
          year: '2026',
          alt: '灰、绿、黄各占一块，饱和度中等'
        },
        {
          ...local('24.jpg', 1333, 2000),
          title: '12:26',
          location: '保定',
          year: '2026',
          alt: '竖构图，灰色为主，红与蓝点缀其间'
        },
        {
          ...local('25.jpg', 2000, 1333),
          title: '12:29',
          location: '保定',
          year: '2026',
          alt: '高亮度的灰蓝画面，亮部占三分之一以上'
        },
        {
          ...local('26.jpg', 2000, 1333),
          title: '12:30',
          location: '保定',
          year: '2026',
          alt: '灰、红、蓝基本三分，层次比较碎'
        },
        {
          ...local('27.jpg', 2000, 1333),
          title: '12:31',
          location: '保定',
          year: '2026',
          alt: '灰、青、红各占一块，明暗都在中段'
        },
        {
          ...local('28.jpg', 2000, 1333),
          title: '12:39',
          location: '保定',
          year: '2026',
          alt: '近三分之二是深绿，整体压得最暗的一张'
        },
        {
          ...local('29.jpg', 2000, 1333),
          title: '12:48',
          location: '保定',
          year: '2026',
          alt: '蓝色为主，绿与灰夹杂，饱和度偏高'
        },
        {
          ...local('30.jpg', 2000, 1333),
          title: '12:49',
          location: '保定',
          year: '2026',
          alt: '蓝、灰、红混合，亮度居中'
        },
        {
          ...local('31.jpg', 2000, 1333),
          title: '13:36',
          location: '保定',
          year: '2026',
          alt: '灰白占近一半，天空排第二'
        },
        {
          ...local('32.jpg', 2000, 1333),
          title: '13:36',
          location: '保定',
          year: '2026',
          alt: '接近一半是天空，配着浅色的建筑轮廓'
        },
        {
          ...local('33.jpg', 2000, 1333),
          title: '15:37',
          location: '保定',
          year: '2026',
          alt: '全组最亮的一张，浅色与青蓝为主'
        },
        {
          ...local('34.jpg', 2000, 1333),
          title: '15:55',
          location: '保定',
          year: '2026',
          alt: '浅色调为主，天空偏青，收在下午四点前'
        }
      ]
    }
  ];

  window.App = window.App || {};
  App.data = {
    SIZE: SIZE,
    img: img,
    local: local,
    site: SITE,
    series: SERIES,
    find: function (id) {
      for (var i = 0; i < SERIES.length; i++) {
        if (SERIES[i].id === id) return SERIES[i];
      }
      return null;
    },
    /* 由 w/h 推出渲染比例与方向，视图层不写任何题材分支 */
    ratio: function (photo) {
      return photo.w && photo.h ? photo.w / photo.h : 1.5;
    },
    isPortrait: function (photo) {
      return !!photo.h && photo.h > photo.w;
    }
  };
})();
