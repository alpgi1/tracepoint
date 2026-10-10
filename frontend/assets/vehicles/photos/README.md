# Vehicle photos

Side-profile renders of the three configured cars, raw inputs of
`scripts/vehicles/photos.mjs`, which lifts the car off the studio background
and writes `public/vehicles/<code>-photo-side.webp` and
`content/vehicles/<code>-photo.json`. Nothing here is edited by hand.

| File | Car | Configuration (team's configurator links, 2026-10-10) | View |
| --- | --- | --- | --- |
| `F70-sideleft.webp` | F70, 1 Series | `configure.bmw.de/de_DE/configure/F70/31GE/FBLAT,P0300,S01CB,…` | SIDELEFT, desktop size 2560 x 1646, background "sand" |
| `G60-sideleft.webp` | G60, 5 Series Sedan | `configure.bmw.de/de_DE/configure/G60/71FJ/FKUSW,P0A90,S01CB,…` | same |
| `G70-sideleft.webp` | G70, 7 Series | `configure.bmw.de/de_DE/configure/G70/61HZ/FKVSW,P0C36,S01CB,…` | same |

How they were obtained: the configurator asks the BMW image service
(`prod.cosy.bmw.cloud`, collection `stage-fullscreen-views`) for the named
views of the configured car; the SIDELEFT entry of the desktop section was
taken from that response and downloaded (the signed image URLs are valid
without the configurator's key). SIDELEFT shows the car's left side with the
front at the left, the same direction as the technical drawings.

Notes

- G68 (5 Series Long Wheelbase, China) uses the G60 photo, as it uses the G60
  drawing; the UI says so.
- The renders are BMW AG material from the public configurator. The prototype
  is an internal hackathon build; clear the rights before any public release.
