# Vehicle drawing sources

Raw inputs of `scripts/vehicles/build.mjs`. The script strips the dimension
annotations, crops the side and top views and writes three alpha masks per
view under `public/vehicles/` (body, lines, contour) and `content/vehicles/*.json`
(size, silhouette box, scale). Nothing in this folder is edited by hand.

| File | Vehicle | Origin | Extraction |
| --- | --- | --- | --- |
| `F70-brochure-p21.svg` | F70, BMW 1 Series | `docs/F70_OptionList.PDF`, page 21 (technical drawing page, third from last) | `pdftocairo -svg -f 21 -l 21 docs/F70_OptionList.PDF F70-brochure-p21.svg` |
| `G60-brochure-p26.svg` | G60, BMW 5 Series Sedan | `docs/G60_OptionList.PDF`, page 26 | `pdftocairo -svg -f 26 -l 26 docs/G60_OptionList.PDF G60-brochure-p26.svg` |
| `G70-press-specifications-p9.png` | G70, BMW 7 Series | BMW Group PressClub, "The new BMW 7 Series. Specifications." (04/2022), page 9, embedded raster 1110 x 1452 px. Fetched 2026-10-10 from <https://www.press.bmwgroup.com/middle-east/article/attachment/T0403219EN/565799> | `pdfimages -png -f 9 -l 9 565799.pdf spec-p9` (image 002) |

Notes

- The G70 brochure in `docs/` has photographs only, no line drawing, so the
  press specification sheet is used (team choice, step 07). It is a raster,
  so its lines are softer than the two vector drawings, and it shows the
  seats, which the brochure drawings do not.
- G68 (5 Series Long Wheelbase, China) has no drawing in `docs/`; the UI shows
  the G60 drawing and says so.
- The press material is BMW Group property, published for editorial use. The
  prototype is an internal hackathon build; clear the rights before any public
  release.
- Overall lengths used for the millimetre scale: F70 4361 mm, G60 5060 mm,
  G70 5391 mm (from the same documents).
