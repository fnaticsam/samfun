# Awakening logo

- `mark.svg` is the light-theme sun-and-river roundel; `mark-dark.svg` uses dark-theme ink, teal, and gold.
- `lockup.svg` combines the light mark with the KNOMI title for share artwork.
- Regenerate icons with `rsvg-convert -w N -h N mark.svg -o ../img/name.png` (ImageMagick's built-in SVG renderer drops the stroked ring and hills); make `icon-180.png` with `-b "#F8F1F2"`. Render the social card by placing `lockup.svg` on a `1200x630 #F8F1F2` canvas.

Light colours: ink `#665560`, teal `#8C9BB8`, gold `#C2A45F`. Dark colours: ink `#EEE6E9`, teal `#B8C5E0`, gold `#D6B45A`. Apple-touch background: `#F8F1F2`.
