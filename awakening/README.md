# The Architecture of Awakening — source

The published site is a single self-contained HTML file, `index.html`. It is **built** from the
pieces in this folder, so edit the pieces, not `index.html`.

## Files

    parts/            The site, split into one file per page (plus head/shell).
                      00-head.html      <title>, fonts, all CSS (incl. the illustration vocabulary)
                      10-shell-open.html  nav rail, topbar
                      20-home.html      home page
                      31-s1 … 40-s10    the ten path stages
                      50-field.html     field guide
                      60-glossary.html  glossary
                      70-traditions.html cross-tradition table
                      80-analogies.html analogy index
                      85-blueprint.html blueprint / lesson types
                      90-shell-close.html  routing + progress JS

    ills_a.py         The 44 illustrations, as inline SVG. Part A: home, stages 1–5.
    ills_b.py         Part B: stages 6–10, field guide, blueprint.
    build.py          Inserts each illustration after its anchor paragraph, then
                      concatenates parts/ into index.html.

    styles.html       The three-direction illustration style sheet (ink / cut paper /
                      blueprint) plus the full illustration inventory. Reference only;
                      not part of the site.

## Building

    python3 build.py

Prints how many figures were inserted and flags unbalanced tags or duplicate SVG ids.
Writes `index.html` (and a copy of the injected parts into `build/`).

## Adding or changing an illustration

In `ills_a.py` / `ills_b.py`:

    add('34-s4.html',                       # which page
        'In the Mahabharata, the archery',  # anchor: unique text in the paragraph it follows
        '''<svg viewBox="0 0 320 200" role="img" aria-label="...">…</svg>''',
        '<b>Title.</b> One sentence saying what the picture shows.',
        wide=False)                          # True → 760px instead of 540px

If an anchor no longer matches, `build.py` prints `MISSING ANCHORS` rather than
silently dropping the figure.

## The visual vocabulary (cut paper)

Colour carries meaning, so keep it strict:

    gold  (.g / .lg)    awareness — and nothing else, ever
    teal  (.t / .lt)    energy, attention, the practices
    mist  (.soft .s2)   the world, objects, the show
    ink   (.i2 .i3)     the character and its things
    skin  (.skin)       body / ground

All colours come from CSS variables, so light and dark themes are automatic. Two
exceptions use literal hex on purpose — the Plato's cave and hero's cave drawings,
which must stay dark in both themes.

Class reference is at the top of `parts/00-head.html` under "Illustrations (cut paper)".
