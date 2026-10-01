# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev -- -p 4000     # dev server — run it on port 4000; every test script hardcodes http://localhost:4000
npm run build              # production build (also the most complete type/compile check)
npx tsc --noEmit           # fast type-check
```

- `.claude/launch.json` defines a `dev` config (port 4000) for the preview browser.
- `npm run lint` (`next lint`) has no ESLint config in the repo and will start an interactive setup prompt, so use `tsc` or `build` instead.
- There is no test runner. Tests are standalone Playwright scripts in `scratch/`, run with node against a running dev server (they launch the `chrome` channel headless and save screenshots under `scratch/screenshots*/`):
  ```bash
  node scratch/e2e_test.js
  node scratch/test_video_ux.js
  ```
  `scratch/` is gitignored except for the few files already tracked. Most scripts there are one-off diagnostics or regression checks for specific bugs (e.g. `test_ton618_*`, `test_continuous_zoom*`, `verify_*`). Add new ad-hoc scripts there in the same style.

## Architecture

Next.js 14 App Router app with a single page (`app/page.tsx`, a client component). All 3D content comes from React Three Fiber (`three`, `@react-three/drei`), camera tweens use GSAP, and all app state lives in one Zustand store. Path alias: `@/*` → repo root.

### Two "worlds" behind one store

First visit (no remembered world and no `?world=` link): `components/ui/WorldChooser.tsx` asks which world to start in. `app/page.tsx` saves the current world under `localStorage['science_lab_world']` (`WORLD_PREFERENCE_KEY`) on every switch. The store's initial state prefers `?world=`, then the saved world, then `subatomic`. Test scripts that open `/` in a fresh browser must pre-set that key, or the chooser will block them.

`stores/useQuantumStore.ts` holds everything: `activeWorld` is `'subatomic' | 'universe'`, and `page.tsx` mounts exactly one canvas plus that world's HUD. The canvases, and every modal or drawer, load through `next/dynamic` with `ssr: false`, and each modal mounts only while its `is…Open` flag is true. Store actions also play sounds through `lib/audioSynth.ts` (procedural Web Audio, with no audio files).

- **Subatomic** (`components/3d/CanvasContainer.tsx`): `scaleLevel` 1–5 swaps between `PeriodicTableScene` → `AtomScene` → `NucleusScene` → `QuarkScene` → `StringScene`. Only one scene is mounted at a time. Camera distance past per-scale min/max thresholds auto-steps the scale. Element data comes from `data/elementsData.ts` (118 elements), the side panel is `components/dossier/`, and the HUD is `components/hud/`.
- **Universe** (`components/universe/UniverseCanvasContainer.tsx`): `cosmicScaleLevel` 1–5 maps to `SolarSystemScene`, `StellarNeighborhoodScene`, `MilkyWayScene`, `ExtragalacticScene` and `CosmicWebScene`. All five share **one continuous coordinate space**: scale camera presets range from ~75 units (scale 1) to ~520k units (scale 5), with a log depth buffer and `far` of 2.5M.

### Universe navigation and what gets rendered (the subtle part)

**Which scale layers are shown** is decided every frame by `computeScaleVisibility` in `lib/scaleVisibility.ts`. `UniverseCameraManager` (inside `UniverseCanvasContainer.tsx`) calls it and publishes `visibleScaleMask` (bit N = scale N) plus the HUD's `cosmicScaleLevel`/`adjacentCosmicScaleLevel`. The rules depend only on camera *position*, never on view direction, so looking around never changes what is shown:
- **Home band**: distance from the origin picks a scale, and overlap zones also show the neighbouring scale.
- **Regions**: scales 1–3 (home galaxy) and 4–5 (deep space) are each shown together. So switching between neighbouring scales never makes planets, orbits, stars, nebulae or the cosmic web vanish.
- **Fades between regions**: nothing is toggled while visible. The neighbouring galaxies fade in (`GALAXIES_FADE_*`), the cosmic web fades out before the Milky Way (`COSMIC_WEB_FADE_*`), and the detailed Milky Way cross-fades with its scale 4 disk (`MILKY_WAY_CROSSFADE_*`). These use `rendering/useDistanceFade` / `DistanceFadeGroup`.
- **Proximity**: being within a body's sphere of influence (framing distance × 1.25, capped at 0.6 × its distance from the origin) shows its scale and wins the HUD. This covers bodies placed outside their band (M87*, Centaurus A, the Magellanic Clouds).
- **Linger**: other smaller scales stay visible while one of their top-level bodies is still ≥ 3 px.
- **Selection**: the selected body's scale is always shown.

The cosmic web fades out within 48,000 units of home, but Laniakea's heart, the Great Attractor (`great_attractor`, ~44,600 units out), would then be invisible right where you reach it. So Laniakea sits outside the web's fade group with its own fade (`laniakeaFade` in `CosmicWebScene`), which keeps it visible within ~20,000 units of the Great Attractor.

Origin-enclosing "container" bodies (the Sun, Milky Way, Laniakea, CMB) are ignored by the proximity and linger rules. Change thresholds there, and simulate offline before touching the app. `node scratch/test_transition_pops.js` must stay at 0 pops.

**Rendering rules** (`components/universe/rendering/`). Follow these when adding scene content:
- `ScaleLayer`: each scale scene mounts once (on first need, or preloaded in the background after the first frame and pre-warmed with `compileAsync`). After that it is only shown or hidden. Each layer has its own `Suspense`, so a loading chunk never blanks the others.
- Use `<PooledPointLight>` instead of `<pointLight>`. three.js bakes the point-light count into every lit shader, so any change in count recompiles every material (hundreds of ms on Windows/ANGLE). `LightPool` keeps a constant 24 real lights and assigns them to the most relevant visible virtual lights.
- Labels use `LayerHtml` (imported `as Html`). drei's `<Html>` ignores hidden three.js parents, so labels must follow `LayerVisibleContext` instead. `LayerHtml` also makes drei's wrapper box click-through (it sits centred on the object and used to swallow clicks meant for it). A clickable element inside a label needs `pointer-events-auto`. Labels are capped at z-index 20 (drei's default reaches 16,777,271), so they stay under the HUD (z-30 and above).
- Pointer events skip hidden objects through the Canvas `events` filter (`visibleOnlyEvents`), because three's raycaster ignores `visible`. The same filter:
  - drops hits on an enterable galaxy's own disk, halo and bulge while the camera is inside it (else a click between stars selected the galaxy and flew the camera out);
  - picks objects marked `userData.pickLast` (diffuse features such as M31's Giant Stellar Stream) only after compact ones.
- Sub-systems that only matter up close (the objects inside each galaxy) go in `ProximityLod`: distance-based, with hysteresis, kept alive after the first mount. Don't cull by view direction. three.js already frustum-culls each mesh, and toggling groups with lights while turning causes flicker and recompiles.
- Objects inside a galaxy's disk go in `GalaxyDiskFrame` (`ExtragalacticScene`), which co-rotates with the spinning galaxy. Their data `position` is the world position at spin 0, and the scene converts it with `toDiskFrame`.
- Coarse copies of another scale's content (Sol anchors) go in `ScaleStandIn`, which shows them only while the detailed layer is hidden.
- **Enterable galaxies** (`lib/galaxyInteriors.ts`): `GALAXY_INTERIORS` maps each galaxy to an interior style.
  - Inside ~1.8–3 radii, `GalaxyInterior` (a procedural star field in the galaxy's disk frame) fades in, while `RealisticGalaxy` fades out its halo sprites, dims or removes the painted disk, and shrinks the bulge. The cosmic web also recedes.
  - `requestGalaxyEntry(id)` (inspector button, dock pills) flies the camera to `galaxyEntryPose` and then drops the selection, leaving free flight.
  - `insideGalaxyId` drives the HUD location chip.
  - Nested `DistanceFadeGroup`s multiply.
  - To add a galaxy: give it an interior style and a short name in `CosmicScaleDock`.
  - **Navigating inside a galaxy** mirrors the Milky Way's Solar System → Stars & Relics → Milky Way.
    - While `insideGalaxyId` is another galaxy, dock buttons 1–3 become its featured star system (`FEATURED_SYSTEMS`), its star neighbourhood (`getStarNeighbourhood`: the richest cluster of catalogued objects) and the whole galaxy. They call `requestGalaxyEntry(id, level)`.
    - `galaxyViewLevel` drives the dock highlight.
    - `GalaxyExplorerPanel` lists the galaxy's members (`getGalaxyMembers`, following `parentBodyId`), and `GalaxyPins` (in `ExtragalacticScene`) tags them on screen while nothing is selected.
    - A body belongs to a galaxy through its `parentBodyId` chain.
  - Camera flights carry a kind (`flightKindRef`). Deselecting only cancels flights to a selected body.
  - Galaxies spin **within their disk plane**: `RealisticGalaxy` nests position → inclination (`getGalaxyDiskRotation`) → spin group, and publishes the spin in `root.userData.spin`. `GalaxyDiskFrame` mirrors that nesting.
  - Entry and "stars" viewpoints use `levelViewDirection`, so a tilted disk appears level and upright on screen (the camera keeps world-up).
  - Free-flight speed and scroll step come from `navigationScale` (`lib/scaleVisibility.ts`):
    - In the Milky Way region and intergalactic space, it is the distance from the origin, so zooming converges on the Solar System.
    - Inside another galaxy, it is the distance to the nearest compact body, so you glide between its stars instead of flying through the galaxy.
  - Fields of individual stars or galaxies that the camera can fly *into* (galaxy interiors, bulges, the Giant Stellar Stream, Laniakea) use `starPointSprites` instead: the same minimum size, but sprites also stop growing at 6 px and get brighter instead, so nearby stars don't turn into large fuzzy discs.
  - Dense point fields use `softenPointSprites` (a ref on `<pointsMaterial>`), which enforces a minimum sprite size with conserved light so sub-pixel stars don't sparkle.
  - Components that place a group at `body.position` must pass inner renderers (`RealisticBlackHole`, `RealisticPulsar`…) a body with a local `[0,0,0]` position, otherwise the offset doubles. `window.__universeDebug.positionAudit()` lists objects drawn far from their catalogued position.
  - Companions (planets, binary partners) must orbit clear of their star's rendered radius (`star.size`, plus any glow or scale), or they end up buried inside it and unclickable. Register each body of a binary on its own group, so selecting it frames that body rather than the system centre. `window.__universeDebug.pick(x, y)` lists what a click at a screen point hits.
- Galaxy content added so far is documented-only (no invented objects, image URLs or planets). Outside the Milky Way, the only planet candidate modelled is PA-99-N2 b in M31.

**Camera requests and the registry**:
- Other code never moves the camera directly. It sends requests through the store: `requestScaleNavigation(level)`, `requestContinuousZoom(dir, factor)`, and `setSelectedCosmicBodyId(id)`. The manager consumes these (`{…, timestamp}` objects, so repeat requests still fire).
- Selecting a body tweens to it and then **follows** it each frame. Tracking breaks away beyond `40 × framingDistance`.
- The object info card (`CelestialInspectorTooltip`) waits for the camera: the selection tween's `onComplete` sets `arrivedCosmicBodyId`, and the card appears 0.75 s later (6 s fallback).
  - A double-click anywhere in `[data-universe-root]` calls `showCosmicCardNow()` to show it at once.
  - A pointer-down outside the card only closes it (`dismissCosmicCard`). The body stays selected and followed, and clicking it again reopens the card.
  - Re-selecting the current body is a no-op for the flight.
  - `scratch/test_card_timing.js` checks all of this.
- **Celestial registry** (`lib/celestialRegistry.ts`): clickable bodies call `registerCelestialObject(body.id, obj)` on mount and `unregisterCelestialObject(body.id)` in the effect cleanup, so the camera can read live world positions.
  - One id may have several owners across scales. The visible one wins, and cleanup only drops owners already detached from the scene.
  - Objects mounted later inside an LoD group need a callback ref to register (see `r136a1` in `ExtragalacticScene`).
  - `CELESTIAL_ANGLES` and `calculateFramingDistance` (FOV 48°) control framing.
- **A new body needs an entry in `CELESTIAL_BODIES`, a registered 3D object in its scale's scene, and ideally a framing angle.**

**Diagnostics**:
- In dev, `UniverseDebugProbe` exposes `window.__universeDebug`. It provides `snapshot()` (visible layers and bodies, in-view-but-hidden bodies, draw calls, light census, frame times), `lookAt`, `framingFor(id)` and the store.
- `node scratch/test_render_visibility.js [scales|yaw|select|flyto|dock|zoom]` audits visibility and hitches against the running dev server.
- Also against the running dev server:
  - `node scratch/test_transition_pops.js` reports abrupt appear/disappear events during scale flights.
  - `scratch/test_render_interaction.js` checks real mouse hover and click.
  - `scratch/test_andromeda_contents.js [ids]` selects and screenshots bodies.
  - `scratch/test_enter_galaxies.js` enters every galaxy through the HUD and checks the interior and location chip.
  - `scratch/test_galaxy_navigation.js` clicks through the in-galaxy dock levels, explorer panel and pins.
  - `scratch/test_select_inside_galaxy.js` selects every galaxy member and checks the camera stays inside.
  - `scratch/test_galaxy_flight.js` measures scroll and fly speeds inside galaxies.
  - `scratch/test_galaxy_view_quality.js` measures flicker and disk orientation.
  - `scratch/test_click_inside_galaxy.js` and `scratch/test_click_each_member.js [Galaxy label]` use real mouse clicks inside galaxies (empty space, and each member's body). They check nothing selects the galaxy itself or leaves it.
  - `scratch/test_world_chooser.js` tests the first-visit chooser and the remembered world.

### Data files

`data/universeData.ts` holds `CELESTIAL_BODIES` (a record keyed by snake_case id; each body has `scaleLevel`, `position`, `size`, bilingual text, and `primaryElements` linking to atomic numbers) plus `COSMIC_SCALES`. The other data files are video catalogues (`videosData.ts`, `universeVideosData.ts`), `elementImagesData.ts`, `constellationData.ts`, and `translations.ts`. Reusable realistic body renderers (black hole, galaxy, nebula, pulsar, supernova, comets/asteroids, spacecraft) live in `components/universe/<type>/` with GLSL in `shaders/*.ts`.

### URL deep linking

`components/navigation/UrlStateSynchronizer.tsx` hydrates the store from query params on mount and writes changes back (debounced). The store also reads `world`/`scale` synchronously at creation so the first frame is correct. Params: `world`, `scale`, `body` (a `CELESTIAL_BODIES` id; this also sets the scale), `element`/`z` (atomic number, symbol, or English/Arabic name), `drawer`, `mode` (`orbit`/`fly`), and `lang`. Tests rely on URLs like `/?world=universe&body=ton_618&lang=en`.

### Where bodies are and how they move (frame graph + one clock)

- **One clock.** `lib/simClock.ts` holds the simulation time.
  - `simClock.time` is simulated seconds since page load, advanced once per frame by `SimClockDriver`, the first child of the universe `Canvas`.
  - At ×1, `EARTH_YEAR_SECONDS` (180 s) is one Earth year.
  - `setSimTimeScale` pauses or speeds time; `components/universe/hud/TimeControl.tsx` is the UI and shows the simulated sky date.
  - Motion must never use `clock.getElapsedTime()`, `Date.now()` or angles accumulated per frame. Shader effects like pulses may use real time.
- **Real sky for any date** (`lib/ephemeris.ts`):
  - Planets come from JPL/Standish Keplerian elements (valid 1800–2050, still close outside it), placed in their true direction at `radius × r / a`, so orbits keep their real eccentricity and orientation. Orbit guides use `orbitPathPoints`.
  - The Moon uses the main lunar terms, so its phase is right to about half a degree.
  - Spin axes and rotation use IAU pole RA/Dec and `W = W0 + Ẇ·d`. `poleQuaternion(id)` orients each planet's tilt group: local +y is the pole, and +x is the node the prime meridian is measured from. `updatePlanetSpin` (`rendering/planetSpin.ts`) turns the surface to the true angle, so on Earth the side under the Sun matches the UTC time; it caps the visual spin when time runs fast and settles once time slows.
  - Moons with `plane: 'equator'` orbit in their planet's real equatorial plane.
  - `earthSeason` and `seasonEventDate` give the seasons and equinox/solstice dates. They are measured from the equinox of date, with precession. `scratch/check_ephemeris.js` checks all of this offline.
- **Picking a date.**
  - `TimeControl`'s date button shows the season on hover and opens a picker on click (date + UTC time, Today, this year's equinoxes and solstices).
  - `travelToDate` glides `simClock.time` there in 0.8–2.4 s, then pauses on that date.
  - While following a planet, the camera turns with its orbit around the Sun, so the lit side stays in view.
  - Spacecraft render through `LaunchGate` (`LAUNCH_UTC`), and probes fly their real `route` (launch, then the flybys) before their straight escape.
  - `scratch/test_sky_date.js` covers all of this.
- **Frame data.** `data/bodyFrames.ts` gives each moving body a parent and a placement:
  - `orbit`: radius in scene units, real period in days, a real J2000 mean longitude (so planets start where they are today) or a phase, and inclination/node.
  - `lagrange`: JWST at Sun–Earth L2.
  - `trajectory`: the Voyagers, Pioneers 10/11 and New Horizons on their real headings (each probe's RA/Dec on the sky converted to ecliptic lon/lat; distances mapped between Pluto's orbit and the Voyagers). `InterstellarTrajectories` draws their real flyby routes and heading beacons, and the card's telemetry box reads `PROBE_TELEMETRY`.
  - Bodies without an entry are fixed at their `CELESTIAL_BODIES.position`.
- **Frame maths.** `lib/frames.ts` provides the pure functions `worldPositionAt(id, t)`, `localPositionAt`, `orbitAngleAt`, `orbitPointAtAngle` (orbit guides), `heliocentricPositionOnDate` (historical positions, e.g. the Voyager flyby routes), `eclipticDirection`, and `validateFrames()` (parents, cycles, clearance from the parent's rendered size, periods growing outward; also exposed as `window.__universeDebug.validateFrames()`).
- **Axes.** Scene y is ecliptic north and the ecliptic (X, Y) maps to scene (x, −z), so orbits run counter-clockwise seen from the north.
- **Stars & Relics placement.** Positions come from `skyPosition(raDeg, decDeg, lightYears)` (`lib/skyPosition.ts`): each star's real J2000 direction in the ecliptic frame, at a distance that grows with log10(light-years). This fits Proxima (200 units) and GRO J1655−40 (~2,250) inside the scale 2 band and keeps the real distance order. Companions use `offsetFrom(...)`. Never hand-type positions for real stars.
- **Constellations** (`data/constellationData.ts`) are generated, not hand-typed. Each star is `s(id, nameEn, nameAr, ra, dec, lightYears, mag, type, colour)`, which places it with `skyPosition`, so figures look like the real sky from the Sun. Data comes from SIMBAD (RA/Dec, parallax, V, spectral type), and stick figures from Stellarium's `modern_iau` sky culture (`modern` where that is fuller). Parallaxes under 1 mas are capped at 1 mas. Stars that are also bodies (Sirius, Betelgeuse) reuse the body id and its numbers. `define()` computes the label point and radius. `scratch/test_faq_items.js` screenshots every figure from the Sun.
- **Moons.** `SolarMoon` (`SolarSystemScene.tsx`) is the one component for every Solar System moon. It is registered, clickable with a card and label, placed by its frame orbit in the planet's equatorial plane, and tidally locked. Looks come from `MOON_LOOKS`, which reuses real maps with a tint or the rock generator. To add a moon, create a `CELESTIAL_BODIES` entry (verified NASA image URL) and a `BODY_FRAMES` orbit, then render `<SolarMoon id>` inside its planet's group.
- **Screen periods.** On-screen periods keep real ratios, with an 8 s floor for very fast orbits. `isMotionScaled(id)` flags them, and the info card says "motion speeded up".
- **Renderers read positions, they don't compute them.** A group placed in world space sets `worldPositionAt(id, simClock.time, group.position)` each frame; a child inside its parent's group uses `localPositionAt`. Visibility rules (`lodPosition` in `lib/scaleVisibility.ts`) use the same frame positions.

### Realistic rendering kit

- **Real surface maps.** `public/textures/2k_*` (Solar System Scope, CC BY 4.0) are loaded through `lib/realTextures.ts`, which is synchronous and cached, so they are safe on the first render.
  - Credit: every info card shows "3D surface maps: Solar System Scope (CC BY 4.0)", and `public/textures/CREDITS.md` has the details.
  - **Don't add more downloads.** Reuse these maps tinted (every star reuses `sun` via `StarBody`; Europa reuses `moon`).
- **Shared materials.** `components/universe/rendering/celestialMaterials.ts`:
  - `createNightLitMaterial` (emissive only on the night side, e.g. Earth's city lights; call `material.userData.updateSun(camera)` each frame).
  - `createAtmosphereMaterial` (a Fresnel limb glow, brighter on the day side).
  - `createStarMaterial` + `components/universe/rendering/StarBody.tsx` (photosphere tinted by temperature with `kelvinToColor`, granulation, limb darkening, a corona sprite).
- **Custom ShaderMaterials must include the log-depth chunks** (`#include <common>`, `<logdepthbuf_pars_vertex>` / `<logdepthbuf_vertex>`, `<logdepthbuf_pars_fragment>` / `<logdepthbuf_fragment>`), because the universe canvas uses a logarithmic depth buffer.
- **Lighting.** Sunlight is a `PooledPointLight` with `decay 0`, and the global ambient light is 0.1, so planets have real day and night sides. Solar System bodies are framed from the sunward side, about 55° off the Sun line (`calculateFramingCameraPosition`); JWST is framed from its cold side.
- **Spacecraft.** `components/universe/models/spacecraftKit.ts` provides a PMREM `RoomEnvironment` reflection map, procedural insulation, solar-cell, gold-foil and sunshield textures, parabolic dishes and hexagonal mirror segments. The models are built in metres and scaled.
- **Stars and exotic objects.** `components/universe/rendering/StellarExtras.tsx` provides `SupergiantStar` (giant convection cells, Betelgeuse-type stars), `HotStar` (smooth O/B surfaces), `GlowShell` (dust envelopes and eruption shells, replacing the old wireframes), gas-stream and accretion-disk materials, and `GlowSprite`.
  - `components/universe/exoplanet/RealisticExoplanet.tsx`: `EXOPLANET_LOOKS` recolours real maps per planet, adds starlight from the host inside the shader (pooled lights fade too fast at star-system scale), and tidally locks planets.
  - Nebulae are camera-facing slice volumes (`nebula/sliceVolume.ts`) sampled in local coordinates.
  - Black holes draw a camera-facing lensed image of the disk and support an EHT-style ring (the `ehtLook` prop).
- **Galaxies.**
  - All catalogued members of the enterable galaxies are inside `GalaxyDiskFrame`, except halo objects such as Mayall II.
  - A galaxy's spin eases to zero while the camera is inside it and follows the time scale. `spunPosition` (`lib/galaxyInteriors.ts`) maps a spin-0 data position to where it is now.
  - The Milky Way scale's arms are barred, centred on Sgr A*, and static (like its stars).
- **Star systems.** Exoplanet and binary orbits use `systemOrbitAngle(id, simClock.time)` with real periods from `ORBITAL_PERIOD_DAYS` (`data/bodyFrames.ts`).
- **Rocky bodies.** `components/universe/smallbodies/rockGeometry.ts` builds noise-displaced, cratered icospheres with vertex-colour albedo and shape options (spinning-top, bilobed, stretch, a bright spot, a giant crater). It is used by the asteroids, the belt, Phobos and the comet nuclei.

### Mobile (phones and tablets)

Every panel must work at 375px portrait and ~812×375 landscape, in both languages.
- **Detecting phones:** use `useIsCompact()` / `useIsTouch()` from `lib/useMediaQuery.ts` (reactive; compact = `max-width: 767px` or `max-height: 500px`, so a phone on its side counts), never ad-hoc `innerWidth` checks. For CSS, Tailwind has `coarse:` (finger input: larger tap targets) and `can-hover:` variants.
- **Layout primitives:**
  - `main` is `h-dvh`, and modal heights use `dvh`.
  - Edge-pinned HUD adds `env(safe-area-inset-*)` (`pb-safe` etc. in `globals.css`); `viewport-fit=cover` is set in `app/layout.tsx`.
  - Inputs are forced to 16px on touch, so iOS doesn't zoom on focus.
- **Panels:**
  - Floating cards (object card, constellation card, galaxy explorer) become a `components/ui/BottomSheet` on compact screens.
  - Wide rows (scale docks, galaxy pills, tabs) keep their end buttons pinned (`shrink-0`) and scroll the middle (`min-w-0 overflow-x-auto no-scrollbar`).
  - Tool panels start collapsed on phones.
- **Stacking on the bottom edge:**
  - `CosmicScaleDock` publishes `--hud-bottom`; the speed and overlay widgets sit above it below `xl`.
  - `MobileElementStrip` publishes `--strip-h`; the subatomic `ScaleDock` sits above it.
  - The object card sheet sets `isCardSheetOpen`, and `SheetViewOffset` shifts the camera's view up so the followed object stays visible above the sheet.
- **In-scene labels:** `LayerHtml` wraps every in-scene label in `.scene-label`, which layout tests skip.
- **Touch input:**
  - One finger looks around or orbits.
  - Pinch flies along the gaze in free flight, using the wheel's step; while a body is selected, OrbitControls handles pinch zoom.
  - A custom double-tap detector shows the card (iOS doesn't fire `dblclick`).
  - The object card closes on a *tap* outside it (drags and pinches don't close it).
  - The "Following …" chip's ✕ stops following (the touch equivalent of Escape).
  - Nucleons and quarks: the first touch tap shows their info, a second tap dives.
  - Fly mode and its keyboard hints are hidden on touch devices.
- **Graphics quality:** `lib/deviceQuality.ts` picks a tier once at load (`?quality=low|high` overrides it).
  - Low tier: lower dpr, no MSAA on the universe canvas, 12 pooled lights instead of 24, and thinner dense star fields (`scaledCount`).
  - drei `PerformanceMonitor` drops dpr to 1 when frames get slow.
  - Only dpr ever changes at runtime, so nothing recompiles.
- **Tests:**
  - `node scratch/test_mobile_layout.js [filter]`: Pixel 7 and iPhone 13, portrait and landscape, EN/AR, both worlds. Checks reachability, overlaps, input sizes, the sheet leaving the object visible, and horizontal scroll, and saves screenshots to `scratch/screenshots_mobile/`.
  - `node scratch/test_mobile_touch.js`: real touch events through CDP (tap, drag, double-tap, pinch, nucleon taps).
  - The Browser pane's mobile preset screenshots can come out mis-scaled at DPR 2; trust the Playwright screenshots.

### Styling gotcha

Tailwind colour-opacity modifiers only exist on the default scale (multiples of 5, e.g. `/85`, `/90`, `/95`). An off-scale value like `bg-slate-950/92` generates no CSS, and the panel silently ends up transparent.

### Bilingual EN/AR

All user-facing text is bilingual. Data objects carry `…En`/`…Ar` field pairs, and UI strings live in `TRANSLATIONS` in `data/translations.ts`. `page.tsx` sets `document.dir` to `rtl` for Arabic, so layout uses Tailwind logical properties (`start-`/`end-`/`ps-`/`pe-`) rather than `left`/`right`. The fonts are Inter and Cairo via `next/font`.

### API routes

`app/api/nasa/exoplanets` (NASA Exoplanet Archive TAP/ADQL) and `app/api/nasa/asteroids` are server-side proxies for `CosmicDatabaseModal`. They sanitize the query string before building ADQL, so keep that sanitization when editing.
