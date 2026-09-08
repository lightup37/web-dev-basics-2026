import os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
n = 0
for f in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
    if 'example-book' in f.replace('\\', '/'):
        continue
    txt = open(f, encoding='utf-8').read()
    new = txt.replace('十二道名菜', '二十道名菜')
    if new != txt:
        open(f, 'w', encoding='utf-8', newline='\n').write(new)
        n += 1
print('updated files:', n)
