# Illustrations, part A: home, stages 1-5
# Each entry: (part file, anchor substring, svg markup, caption html, wide?)
# Insertion happens after the closing tag of the block that contains the anchor.

FIG = '''<g id="{id}-fig"><circle cx="0" cy="-24" r="9"/><path d="M -12 14 C -12 -8, 12 -8, 12 14 Z"/></g>'''
HORSE = '''<g id="{id}-horse"><ellipse cx="0" cy="0" rx="20" ry="9"/><ellipse cx="20" cy="-9" rx="9" ry="5" transform="rotate(-35 20 -9)"/><rect x="-15" y="6" width="4" height="15" rx="1"/><rect x="-6" y="6" width="4" height="15" rx="1"/><rect x="4" y="6" width="4" height="15" rx="1"/><rect x="12" y="6" width="4" height="15" rx="1"/><path d="M -20 -2 C -28 2, -28 10, -24 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></g>'''

ILLS = []

def add(file, anchor, svg, caption, wide=False):
    ILLS.append((file, anchor, svg, caption, wide))

# ---------------- HOME ----------------
add('20-home.html', 'Different traditions. A recurring invitation to awaken.',
'''<svg viewBox="0 0 480 320" role="img" aria-label="Seven named traditions surround teal dots whose fading spokes meet a gold circle labelled awareness">
  <defs><radialGradient id="home-map-fade" gradientUnits="userSpaceOnUse" cx="240" cy="160" r="150"><stop offset="0" stop-color="var(--teal)" stop-opacity=".7"/><stop offset="1" stop-color="var(--teal)" stop-opacity=".12"/></radialGradient></defs>
  <path class="soft" opacity=".32" d="M446.81 123.53 A210 210 0 0 1 446.81 196.47 L442.87 195.77 A206 206 0 0 0 442.87 124.23 Z"/>
  <path class="soft" opacity=".22" d="M33.19 196.47 A210 210 0 0 1 33.19 123.53 L37.13 124.23 A206 206 0 0 0 37.13 195.77 Z"/>
  <g class="lt2" style="stroke:url(#home-map-fade)"><path d="M240 120L240 50"/><path d="M271.26 135.04L325.97 91.37"/><path d="M278.99 168.93L347.22 184.56"/><path d="M257.35 196.04L287.7 259.12"/><path d="M222.65 196.04L192.3 259.12"/><path d="M201.01 168.93L132.78 184.56"/><path d="M208.74 135.04L154.03 91.37"/></g>
  <circle class="g" cx="240" cy="160" r="34"/><text class="lbl-w" style="font-size:9px" x="240" y="163" text-anchor="middle">awareness</text>
  <circle class="t" cx="240" cy="42" r="7"/><circle class="t" cx="332.22" cy="86.38" r="7"/><circle class="t" cx="355.02" cy="186.34" r="7"/><circle class="t" cx="291.17" cy="266.33" r="7"/><circle class="t" cx="188.83" cy="266.33" r="7"/><circle class="t" cx="124.98" cy="186.34" r="7"/><circle class="t" cx="147.78" cy="86.38" r="7"/>
  <text class="lbl-s" x="240" y="28" text-anchor="middle">FANA</text><text class="lbl-s" x="344.22" y="89.38" text-anchor="start">KENSHO</text><text class="lbl-s" x="367.02" y="189.34" text-anchor="start">MOKSHA</text><text class="lbl-s" x="303.17" y="269.33" text-anchor="start">RIGPA</text><text class="lbl-s" x="176.83" y="269.33" text-anchor="end">THEOSIS</text><text class="lbl-s" x="112.98" y="189.34" text-anchor="end">BITTUL</text><text class="lbl-s" x="135.78" y="89.38" text-anchor="end">HENOSIS</text>
</svg>''', '<b>One realization, many names.</b> Every tradition draws a different map. They all point at the same centre.', True)

add('20-home.html', 'Awakening is not a summit you climb.',
'''<svg viewBox="0 0 320 220" role="img" aria-label="A relaxed figure steps from the bank into a teal river looping toward a gold source">
  <path class="skin" d="M0 185 C30 180 58 158 78 166 C94 172 100 190 100 220 L0 220 Z"/>
  <path fill="none" stroke="var(--teal-soft)" stroke-width="26" stroke-linecap="round" d="M108 166 C154 190 268 180 272 132 C276 98 206 110 204 84 C202 66 216 60 232 60"/>
  <path class="t" opacity=".7" transform="translate(195.19 177.38) rotate(-5.95)" d="M-5 -4L7 0L-5 4Z"/>
  <path class="t" opacity=".7" transform="translate(242.32 105.55) rotate(-165.01)" d="M-5 -4L7 0L-5 4Z"/>
  <path class="t" opacity=".7" transform="translate(214.66 63.26) rotate(-25.35)" d="M-5 -4L7 0L-5 4Z"/>
  <circle class="g" cx="232" cy="60" r="20" opacity=".2"/><circle class="g" cx="232" cy="60" r="12"/><text class="lbl-s" x="232" y="86" text-anchor="middle">source</text>
  <circle class="i2" cx="88" cy="84" r="9"/><path class="ln" stroke-width="5" style="stroke-width:5px" d="M88 94L88 132 M88 104L66 120 M88 104L110 118 M88 132L72 168 M88 132L112 162"/>
</svg>''', '<b>Stepping in.</b> The current was always moving. All you do is stop standing on the bank.')

# ---------------- STAGE 1 ----------------
add('31-s1.html', '<h2>The character and the one watching</h2>',
'''<svg viewBox="0 0 320 220" role="img" aria-label="A person on a sofa watching a screen where a character is caught in a drama; the watcher is gold">
  <rect class="soft" x="176" y="40" width="122" height="88" rx="6"/>
  <rect class="i2" x="232" y="128" width="8" height="12"/><rect class="i2" x="214" y="140" width="44" height="5" rx="2"/>
  <circle class="i2" cx="237" cy="70" r="9"/>
  <path class="ln" stroke-width="5" d="M 237 80 L 237 100 M 237 86 L 220 76 M 237 86 L 254 76 M 237 100 L 227 116 M 237 100 L 247 116"/>
  <path class="lt2" stroke-width="3" d="M 192 56 L 200 50 M 282 56 L 274 50 M 200 114 L 207 106"/>
  <rect class="s2" x="22" y="150" width="130" height="48" rx="10"/>
  <rect class="i2" x="22" y="140" width="18" height="40" rx="8" opacity=".5"/><rect class="i2" x="134" y="140" width="18" height="40" rx="8" opacity=".5"/>
  <circle class="g" cx="88" cy="120" r="30" opacity=".22"/><circle class="g" cx="88" cy="122" r="13"/>
  <path class="g" d="M 72 170 C 72 122, 104 122, 104 170 Z"/>
  <path class="lg" stroke-width="5" d="M 106 152 L 128 146"/>
  <text class="lbl-s" x="176" y="32">the character</text>
  <text class="lbl-s" x="30" y="214">the one watching</text>
</svg>''',
'<b>The character and the watcher.</b> The drama is entirely on the screen. The one on the sofa gets absorbed, but was never in it.')

add('31-s1.html', 'Most spiritual language makes awakening sound like a summit',
'''<svg viewBox="0 0 480 200" role="img" aria-label="Left: a tiny climber labouring up a mountain toward a gold point. Right: the same figure carried by a river to the same gold point">
  <path class="s2" d="M 20 180 L 120 40 L 220 180 Z"/>
  <path class="ln3" stroke-dasharray="4 5" d="M 60 176 L 90 150 L 74 130 L 108 104 L 96 84 L 120 44"/>
  <circle class="g" cx="120" cy="40" r="8"/>
  <g transform="translate(92 122) rotate(-25)"><circle class="i2" cx="0" cy="-10" r="5"/><path class="i2" d="M -6 8 C -6 -2, 6 -2, 6 8 Z"/></g>
  <path class="lt2" stroke-width="2" d="M 102 112 l 3 -6 M 108 116 l 4 -5"/>
  <text class="lbl-s" x="120" y="196" text-anchor="middle">the summit</text>
  <path fill="none" stroke="var(--teal-soft)" stroke-width="26" stroke-linecap="round" d="M 262 60 C 300 60, 320 120, 360 120 C 400 120, 420 96, 456 96"/>
  <path class="t" opacity=".6" d="M 330 96 l 10 5 l -10 5 z"/><path class="t" opacity=".6" d="M 396 108 l 10 5 l -10 5 z"/>
  <circle class="g" cx="456" cy="96" r="8"/>
  <g transform="translate(300 74)"><path class="i2" d="M -14 0 L 14 0 L 10 7 L -10 7 Z"/><circle class="i2" cx="0" cy="-8" r="5"/></g>
  <text class="lbl-s" x="360" y="196" text-anchor="middle">the current</text>
</svg>''',
'<b>Summit or current.</b> Same destination. On the mountain the whole thing depends on your effort; in the river the most useful thing you can do is stop swimming upstream.', True)

add('31-s1.html', 'The dualistic, planning mind was never designed to steer a life',
'''<svg viewBox="0 0 320 180" role="img" aria-label="A boat carried by a strong current; inside it a small instrument panel with a hand on it">
  <path fill="none" stroke="var(--teal-soft)" stroke-width="40" stroke-linecap="round" d="M 20 120 C 100 120, 200 120, 300 120"/>
  <path class="t" opacity=".55" d="M 60 116 l 14 6 l -14 6 z M 120 116 l 14 6 l -14 6 z M 220 116 l 14 6 l -14 6 z M 270 116 l 14 6 l -14 6 z"/>
  <path class="i2" d="M 110 106 L 230 106 L 216 126 L 124 126 Z"/>
  <rect class="s2" x="150" y="84" width="40" height="22" rx="3"/>
  <circle class="t" cx="160" cy="95" r="4"/><circle class="t" cx="171" cy="95" r="4"/><rect class="t" x="180" y="91" width="5" height="8" rx="1"/>
  <circle class="i2" cx="188" cy="76" r="6"/><path class="ln3" d="M 186 82 L 178 90"/>
  <text class="lbl-s" x="170" y="70" text-anchor="middle">the planning mind</text>
  <text class="lbl-s" x="160" y="166" text-anchor="middle">what actually moves the boat</text>
</svg>''',
'<b>Servant, not master.</b> The panel is real and useful. It is not what moves the boat, and treating it as the captain is where the friction comes from.')

# ---------------- STAGE 2 ----------------
add('32-s2.html', 'It has no owner. It, too, is empty of self.',
'''<svg viewBox="0 0 320 220" role="img" aria-label="A mosquito on an arm with five numbered rings of response rippling outward, and a gold disc outside all of them">
  <path class="skin" d="M 0 186 C 80 168, 220 168, 320 190 L 320 220 L 0 220 Z"/>
  <path class="t" opacity=".12" d="M 56 180 A 104 104 0 0 1 264 180 Z"/><path class="t" opacity=".12" d="M 76 180 A 84 84 0 0 1 244 180 Z"/><path class="t" opacity=".12" d="M 96 180 A 64 64 0 0 1 224 180 Z"/><path class="t" opacity=".12" d="M 116 180 A 44 44 0 0 1 204 180 Z"/><path class="t" opacity=".12" d="M 136 180 A 24 24 0 0 1 184 180 Z"/>
  <ellipse class="i2" cx="160" cy="152" rx="7" ry="12" transform="rotate(30 160 152)"/>
  <ellipse class="i3" cx="149" cy="141" rx="13" ry="5" transform="rotate(-30 149 141)" opacity=".8"/><ellipse class="i3" cx="165" cy="137" rx="13" ry="5" transform="rotate(-10 165 137)" opacity=".8"/>
  <rect class="i2" x="164" y="160" width="2.5" height="20" transform="rotate(-6 164 160)"/>
  <circle cx="177" cy="161" r="7" class="t"/><text x="177" y="164" text-anchor="middle" class="lbl-w" font-size="8.5">1</text>
  <circle cx="191.1" cy="146.9" r="7" class="t"/><text x="191.1" y="149.9" text-anchor="middle" class="lbl-w" font-size="8.5">2</text>
  <circle cx="205.3" cy="132.7" r="7" class="t"/><text x="205.3" y="135.7" text-anchor="middle" class="lbl-w" font-size="8.5">3</text>
  <circle cx="219.4" cy="118.6" r="7" class="t"/><text x="219.4" y="121.6" text-anchor="middle" class="lbl-w" font-size="8.5">4</text>
  <circle cx="233.5" cy="104.5" r="7" class="t"/><text x="233.5" y="107.5" text-anchor="middle" class="lbl-w" font-size="8.5">5</text>
  <text class="lbl" x="250" y="60">1 form</text><text class="lbl" x="250" y="76">2 sensation</text><text class="lbl" x="250" y="92">3 perception</text><text class="lbl" x="250" y="108">4 reaction</text><text class="lbl" x="250" y="124">5 attention</text>
  <circle class="g" cx="160" cy="40" r="11"/><circle class="g" cx="160" cy="40" r="20" opacity=".25"/>
  <text class="lbl-s" x="160" y="70" text-anchor="middle">what all five appear in</text>
</svg>''',
'<b>The mosquito in five rings.</b> One landing, five operations, each a separate event. The gold disc is not a sixth ring; it is what the rings appear in.')

add('32-s2.html', 'Plato described prisoners chained in a cave',
'''<svg viewBox="0 0 320 200" role="img" aria-label="Figures inside a dark cave facing shadows on a wall, a fire behind them; one figure has turned toward the bright opening">
  <path fill="#2B3B47" d="M 0 0 L 320 0 L 320 200 L 0 200 Z"/>
  <path class="gsoft" d="M 250 0 L 320 0 L 320 200 L 292 200 Z"/>
  <path class="g" opacity=".55" d="M 268 0 L 320 0 L 320 200 L 300 200 Z"/>
  <rect fill="#7B8791" x="18" y="24" width="14" height="150" opacity=".6"/>
  <path fill="#7B8791" opacity=".5" d="M 34 60 l 10 0 l 3 -8 l 4 8 l 10 0 l -8 6 l 3 9 l -9 -5 l -9 5 l 3 -9 z"/>
  <path fill="#7B8791" opacity=".5" d="M 36 120 c 10 -14, 22 -14, 30 0 c 6 10, 0 20, -14 22 c -14 -2, -22 -12, -16 -22 z"/>
  <g transform="translate(96 150)"><circle fill="#D6DEE2" cx="0" cy="-20" r="9"/><path fill="#D6DEE2" d="M -12 14 C -12 -20, 12 -20, 12 14 Z"/></g>
  <g transform="translate(140 150)"><circle fill="#D6DEE2" cx="0" cy="-20" r="9"/><path fill="#D6DEE2" d="M -12 14 C -12 -20, 12 -20, 12 14 Z"/></g>
  <g transform="translate(184 150)"><circle class="g" cx="0" cy="-20" r="9"/><path class="g" d="M -12 14 C -12 -20, 12 -20, 12 14 Z"/></g>
  <path class="g" d="M 226 122 c -10 -6, -8 -22, 2 -28 c -2 10, 8 10, 8 2 c 8 8, 6 22, -4 28 z"/>
  <path class="lt2" d="M 196 132 L 256 150"/><path class="t" d="M 258 151 l -9 1 l 3 -8 z"/>
  <text class="lbl-s" x="20" y="192" fill="#EDF1F2" opacity=".85">the shadows</text>
  <text class="lbl-s" x="212" y="192" fill="#EDF1F2" opacity=".85">the fire</text>
</svg>''',
'<b>The cave.</b> The shadows are the contents of the mind. Everyone faces the wall; one has turned toward the opening, and there is no real way back once you have seen the light.')

add('32-s2.html', 'The shadows are the contents of the mind: thoughts, images, perceptions, the running commentary.',
'''<svg viewBox="0 0 320 190" role="img" aria-label="A classroom: a child at a desk, attention drawn to a squirrel in the window, a dashed arrow pulling attention back to the lesson on the board">
  <rect class="s2" x="22" y="20" width="120" height="70" rx="3"/>
  <path class="ln3" stroke-width="2" d="M 36 40 h 60 M 36 54 h 84 M 36 68 h 48"/>
  <rect class="soft" x="212" y="24" width="88" height="70" rx="3"/>
  <ellipse class="i2" cx="254" cy="76" rx="13" ry="9"/><circle class="i2" cx="268" cy="66" r="6"/><path class="i2" d="M 266 60 l 2 -6 l 4 5 z"/><circle class="sf" cx="270" cy="65" r="1.4"/>
  <path fill="none" stroke="var(--ink-2)" stroke-width="7" stroke-linecap="round" d="M 242 78 c -12 -2, -16 -20, -4 -28"/>
  <rect class="i2" x="244" y="82" width="4" height="6" rx="1"/><rect class="i2" x="256" y="82" width="4" height="6" rx="1"/>
  <rect class="i2" x="92" y="140" width="110" height="8" rx="2"/><rect class="i2" x="100" y="148" width="6" height="30"/><rect class="i2" x="188" y="148" width="6" height="30"/>
  <g transform="translate(148 132)"><circle class="i2" cx="0" cy="-20" r="9"/><path class="i2" d="M -12 6 C -12 -18, 12 -18, 12 6 Z"/></g>
  <path class="t" opacity=".28" d="M 156 108 L 216 40 L 236 78 Z"/>
  <path class="ln3" stroke-dasharray="4 4" d="M 150 108 L 96 60"/><path class="i3" d="M 96 60 l 9 1 l -4 8 z"/>
  <text class="lbl-s" x="82" y="14">the lesson</text>
  <text class="lbl-s" x="212" y="18">aliveness</text>
  <text class="lbl-s" x="118" y="168">"pay attention"</text>
</svg>''',
'<b>The child and the squirrel.</b> Attention goes naturally to where the aliveness is. The persona begins when the child learns that following it gets you into trouble.')

add('32-s2.html', 'Put your attention on your left hand right now.',
'''<svg viewBox="0 0 320 170" role="img" aria-label="A hand with a beam of attention falling on it; where the beam lands, energy sparkles; elsewhere nothing">
  <path class="t" opacity=".22" d="M 40 10 L 100 10 L 200 120 L 140 140 Z"/>
  <g class="skin"><rect x="140" y="80" width="80" height="70" rx="20"/><rect x="146" y="30" width="15" height="62" rx="7"/><rect x="164" y="20" width="15" height="72" rx="7"/><rect x="182" y="24" width="15" height="68" rx="7"/><rect x="200" y="36" width="15" height="56" rx="7"/><rect x="118" y="88" width="34" height="15" rx="7" transform="rotate(-30 135 95)"/></g>
  <g class="t"><circle cx="152" cy="96" r="3"/><circle cx="166" cy="110" r="2.5"/><circle cx="158" cy="124" r="3"/><circle cx="176" cy="98" r="2"/><circle cx="170" cy="130" r="2.5"/><circle cx="184" cy="116" r="2"/><circle cx="150" cy="70" r="2"/><circle cx="168" cy="60" r="2.5"/></g>
  <text class="lbl-s" x="40" y="160">attention goes</text>
  <text class="lbl-s" x="196" y="160">energy follows</text>
</svg>''',
'<b>Energy follows attention.</b> Nothing changed in the hand. Attention went there, and aliveness followed. The self-structure is powered the same way.')

add('32-s2.html', 'Many practitioners arrive at the fifth skandha and stop.',
'''<svg viewBox="0 0 320 150" role="img" aria-label="A camera and the scene it points at, both sitting inside one gold field labelled awareness">
  <rect class="g" opacity=".16" x="14" y="14" width="292" height="122" rx="30"/>
  <rect class="i2" x="60" y="62" width="52" height="34" rx="6"/><rect class="i2" x="72" y="54" width="20" height="10" rx="2"/><circle class="sf" cx="86" cy="79" r="10"/><circle class="t" cx="86" cy="79" r="5"/>
  <path class="t" opacity=".25" d="M 112 72 L 200 50 L 200 108 Z"/>
  <path class="soft" d="M 200 108 L 232 60 L 256 84 L 276 52 L 300 108 Z"/><circle class="soft" cx="286" cy="48" r="8"/>
  <text class="lbl-s" x="60" y="118">the witness</text><text class="lbl-s" x="214" y="128">the witnessed</text>
  <text class="lbl-s" x="160" y="30" text-anchor="middle">awareness</text>
</svg>''',
'<b>Witness and witnessed.</b> The camera and the scene arise together, as two poles of one duality. Awareness is not the camera; it is the field both appear in.')

# ---------------- STAGE 3 ----------------
add('33-s3.html', 'Every strongly charged experience that was not fully felt at the time leaves a residue.',
'''<svg viewBox="0 0 480 170" role="img" aria-label="Three frames of ground: a first trickle of water, a shallow groove forming, and a deep channel that later rain follows">
  <g transform="translate(0 0)"><path class="skin" d="M 10 90 L 150 90 L 150 150 L 10 150 Z"/><path class="lt2" stroke-width="2" d="M 30 96 C 60 100, 100 104, 130 100"/><text class="lbl-s" x="80" y="164" text-anchor="middle">first rain</text></g>
  <g transform="translate(165 0)"><path class="skin" d="M 10 90 L 150 90 L 150 150 L 10 150 Z"/><path class="soft" d="M 20 90 C 60 90, 70 120, 90 120 C 110 120, 120 90, 140 90 Z"/><path class="lt" stroke-width="5" d="M 24 92 C 60 94, 70 116, 90 116 C 110 116, 120 96, 136 92"/><text class="lbl-s" x="80" y="164" text-anchor="middle">a groove</text></g>
  <g transform="translate(330 0)"><path class="skin" d="M 10 90 L 150 90 L 150 150 L 10 150 Z"/><path class="soft" d="M 20 90 C 50 90, 56 142, 80 142 C 104 142, 110 90, 140 90 Z"/><path class="lt" stroke-width="10" d="M 26 96 C 50 100, 56 136, 80 136 C 104 136, 110 100, 134 96"/><text class="lbl-s" x="80" y="164" text-anchor="middle">a channel</text></g>
  <path class="i3" d="M 152 118 l 10 -5 l 0 10 z M 317 118 l 10 -5 l 0 10 z"/>
  <g class="t" opacity=".6"><circle cx="60" cy="40" r="2"/><circle cx="90" cy="30" r="2"/><circle cx="240" cy="40" r="2"/><circle cx="260" cy="26" r="2"/><circle cx="405" cy="40" r="2"/><circle cx="420" cy="28" r="2"/><circle cx="395" cy="24" r="2"/></g>
</svg>''',
'<b>The riverbed.</b> Water cuts a channel; the next rain runs down it and deepens it. Samskaras are the channels, and karma is water following them.', True)

add('33-s3.html', 'In the moment of awakening, identification with the mind and its reactions ceases.',
'''<svg viewBox="0 0 320 220" role="img" aria-label="A ceiling fan with its plug pulled out of the socket, blades still turning; a gold bracket marks the gap">
  <rect class="i2" x="70" y="10" width="180" height="8" rx="4"/><rect class="i2" x="157" y="18" width="6" height="52"/>
  <ellipse class="soft" cx="160" cy="84" rx="62" ry="10" transform="rotate(20 160 84)"/><ellipse class="soft" cx="160" cy="84" rx="62" ry="10" transform="rotate(110 160 84)"/>
  <circle class="t" cx="160" cy="84" r="14"/>
  <path class="lt" stroke-width="6" opacity=".35" d="M 97.6 120 A 72 72 0 0 1 97.6 48"/><path class="lt" stroke-width="6" opacity=".35" d="M 222 48 A 72 72 0 0 1 222 120"/>
  <path class="ln" d="M 160 98 C 160 136, 222 130, 236 168"/>
  <rect class="i2" x="232" y="162" width="18" height="14" rx="3"/><rect class="i2" x="250" y="165" width="12" height="3"/><rect class="i2" x="250" y="171" width="12" height="3"/>
  <rect class="s2" x="282" y="154" width="26" height="34" rx="4"/><rect class="i2" x="289" y="165" width="3" height="9"/><rect class="i2" x="298" y="165" width="3" height="9"/>
  <path class="lg" stroke-width="3" d="M 266 200 C 272 188, 300 188, 306 200"/>
  <text class="lbl-s" x="286" y="214" text-anchor="middle">the gap</text>
</svg>''',
'<b>The fan.</b> Plug out, blades still turning on momentum. Every reaction to a preference is a hand reaching for the socket; the practice is keeping the gap open.')

add('33-s3.html', 'Of all the strands that tie the sense of "I" to the character, two are primary.',
'''<svg viewBox="0 0 320 170" role="img" aria-label="One cord with two knots: one tied around a cushion labelled comfort, one around a book labelled knowing">
  <path class="ln" stroke-width="5" d="M 10 90 C 40 90, 50 60, 80 60 C 100 60, 104 76, 92 84 C 80 92, 70 78, 86 70 C 110 60, 130 90, 170 90 C 200 90, 210 60, 240 60 C 260 60, 264 76, 252 84 C 240 92, 230 78, 246 70 C 270 60, 290 90, 310 90"/>
  <rect class="soft" x="56" y="98" width="60" height="30" rx="12"/>
  <rect class="s2" x="216" y="96" width="52" height="36" rx="3"/><rect class="t" x="216" y="96" width="8" height="36" rx="2"/><path class="ln3" stroke-width="2" d="M 232 108 h 24 M 232 116 h 24 M 232 124 h 16"/>
  <path class="ln" stroke-width="5" d="M 86 84 L 86 98 M 246 84 L 246 96"/>
  <text class="lbl-s" x="86" y="150" text-anchor="middle">comfort · the body</text>
  <text class="lbl-s" x="242" y="150" text-anchor="middle">knowing · the mind</text>
</svg>''',
'<b>The two knots.</b> One cord, two knots: the body tied to comfort, the mind tied to knowing. Every hindrance is one of the two pulling.')

# ---------------- STAGE 4 ----------------
add('34-s4.html', '<strong>Awareness</strong> is neither.',
'''<svg viewBox="0 0 480 190" role="img" aria-label="Three panels: a camera turning and zooming, an unbroken stream of oil from a jar, and a gold field containing both">
  <g transform="translate(0 0)"><rect class="i2" x="30" y="70" width="48" height="32" rx="6"/><rect class="i2" x="42" y="62" width="18" height="10" rx="2"/><circle class="sf" cx="54" cy="86" r="9"/><circle class="t" cx="54" cy="86" r="4"/><path class="t" opacity=".25" d="M 78 80 L 140 62 L 140 110 Z"/><path class="t" opacity=".12" d="M 78 80 L 140 30 L 140 140 Z"/><text class="lbl-s" x="80" y="166" text-anchor="middle">concentration</text><text class="lbl" x="80" y="180" text-anchor="middle">turns and focuses</text></g>
  <g transform="translate(160 0)"><path class="i2" d="M 60 40 L 100 40 L 108 62 L 96 66 L 64 66 L 52 62 Z"/><path class="lt" stroke-width="5" d="M 96 66 C 96 90, 96 110, 96 128"/><path class="s2" d="M 60 128 L 132 128 L 124 150 L 68 150 Z"/><text class="lbl-s" x="96" y="166" text-anchor="middle">attention</text><text class="lbl" x="96" y="180" text-anchor="middle">an unbroken stream</text></g>
  <g transform="translate(320 0)"><rect class="g" opacity=".18" x="14" y="24" width="132" height="126" rx="26"/><rect class="i2" x="40" y="80" width="30" height="20" rx="4"/><circle class="sf" cx="55" cy="90" r="5"/><path class="i2" d="M 92 64 L 114 64 L 118 76 L 88 76 Z"/><path class="lt2" d="M 110 76 L 110 108"/><text class="lbl-s" x="80" y="166" text-anchor="middle">awareness</text><text class="lbl" x="80" y="180" text-anchor="middle">what both appear in</text></g>
</svg>''',
'<b>Three words that are not the same word.</b> Concentration chooses the object; attention keeps it through time; awareness is what both appear in, and cannot be pointed anywhere.', True)

add('34-s4.html', 'In the Mahabharata, the archery master Drona',
'''<svg viewBox="0 0 320 200" role="img" aria-label="An archer's view of a tree, a bird, and the crowd, all faded; only the bird's eye is crisp and gold; an arrow points at it">
  <g opacity=".22"><rect class="i2" x="196" y="90" width="12" height="90"/><ellipse class="i2" cx="202" cy="80" rx="52" ry="40"/><g transform="translate(30 150)"><circle class="i2" cx="0" cy="-20" r="8"/><path class="i2" d="M -10 10 C -10 -18, 10 -18, 10 10 Z"/></g><g transform="translate(58 156)"><circle class="i2" cx="0" cy="-20" r="8"/><path class="i2" d="M -10 10 C -10 -18, 10 -18, 10 10 Z"/></g></g>
  <ellipse class="i2" cx="230" cy="52" rx="16" ry="9" opacity=".35"/><circle class="i2" cx="246" cy="46" r="6" opacity=".35"/>
  <circle class="g" cx="248" cy="45" r="4"/><circle class="g" cx="248" cy="45" r="10" opacity=".3"/>
  <path class="ln" stroke-width="3" d="M 70 150 L 236 52"/><path class="i2" d="M 240 50 l -10 0 l 3 8 z"/>
  <path class="ln3" d="M 60 120 C 76 138, 76 166, 60 184"/><path class="ln3" stroke-width="1.5" d="M 60 120 L 60 184"/>
  <text class="lbl-s" x="120" y="192">only the eye of the bird</text>
</svg>''',
'<b>The eye of the bird.</b> Not the tree, the crowd, the arrow or the clever answer that there is no bird. Single-pointedness is when there is nothing else.')

add('34-s4.html', 'That is single-pointedness, and it is the key to the whole progressive path.',
'''<svg viewBox="0 0 320 200" role="img" aria-label="A straight path up a mountain to a gold summit; flowers on one side, a creature on the other; a walker looking straight ahead">
  <path class="s2" d="M 20 184 L 160 30 L 300 184 Z"/>
  <path class="lt" stroke-width="5" d="M 160 178 L 160 44"/>
  <circle class="g" cx="160" cy="34" r="9"/>
  <g class="soft"><circle cx="96" cy="150" r="6"/><circle cx="112" cy="128" r="6"/><circle cx="124" cy="104" r="5"/><circle cx="84" cy="170" r="5"/></g>
  <path class="ln3" stroke-width="1.5" d="M 96 156 v 14 M 112 134 v 14 M 124 109 v 12"/>
  <path class="i2" d="M 210 132 c 0 -14, 22 -18, 30 -6 c 6 10, -2 20, -14 20 c -10 0, -16 -6, -16 -14 z"/><circle class="sf" cx="228" cy="128" r="2"/><circle class="sf" cx="236" cy="128" r="2"/><path class="i2" d="M 214 120 l -4 -10 l 8 4 z M 240 116 l 6 -9 l 0 10 z"/>
  <g transform="translate(160 120)"><circle class="i2" cx="0" cy="-20" r="7"/><path class="i2" d="M -9 8 C -9 -18, 9 -18, 9 8 Z"/></g>
  <text class="lbl-s" x="60" y="196">the flowers</text><text class="lbl-s" x="212" y="196">the creatures</text>
</svg>''',
'<b>Mount Carmel.</b> Straight up, looking neither left nor right: not stopping for the flowers, not scared off by the creatures.')

add('34-s4.html', 'Take sleepiness. It has a shape',
'''<svg viewBox="0 0 320 190" role="img" aria-label="A slumped seated figure with callouts to heavy eyes, a curved spine and a shortened breath line; a gold mark above reads seen">
  <g transform="translate(150 120)"><circle class="i2" cx="-6" cy="-40" r="12"/><path class="i2" d="M -22 30 C -32 -30, 12 -40, 20 30 Z"/><path class="ln3" stroke="var(--surface)" stroke-width="2" d="M -12 -40 h 6 M -2 -40 h 6"/></g>
  <path class="ln3" stroke-width="1.5" d="M 150 78 L 210 60"/><text class="lbl-s" x="214" y="62">heavy eyes</text>
  <path class="ln3" stroke-width="1.5" d="M 132 120 L 76 100"/><text class="lbl-s" x="20" y="96">the slump</text>
  <path class="lt2" d="M 60 150 q 8 -8 16 0 q 8 8 16 0"/><path class="ln3" stroke-width="1.5" d="M 126 140 L 96 148"/><text class="lbl-s" x="30" y="170">shallow breath</text>
  <circle class="g" cx="144" cy="30" r="7"/><text class="lbl-s" x="156" y="34">seen</text>
</svg>''',
'<b>A hindrance, fully seen.</b> Sleepiness is not a fog; it is a pattern with parts. Bring the whole pattern into view and it can no longer run you from the shadows.')

add('34-s4.html', 'The invitation to sit without reacting has a limit',
'''<svg viewBox="0 0 320 180" role="img" aria-label="Two seated figures: one surrounded by wavy lines of resistance, marked sit through; one with a warning mark at the knee, marked stop and take care">
  <g transform="translate(90 110)"><circle class="i2" cx="0" cy="-40" r="12"/><path class="i2" d="M -22 30 C -22 -42, 22 -42, 22 30 Z"/><path class="lt2" d="M -40 -10 q 6 -6 12 0 q 6 6 12 0 M -44 10 q 6 -6 12 0 q 6 6 12 0 M 28 -10 q 6 -6 12 0 q 6 6 12 0 M 32 10 q 6 -6 12 0 q 6 6 12 0"/></g>
  <text class="lbl-s" x="90" y="158" text-anchor="middle">karmic pain</text><text class="lbl" x="90" y="172" text-anchor="middle">sit through it</text>
  <g transform="translate(230 110)"><circle class="i2" cx="0" cy="-40" r="12"/><path class="i2" d="M -22 30 C -22 -42, 22 -42, 22 30 Z"/><path class="i3" d="M 20 12 l 12 -20 l 12 20 z"/><rect class="sf" x="31" y="0" width="2.5" height="6"/><circle class="sf" cx="32.2" cy="9" r="1.4"/></g>
  <text class="lbl-s" x="230" y="158" text-anchor="middle">biological pain</text><text class="lbl" x="230" y="172" text-anchor="middle">stop, take care</text>
</svg>''',
'<b>Productive and unproductive pain.</b> The squirm of resistance is sat through; the body\'s warning is listened to. Knowing which is which is the skill.')

add('34-s4.html', 'An old image: a technique is a thorn used to remove a thorn.',
'''<svg viewBox="0 0 320 130" role="img" aria-label="One thorn levering another out of skin; both thorns then lie discarded">
  <path class="skin" d="M 10 80 C 60 70, 140 70, 180 82 L 180 120 L 10 120 Z"/>
  <path class="i2" d="M 96 56 L 106 56 L 101 104 Z"/>
  <path class="i2" d="M 44 40 L 100 74 L 96 82 Z"/>
  <path class="lt2" stroke-width="2" d="M 108 66 q 8 -10 14 -8"/><path class="t" d="M 122 58 l -6 -1 l 1 6 z"/>
  <path class="i3" opacity=".7" d="M 236 92 L 270 88 L 240 100 Z"/><path class="i3" opacity=".7" d="M 250 108 L 284 98 L 258 112 Z"/>
  <text class="lbl-s" x="196" y="122">both discarded</text>
</svg>''',
'<b>A thorn to remove a thorn.</b> The technique is the second thorn. When the first is out, both are thrown away; keep the second and it becomes a new splinter.')

# ---------------- STAGE 5 ----------------
add('35-s5.html', 'is a short poem on "faith in mind"',
'''<svg viewBox="0 0 480 170" role="img" aria-label="Left: a field of assorted shapes divided by a bold line into for and against. Right: the same shapes with no line">
  <g transform="translate(0 0)">
    <g class="soft"><circle cx="40" cy="50" r="9"/><rect x="70" y="80" width="18" height="18" rx="3"/><path d="M 60 130 l 10 -18 l 10 18 z"/><circle cx="120" cy="40" r="7"/></g>
    <g class="i3" opacity=".8"><circle cx="160" cy="70" r="9"/><rect x="180" y="110" width="18" height="18" rx="3"/><path d="M 140 130 l 10 -18 l 10 18 z"/><circle cx="196" cy="46" r="7"/></g>
    <path class="lt" stroke-width="5" d="M 118 14 L 138 156"/>
    <text class="lbl-s" x="40" y="160">for</text><text class="lbl-s" x="160" y="160">against</text>
  </g>
  <g transform="translate(250 0)">
    <g class="soft"><circle cx="40" cy="50" r="9"/><rect x="70" y="80" width="18" height="18" rx="3"/><path d="M 60 130 l 10 -18 l 10 18 z"/><circle cx="120" cy="40" r="7"/><circle cx="160" cy="70" r="9"/><rect x="180" y="110" width="18" height="18" rx="3"/><path d="M 140 130 l 10 -18 l 10 18 z"/><circle cx="196" cy="46" r="7"/></g>
    <text class="lbl-s" x="40" y="160">the same things, no line</text>
  </g>
  <path class="i3" d="M 228 84 l 12 -6 l 0 12 z"/>
</svg>''',
'<b>The disease of the mind.</b> Not the things, not the sensing of them: the line drawn through them. Take away the line and everything becomes, in the poem\'s words, clear and undisguised.', True)

add('35-s5.html', 'Half a world and a thousand years before Sengcan',
'''<svg viewBox="0 0 320 170" role="img" aria-label="Thirty spokes meeting at an empty gold hub; a cup whose emptiness holds the water">
  <g transform="translate(90 85)"><circle fill="none" stroke="var(--ink-2)" stroke-width="7" r="58"/>
    <g stroke="var(--ink-3)" stroke-width="1.5"><line x1="0" y1="-54" x2="0" y2="54"/><line x1="-54" y1="0" x2="54" y2="0"/><line x1="-38" y1="-38" x2="38" y2="38"/><line x1="-38" y1="38" x2="38" y2="-38"/><line x1="-20" y1="-50" x2="20" y2="50"/><line x1="20" y1="-50" x2="-20" y2="50"/><line x1="-50" y1="-20" x2="50" y2="20"/><line x1="50" y1="-20" x2="-50" y2="20"/></g>
    <circle class="sf" r="15"/><circle class="g" r="15" opacity=".45"/></g>
  <path class="i2" d="M 210 60 L 290 60 L 280 130 L 220 130 Z"/><path class="g" opacity=".4" d="M 218 66 L 282 66 L 274 124 L 226 124 Z"/><path class="soft" d="M 224 94 L 276 94 L 274 124 L 226 124 Z"/>
  <text class="lbl-s" x="90" y="162" text-anchor="middle">the empty hub</text><text class="lbl-s" x="250" y="162" text-anchor="middle">the empty cup</text>
</svg>''',
'<b>The wheel and the cup.</b> The spokes and the clay are what you can see; the usefulness lives in what is not there.')

add('35-s5.html', 'The Taoist practice that follows is',
'''<svg viewBox="0 0 320 170" role="img" aria-label="Water flowing around a rock and on toward the sea; the rock unmoved, the water untroubled">
  <path class="soft" d="M 0 60 L 320 60 L 320 140 L 0 140 Z"/>
  <path class="i2" d="M 118 72 c 20 -18, 50 -12, 56 10 c 6 20, -14 36, -34 34 c -22 -2, -40 -22, -22 -44 z"/>
  <g class="lt2" stroke-width="2.5"><path d="M 10 76 C 60 76, 90 62, 118 62 M 176 62 C 210 62, 260 76, 310 76"/><path d="M 10 100 C 40 100, 80 100, 106 100 M 186 100 C 220 100, 260 100, 310 100"/><path d="M 10 124 C 60 124, 100 128, 140 128 C 180 128, 240 124, 310 124"/><path d="M 96 86 C 100 74, 108 66, 118 62 M 176 62 C 184 70, 188 82, 186 100"/></g>
  <path class="t" opacity=".6" d="M 296 72 l 10 4 l -10 4 z M 296 120 l 10 4 l -10 4 z"/>
  <text class="lbl-s" x="152" y="158" text-anchor="middle">around the rock, on to the sea</text>
</svg>''',
'<b>The way of water.</b> Never passive, never in conflict with the shape of things. Around the rock rather than into it, always arriving at the sea.')

add('35-s5.html', 'A farmer in a small village owned a fine horse',
'''<svg viewBox="0 0 480 150" role="img" aria-label="Four frames of the parable: the horse runs off; it returns with wild horses; the son breaks his leg; the army passes him by. The farmer stands unchanged in each">
  <defs>''' + HORSE.format(id='fh') + '''<g id="fh-farmer"><circle cx="0" cy="-22" r="7"/><rect x="-12" y="-31" width="24" height="3" rx="1"/><path d="M -10 10 C -10 -22, 10 -22, 10 10 Z"/><path d="M -8 -2 h 16" stroke="var(--surface)" stroke-width="2"/></g></defs>
  <g transform="translate(0 0)"><rect class="s2" x="14" y="50" width="40" height="46"/><use href="#fh-horse" class="i2" x="86" y="78"/><path class="i3" d="M 112 84 l 10 -4 l 0 8 z"/><use href="#fh-farmer" class="i2" x="20" y="86"/><text class="lbl-s" x="60" y="128" text-anchor="middle">gone.</text><text class="lbl" x="60" y="142" text-anchor="middle">"maybe."</text></g>
  <g transform="translate(120 0)"><use href="#fh-horse" class="i2" x="60" y="78"/><use href="#fh-horse" class="i3" transform="translate(96 92) scale(.8)"/><use href="#fh-horse" class="i3" transform="translate(104 66) scale(.8)"/><use href="#fh-farmer" class="i2" x="18" y="86"/><text class="lbl-s" x="60" y="128" text-anchor="middle">back, with more.</text><text class="lbl" x="60" y="142" text-anchor="middle">"maybe."</text></g>
  <g transform="translate(240 0)"><g transform="translate(70 92)"><circle class="i2" cx="0" cy="-22" r="7"/><path class="i2" d="M -10 6 C -10 -24, 10 -24, 10 6 Z"/><rect class="t" x="-4" y="6" width="9" height="14" rx="2"/></g><use href="#fh-horse" class="i3" transform="translate(104 78) scale(.7)"/><use href="#fh-farmer" class="i2" x="18" y="86"/><text class="lbl-s" x="60" y="128" text-anchor="middle">the leg.</text><text class="lbl" x="60" y="142" text-anchor="middle">"maybe."</text></g>
  <g transform="translate(360 0)"><g class="i3"><circle cx="70" cy="60" r="6"/><rect x="65" y="66" width="10" height="20" rx="3"/><circle cx="88" cy="60" r="6"/><rect x="83" y="66" width="10" height="20" rx="3"/><circle cx="106" cy="60" r="6"/><rect x="101" y="66" width="10" height="20" rx="3"/></g><path class="i3" d="M 112 76 l 8 -4 l 0 8 z"/><g transform="translate(50 100)"><circle class="i2" cx="0" cy="-16" r="5"/><path class="i2" d="M -7 6 C -7 -18, 7 -18, 7 6 Z"/><rect class="t" x="-3" y="6" width="6" height="8" rx="1"/></g><use href="#fh-farmer" class="i2" x="18" y="86"/><text class="lbl-s" x="60" y="128" text-anchor="middle">passed over.</text><text class="lbl" x="60" y="142" text-anchor="middle">"maybe."</text></g>
</svg>''',
'<b>The farmer\'s horse.</b> Four verdicts from the villagers, one answer from the farmer. He is not indifferent; he has stopped believing the mind is qualified to judge.', True)
