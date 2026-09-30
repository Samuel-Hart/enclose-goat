# enclose.goat 🐐

A clone of the classic logic puzzle [enclose.horse](https://enclose.horse), except **with Goat, you can NEVER win.**

---

## 🌾 The Premise
In *enclose.horse*, your goal is to build a pen out of wooden fences to trap a horse and maximize your enclosed pasture area.

In **enclose.goat**, Barnaby the Goat has zero respect for agricultural zoning laws, wooden barriers, or Euclidean geometry. You can build any fence you like. The moment you hit **Submit**, Barnaby will:
1. Gleefully trot around the fenced-in area inspecting your craftsmanship and sniffing the pine.
2. If there's an open breach or gap in the fence, Barnaby will immediately spot it and sneak out to freedom, strictly refusing to return the way he came.
3. If you build an airtight, 100% sealed fortress with zero gaps... **goats can spawn interdimensional portals.**

---

## ⚡ The Infuriating Escape Codex (10 Tactic Catalog)
When the pen is 100% enclosed, Barnaby will randomly unleash one of ten exasperating caprine escape maneuvers:

1. **🌀 Interdimensional Caprine Wormhole (Featured)**: Barnaby stamps his hooves, summons a swirling purple cosmic vortex right on the pasture grass, winks at you, and teleports outside the fence through an exit portal.
2. **🪵 Untreated Cedar Delicacy (Wood Muncher)**: Barnaby strolls over to a high-tensile cedar fence post and devours it like a pretzel stick, creating a gaping hole.
3. **🧗 The 89-Degree Dam Climber (Extreme Parkour)**: Inspired by real Alpine goats climbing vertical hydroelectric dam walls, Barnaby vaults vertically, balances on a 1-millimeter splinter on top of the post on one hoof, does a pirouette, and hops down outside.
4. **💥 The Kinetic Horn Cannon (Headbutt Ram)**: Barnaby backs up three paces, revs his hooves in cartoon dust, and shatters an oak beam into splinters with a huge screen shake.
5. **🕳️ Subterranean Soil Squeeze (Mole Goat)**: Barnaby digs a dirt hole with flying soil, burrows underneath the fence posts, and pops up outside like a gopher.
6. **🎋 Olympic Bamboo Vault (Pole Vault)**: Barnaby pulls out a 12-foot bamboo pole, vaults high into the air in a graceful arc, and sticks a 10/10 landing outside.
7. **⚡ Atomic Resonance Phasing (Quantum Tunneling)**: Barnaby vibrates at 432 Hz with chromatic glitch artifacts and phases straight through the atomic lattice of the solid wood.
8. **🎈 Aero-Caprine Thermal Lift (Balloon Goat)**: Barnaby inhales deeply, puffs into a spherical balloon, and floats over the barbed wire on a gentle breeze.
9. **🦝 The Syndicate (Raccoon Heist)**: A raccoon accomplice in a burglar mask scurries out with a 10mm socket wrench, unbolts the fence gate, and high-fives the goat.
10. **🚪 The Obvious Hole (Gap Walk)**: When you inevitably leave a 4-foot opening on the north perimeter, Barnaby strolls through and thanks you for the door.

---

## 🎮 How to Play

### 1. Launching Locally
To play immediately, start a local web server in this directory:
```bash
python3 -m http.server 8089
```
Then open your browser to:
[http://localhost:8089](http://localhost:8089)

Or simply open `index.html` directly in any modern browser!

### 2. Controls
- **🔨 Place Fence Tool**: Click or click-and-drag across grass tiles to erect sturdy wooden fences. Fences automatically connect to adjacent posts with realistic wooden rails.
- **🪓 Erase Tool / Right-Click**: Click or right-click on fences to remove them.
- **🧹 Clear All**: Clears player-built fences.
- **🔄 Reset Goat**: Centers the goat back at the starting marker.
- **🎲 Random Map**: Generates procedural pastures with ponds, boulders, and clover patches.
- **Levels**: Try pre-built puzzle pastures including *Duck Pond Bluff*, *Granite Ridge*, and *The 95% Complete Pen*.
- **🔒 TEST ENCLOSURE (SUBMIT)**: Locks building and triggers the goat's perimeter inspection and sneak out!
- **📖 Escape Codex**: Open the modal to track which of the 10 escapes you have witnessed, read the Farmer's Journal notes, and test specific escapes in sandbox mode.
- **🔊 Sound Engine**: 100% synthesized procedural Web Audio API sounds for goat bleats, wooden thuds, portal drones, digging, and comically descending trombone farmer despair.

---

## 🛠️ Technology Stack
- **HTML5 & Vanilla CSS**: Custom modern indie farm aesthetic with glassmorphism, responsive canvas scaling, and modern typography (*Outfit* & *Space Grotesk*).
- **Canvas 2D Vector Engine**: Procedural animated cartoon goat with trotting hooves, blinking rectangular pupils, wagging tail, chewing grass blade, and particle effects.
- **Procedural Web Audio API**: Zero external audio dependencies; realistic goat formants and vibrato, wood clatter, portal frequency sweeps, and crunch effects.
- **A* & BFS Pathfinding**: Dynamic flood fill and perimeter detection ensuring the goat always finds the gap, or triggers creative physics-defying maneuvers when sealed.
