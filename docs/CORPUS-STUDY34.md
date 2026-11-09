# Study 34 corpus proposal (v2, 2026-11-09)

The breadth corpus for the app's Study 34 brief
(stem-shovel docs/bench-brief-study34-breadth-2026-11-09.md), revised
after Kevin's two decisions: Interbellum is published on stemshovel.com
and joins the corpus; the rehearsal phone captures are dropped for now
(too low quality), which defers S34-G3 (the phone-input gate) to its
own study when captures worth measuring exist.

Audio is fetched at run time and never committed; this file plus the
registration manifest carry the links, licenses and truth authorship.
US sound recordings published through 1925 are public domain under the
Music Modernization Act's 100-year term (1925 entered PD on
2026-01-01). JAAH is the MTG Jazz Audio-Aligned Harmony dataset
(ISMIR 2018, CC BY annotations, github.com/MTG/JAAH): per-track key,
meter, tuning, section parts, and BEAT-ALIGNED chords — which supplies
the bar-one anchor and section boundaries mechanically for its slots.

## The twelve slots

| # | recording | category | rights | truth |
|---|---|---|---|---|
| 1 | eat-all-the-clocks, clean mix (Badverbs) | in-run control, excluded from G2 | Kevin's outright | band chart (corpus/badverbs-charts) |
| 2 | Interbellum (Badverbs, fetched 2026-11-09, 7 stems + mix, C 4/4 115) | key change at the bridge (C to A at DAOM), genuine ritardando, sevenths and slash bass | Kevin's outright | band chart, fetched |
| 3 | Josh Woodward, one acoustic vocal track (Free Music Archive) | solo singer with acoustic guitar | CC BY | hand chart (bench), Kevin spot-check |
| 4 | second singer-songwriter, different artist (FMA) | second acoustic voice | CC BY or BY-SA, picked at manifest | hand chart (bench) |
| 5 | Zez Confrey, "Kitten on the Keys" (1921 piano solo), archive.org 78_kitten-on-the-keys_zez-confrey-zez-confrey_gbia0566187a | solo piano | public domain (1921) | hand chart from the PD published sheet, verified against the recording |
| 6 | Paul Whiteman, "Three O'Clock in the Morning" (1922 waltz), archive.org 78_three-oclock-in-the-morning_paul-whiteman-and-his-orchestra-j-robledo_gbia3033387a | 3/4 | public domain (1922) | hand chart from the PD sheet, verified |
| 7 | King Oliver's Creole Jazz Band, "Dippermouth Blues" (1923) | jazz with sevenths as written harmony | public domain (1923) | JAAH annotation (beat-aligned), cited |
| 8 | Bessie Smith with Louis Armstrong, "St. Louis Blues" (1925) | slow blues, low-tempo end, voice-led | public domain (1925) | JAAH annotation, cited |
| 9 | Original Dixieland Jazz Band, "Livery Stable Blues" (1917) | extreme tempo (fast), earliest and roughest signal | public domain (1917) | JAAH annotation, cited (fallback: Tiger Rag 1918, hand chart) |
| 10 | one live recording with audience, Live Music Archive | live with crowd noise | CC BY only (etree items carry per-show licenses; candidates listed at manifest for the rights pass) | hand chart (bench) |
| 11 | one PD 1920s vocal quartet side (a cappella or near) | no drums at all: the grid's hardest case | public domain, identifier at manifest | hand chart (bench) |
| 12 | one modern full-band production (e.g. Lorenzo's Music, FMA) | modern production, so the corpus is not all vintage | CC BY-SA, picked at manifest | hand chart (bench) |

The pickup-bar category is assigned at chart-writing time from
whichever of slots 3 to 9 carries one (several 1920s sides and most
singer-songwriter songs do); if none does, a dedicated PD pick with a
pickup replaces slot 4.

## Notes for the registration

- Slots 7 to 9 arrive with beat-aligned truth; their anchors need no
  hand measurement. Every other slot's bar-one anchor is hand-measured
  and committed with a diagnostic before the run (the Correction 4
  rule: wild recordings do not start on bar lines).
- "Ninths and altered chords as the written harmony" cannot be
  rights-cleared from the PD era (bebop is decades from the public
  domain); slot 7 and 8's sevenths are the honest ceiling, and the
  altered-harmony breadth case is named as out of reach rather than
  faked.
- 78 rpm transfers carry surface noise, acoustic-horn bandwidth
  (roughly 200 to 3,000 Hz on the earliest sides) and period tuning
  (JAAH records 440 to 452 Hz): all three are breadth, not defects,
  and the report will say which failures track the transfer rather
  than the music.
- The fetch script (scripts/fetch-study34.ts) will record URL, SHA-256,
  bytes and duration per item in corpus/fixture-study34.json, as
  fetch-mmkk.ts does; JAAH-slot durations are cross-checked against the
  annotation's declared duration so the right master is fetched.
