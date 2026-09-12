# Awakening logo

- `mark.svg` is the light-theme sun-and-river roundel; `mark-dark.svg` uses dark-theme ink, teal, and gold.
- `lockup.svg` combines the light mark with the title for share artwork.
- Regenerate icons with `rsvg-convert -w N -h N mark.svg -o ../img/name.png` (ImageMagick's built-in SVG renderer drops the stroked ring and hills); make `icon-180.png` with `-b "#EDF1F2"`. Render the social card by placing `lockup.svg` on a `1200x630 #EDF1F2` canvas.

Light colours: ink `#17212A`, teal `#1E6C74`, gold `#A8841F`. Dark colours: ink `#DCE4E8`, teal `#5AB3BB`, gold `#D6B45A`. Apple-touch background: `#EDF1F2`.
