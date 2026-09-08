import os, re, glob, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_PREFIX = ('http:', 'https:', 'mailto:', 'tel:', '#', 'data:')

def resolve(base_dir, ref):
    ref = ref.split('#', 1)[0]
    if not ref:
        return None
    p = os.path.normpath(os.path.join(base_dir, ref))
    return p

problems = []
files = []
for f in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
    if 'example-book' in f.replace('\\', '/'):
        continue  # 教材原稿参考目录,不参与本站校验
    files.append(f)
files.sort()
total_refs = 0
for f in files:
    rel = os.path.relpath(f, ROOT)
    txt = open(f, encoding='utf-8').read()
    # basic encoding/doctype sanity
    if '<!doctype html>' not in txt.lower():
        problems.append('%s: 缺少 DOCTYPE' % rel)
    if 'charset="utf-8"' not in txt and "charset='utf-8'" not in txt:
        problems.append('%s: 缺少 utf-8 声明' % rel)
    if '<title>' not in txt:
        problems.append('%s: 缺少 title' % rel)
    for m in re.finditer(r'(?:href|src)\s*=\s*"([^"]+)"', txt):
        ref = m.group(1).strip()
        if ref.startswith(SKIP_PREFIX):
            continue
        total_refs += 1
        target = resolve(os.path.dirname(f), ref)
        if target is None:
            continue
        if not os.path.exists(target):
            problems.append('%s -> 缺失: %s (ref=%s)' % (rel, os.path.relpath(target, ROOT), ref))

print('HTML 文件数: %d' % len(files))
print('检查的内部引用总数: %d' % total_refs)
if problems:
    print('\n发现 %d 个问题:' % len(problems))
    for p in problems:
        print(' -', p)
else:
    print('全部内部链接与资源引用均能找到对应文件 ✓')
