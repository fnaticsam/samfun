import html, os, re, struct, sys
sys.path.insert(0, os.path.dirname(__file__))
import ills_a, ills_b  # noqa
from ills_a import ILLS

PARTS = 'parts'; OUT = 'build'
os.makedirs(OUT, exist_ok=True)
files = sorted(f for f in os.listdir(PARTS) if f.endswith('.html'))
content = {f: open(os.path.join(PARTS, f), encoding='utf-8').read() for f in files}

def figure_id(file, index):
    """Return the stable raster filename stem for a one-based illustration index."""
    key = re.sub(r'^\d+-', '', os.path.splitext(os.path.basename(file))[0])
    return f'{key}-{index:02d}'

def webp_size(path):
    """Read dimensions from a WebP RIFF header without decoding the image."""
    data = open(path, 'rb').read(30)
    if len(data) < 16 or data[:4] != b'RIFF' or data[8:12] != b'WEBP':
        raise ValueError(f'not a WebP file: {path}')
    kind = data[12:16]
    if kind == b'VP8 ':
        if len(data) < 30 or data[23:26] != b'\x9d\x01\x2a':
            raise ValueError(f'invalid VP8 header: {path}')
        width, height = struct.unpack_from('<HH', data, 26)
        return width & 0x3fff, height & 0x3fff
    if kind == b'VP8L':
        if len(data) < 25 or data[20] != 0x2f:
            raise ValueError(f'invalid VP8L header: {path}')
        bits = int.from_bytes(data[21:25], 'little')
        return (bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1
    if kind == b'VP8X':
        if len(data) < 30:
            raise ValueError(f'invalid VP8X header: {path}')
        return int.from_bytes(data[24:27], 'little') + 1, int.from_bytes(data[27:30], 'little') + 1
    raise ValueError(f'unsupported WebP variant {kind!r}: {path}')

def svg_alt(svg, caption):
    match = re.search(r'<svg\b[^>]*\baria-label=["\']([^"\']+)["\']', svg)
    if match:
        return match.group(1)
    lead = re.search(r'<b>(.*?)</b>', caption, re.S)
    return re.sub(r'<[^>]+>', '', lead.group(1) if lead else caption).strip()

def figure(svg, caption, wide, image=None):
    cls = 'ill wide' if wide else 'ill'
    if image:
        image_id, width, height = image
        alt = html.escape(svg_alt(svg, caption), quote=True)
        return f'\n    <figure class="{cls} photo">\n      <img src="img/{image_id}.webp" alt="{alt}" width="{width}" height="{height}" loading="lazy" decoding="async">\n      <figcaption>{caption}</figcaption>\n    </figure>\n'
    return f'\n    <figure class="{cls}">\n      {svg.strip()}\n      <figcaption>{caption}</figcaption>\n    </figure>\n'

def ids_in_order():
    counts = {}
    for f, *_ in ILLS:
        counts[f] = counts.get(f, 0) + 1
        yield figure_id(f, counts[f])

def build():
    missing = []
    raster = 0
    id_iter = iter(ids_in_order())
    all_ids = set()
    for (f, anchor, svg, caption, wide) in ILLS:
        image_id = next(id_iter)
        all_ids.add(image_id)
        image_path = os.path.join('img', f'{image_id}.webp')
        image = (image_id, *webp_size(image_path)) if os.path.exists(image_path) else None
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
        content[f] = s[:end] + figure(svg, caption, wide, image) + s[end:]
        raster += bool(image)

    if missing:
        print('MISSING ANCHORS:'); [print(' ', m) for m in missing]

    for f in files:
        open(os.path.join(OUT, f), 'w', encoding='utf-8').write(content[f])

    order = ['00-head.html','10-shell-open.html','20-home.html','31-s1.html','32-s2.html','33-s3.html','34-s4.html','35-s5.html','36-s6.html','37-s7.html','38-s8.html','39-s9.html','40-s10.html','50-field.html','60-glossary.html','70-traditions.html','80-analogies.html','85-blueprint.html','90-shell-close.html']
    output = ''.join(content[f] for f in order)
    open('index.html', 'w', encoding='utf-8').write(output)
    print('figures inserted:', len(ILLS) - len(missing), 'of', len(ILLS))
    print('raster figures:', raster, 'of', len(ILLS))
    print('bytes:', len(output.encode()))
    for t in ['svg','figure','figcaption','g','defs','section','div','details','p','table']:
        o = len(re.findall(r'<%s\b[^>]*>' % t, output)); c = len(re.findall(r'</%s>' % t, output))
        if o != c: print('MISMATCH', t, o, c)
    ids = re.findall(r'\bid="([^"]+)"', output)
    dups = {x for x in ids if ids.count(x) > 1}
    if dups: print('DUP IDS', dups)
    orphans = sorted(os.path.splitext(f)[0] for f in os.listdir('img') if f.endswith('.webp') and os.path.splitext(f)[0] not in all_ids)
    if orphans: print('ORPHAN IMAGES:', ', '.join(orphans))

if __name__ == '__main__':
    if sys.argv[1:] == ['--list-ids']:
        print(*ids_in_order(), sep='\n')
    else:
        build()
