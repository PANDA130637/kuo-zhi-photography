# 阔之神来之眼 —— 个人摄影作品集

纯静态、零构建、零 npm 依赖的摄影作品集站点。**网站是"墙"，作品是"画"。**

当前收录的是 2026.06.25–06.27 在保定拍的 34 张照片（Canon EOS R50 + RF-S 18-45mm），已压缩为本地两级资源，不依赖任何外部图床。

## 运行

任选其一：

```bash
# 直接双击 index.html（无需服务器）
# 或起个本地静态服务：
python -m http.server 8123
# 然后访问 http://127.0.0.1:8123
```

## 页面

| 地址 | 内容 |
|---|---|
| `#/` | 首页：系列封面轮播（淡入淡出，悬停暂停，方向键 / 触屏滑动可切） |
| `#/series` | 系列总览：原生比例瀑布流，封面零裁切，走 `thumbs/` 缩略图 |
| `#/series/:id` | 系列详情：横向画册（snap 居中 / 鼠标拖拽 / 滚轮转横向 / 方向键 / 左右箭头 / 触屏），点击图片开 Lightbox |
| `#/series/:id/:n` | 同上，但直接打开第 n 张 |
| `#/about` | 关于 |

现在的三个系列：`#/series/landscape`（风景 · 06.25–26 傍晚与深夜）· `#/series/campus`（大学 · 06.27 上午）· `#/series/street`（保定街头 · 06.27 日间）。

## 发给别人看 / 离线交付

两种方式，按需要选：

**1）发文件（离线可看）**，两种粒度：

- **单文件版**（推荐，最省事）：一个 HTML 装下全部——样式、脚本、字体、照片全内联，微信 / 邮件直接发，对方双击即看，连解压都不用。

  ```bash
  node tools/build-single.cjs   # 默认输出到桌面「阔之神来之眼-单文件版.html」（约 10 MB）
  ```

  照片会先重编码（长边 1440 · JPEG q0.72）再内联，要更清晰改环境变量 `SINGLE_LONG_EDGE` / `SINGLE_QUALITY`。

- **整站 zip**：解压后双击 `index.html`，画质是原始的 2000px。

  ```bash
  python tools/pack.py        # 会在桌面生成「阔之神来之眼-摄影作品集.zip」
  ```

注意 `file://` 的一个坑：浏览器会把本地字体的来源当成 opaque origin，`@font-face` 的跨源请求直接被 CORS 拒掉。所以 `index.html` 里有一段判断——`location.protocol === 'file:'` 时改用 `assets/fonts/fonts-inline.css`（woff2 已 base64 内联），用 HTTP(S) 打开时仍走 `fonts.css`，字体照常独立缓存。换字体后记得重新生成：

```bash
python tools/inline-fonts.py
```

**2）发链接（在线）**：GitHub Pages 已开启 —— https://panda130637.github.io/kuo-zhi-photography/

## 图片是怎么放的

两级结构，站点自己会用：

```
assets/img/baoding/NN.jpg          长边 2000 —— 画册、Lightbox 大图
assets/img/baoding/thumbs/NN.jpg   长边 1000 —— 系列总览封面
```

由 `tools/import-local.cjs` 生成。想换一批图：

```bash
# 1) 把放原图的目录起个静态服务
python -m http.server 8124        # 在那个目录里跑

# 2) 批量压图：系列ID / 主图长边 / 缩略图长边 / 原图服务
node tools/import-local.cjs baoding 2000 1000 http://127.0.0.1:8124
```

脚本末尾会打印每张的 `{ src, w, h }`，直接粘进 `data.js`。它用无头 Chrome 的 canvas 缩放：浏览器解码时已按 EXIF 方向旋转，重新绘制会把方向烘焙进像素，不用自己处理 Orientation。

## 添加一个系列（**只需要改这一个文件**）

打开 `assets/js/data.js`，在 `SERIES` 数组末尾加一个对象：

```js
{
  id: 'snowline',                  // 会出现在地址栏：#/series/snowline
  title: '雪线之上',
  year: '2025',
  description: '一句话描述，越短越好。',
  cover: local('01.jpg', 2000, 1333),
  photos: [
    {
      ...local('01.jpg', 2000, 1333),
      title: '05:40',
      location: '某地',
      year: '2025',
      alt: '写画面内容+环境，给读屏与图片加载失败时用'
    }
  ]
}
```

`local(name, w, h)` 里 **w/h 必须是 `assets/img/baoding/` 下主图的真实像素**，它同时决定渲染比例与横竖方向。写完顺手跑一次：

```bash
python tools/check_dims.py
```

它会把 data.js 里所有 `local()` 的声明和真实像素对账——方向写反会让画册的「横构图组 → 竖构图组」分错组（这个项目踩过：21 号被写成竖幅）。

改完保存、刷新即可：首页轮播、总览瀑布流、详情画册全部自动出现，不用动其他任何文件。

**注意**：不要给同一个系列塞太多横图或太多竖图。画册会先展示所有横构图，再展示竖构图（组间有分隔板），混合比例的节奏感更好。

## 调视觉参数

所有全局旋钮都在 `assets/css/tokens.css`：

- `--gh: 72vh` 画册图片的高度带；`--gw: 76vw` 宽度上限（超宽图触发它时会自动降高度，绝不裁切构图）
- `--tile-gap: 48px` 系列总览瀑布流的列间距
- `--bg` / `--panel` / `--card` / `--accent` / `--text*` 全部颜色令牌
- `--radius: 5px` 圆角

想换列数？改 `assets/css/views.css` 里 `.series-grid { columns: 3 }`。

## 文案是怎么写的

每张的拍摄时刻取自**原图 EXIF**，`alt` 描述取自**像素统计**（平均亮度、色相占比、暗部比例），二者都可验证——没有"看图猜景点"的成分。所以如果你想写具体的地点或景物，直接改 `data.js` 里的 `title` / `location` / `alt` 就行，其他代码不用动。

## 字体

三套字体（Space Grotesk / Inter / JetBrains Mono）已自托管在 `assets/fonts/`，不依赖外部 CDN。中文自动回落到系统字体（PingFang SC / 微软雅黑），这是有意的：几何无衬线只用于英文与数字。

## 占位图

`data.js` 里还留着 `img()` / `SIZE` 工厂（Unsplash CDN），临时补位时用；当前三个系列全部走本地图。
