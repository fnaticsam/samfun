import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import ills_a, ills_b  # noqa
from ills_a import ILLS

PARTS = 'parts'; OUT = 'build'
os.makedirs(OUT, exist_ok=True)
files = sorted(f for f in os.listdir(PARTS) if f.endswith('.html'))
content = {f: open(os.path.join(PARTS, f), encoding='utf-8').read() for f in files}

def figure(svg, caption, wide):
    cls = 'ill wide' if wide else 'ill'
    return f'\n    <figure class="{cls}">\n      {svg.strip()}\n      <figcaption>{caption}</figcaption>\n    </figure>\n'

missing = []
for (f, anchor, svg, caption, wide) in ILLS:
    s = content[f]
    i = s.find(anchor)
    if i == -1:
        missing.append((f, anchor)); continue
    if anchor.startswith('<div class="current-line"') or anchor.startswith('<h2>'):
        end = i + len(anchor)
    else:
        end = s.find('</p>', i)
        assert end != -1, anchor
        end += len('</p>')
    content[f] = s[:end] + figure(svg, caption, wide) + s[end:]

if missing:
    print('MISSING ANCHORS:'); [print(' ', m) for m in missing]

for f in files:
    open(os.path.join(OUT, f), 'w', encoding='utf-8').write(content[f])

# assemble
order = ['00-head.html','10-shell-open.html','20-home.html','31-s1.html','32-s2.html','33-s3.html','34-s4.html','35-s5.html','36-s6.html','37-s7.html','38-s8.html','39-s9.html','40-s10.html','50-field.html','60-glossary.html','70-traditions.html','80-analogies.html','85-blueprint.html','90-shell-close.html']
html = ''.join(content[f] for f in order)
open('index.html', 'w', encoding='utf-8').write(html)
print('figures inserted:', len(ILLS) - len(missing), 'of', len(ILLS))
print('bytes:', len(html.encode()))
# quick tag balance
for t in ['svg','figure','figcaption','g','defs','section','div','details','p','table']:
    o = len(re.findall(r'<%s\b[^>]*>' % t, html)); c = len(re.findall(r'</%s>' % t, html))
    if o != c: print('MISMATCH', t, o, c)
# duplicate ids across svgs
ids = re.findall(r'\bid="([^"]+)"', html)
dups = {x for x in ids if ids.count(x) > 1}
if dups: print('DUP IDS', dups)
