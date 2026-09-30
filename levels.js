// levels.js - Pasture Layouts and Procedural Generator for enclose.goat

const PRESET_LEVELS = [
  {
    id: "novice_pasture",
    name: "Level 1: The Novice Pasture",
    gridSize: 9,
    goatStart: { x: 4, y: 4 },
    fenceBudget: 16,
    obstacles: [
      { x: 1, y: 1, type: "bush" },
      { x: 7, y: 1, type: "flower" },
      { x: 1, y: 7, type: "flower" },
      { x: 7, y: 7, type: "bush" },
      { x: 2, y: 5, type: "rock" }
    ],
    hint: "A quiet summer afternoon. Seems easy to build a perimeter... Surely a wooden fence can stop a goat."
  },
  {
    id: "duck_pond",
    name: "Level 2: Duck Pond Bluff",
    gridSize: 9,
    goatStart: { x: 3, y: 4 },
    fenceBudget: 12,
    obstacles: [
      { x: 5, y: 3, type: "water" },
      { x: 6, y: 3, type: "water" },
      { x: 5, y: 4, type: "water" },
      { x: 6, y: 4, type: "water" },
      { x: 6, y: 5, type: "water" },
      { x: 1, y: 2, type: "rock" },
      { x: 2, y: 6, type: "flower" }
    ],
    hint: "Water acts as a natural barrier! Use the duck pond to save on your fence budget. What could go wrong?"
  },
  {
    id: "rocky_corridor",
    name: "Level 3: Granite Ridge",
    gridSize: 9,
    goatStart: { x: 4, y: 4 },
    fenceBudget: 14,
    obstacles: [
      { x: 2, y: 2, type: "rock" },
      { x: 2, y: 3, type: "rock" },
      { x: 6, y: 5, type: "rock" },
      { x: 6, y: 6, type: "rock" },
      { x: 1, y: 7, type: "water" },
      { x: 7, y: 1, type: "bush" }
    ],
    hint: "The boulders narrow the pasture. Bottle the goat up between the stones!"
  },
  {
    id: "fortress_hope",
    name: "Level 4: The 95% Complete Pen",
    gridSize: 9,
    goatStart: { x: 4, y: 4 },
    fenceBudget: 6,
    preplacedFences: [
      { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
      { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 },
      { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 },
      { x: 3, y: 6 } // leaving a gap on the south side
    ],
    obstacles: [
      { x: 4, y: 3, type: "flower" }
    ],
    hint: "Almost finished! Just seal the south gate. This time, the goat is trapped for good... right?"
  },
  {
    id: "sandbox_meadow",
    name: "Free Sandbox (11x11)",
    gridSize: 11,
    goatStart: { x: 5, y: 5 },
    fenceBudget: 99,
    obstacles: [
      { x: 2, y: 2, type: "water" },
      { x: 2, y: 3, type: "water" },
      { x: 8, y: 7, type: "water" },
      { x: 8, y: 8, type: "water" },
      { x: 3, y: 8, type: "rock" },
      { x: 7, y: 2, type: "bush" }
    ],
    hint: "A vast 11x11 pasture. Build double walls, concentric rings, moats—see how Barnaby handles it!"
  }
];

function generateRandomPasture(size = 9) {
  const mid = Math.floor(size / 2);
  const obstacles = [];

  // Add a water cluster away from center
  const wx = Math.random() > 0.5 ? 1 : size - 3;
  const wy = Math.random() > 0.5 ? 1 : size - 3;
  obstacles.push({ x: wx, y: wy, type: "water" });
  obstacles.push({ x: wx + 1, y: wy, type: "water" });
  obstacles.push({ x: wx, y: wy + 1, type: "water" });

  // Add 2-3 rocks
  for (let i = 0; i < 3; i++) {
    const rx = Math.floor(Math.random() * (size - 2)) + 1;
    const ry = Math.floor(Math.random() * (size - 2)) + 1;
    if (Math.abs(rx - mid) > 1 || Math.abs(ry - mid) > 1) {
      obstacles.push({ x: rx, y: ry, type: "rock" });
    }
  }

  // Add decorative bushes / flowers
  for (let i = 0; i < 4; i++) {
    const bx = Math.floor(Math.random() * size);
    const by = Math.floor(Math.random() * size);
    if (bx !== mid || by !== mid) {
      obstacles.push({ x: bx, y: by, type: Math.random() > 0.5 ? "flower" : "bush" });
    }
  }

  return {
    id: "random_" + Date.now(),
    name: "Procedural Pasture",
    gridSize: size,
    goatStart: { x: mid, y: mid },
    fenceBudget: 24,
    obstacles,
    hint: "A randomly generated farm field. The goat watches you with quiet amusement."
  };
}

window.PRESET_LEVELS = PRESET_LEVELS;
window.generateRandomPasture = generateRandomPasture;
