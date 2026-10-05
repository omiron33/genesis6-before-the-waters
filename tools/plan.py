"""Write film.json: one scene per stretch of the song, each cut on a measured beat just before the
first sung word of the scene (or on a beat at the time given for the instrumental stretches)."""
import json
L = json.load(open('data/lyrics.json'))
beats = L['beats']; lines = L['lines']
# (scene, first line of the scene, or a song time for an instrumental cut, hold note)
PLAN = [
    ('s00-title', 0.0, 'the title in the first seconds'),
    ('s01-numerous', 'As people grew', None),
    ('s02-daughters', 'daughters were born', None),
    ('s03-sons-saw', 'The sons of God saw', None),
    ('s04-took', 'they took as wives', None),
    ('s05-spirit', 'The Lord God said', 'one sentence of God'),
    ('s06-years', 'they are flesh', None),
    ('s07-giants', 'Giants lived', None),
    ('s08-came', 'The sons of God came', None),
    ('s09-renown', 'their children were', 'the held line into the drop'),
    ('s10-saw', 'The Lord God saw wickedness', 'the near-silent drop'),
    ('s11-multiply', 'multiply upon', None),
    ('s12-brooding', 'Every heart', None),
    ('s13-pondered', 'God took it to heart', 'one sentence of God pondering'),
    ('s14-wipe', 'God said, I will wipe', None),
    ('s15-creatures', 'and cattle, creatures', None),
    ('s16-grieve', 'I grieve', None),
    ('s17-grace', 'But Noe found grace', 'grace breaks: one sentence'),
    ('s18-generations', 'These are the generations', None),
    ('s19-just', 'He was a just man', None),
    ('s20-pleasing', 'and pleasing to God', None),
    ('s21-sons', 'Noe fathered', None),
    ('s22-corrupt', 'The earth was corrupt', None),
    ('s23-looked', 'The Lord God looked', None),
    ('s24-all-flesh', 'all flesh had corrupted', None),
    ('s25-end', 'The Lord God said to Noe', None),
    ('s26-destroy', 'They have filled', None),
    ('s27-ark', 'Make yourself an ark', None),
    ('s28-pitch', 'with rooms inside', None),
    ('s29-cubits', 'Make the ark three hundred', 'three measures of one command'),
    ('s30-narrow', 'Narrow the ark', None),
    ('s31-door', 'Put its door', None),
    ('s32-flood', 'I will bring a flood', None),
    ('s33-perish', 'All flesh that breathes', None),
    ('s34-die', 'everything on earth', 'the held climax'),
    ('s35-covenant', 'But I will establish', 'the covenant, one sentence'),
    ('s36-enter', 'Enter the ark', 'one sentence'),
    ('s37-pairs', 'Bring pairs', None),
    ('s38-beasts', 'cattle, creatures', None),
    ('s39-feed', 'Feed them', None),
    ('s40-birds', 'Birds after', None),
    ('s41-crawl', 'all that crawl', None),
    ('s42-two', 'pairs of each', None),
    ('s43-food', 'Gather every kind', None),
    ('s44-store', 'store it for', 'the long held line'),
    ('s45-obey', 'Noe did everything', 'one sentence'),
    ('s46-end', 'He did it all', 'the last line and the end title'),
]
norm = lambda s: s.lower().replace(',', '')
cuts = []
after = 0.0
prev_end = 0.0
for name, key, hold in PLAN:
    if isinstance(key, float):
        t = key if key == 0 else min(beats, key=lambda b: abs(b - key))
    else:
        l = next(l for l in lines if l['start'] >= after and norm(l['text']).startswith(norm(key)))
        after = l['start'] + 0.01
        k = lines.index(l)
        prev_end = lines[k - 1]['end'] if k else 0.0   # the line sung just before: never cut inside it
        ok = [b for b in beats if prev_end - 0.05 <= b <= l['start'] - 0.12]
        t = ok[-1] if ok else (prev_end + l['start']) / 2
    cuts.append((name, round(t, 3), hold))
scenes = []
for i, (name, t, hold) in enumerate(cuts):
    to = cuts[i + 1][1] if i + 1 < len(cuts) else round(L['duration'], 3)
    s = {'id': f'{i:02d}', 'scene': name, 'from': t, 'to': to}
    if hold: s['hold'] = hold
    scenes.append(s)
json.dump({'fps': 60, 'samples': 10, 'tier': 'standard', 'lyric': {'haloSpread': 9, 'shade': 0.5}, 'scenes': scenes}, open('film.json', 'w'), indent=1)
for s in scenes: print(s['id'], s['scene'].ljust(16), f"{s['from']:7.2f} {s['to']:7.2f} {s['to']-s['from']:5.2f}")
