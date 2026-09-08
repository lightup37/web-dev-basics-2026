import os, re, glob, sys
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class Balance(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []
        self.file = ''
    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append('多余的结束标签 </%s>' % tag)
            return
        top = self.stack.pop()
        if top != tag:
            self.errors.append('标签不配对:<%s> 遇 </%s>' % (top, tag))
            # 尝试按常见错误恢复:若栈内含该标签,弹出到该层
            if tag in self.stack:
                while self.stack and self.stack[-1] != tag:
                    self.stack.pop()
                if self.stack:
                    self.stack.pop()
            else:
                self.stack.append(top)

html_files = []
for f in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
    if 'example-book' in f.replace('\\', '/'):
        continue
    html_files.append(f)
html_files.sort()

problems = []
for f in html_files:
    rel = os.path.relpath(f, ROOT)
    b = Balance()
    txt = open(f, encoding='utf-8').read()
    b.feed(txt)
    for e in b.errors:
        problems.append('%s: %s' % (rel, e))
    for tag in b.stack:
        problems.append('%s: 未闭合 <%s>' % (rel, tag))

css_files = glob.glob(os.path.join(ROOT, 'css', '*.css'))
for f in css_files:
    txt = open(f, encoding='utf-8').read()
    body = re.sub(r'/\*.*?\*/', '', txt, flags=re.S)
    body = re.sub(r'"(?:[^"\\]|\\.)*"', '""', body)
    if body.count('{') != body.count('}'):
        problems.append('%s: 花括号不配平 {=%d }=%d' % (
            os.path.relpath(f, ROOT), body.count('{'), body.count('}')))

# pages.js 词典中的路径都要存在
pj = os.path.join(ROOT, 'js', 'pages.js')
txt = open(pj, encoding='utf-8').read()
for m in re.finditer(r"u:\s*'([^']+)'", txt):
    p = os.path.normpath(os.path.join(ROOT, m.group(1)))
    if not os.path.exists(p):
        problems.append('pages.js 指向缺失页面: %s' % m.group(1))

if problems:
    print('发现 %d 个问题:' % len(problems))
    for p in problems:
        print(' -', p)
else:
    print('HTML 标签配对、CSS 花括号、搜索词典路径 全部通过 ✓ (%d 个页面)' % len(html_files))
