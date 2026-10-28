"""把站点打包成一个可以直接发给别人的 zip（排除 .git / .workbuddy / 旧 zip）。

解压后双击 index.html 即可离线浏览：字体走 fonts-inline.css 的 base64 版本，
图片是本地文件，hash 路由不依赖服务器。

用法：python tools/pack.py [输出目录]      # 默认输出到桌面
"""
import os
import shutil
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = '阔之神来之眼-摄影作品集'
DEFAULT_OUT_DIR = os.path.join(os.path.expanduser('~'), 'Desktop')

# 要进包的条目（顺序无所谓）；.git / .workbuddy 一律不打包
INCLUDE = ['index.html', 'assets', 'tools', 'README.md', '.nojekyll', '.gitignore']


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT_DIR
    out_zip = os.path.join(out_dir, NAME + '.zip')
    stage_root = os.path.join(os.environ.get('TEMP', '/tmp'), 'share_pack')
    stage = os.path.join(stage_root, NAME)

    if os.path.isdir(stage_root):
        shutil.rmtree(stage_root)
    os.makedirs(stage, exist_ok=True)

    copied = missing = 0
    for name in INCLUDE:
        src, dst = os.path.join(ROOT, name), os.path.join(stage, name)
        if os.path.isdir(src):
            shutil.copytree(src, dst)
            copied += 1
        elif os.path.isfile(src):
            shutil.copy2(src, dst)
            copied += 1
        else:
            missing += 1

    if missing:
        print('跳过不存在的条目 %d 个（正常，例如没有 .nojekyll）' % missing)

    if os.path.exists(out_zip):
        os.remove(out_zip)

    count = 0
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for base, _, names in os.walk(stage):
            for n in names:
                full = os.path.join(base, n)
                z.write(full, os.path.relpath(full, stage_root))
                count += 1

    raw = sum(os.path.getsize(os.path.join(b, n)) for b, _, ns in os.walk(stage) for n in ns)
    print('打包 %d 个文件（原始 %.1f MB）' % (count, raw / 1048576))
    print('输出: %s（%.1f MB）' % (out_zip, os.path.getsize(out_zip) / 1048576))


if __name__ == '__main__':
    main()
