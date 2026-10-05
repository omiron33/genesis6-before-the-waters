# Scene architecture

The film is deterministic: each frame is a pure function of the scene parameters and song time, and any randomness is seeded by position. `film.json` defines 47 contiguous intervals cut on measured beats (some carry a `hold` note: a stretch the cut must not interrupt). Each scene has a picture module and a separate lyric module, so typography can change without re-rendering its world.

## Picture modules

Every picture module exports `kind = 'shader'` and a default factory receiving the scene parameters (`id`, `from`, `to`). The result provides `from`, `to`, a GLSL fragment shader, uniforms, a camera function (position, target, field of view, focus distance and aperture for the thin lens) and optional update and finishing functions. These scenes render through `renderer/web/premium/`.

`lib/look.js` is the shared look: the palette (storm violet and slate teal, forge orange and crimson, the cold star-white of the fallen, the gold of grace, honey cedar and black pitch, ash grey), the grade, timing, easing and camera helpers. The worlds live in `lib/x-*.js`:

- `x-mount.js`, `x-mount-near.js`, `x-mount-ground.js`, `x-mount-watch.js` — the holy mountain (Hermon) and the great valley of Cain, in kilometres: the granite ridge, the river plain, walled cities, villages, torch-lit roads, forges and hearth smoke (s00, s01, s03, s04, s05, s08, s10, s11, s23). `x-mount-near.js` holds the close things in metres: the stone altar and its smoke that the wind tears away, the clay lamps on the ledge and the lamps on the path. `x-mount-ground.js` is a JavaScript twin of the terrain so cameras and lights can ride it. `x-mount-watch.js` packs the cold lights of the Watchers (the fallen angels) for the shader: position, brightness and the trail of their fall.
- `x-city.js` and `x-city-*.js` — the valley city of Cain close up: shared lens, fire, embers and materials (cyclopean stone, mud-brick, bronze, basalt). `x-city-sill.js` is the window with the bronze mirror, earrings, comb and loom, one cold light in the sky (s02); `x-city-wall.js` the giants' walls, towers and bronze gate (s07); `x-city-hall.js` the giants' hall, the colossal bronze sword and the basalt throne (s09); `x-city-street.js` the street at night with its chains, false scales, dropped blade, idols and furnace (s22); `x-city-road.js` the road out, the tipped cart and the overturned shrine (s24); `x-city-storm.js` the city under the dry storm front and its run of lightning (s26). `x-city-type.js` is a lyric-only layout helper for the city scenes' heavy lines.
- `x-ember.js` — the bed of coals in macro, breathing like a heart (s12).
- `x-storm.js` and `x-storm-*.js` — the storm over the plain at night: the cumulonimbus lit from within by silent lightning (`x-storm-cloud.js`, s13), the empty village in the wind (`x-storm-village.js`, s14), the plain with the herd and the murmuration (`x-storm-plain.js`, s15), the dried waterhole and its clay jar (`x-storm-dust.js`, s16) and the storm wall of the foretold flood (`x-storm-wall.js`, s32).
- `x-grove.js`, `x-grove-sky.js`, `x-grove-scene.js`, `x-cedar.js` — Noe's grove: the hill of cedars, the stone house with its lamp, the well, the olive tree, the altar, the three young cedars and their lamps, the felled stump and the plumb line (s06, s17 to s21, s25). `x-grove-sky.js` is the storm cloud whose gap lets the gold of grace fall, and the wall of storm on the horizon; `x-grove-scene.js` wraps the world with a camera and grade; `x-cedar.js` grows the cedars of Lebanon from a seed and draws them.
- `x-yard.js`, `x-yard-beam.js`, `x-yard-pitch.js`, `x-ark.js`, `x-ark-cams.js` — building the ark on Noe's hill by lamplight: the shared lamps, honey cedar and wet black pitch (`x-yard.js`), the squared beam on its trestles (s27), the frame being pitched within (s28), and the hull of 300 × 50 × 30 cubits with its measure lines, the window a cubit below the ridge, the door and the three decks (`x-ark.js`, s29 to s31). `x-ark-cams.js` holds the camera paths shared by these scenes and their lyric modules.
- `x-flood-sky.js`, `x-flood-deep.js`, `x-flood-ark.js` — the flood world: the shared night storm, lightning and rain; God's foretelling in cold ash (the city drowned in rain and the fountains of the deep, s33 and s34); and the finished ark on its hill, lit gold from its door and window, with the carried lamps going up the ramp and the door shut at the end (s35, s36, s45, s46).
- `x-gather.js` — every living kind coming to the ark: paired tracks in the mud, animals as dark silhouettes, birds settling on the ridge, feathers, the small trails at the ramp's foot and the view out of the door (s37 to s42).
- `x-hold.js` — the hold by lamplight: stalls and sleeping animals on the lower deck, the storeroom of grain jars, figs, dates and wheat on the second, roosting birds on the third, and the window above (s43, s44).

No human figure is drawn anywhere. The fallen angels are only points of cold light, the Nephilim only distant, still silhouettes and their works, and people only what they leave behind.

## Lyric modules

Each `scenes/<name>.lyric.js` exports a factory for a transparent text layer, built with `lyricModule` from `lib/type.js`. `lib/type.js` holds the typography. There are two speakers: the narrator (upright bone EB Garamond) and `god`, the words of God in gold italic Garamond with a little light, which a lyric module selects with `{ speaker: 'god' }` for God's lines. Words of meaning take their own voice:

- `holy` — God, Lord, grace, covenant, Spirit, heaven, just, perfect, pleasing: gold capitals that carry light.
- `noe` — Noe, Shem, Ham, Japheth, sons, wife, wives: warm cedar-gold spaced capitals.
- `fallen` — "the sons of God": cold star-white capitals with a pale blue glow. It has no word list; `linesIn` gives those three words this voice wherever the phrase is sung, so in this film "sons of God" reads as the fallen angels and never as the gold of God.
- `wrong` — giants, wickedness, evil, corrupt, wrong, destroy, renown: forge-red capitals for the heavy hits.
- `ash` — flood, perish, die, end, wipe, grieve, flesh: ash capitals for judgment.
- `ark` — ark, timber, pitch, door, rooms, stories, build: honey cedar capitals.
- `measure` — the numbers and measures (one hundred twenty, three hundred, fifty, thirty, cubits, years, lower, second, third): silver capitals like a builder's mark.
- `living` — cattle, creatures, birds, beasts, pairs, male, female, kind, daughters, beautiful: a soft warm italic.
- `earth` — earth: clay capitals.
- `quiet` — the small words of a big line, for layouts that set them quietly.

`data/lyrics.json` gives the measured sung-word and line intervals; words appear on their measured onsets, not on estimated beats.

The lyric canvas is 3840 × 2160 and is composited into the 1920 × 1080 output. Every word stays inside a 200 px margin of that canvas. The film-wide lyric backing (halo spread, shade and `lift: false`) is set in `film.json`; see [rendering](RENDERING.md). Lyric modules may import only what the picture does not (apart from shared camera paths such as `x-ark-cams.js`), so a typography change never re-renders a picture.

## Working on a scene

```sh
node tools/params.mjs s17-grace --times
npm run still -- --scene s17-grace --time 94 --samples 4
node tools/render.mjs scene --scene s17-grace --from 93 --to 95 --draft
```

`docs/BRIEF.md` is the visual brief and `docs/STORYBOARD.md` gives each scene's intent. Keep scene times as they are in `film.json`; the cuts sit on beats.

## Optional planning and timing tools

The released timing data is sufficient for rendering; none of these run during installation or rendering, and running them overwrites authored files, so use a separate branch.

- `tools/plan.py` — rebuilds `film.json` from lyric lines and measured beats.
- `tools/analyze.py` — measures beats and loudness from the recording with NumPy (`python tools/analyze.py media/song.wav data/audio.json`).
- `tools/timing.py` — rebuilds `data/lyrics.json` from a forced alignment of `intake/sung-lyrics.txt` (the alignment file and recording are not included).
- `tools/vocals.py` — separates a vocal stem with a locally supplied Hybrid Demucs checkpoint (`python tools/vocals.py <checkpoint> <song.wav> <vocals.wav>`), so forced alignment hears the voice alone. Requires PyTorch and torchaudio.
