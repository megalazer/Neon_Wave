neon-terminus/
├── App.js
├── babel.config.js
├── tailwind.config.js              ← full color palette from Stitch
├── app.json
├── package.json
├── CLAUDE.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   └── designs/                    ← my Stitch HTML files
└── src/
    ├── store/
    │   ├── index.js
    │   └── slices/
    │       ├── characterSlice.js
    │       ├── crewSlice.js
    │       ├── worldSlice.js
    │       ├── logSlice.js
    │       ├── eventSlice.js
    │       └── legacySlice.js
    ├── engine/
    │   └── turnPipeline.js
    ├── data/
    │   └── placeholderNarration.js
    ├── screens/
    │   ├── LogScreen.js
    │   ├── HavenScreen.js
    │   ├── CyberScreen.js
    │   ├── JobsScreen.js
    │   └── LifestyleScreen.js
    ├── components/
    │   ├── TopBanner.js
    │   ├── BottomNav.js
    │   ├── ScanlineOverlay.js
    │   ├── CRTBackground.js
    │   ├── NoiseTexture.js
    │   ├── LogEntry.js
    │   └── AdvanceCycleFAB.js
    └── theme/
        ├── colors.js               ← exported color tokens
        └── fonts.js                ← Kode Mono loading