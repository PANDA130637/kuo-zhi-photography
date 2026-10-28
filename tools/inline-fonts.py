"""把 assets/fonts/fonts.css 里的 woff2 引用换成 base64 内联，产出 fonts-inline.css。

为什么需要：浏览器在 file:// 下会把本地字体的来源当成 opaque origin('null')，
@font-face 的跨源请求被 CORS 拒掉——直接双击 index.html 时字体全部失效。
index.html 里有一段脚本判断 location.protocol === 'file:'，是的话就换成这份内联版。
用 HTTP 打开时仍走原来的 fonts.css（字体独立缓存，关键路径更轻）。

用法：python tools/inline-fonts.py
"""
import base64
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, 'assets', 'fonts')
SRC = os.path.join(FONT_DIR, 'fonts.css')
OUT = os.path.join(FONT_DIR, 'fonts-inline.css')


def main():
    css = open(SRC, encoding='utf-8').read()

    def repl(m):
        fname = m.group(2)
        path = os.path.join(FONT_DIR, fname)
        data = base64.b64encode(open(path, 'rb').read()).decode('ascii')
        print('内联 %-45s %6.1f KB -> base64 %6.1f KB'
              % (fname, os.path.getsize(path) / 1024, len(data) / 1024))
        return "url('data:font/woff2;base64,%s')" % data

    out = re.sub(r"url\('(\./)?([^']+\.woff2)'\)", repl, css)
    if out == css:
        raise SystemExit('没找到任何 woff2 引用，fonts.css 结构可能变了')

    header = ('/* 由 tools/inline-fonts.py 生成，请勿手改。\n'
              ' * 仅在 file:// 场景下使用（见 index.html 里的 protocol 判断）。 */\n')
    open(OUT, 'w', encoding='utf-8').write(header + out)
    print('写入 %s（%.1f KB）' % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT) / 1024))


if __name__ == '__main__':
    main()
