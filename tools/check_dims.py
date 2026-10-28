"""对账：assets/js/data.js 里每一处 local('NN.jpg', w, h) 是否与真实像素一致。

用法：python tools/check_dims.py
用途：图片换来换去时最容易写错的就是 w/h——方向判错会让画册的
      「横构图组 → 竖构图组」分组出错。改完 data.js 跑一遍最省事。
"""
import os
import re
import struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, 'assets', 'img')


def jpeg_size(path):
    """纯 stdlib 读 JPEG 的 SOF 尺寸，不依赖 Pillow。"""
    data = open(path, 'rb').read()
    i = 2
    while i < len(data) - 1:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        if marker in (0xD9, 0xDA):
            break
        length = struct.unpack('>H', data[i + 2:i + 4])[0]
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            return struct.unpack('>H', data[i + 7:i + 9])[0], struct.unpack('>H', data[i + 5:i + 7])[0]
        i += 2 + length
    return None


def main():
    src = open(os.path.join(ROOT, 'assets', 'js', 'data.js'), encoding='utf-8').read()

    # local() 工厂里写着主图目录，例如 "src: 'assets/img/' + DIR + ..." 或写死 baoding
    m = re.search(r"local\b[\s\S]{0,400}?src:\s*'assets/img/([^/']+)/'", src)
    if not m:
        m = re.search(r"src:\s*'assets/img/([^/']+)/'", src)
    base = os.path.join(IMG_DIR, m.group(1)) if m else IMG_DIR
    print('主图目录：' + os.path.relpath(base, ROOT).replace('\\', '/'))

    calls = re.findall(r"local\('([^']+)',\s*(\d+),\s*(\d+)\)", src)
    bad = []
    for name, w, h in calls:
        path = os.path.join(base, name)
        if not os.path.exists(path):
            bad.append((name, w + 'x' + h, '文件不存在'))
            continue
        real = jpeg_size(path)
        if real != (int(w), int(h)):
            bad.append((name, w + 'x' + h, '%dx%d' % real))

    print('声明条数 %d' % len(calls), '| 不匹配 %d' % len(bad))
    for name, declared, real in bad:
        print('  x', name, '声明', declared, '实际', real)


if __name__ == '__main__':
    main()
