// game.js - Core Logic, Grid, Goat AI, and Rendering Engine for enclose.goat

class EncloseGoatGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Level & Grid State
    this.gridSize = 9;
    this.tileSize = 64;
    this.tiles = []; // 2D array of tile objects
    this.currentLevel = PRESET_LEVELS[0];
    this.fenceBudget = 16;
    this.fencesPlaced = 0;

    // Tools: 'fence' or 'erase'
    this.currentTool = 'fence';
    this.isMouseDown = false;
    this.hoverTile = null;

    // Goat Actor
    this.goat = {
      x: 4,
      y: 4,
      drawX: 4,
      drawY: 4,
      facing: 1, // 1: right, -1: left
      state: 'idle', // 'idle', 'inspecting', 'escaping', 'escaped'
      speech: "Go ahead. Try to fence me in.",
      speechTimer: 3.0,
      chewCycle: 0,
      trotCycle: 0,
      blinkTimer: 2.0,
      isBlinking: false,
      wanderHistory: [], // tracks visited coordinates to avoid backtracking
      // Escape animation specific params
      escapeMethod: null,
      escapeProgress: 0,
      escapeData: {}
    };

    // Farmer Rage & Stats
    this.escapesWitnessed = JSON.parse(localStorage.getItem('enclose_goat_escapes') || '[]');
    this.farmerRage = parseInt(localStorage.getItem('enclose_goat_rage') || '0', 10);
    this.forcedEscape = 'random'; // or specific id from select

    // Animation & particles
    this.animController = new EscapeAnimationController(this);
    this.lastTime = performance.now();
    this.inspectionStepsRemaining = 0;
    this.inspectionPath = [];

    this.initDOM();
    this.loadLevel(this.currentLevel);
    this.setupEvents();
    this.updateStatsUI();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  initDOM() {
    this.levelSelect = document.getElementById('level-select');
    this.submitBtn = document.getElementById('submit-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.clearBtn = document.getElementById('clear-btn');
    this.toolFenceBtn = document.getElementById('tool-fence');
    this.toolEraseBtn = document.getElementById('tool-erase');
    this.randomBtn = document.getElementById('random-btn');
    this.soundToggleBtn = document.getElementById('sound-toggle');
    this.codexBtn = document.getElementById('codex-btn');
    this.codexModal = document.getElementById('codex-modal');
    this.closeCodexBtn = document.getElementById('close-codex-btn');
    this.forceEscapeSelect = document.getElementById('force-escape-select');
    this.rageBar = document.getElementById('rage-bar');
    this.rageLabel = document.getElementById('rage-label');
    this.farmerLogBox = document.getElementById('farmer-log-content');
    this.perimeterStatusBadge = document.getElementById('perimeter-status');

    // Populate level select
    this.levelSelect.innerHTML = '';
    PRESET_LEVELS.forEach((lvl, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = lvl.name;
      this.levelSelect.appendChild(opt);
    });

    // Populate escape selector for testing
    this.forceEscapeSelect.innerHTML = '<option value="random">🎲 Random Infuriating Escape</option>';
    ESCAPES_CATALOG.forEach(esc => {
      const opt = document.createElement('option');
      opt.value = esc.id;
      opt.textContent = `${esc.icon} ${esc.title}`;
      this.forceEscapeSelect.appendChild(opt);
    });
  }

  loadLevel(level) {
    this.currentLevel = level;
    this.gridSize = level.gridSize;
    this.fenceBudget = level.fenceBudget || 99;
    this.fencesPlaced = 0;

    // Reset grid
    this.tiles = [];
    for (let y = 0; y < this.gridSize; y++) {
      const row = [];
      for (let x = 0; x < this.gridSize; x++) {
        row.push({
          type: 'grass',
          variation: (x + y * 7) % 3,
          permanent: false
        });
      }
      this.tiles.push(row);
    }

    // Place obstacles
    if (level.obstacles) {
      level.obstacles.forEach(obs => {
        if (obs.x < this.gridSize && obs.y < this.gridSize) {
          this.tiles[obs.y][obs.x].type = obs.type;
          this.tiles[obs.y][obs.x].permanent = true;
        }
      });
    }

    // Preplaced fences
    if (level.preplacedFences) {
      level.preplacedFences.forEach(f => {
        if (f.x < this.gridSize && f.y < this.gridSize) {
          this.tiles[f.y][f.x].type = 'fence';
          this.tiles[f.y][f.x].permanent = false;
          this.fencesPlaced++;
        }
      });
    }

    // Position goat
    this.resetGoat(level.goatStart.x, level.goatStart.y);
    this.animController.reset();

    // Adjust canvas resolution
    this.resizeCanvas();
    this.checkPerimeterStatus();
    this.updateStatsUI();

    const quotes = [
      "Nice pasture. Needs more chaos.",
      "Is that pine? My favorite chew toy.",
      "Build your little walls, human.",
      "I give this perimeter a 2/10."
    ];
    this.setGoatSpeech(quotes[Math.floor(Math.random() * quotes.length)], 3.5);
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    // Calculate tile size to fit comfortably in viewport
    const container = document.getElementById('canvas-container');
    const maxDimension = Math.min(container.clientWidth || 600, 680);
    this.tileSize = Math.floor(maxDimension / this.gridSize);

    const displayWidth = this.tileSize * this.gridSize;
    const displayHeight = this.tileSize * this.gridSize;

    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resetGoat(x = null, y = null) {
    const startX = x !== null ? x : (this.currentLevel.goatStart ? this.currentLevel.goatStart.x : Math.floor(this.gridSize / 2));
    const startY = y !== null ? y : (this.currentLevel.goatStart ? this.currentLevel.goatStart.y : Math.floor(this.gridSize / 2));

    this.goat.x = startX;
    this.goat.y = startY;
    this.goat.drawX = startX;
    this.goat.drawY = startY;
    this.goat.facing = 1;
    this.goat.state = 'idle';
    this.goat.wanderHistory = [`${startX},${startY}`];
    this.goat.escapeMethod = null;
    this.goat.escapeProgress = 0;
    this.goat.escapeData = {};

    this.submitBtn.disabled = false;
    this.submitBtn.classList.remove('running');
    this.submitBtn.textContent = '🔒 TEST ENCLOSURE (SUBMIT)';
  }

  setupEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    // Canvas Mouse / Touch events for fence drawing
    const getTileCoords = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const x = Math.floor((clientX - rect.left) / this.tileSize);
      const y = Math.floor((clientY - rect.top) / this.tileSize);
      return { x, y };
    };

    const handleInteract = (e) => {
      if (this.goat.state !== 'idle') return;
      const { x, y } = getTileCoords(e);
      if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return;

      const isRightClick = e.button === 2;
      const tool = isRightClick ? 'erase' : this.currentTool;

      this.interactTile(x, y, tool);
    };

    this.canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      handleInteract(e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const { x, y } = getTileCoords(e);
      if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
        this.hoverTile = { x, y };
      } else {
        this.hoverTile = null;
      }
      if (this.isMouseDown) {
        handleInteract(e);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // prevent default context menu for easy right-click erasing
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      this.isMouseDown = true;
      handleInteract(e);
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isMouseDown) handleInteract(e);
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.isMouseDown = false;
    });

    // Button interactions
    this.toolFenceBtn.addEventListener('click', () => {
      this.currentTool = 'fence';
      this.toolFenceBtn.classList.add('active');
      this.toolEraseBtn.classList.remove('active');
      window.soundEngine.playPlaceFence();
    });

    this.toolEraseBtn.addEventListener('click', () => {
      this.currentTool = 'erase';
      this.toolEraseBtn.classList.add('active');
      this.toolFenceBtn.classList.remove('active');
      window.soundEngine.playRemoveFence();
    });

    this.clearBtn.addEventListener('click', () => {
      if (this.goat.state !== 'idle') return;
      for (let y = 0; y < this.gridSize; y++) {
        for (let x = 0; x < this.gridSize; x++) {
          if (this.tiles[y][x].type === 'fence' && !this.tiles[y][x].permanent) {
            this.tiles[y][x].type = 'grass';
          }
        }
      }
      this.fencesPlaced = 0;
      window.soundEngine.playRemoveFence();
      this.checkPerimeterStatus();
      this.updateStatsUI();
      this.setGoatSpeech("Clean slate! I appreciate the open space.", 3.0);
    });

    this.resetBtn.addEventListener('click', () => {
      this.resetGoat();
      this.animController.reset();
      window.soundEngine.playBleat('normal');
      this.setGoatSpeech("Back in the hot seat. Whatcha got?", 2.5);
    });

    this.levelSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value, 10);
      this.loadLevel(PRESET_LEVELS[idx]);
    });

    this.randomBtn.addEventListener('click', () => {
      const rndLvl = generateRandomPasture(9);
      this.loadLevel(rndLvl);
      window.soundEngine.playBleat('normal');
    });

    this.submitBtn.addEventListener('click', () => {
      this.handleSubmitEnclosure();
    });

    this.soundToggleBtn.addEventListener('click', () => {
      const isMuted = window.soundEngine.toggleMute();
      this.soundToggleBtn.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
    });

    this.forceEscapeSelect.addEventListener('change', (e) => {
      this.forcedEscape = e.target.value;
    });

    // Escape Codex Modal
    this.codexBtn.addEventListener('click', () => {
      this.renderCodex();
      this.codexModal.classList.remove('hidden');
    });

    this.closeCodexBtn.addEventListener('click', () => {
      this.codexModal.classList.add('hidden');
    });

    this.codexModal.addEventListener('click', (e) => {
      if (e.target === this.codexModal) {
        this.codexModal.classList.add('hidden');
      }
    });
  }

  interactTile(x, y, tool) {
    const tile = this.tiles[y][x];
    if (tile.permanent) return; // water, rocks cannot be modified
    // Cannot build on top of goat directly
    if (Math.round(this.goat.x) === x && Math.round(this.goat.y) === y) {
      this.setGoatSpeech("Hey! Personal space, human!", 2.0);
      window.soundEngine.playBleat('smug');
      return;
    }

    if (tool === 'fence') {
      if (tile.type !== 'fence') {
        if (this.fencesPlaced >= this.fenceBudget) {
          this.setGoatSpeech("Out of fences! Budget cuts hit hard.", 2.0);
          return;
        }
        tile.type = 'fence';
        this.fencesPlaced++;
        window.soundEngine.playPlaceFence();
        this.checkPerimeterStatus();
        this.updateStatsUI();
      }
    } else if (tool === 'erase') {
      if (tile.type === 'fence') {
        tile.type = 'grass';
        this.fencesPlaced = Math.max(0, this.fencesPlaced - 1);
        window.soundEngine.playRemoveFence();
        this.checkPerimeterStatus();
        this.updateStatsUI();
      }
    }
  }

  setGoatSpeech(text, duration = 3.0) {
    this.goat.speech = text;
    this.goat.speechTimer = duration;
  }

  updateStatsUI() {
    const budgetEl = document.getElementById('fence-budget');
    if (budgetEl) {
      budgetEl.textContent = `${this.fencesPlaced} / ${this.fenceBudget}`;
    }
    const escapesCountEl = document.getElementById('escapes-count');
    if (escapesCountEl) {
      escapesCountEl.textContent = `${this.escapesWitnessed.length} / ${ESCAPES_CATALOG.length}`;
    }
    this.updateRageUI();
  }

  updateRageUI() {
    const ragePercent = Math.min(100, (this.farmerRage / 10) * 100);
    if (this.rageBar) {
      this.rageBar.style.width = `${ragePercent}%`;
    }

    let title = "Calm & In Denial";
    if (this.farmerRage >= 10) title = "Cosmic Caprine Psychosis (Max Rage)";
    else if (this.farmerRage >= 8) title = "Snapped Pitchforks & Despair";
    else if (this.farmerRage >= 6) title = "Crying into Tractor Steering Wheel";
    else if (this.farmerRage >= 4) title = "Aggressively Googling 'Llama Sales'";
    else if (this.farmerRage >= 2) title = "Mild Facial Twitch";
    else if (this.farmerRage >= 1) title = "Slightly Irritated";

    if (this.rageLabel) {
      this.rageLabel.textContent = `Farmer Rage: ${title} (${this.farmerRage} Escapes)`;
    }
  }

  // Check if there is an open path from the goat to the perimeter
  findPathToPerimeter(startX, startY) {
    const queue = [[startX, startY]];
    const visited = new Set([`${startX},${startY}`]);
    const parent = new Map();

    const isPerimeter = (x, y) => x === 0 || x === this.gridSize - 1 || y === 0 || y === this.gridSize - 1;
    let exitTile = null;

    // 4 cardinal directions
    const dirs = [
      { dx: 0, dy: -1 }, // North
      { dx: 1, dy: 0 },  // East
      { dx: 0, dy: 1 },  // South
      { dx: -1, dy: 0 }  // West
    ];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();

      if (isPerimeter(cx, cy)) {
        exitTile = [cx, cy];
        break;
      }

      for (const { dx, dy } of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        const key = `${nx},${ny}`;

        if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize && !visited.has(key)) {
          const tileType = this.tiles[ny][nx].type;
          // Walkable tiles: grass, bush, flower. Fences, water, and rocks block!
          if (tileType !== 'fence' && tileType !== 'water' && tileType !== 'rock') {
            visited.add(key);
            parent.set(key, [cx, cy]);
            queue.push([nx, ny]);
          }
        }
      }
    }

    if (!exitTile) return null;

    // Reconstruct path
    const path = [];
    let curr = exitTile;
    while (curr) {
      path.unshift(curr);
      const key = `${curr[0]},${curr[1]}`;
      curr = parent.get(key);
    }
    return path;
  }

  checkPerimeterStatus() {
    const gx = Math.round(this.goat.x);
    const gy = Math.round(this.goat.y);
    const pathToExit = this.findPathToPerimeter(gx, gy);

    if (this.perimeterStatusBadge) {
      if (pathToExit) {
        this.perimeterStatusBadge.textContent = "⚠️ Perimeter: Leaking like a sieve (Open Hole)";
        this.perimeterStatusBadge.className = "status-badge status-open";
      } else {
        this.perimeterStatusBadge.textContent = "🛡️ Perimeter: 100% Sealed (Prepare for Caprine Sorcery)";
        this.perimeterStatusBadge.className = "status-badge status-sealed";
      }
    }
    return !pathToExit; // true if completely enclosed
  }

  // Get reachable connected component inside pen
  getReachablePenTiles(startX, startY) {
    const queue = [[startX, startY]];
    const visited = new Set([`${startX},${startY}`]);
    const reachable = [];

    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      reachable.push({ x: cx, y: cy });

      for (const { dx, dy } of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        const key = `${nx},${ny}`;
        if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize && !visited.has(key)) {
          const tileType = this.tiles[ny][nx].type;
          if (tileType !== 'fence' && tileType !== 'water' && tileType !== 'rock') {
            visited.add(key);
            queue.push([nx, ny]);
          }
        }
      }
    }
    return reachable;
  }

  // User hits "SUBMIT"
  handleSubmitEnclosure() {
    if (this.goat.state !== 'idle') return;

    window.soundEngine.ensureContext();
    window.soundEngine.playBleat('normal');

    this.submitBtn.disabled = true;
    this.submitBtn.classList.add('running');
    this.submitBtn.textContent = '👀 GOAT ASSESSING PERIMETER...';

    const gx = Math.round(this.goat.x);
    const gy = Math.round(this.goat.y);
    const pathToExit = this.findPathToPerimeter(gx, gy);
    const reachableTiles = this.getReachablePenTiles(gx, gy);

    // Step 1: Run around in the fenced in area (inspection phase)
    // "When the user hits submit. Have the goat run around in the fenced in area, but then sneak out."
    this.goat.state = 'inspecting';
    this.setGoatSpeech("Hmm, let me inspect this perimeter...", 2.5);

    // Build adjacent inspection tour inside pen without backtracking
    this.inspectionPath = [];
    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
    let currentPos = { x: gx, y: gy };
    const visitedInTour = new Set([`${gx},${gy}`]);
    const maxSteps = Math.min(5, Math.max(2, reachableTiles.length));

    for (let i = 0; i < maxSteps; i++) {
      const neighbors = dirs
        .map(d => ({ x: currentPos.x + d.dx, y: currentPos.y + d.dy }))
        .filter(t => t.x >= 0 && t.x < this.gridSize && t.y >= 0 && t.y < this.gridSize)
        .filter(t => {
          const type = this.tiles[t.y][t.x].type;
          return type !== 'fence' && type !== 'water' && type !== 'rock';
        });

      // Strict anti-backtracking: prioritize unvisited adjacent tiles
      const unvisited = neighbors.filter(t => !visitedInTour.has(`${t.x},${t.y}`));
      const nextTile = unvisited.length > 0
        ? unvisited[Math.floor(Math.random() * unvisited.length)]
        : (neighbors.length > 0 ? neighbors[Math.floor(Math.random() * neighbors.length)] : null);

      if (nextTile) {
        this.inspectionPath.push(nextTile);
        visitedInTour.add(`${nextTile.x},${nextTile.y}`);
        currentPos = nextTile;
      } else {
        break;
      }
    }

    // After inspecting pen, transition to escape!
    this.startInspectionSequence();
  }

  startInspectionSequence() {
    let stepIndex = 0;

    const doNextInspectionHop = () => {
      if (stepIndex >= this.inspectionPath.length) {
        // Inspection finished! Check perimeter exit from current position
        const currentGx = Math.round(this.goat.x);
        const currentGy = Math.round(this.goat.y);
        const pathToExitNow = this.findPathToPerimeter(currentGx, currentGy);
        this.triggerGoatEscape(pathToExitNow);
        return;
      }

      const nextTile = this.inspectionPath[stepIndex];
      stepIndex++;

      // Face direction of movement
      if (nextTile.x > this.goat.x) this.goat.facing = 1;
      else if (nextTile.x < this.goat.x) this.goat.facing = -1;

      // Animate hop to next tile
      this.animateGoatMove(nextTile.x, nextTile.y, 220, () => {
        window.soundEngine.playFootstep();
        // Sniff or bleat occasionally
        if (Math.random() > 0.6) {
          const inspectComments = ["Sniffing the cedar...", "Checking structural integrity...", "Is this 100% pine?", "Cute fence attempt..."];
          this.setGoatSpeech(inspectComments[Math.floor(Math.random() * inspectComments.length)], 1.5);
        }
        setTimeout(doNextInspectionHop, 120);
      });
    };

    doNextInspectionHop();
  }

  // Smooth movement interpolation helper
  animateGoatMove(targetX, targetY, durationMs, onComplete) {
    const startX = this.goat.x;
    const startY = this.goat.y;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Smooth ease in-out
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      this.goat.x = startX + (targetX - startX) * ease;
      this.goat.y = startY + (targetY - startY) * ease;
      this.goat.drawX = this.goat.x;
      this.goat.drawY = this.goat.y;
      this.goat.trotCycle += 0.25;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        this.goat.x = targetX;
        this.goat.y = targetY;
        this.goat.drawX = targetX;
        this.goat.drawY = targetY;
        // Refusal to go back in the way it came: log visited location
        this.goat.wanderHistory.push(`${targetX},${targetY}`);
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(step);
  }

  // THE ESCAPE
  triggerGoatEscape(pathToExit) {
    this.goat.state = 'escaping';
    this.submitBtn.textContent = '🚨 ESCAPE IN PROGRESS...';

    // REQUIREMENT: "If there is a simple, obvious escape route, Use that."
    if (pathToExit && pathToExit.length > 0) {
      this.executeGapEscape(pathToExit);
      return;
    }

    // REQUIREMENT: "If no route exists. goats can spawn portals."
    // REQUIREMENT: "Make a random list of creative ways for the goat to escape that would infuriate any farmer type."
    let escapeId = this.forcedEscape;
    if (escapeId === 'random') {
      // Pick one from sealed escapes: portal, wood_muncher, extreme_parkour, headbutt_ram, mole_goat, pole_vault, quantum_tunnel, balloon_float, the_accomplice
      const sealedEscapes = ['portal', 'wood_muncher', 'extreme_parkour', 'headbutt_ram', 'mole_goat', 'pole_vault', 'quantum_tunnel', 'balloon_float', 'the_accomplice'];
      escapeId = sealedEscapes[Math.floor(Math.random() * sealedEscapes.length)];
    }

    this.goat.escapeMethod = escapeId;
    this.executeCreativeEscape(escapeId);
  }

  // 1. GAP ESCAPE (Strict anti-backtracking path to perimeter)
  executeGapEscape(pathToExit) {
    this.goat.escapeMethod = 'gap_walk';
    this.setGoatSpeech("You left a giant hole! Don't mind if I do!", 3.0);
    window.soundEngine.playBleat('triumphant');

    // Strict forward momentum: follow path without ever backtracking
    let pathIdx = 1; // start from next tile in path
    const followPath = () => {
      if (pathIdx >= pathToExit.length) {
        // Reached perimeter! Step off-screen into the sunset
        const [lastX, lastY] = pathToExit[pathToExit.length - 1];
        let offscreenX = lastX;
        let offscreenY = lastY;
        if (lastX === 0) offscreenX = -1.5;
        else if (lastX === this.gridSize - 1) offscreenX = this.gridSize + 0.5;
        else if (lastY === 0) offscreenY = -1.5;
        else if (lastY === this.gridSize - 1) offscreenY = this.gridSize + 0.5;

        this.animateGoatMove(offscreenX, offscreenY, 350, () => {
          this.completeEscape('gap_walk');
        });
        return;
      }

      const [nx, ny] = pathToExit[pathIdx];
      pathIdx++;

      if (nx > this.goat.x) this.goat.facing = 1;
      else if (nx < this.goat.x) this.goat.facing = -1;

      this.animateGoatMove(nx, ny, 160, () => {
        window.soundEngine.playFootstep();
        followPath();
      });
    };

    followPath();
  }

  // 2. CREATIVE INFURIATING ESCAPES
  executeCreativeEscape(escapeId) {
    const escMeta = ESCAPES_CATALOG.find(e => e.id === escapeId);
    if (escMeta) {
      this.setGoatSpeech(escMeta.goatQuote, 3.5);
    }

    switch (escapeId) {
      case 'portal':
        this.escapePortal();
        break;
      case 'wood_muncher':
        this.escapeWoodMuncher();
        break;
      case 'extreme_parkour':
        this.escapeExtremeParkour();
        break;
      case 'headbutt_ram':
        this.escapeHeadbuttRam();
        break;
      case 'mole_goat':
        this.escapeMoleGoat();
        break;
      case 'pole_vault':
        this.escapePoleVault();
        break;
      case 'quantum_tunnel':
        this.escapeQuantumTunnel();
        break;
      case 'balloon_float':
        this.escapeBalloonFloat();
        break;
      case 'the_accomplice':
        this.escapeTheAccomplice();
        break;
      default:
        this.escapePortal();
        break;
    }
  }

  // Find nearest fence post to goat
  findNearestFence() {
    let nearest = null;
    let minDist = Infinity;
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.tiles[y][x].type === 'fence') {
          const dist = Math.hypot(x - this.goat.x, y - this.goat.y);
          if (dist < minDist) {
            minDist = dist;
            nearest = { x, y };
          }
        }
      }
    }
    return nearest || { x: Math.min(this.gridSize - 1, Math.round(this.goat.x) + 1), y: Math.round(this.goat.y) };
  }

  // Find a clear grass landing tile outside the fence
  findOutsideLandingTile(fenceX, fenceY) {
    const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
    for (const { dx, dy } of dirs) {
      const nx = fenceX + dx;
      const ny = fenceY + dy;
      if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
        if (this.tiles[ny][nx].type !== 'fence') {
          // Check if this tile connects to perimeter!
          if (this.findPathToPerimeter(nx, ny)) {
            return { x: nx, y: ny };
          }
        }
      }
    }
    // Fallback: outside border
    return { x: fenceX > this.gridSize / 2 ? this.gridSize - 1 : 0, y: fenceY };
  }

  // --- ESCAPE 1: INTERDIMENSIONAL PORTAL (Explicit user requirement) ---
  escapePortal() {
    window.soundEngine.playPortalDrone();
    const gx = this.goat.x;
    const gy = this.goat.y;

    // Exit portal location (outside the pen near the border)
    const exitX = gx < this.gridSize / 2 ? this.gridSize - 1 : 0;
    const exitY = Math.min(this.gridSize - 1, Math.max(0, gy + (Math.random() > 0.5 ? 2 : -2)));

    this.goat.escapeData = {
      penPortal: { x: gx, y: gy, scale: 0, alpha: 0, active: true },
      exitPortal: { x: exitX, y: exitY, scale: 0, alpha: 0, active: false },
      phase: 'opening_pen_portal'
    };

    let elapsed = 0;
    const portalInterval = setInterval(() => {
      elapsed += 0.05;
      const pData = this.goat.escapeData;
      if (!pData || this.goat.state !== 'escaping') {
        clearInterval(portalInterval);
        return;
      }

      // Spawn ambient purple vortex particles
      const px = (pData.penPortal.x + 0.5) * this.tileSize;
      const py = (pData.penPortal.y + 0.5) * this.tileSize;
      this.animController.spawnPortalParticles(px, py, '#c084fc');

      if (pData.phase === 'opening_pen_portal') {
        pData.penPortal.scale = Math.min(1.2, pData.penPortal.scale + 0.08);
        pData.penPortal.alpha = Math.min(1, pData.penPortal.alpha + 0.08);

        if (pData.penPortal.scale >= 1.0 && elapsed > 0.8) {
          pData.phase = 'goat_entering';
          window.soundEngine.playBleat('smug');
        }
      } else if (pData.phase === 'goat_entering') {
        // Goat shrinks and spirals into the pen portal
        this.goat.escapeProgress = Math.min(1, this.goat.escapeProgress + 0.06);

        if (this.goat.escapeProgress >= 1) {
          pData.phase = 'opening_exit_portal';
          pData.exitPortal.active = true;
          window.soundEngine.playPortalWoosh();
        }
      } else if (pData.phase === 'opening_exit_portal') {
        pData.exitPortal.scale = Math.min(1.2, pData.exitPortal.scale + 0.09);
        pData.exitPortal.alpha = Math.min(1, pData.exitPortal.alpha + 0.09);

        const ex = (pData.exitPortal.x + 0.5) * this.tileSize;
        const ey = (pData.exitPortal.y + 0.5) * this.tileSize;
        this.animController.spawnPortalParticles(ex, ey, '#38bdf8');

        if (pData.exitPortal.scale >= 1.0) {
          pData.phase = 'goat_emerging';
          this.goat.x = pData.exitPortal.x;
          this.goat.y = pData.exitPortal.y;
          this.goat.drawX = this.goat.x;
          this.goat.drawY = this.goat.y;
          this.goat.escapeProgress = 1;
        }
      } else if (pData.phase === 'goat_emerging') {
        this.goat.escapeProgress = Math.max(0, this.goat.escapeProgress - 0.07);
        const ex = (pData.exitPortal.x + 0.5) * this.tileSize;
        const ey = (pData.exitPortal.y + 0.5) * this.tileSize;
        this.animController.spawnPortalParticles(ex, ey, '#e879f9');

        if (this.goat.escapeProgress <= 0) {
          pData.phase = 'done';
          clearInterval(portalInterval);
          window.soundEngine.playBleat('triumphant');
          this.setGoatSpeech("Spacetime coordinates verified. Smell ya later!", 3.0);
          setTimeout(() => this.completeEscape('portal'), 800);
        }
      }
    }, 40);
  }

  // --- ESCAPE 2: WOOD MUNCHER ---
  escapeWoodMuncher() {
    const fence = this.findNearestFence();
    const landing = this.findOutsideLandingTile(fence.x, fence.y);

    // Step 1: Walk to fence
    this.animateGoatMove(fence.x > this.goat.x ? fence.x - 0.7 : fence.x + 0.7, fence.y, 400, () => {
      this.goat.facing = fence.x > this.goat.x ? 1 : -1;
      this.setGoatSpeech("Mmm, untreated cedar. High fiber!", 2.5);

      let chomps = 0;
      const chompTimer = setInterval(() => {
        chomps++;
        window.soundEngine.playCrunch();
        const fx = (fence.x + 0.5) * this.tileSize;
        const fy = (fence.y + 0.5) * this.tileSize;
        this.animController.spawnWoodSplinters(fx, fy);

        if (chomps >= 6) {
          clearInterval(chompTimer);
          // Obliterate fence tile!
          this.tiles[fence.y][fence.x].type = 'grass';
          window.soundEngine.playBleat('smug');
          this.setGoatSpeech("Burp! Delicious.", 2.0);

          // Stroll through the eaten hole
          this.animateGoatMove(landing.x, landing.y, 450, () => {
            this.completeEscape('wood_muncher');
          });
        }
      }, 180);
    });
  }

  // --- ESCAPE 3: EXTREME PARKOUR (DAM CLIMBER) ---
  escapeExtremeParkour() {
    const fence = this.findNearestFence();
    const landing = this.findOutsideLandingTile(fence.x, fence.y);

    // Approach fence
    this.animateGoatMove(fence.x > this.goat.x ? fence.x - 0.4 : fence.x + 0.4, fence.y, 350, () => {
      this.setGoatSpeech("My ancestors climbed 90° concrete dams. Watch this.", 2.5);
      window.soundEngine.playBleat('smug');

      this.goat.escapeData = {
        type: 'parkour',
        fencePos: fence,
        jumpArc: 0,
        spinAngle: 0
      };

      // Jump straight up onto the fence post tip!
      let t = 0;
      const jumpInterval = setInterval(() => {
        t += 0.05;
        this.goat.escapeData.jumpArc = Math.sin(t * Math.PI) * 45; // pixel height jump
        this.goat.escapeData.spinAngle = t * Math.PI * 2;

        if (t >= 1) {
          clearInterval(jumpInterval);
          this.goat.escapeData.jumpArc = 30; // perched on top!
          window.soundEngine.playBleat('triumphant');
          this.setGoatSpeech("Balance rating: 100/100.", 2.0);

          setTimeout(() => {
            // Dismount smoothly to landing tile
            this.animateGoatMove(landing.x, landing.y, 400, () => {
              this.goat.escapeData = {};
              this.completeEscape('extreme_parkour');
            });
          }, 600);
        }
      }, 30);
    });
  }

  // --- ESCAPE 4: HEADBUTT RAM ---
  escapeHeadbuttRam() {
    const fence = this.findNearestFence();
    const landing = this.findOutsideLandingTile(fence.x, fence.y);

    // Back up 1 tile to get a running start!
    const backX = Math.max(0, Math.min(this.gridSize - 1, this.goat.x - (fence.x > this.goat.x ? 1 : -1)));
    this.animateGoatMove(backX, this.goat.y, 300, () => {
      this.goat.facing = fence.x > this.goat.x ? 1 : -1;
      this.setGoatSpeech("3... 2... 1... MAXIMUM RAMMING SPEED!", 2.0);

      // Rev up hooves in cartoon dust!
      let rev = 0;
      const revInterval = setInterval(() => {
        rev++;
        this.animController.spawnDirtParticles((this.goat.x + 0.5) * this.tileSize, (this.goat.y + 0.8) * this.tileSize);
        window.soundEngine.playFootstep();

        if (rev >= 8) {
          clearInterval(revInterval);
          // Rocket charge into fence!
          this.animateGoatMove(fence.x, fence.y, 160, () => {
            window.soundEngine.playSmash();
            this.animController.screenShake = 12;
            const fx = (fence.x + 0.5) * this.tileSize;
            const fy = (fence.y + 0.5) * this.tileSize;
            this.animController.spawnWoodSplinters(fx, fy);
            this.tiles[fence.y][fence.x].type = 'grass'; // smashed!

            this.animateGoatMove(landing.x, landing.y, 350, () => {
              this.completeEscape('headbutt_ram');
            });
          });
        }
      }, 70);
    });
  }

  // --- ESCAPE 5: MOLE GOAT ---
  escapeMoleGoat() {
    const fence = this.findNearestFence();
    const landing = this.findOutsideLandingTile(fence.x, fence.y);

    this.setGoatSpeech("Digging secret tunnel under your pathetic post...", 2.5);
    let digTicks = 0;
    const digInterval = setInterval(() => {
      digTicks++;
      window.soundEngine.playDig();
      const gx = (this.goat.x + 0.5) * this.tileSize;
      const gy = (this.goat.y + 0.8) * this.tileSize;
      this.animController.spawnDirtParticles(gx, gy);

      // Goat lowers into ground
      this.goat.escapeProgress = Math.min(1, digTicks / 8);

      if (digTicks >= 8) {
        clearInterval(digInterval);
        // Goat travels underground
        setTimeout(() => {
          this.goat.x = landing.x;
          this.goat.y = landing.y;
          this.goat.drawX = landing.x;
          this.goat.drawY = landing.y;

          // Pop out outside!
          window.soundEngine.playBleat('triumphant');
          const lx = (landing.x + 0.5) * this.tileSize;
          const ly = (landing.y + 0.8) * this.tileSize;
          this.animController.spawnDirtParticles(lx, ly);
          this.goat.escapeProgress = 0;
          this.setGoatSpeech("Peek-a-boo! Didn't expect a mole goat, did ya?", 3.0);
          setTimeout(() => this.completeEscape('mole_goat'), 700);
        }, 600);
      }
    }, 90);
  }

  // --- ESCAPE 6: POLE VAULT ---
  escapePoleVault() {
    const fence = this.findNearestFence();
    const landing = this.findOutsideLandingTile(fence.x, fence.y);

    this.setGoatSpeech("Standard Olympic technique. Watch the dismount.", 2.5);
    window.soundEngine.playBoing();

    this.goat.escapeData = {
      type: 'pole_vault',
      poleOrigin: { x: fence.x, y: fence.y },
      arcT: 0
    };

    const startX = this.goat.x;
    const startY = this.goat.y;

    let t = 0;
    const vaultInterval = setInterval(() => {
      t += 0.04;
      this.goat.escapeData.arcT = t;
      this.goat.x = startX + (landing.x - startX) * t;
      this.goat.y = startY + (landing.y - startY) * t;
      this.goat.drawX = this.goat.x;
      this.goat.drawY = this.goat.y;

      if (t >= 1) {
        clearInterval(vaultInterval);
        this.goat.escapeData = {};
        window.soundEngine.playBleat('triumphant');
        this.setGoatSpeech("Flawless stick on the landing!", 2.5);
        this.completeEscape('pole_vault');
      }
    }, 35);
  }

  // --- ESCAPE 7: QUANTUM TUNNEL ---
  escapeQuantumTunnel() {
    const fence = this.findNearestFence();
    const landing = this.findOutsideLandingTile(fence.x, fence.y);

    this.setGoatSpeech("Matter is mostly empty space. Phasing in 3, 2, 1...", 2.5);
    window.soundEngine.playGlitch();

    this.goat.escapeData = {
      type: 'quantum',
      glitchActive: true,
      glitchOffset: 0
    };

    let glitchCount = 0;
    const glitchInterval = setInterval(() => {
      glitchCount++;
      this.goat.escapeData.glitchOffset = (Math.random() - 0.5) * 16;

      if (glitchCount === 8) {
        // Phase through to landing
        this.goat.x = landing.x;
        this.goat.y = landing.y;
        this.goat.drawX = landing.x;
        this.goat.drawY = landing.y;
      }

      if (glitchCount >= 14) {
        clearInterval(glitchInterval);
        this.goat.escapeData = {};
        window.soundEngine.playBleat('triumphant');
        this.setGoatSpeech("Schrödinger's Goat has left the box.", 2.5);
        this.completeEscape('quantum_tunnel');
      }
    }, 50);
  }

  // --- ESCAPE 8: BALLOON FLOAT ---
  escapeBalloonFloat() {
    const fence = this.findNearestFence();
    const landing = this.findOutsideLandingTile(fence.x, fence.y);

    this.setGoatSpeech("Inhaling helium... Float mode active!", 2.5);
    window.soundEngine.playBleat('baby');

    this.goat.escapeData = {
      type: 'balloon',
      balloonScale: 1.0,
      floatY: 0
    };

    let t = 0;
    const startX = this.goat.x;
    const startY = this.goat.y;

    const balloonInterval = setInterval(() => {
      t += 0.03;
      this.goat.escapeData.balloonScale = 1.0 + Math.sin(Math.min(1, t * 1.5) * Math.PI) * 0.45;
      this.goat.escapeData.floatY = -Math.sin(t * Math.PI) * 35; // float above fence!

      this.goat.x = startX + (landing.x - startX) * t;
      this.goat.y = startY + (landing.y - startY) * t;
      this.goat.drawX = this.goat.x;
      this.goat.drawY = this.goat.y;

      if (t >= 1) {
        clearInterval(balloonInterval);
        this.goat.escapeData = {};
        window.soundEngine.playBleat('triumphant');
        this.setGoatSpeech("Gently grounded. Gravity is overrated.", 2.5);
        this.completeEscape('balloon_float');
      }
    }, 40);
  }

  // --- ESCAPE 9: THE ACCOMPLICE (RACCOON HEIST) ---
  escapeTheAccomplice() {
    const fence = this.findNearestFence();
    const landing = this.findOutsideLandingTile(fence.x, fence.y);

    this.setGoatSpeech("Paging my field operative...", 2.0);

    // Spawn raccoon entity outside
    const raccoon = {
      x: landing.x,
      y: landing.y,
      alpha: 0,
      hasWrench: true
    };
    this.goat.escapeData = { type: 'accomplice', raccoon };

    setTimeout(() => {
      window.soundEngine.playRemoveFence();
      this.tiles[fence.y][fence.x].type = 'grass'; // unbolted!
      this.setGoatSpeech("Thanks Rocky! 10/10 union work.", 2.5);

      this.animateGoatMove(landing.x, landing.y, 400, () => {
        window.soundEngine.playBleat('triumphant');
        setTimeout(() => {
          this.goat.escapeData = {};
          this.completeEscape('the_accomplice');
        }, 500);
      });
    }, 800);
  }

  // --- ESCAPE FINISHED: UPDATE STATS & FARMER DESPAIR ---
  completeEscape(escapeMethodId) {
    this.goat.state = 'escaped';
    window.soundEngine.playFarmerDespair();

    // Log escape in codex
    if (!this.escapesWitnessed.includes(escapeMethodId)) {
      this.escapesWitnessed.push(escapeMethodId);
      localStorage.setItem('enclose_goat_escapes', JSON.stringify(this.escapesWitnessed));
    }

    // Increment Farmer Rage
    this.farmerRage++;
    localStorage.setItem('enclose_goat_rage', this.farmerRage.toString());

    this.updateStatsUI();

    const escapeData = ESCAPES_CATALOG.find(e => e.id === escapeMethodId) || {
      title: "Unknown Caprine Glitch",
      farmerLog: "Farmer's Log: The goat escaped. I don't even know how. I am selling the farm and moving to Nebraska."
    };

    if (this.farmerLogBox) {
      this.farmerLogBox.innerHTML = `
        <div class="log-entry">
          <div class="log-badge">${escapeData.icon} ${escapeData.title}</div>
          <p class="log-quote">${escapeData.farmerLog}</p>
          <div class="log-footer">Days Since Last Goat Escape: <span class="zero-strike">0</span></div>
        </div>
      `;
    }

    this.submitBtn.disabled = false;
    this.submitBtn.classList.remove('running');
    this.submitBtn.textContent = '🔄 RESET & TRY AGAIN';
    this.submitBtn.onclick = () => {
      this.resetGoat();
      this.submitBtn.onclick = () => this.handleSubmitEnclosure();
    };
  }

  renderCodex() {
    const listEl = document.getElementById('codex-grid');
    if (!listEl) return;
    listEl.innerHTML = '';

    ESCAPES_CATALOG.forEach(esc => {
      const unlocked = this.escapesWitnessed.includes(esc.id);
      const card = document.createElement('div');
      card.className = `codex-card ${unlocked ? 'unlocked' : 'locked'}`;

      if (unlocked) {
        card.innerHTML = `
          <div class="codex-icon">${esc.icon}</div>
          <div class="codex-title">${esc.title}</div>
          <div class="codex-rarity">${esc.rarity}</div>
          <p class="codex-desc">${esc.description}</p>
          <div class="codex-quote">"${esc.goatQuote}"</div>
          <button class="test-escape-btn" data-id="${esc.id}">Test This Escape</button>
        `;
        card.querySelector('.test-escape-btn').addEventListener('click', () => {
          this.codexModal.classList.add('hidden');
          this.forcedEscape = esc.id;
          this.forceEscapeSelect.value = esc.id;
          this.resetGoat();
          this.setGoatSpeech(`Testing ${esc.title}! Hit Submit!`, 2.5);
        });
      } else {
        card.innerHTML = `
          <div class="codex-icon">❓</div>
          <div class="codex-title">Undiscovered Method</div>
          <div class="codex-rarity">Locked</div>
          <p class="codex-desc">Build new and strange fence layouts to provoke this escape tactic!</p>
        `;
      }
      listEl.appendChild(card);
    });
  }

  // Main Render Loop
  gameLoop(currentTime) {
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    // Update speech timer
    if (this.goat.speechTimer > 0) {
      this.goat.speechTimer -= dt;
      if (this.goat.speechTimer <= 0) {
        this.goat.speech = null;
      }
    }

    // Idle chew and blink animations
    this.goat.chewCycle += dt * 3.5;
    this.goat.blinkTimer -= dt;
    if (this.goat.blinkTimer <= 0) {
      this.goat.isBlinking = !this.goat.isBlinking;
      this.goat.blinkTimer = this.goat.isBlinking ? 0.15 : (2.0 + Math.random() * 3.0);
    }

    this.animController.update(dt);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    // Screen shake
    if (this.animController.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.animController.screenShake;
      const shakeY = (Math.random() - 0.5) * this.animController.screenShake;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Render Grid Tiles (Grass, Water, Rocks, Bushes, Flowers)
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        this.renderTile(x, y, this.tiles[y][x]);
      }
    }

    // 2. Render Hover Indicator
    if (this.hoverTile && this.goat.state === 'idle') {
      const { x, y } = this.hoverTile;
      this.ctx.save();
      this.ctx.fillStyle = this.currentTool === 'fence' ? 'rgba(217, 119, 6, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      this.ctx.strokeStyle = this.currentTool === 'fence' ? '#b45309' : '#dc2626';
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      this.ctx.restore();
    }

    // 3. Render Auto-Connecting Wooden Fences
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.tiles[y][x].type === 'fence') {
          this.renderFence(x, y);
        }
      }
    }

    // 4. Render Portals / Custom Escape Entities
    this.renderEscapeOverlays();

    // 5. Render The Goat
    this.renderGoat();

    // 6. Render Particles & Overlays
    this.animController.render(this.ctx);

    // 7. Render Goat Speech Bubble
    if (this.goat.speech) {
      this.renderSpeechBubble(this.goat.drawX, this.goat.drawY, this.goat.speech);
    }

    this.ctx.restore();
  }

  renderTile(x, y, tile) {
    const px = x * this.tileSize;
    const py = y * this.tileSize;
    const size = this.tileSize;

    // Grass base with subtle checkerboard alternating shades
    const isEven = (x + y) % 2 === 0;
    this.ctx.fillStyle = isEven ? '#65a30d' : '#4d7c0f';
    this.ctx.fillRect(px, py, size, size);

    // Subtle grass blade detail
    if (tile.variation === 1) {
      this.ctx.fillStyle = '#84cc16';
      this.ctx.fillRect(px + size * 0.25, py + size * 0.3, 2, 4);
      this.ctx.fillRect(px + size * 0.28, py + size * 0.28, 2, 6);
    } else if (tile.variation === 2) {
      this.ctx.fillStyle = '#3f6212';
      this.ctx.fillRect(px + size * 0.7, py + size * 0.65, 2, 5);
    }

    if (tile.type === 'water') {
      // Pond water with animated wave reflection
      this.ctx.fillStyle = '#0284c7';
      this.ctx.fillRect(px, py, size, size);
      this.ctx.fillStyle = '#38bdf8';
      const wave = Math.sin(performance.now() * 0.003 + x + y) * 2;
      this.ctx.fillRect(px + 6, py + 12 + wave, size - 12, 3);
      this.ctx.fillRect(px + 12, py + size - 16 - wave, size - 24, 2);

      // Cute Lily pad
      this.ctx.fillStyle = '#15803d';
      this.ctx.beginPath();
      this.ctx.arc(px + size * 0.6, py + size * 0.45, size * 0.16, 0.2, Math.PI * 1.8);
      this.ctx.fill();
    } else if (tile.type === 'rock') {
      // Natural mossy stone boulder
      this.ctx.fillStyle = '#64748b';
      this.ctx.beginPath();
      this.ctx.roundRect(px + 8, py + 8, size - 16, size - 16, 12);
      this.ctx.fill();
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.beginPath();
      this.ctx.roundRect(px + 10, py + 10, size - 22, (size - 22) * 0.5, 8);
      this.ctx.fill();
    } else if (tile.type === 'bush') {
      // Berry bush
      this.ctx.fillStyle = '#166534';
      this.ctx.beginPath();
      this.ctx.arc(px + size * 0.5, py + size * 0.5, size * 0.35, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#3b82f6'; // blueberries
      this.ctx.beginPath();
      this.ctx.arc(px + size * 0.4, py + size * 0.4, 3, 0, Math.PI * 2);
      this.ctx.arc(px + size * 0.62, py + size * 0.55, 3, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (tile.type === 'flower') {
      // Flower patch
      this.ctx.fillStyle = '#f43f5e';
      this.ctx.beginPath();
      this.ctx.arc(px + size * 0.5, py + size * 0.5, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#fde047';
      this.ctx.beginPath();
      this.ctx.arc(px + size * 0.5, py + size * 0.5, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  // Auto-tiling wooden fences with rails connecting in 4 directions
  renderFence(x, y) {
    const px = x * this.tileSize;
    const py = y * this.tileSize;
    const size = this.tileSize;
    const midX = px + size * 0.5;
    const midY = py + size * 0.5;

    // Check 4 orthogonal neighbors
    const north = y > 0 && this.tiles[y - 1][x].type === 'fence';
    const south = y < this.gridSize - 1 && this.tiles[y + 1][x].type === 'fence';
    const west = x > 0 && this.tiles[y][x - 1].type === 'fence';
    const east = x < this.gridSize - 1 && this.tiles[y][x + 1].type === 'fence';

    this.ctx.save();

    // 1. Draw Wooden Rails Connecting to Neighbors
    const woodRailColor = '#b45309';
    const woodShadow = '#78350f';
    const woodHighlight = '#d97706';

    const drawRail = (x1, y1, w, h) => {
      this.ctx.fillStyle = woodShadow;
      this.ctx.fillRect(x1, y1 + 1, w, h);
      this.ctx.fillStyle = woodRailColor;
      this.ctx.fillRect(x1, y1, w, h - 1);
      this.ctx.fillStyle = woodHighlight;
      this.ctx.fillRect(x1, y1, w, 1);
    };

    const railThickness = 5;

    // East rail
    if (east) {
      drawRail(midX, midY - 6, size * 0.5 + 2, railThickness);
      drawRail(midX, midY + 4, size * 0.5 + 2, railThickness);
    }
    // West rail
    if (west) {
      drawRail(px - 1, midY - 6, size * 0.5 + 2, railThickness);
      drawRail(px - 1, midY + 4, size * 0.5 + 2, railThickness);
    }
    // North rail
    if (north) {
      drawRail(midX - 7, py - 1, railThickness, size * 0.5 + 2);
      drawRail(midX + 3, py - 1, railThickness, size * 0.5 + 2);
    }
    // South rail
    if (south) {
      drawRail(midX - 7, midY, railThickness, size * 0.5 + 2);
      drawRail(midX + 3, midY, railThickness, size * 0.5 + 2);
    }

    // 2. Draw Central Fence Post
    const postWidth = 14;
    const postHeight = 22;
    const postX = midX - postWidth * 0.5;
    const postY = midY - postHeight * 0.5;

    // Post drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this.ctx.beginPath();
    this.ctx.ellipse(midX, midY + postHeight * 0.45, postWidth * 0.7, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Post body
    this.ctx.fillStyle = woodRailColor;
    this.ctx.fillRect(postX, postY, postWidth, postHeight);
    this.ctx.fillStyle = woodHighlight;
    this.ctx.fillRect(postX, postY, 2, postHeight);
    this.ctx.fillStyle = woodShadow;
    this.ctx.fillRect(postX + postWidth - 3, postY, 3, postHeight);

    // Post beveled cap
    this.ctx.fillStyle = woodHighlight;
    this.ctx.beginPath();
    this.ctx.moveTo(postX, postY);
    this.ctx.lineTo(midX, postY - 5);
    this.ctx.lineTo(postX + postWidth, postY);
    this.ctx.fill();

    this.ctx.restore();
  }

  renderEscapeOverlays() {
    const pData = this.goat.escapeData;
    if (!pData) return;

    // Portal rendering
    if (pData.penPortal && pData.penPortal.scale > 0) {
      this.drawPortalVortex(pData.penPortal.x, pData.penPortal.y, pData.penPortal.scale, '#a855f7');
    }
    if (pData.exitPortal && pData.exitPortal.scale > 0) {
      this.drawPortalVortex(pData.exitPortal.x, pData.exitPortal.y, pData.exitPortal.scale, '#06b6d4');
    }

    // Accomplice Raccoon
    if (pData.type === 'accomplice' && pData.raccoon) {
      const rx = (pData.raccoon.x + 0.5) * this.tileSize;
      const ry = (pData.raccoon.y + 0.5) * this.tileSize;
      this.drawRaccoon(rx, ry);
    }
  }

  drawPortalVortex(gridX, gridY, scale, baseColor) {
    const cx = (gridX + 0.5) * this.tileSize;
    const cy = (gridY + 0.5) * this.tileSize;
    const radius = this.tileSize * 0.45 * scale;
    const time = performance.now() * 0.005;

    this.ctx.save();
    this.ctx.translate(cx, cy);

    // Glowing cosmic aura
    const grad = this.ctx.createRadialGradient(0, 0, 2, 0, 0, radius);
    grad.addColorStop(0, '#fdf4ff');
    grad.addColorStop(0.4, baseColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, radius, radius * 0.65, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Rotating spiral arms
    this.ctx.rotate(time);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.6, i * 2.09, i * 2.09 + 1.2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawRaccoon(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);

    // Gray raccoon body
    this.ctx.fillStyle = '#64748b';
    this.ctx.beginPath();
    this.ctx.arc(0, 4, 12, 0, Math.PI * 2);
    this.ctx.fill();

    // Bandit eye mask
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.ellipse(0, -2, 10, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Raccoon eyes
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-5, -3, 2, 2);
    this.ctx.fillRect(3, -3, 2, 2);

    // 10mm Wrench in paw
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillRect(8, -6, 12, 3);
    this.ctx.fillRect(18, -9, 4, 8);

    this.ctx.restore();
  }

  // Render Barnaby the Goat with complete procedural vector animation
  renderGoat() {
    let gx = (this.goat.drawX + 0.5) * this.tileSize;
    let gy = (this.goat.drawY + 0.5) * this.tileSize;

    // Handle escape visual transforms
    const eData = this.goat.escapeData;
    let scaleX = this.goat.facing;
    let scaleY = 1.0;
    let rotation = 0;

    if (this.goat.escapeMethod === 'portal') {
      if (this.goat.escapeProgress > 0) {
        const pScale = 1 - this.goat.escapeProgress;
        scaleX *= pScale;
        scaleY *= pScale;
        rotation = this.goat.escapeProgress * Math.PI * 4;
      }
    } else if (eData.type === 'parkour') {
      gy -= (eData.jumpArc || 0);
      rotation = (eData.spinAngle || 0);
    } else if (eData.type === 'pole_vault') {
      const arc = Math.sin((eData.arcT || 0) * Math.PI);
      gy -= arc * 60; // 60px high pole vault jump
      rotation = (eData.arcT || 0) * Math.PI * 2;
    } else if (eData.type === 'balloon') {
      gy += (eData.floatY || 0);
      scaleX *= (eData.balloonScale || 1);
      scaleY *= (eData.balloonScale || 1);
    } else if (eData.type === 'quantum') {
      gx += (eData.glitchOffset || 0);
    } else if (this.goat.escapeProgress > 0 && this.goat.escapeMethod === 'mole_goat') {
      gy += this.goat.escapeProgress * 25; // burrow down into dirt!
    }

    this.ctx.save();
    this.ctx.translate(gx, gy);
    this.ctx.rotate(rotation);
    this.ctx.scale(scaleX, scaleY);

    // Drop shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 14, 16, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 4 Trot Hooves
    const trot = Math.sin(this.goat.trotCycle) * 4;
    this.ctx.fillStyle = '#334155';
    // Back hooves
    this.ctx.fillRect(-10, 8 + trot, 4, 7);
    this.ctx.fillRect(6, 8 - trot, 4, 7);
    // Front hooves
    this.ctx.fillRect(-6, 9 - trot, 4, 7);
    this.ctx.fillRect(10, 9 + trot, 4, 7);

    // Fluffy White Body
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 3, 16, 11, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Goat Tail (wags!)
    const tailWag = Math.sin(performance.now() * 0.008) * 3;
    this.ctx.fillStyle = '#f1f5f9';
    this.ctx.beginPath();
    this.ctx.ellipse(-16, -1 + tailWag, 4, 3, -0.3, 0, Math.PI * 2);
    this.ctx.fill();

    // Goat Head
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.ellipse(12, -4, 10, 8, 0.2, 0, Math.PI * 2);
    this.ctx.fill();

    // Floppy Ear
    const earBounce = Math.sin(this.goat.trotCycle * 2) * 2;
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.beginPath();
    this.ctx.ellipse(6, -8 + earBounce, 7, 3, -0.6, 0, Math.PI * 2);
    this.ctx.fill();

    // Golden Horns!
    this.ctx.strokeStyle = '#d97706';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(10, -11);
    this.ctx.quadraticCurveTo(8, -20, 2, -18);
    this.ctx.stroke();

    // Goat Eye with classic horizontal rectangular pupil!
    this.ctx.fillStyle = '#fef08a'; // yellow goat iris
    this.ctx.beginPath();
    this.ctx.arc(14, -5, 3.5, 0, Math.PI * 2);
    this.ctx.fill();

    if (this.goat.isBlinking) {
      this.ctx.strokeStyle = '#475569';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(11, -5);
      this.ctx.lineTo(17, -5);
      this.ctx.stroke();
    } else {
      // Horizontal bar pupil
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(12, -6, 4, 2);
    }

    // Goatee Beard
    this.ctx.fillStyle = '#f1f5f9';
    this.ctx.beginPath();
    this.ctx.moveTo(17, 1);
    this.ctx.lineTo(21, 6);
    this.ctx.lineTo(15, 4);
    this.ctx.fill();

    // Blade of Grass Chewing
    const chewSway = Math.sin(this.goat.chewCycle) * 3;
    this.ctx.strokeStyle = '#22c55e';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(18, 0);
    this.ctx.lineTo(26, -3 + chewSway);
    this.ctx.stroke();

    this.ctx.restore();
  }

  renderSpeechBubble(gridX, gridY, text) {
    const gx = (gridX + 0.5) * this.tileSize;
    const gy = (gridY + 0.5) * this.tileSize;

    this.ctx.save();
    this.ctx.font = 'bold 12px "Outfit", system-ui, sans-serif';
    const textMetrics = this.ctx.measureText(text);
    const textWidth = textMetrics.width;
    const padding = 8;
    const boxW = textWidth + padding * 2;
    const boxH = 26;
    const boxX = gx - boxW * 0.5;
    const boxY = gy - 45;

    // Bubble Background (Glassmorphism white)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    this.ctx.fill();

    // Pointer tail
    this.ctx.beginPath();
    this.ctx.moveTo(gx - 4, boxY + boxH);
    this.ctx.lineTo(gx, boxY + boxH + 6);
    this.ctx.lineTo(gx + 4, boxY + boxH);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Text
    this.ctx.fillStyle = '#0f172a';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, gx, boxY + boxH * 0.5);

    this.ctx.restore();
  }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
  window.game = new EncloseGoatGame();
});
