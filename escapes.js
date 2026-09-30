// escapes.js - Creative Infuriating Goat Escapes & Animation Engine for enclose.goat

const ESCAPES_CATALOG = [
  {
    id: "portal",
    title: "Interdimensional Caprine Wormhole",
    icon: "🌀",
    rarity: "Cosmic",
    farmerLog: "Farmer's Log: The fence held firm. Unfortunately, the goat opened an Einstein-Rosen bridge to the 5th dimension. My homeowner's insurance does not cover spacetime ruptures.",
    goatQuote: "Fences exist in 3D. I exist in 11D.",
    description: "Goats possess innate mastery over quantum wormholes. When enclosed, they effortlessly summon a cosmic vortex."
  },
  {
    id: "wood_muncher",
    title: "Untreated Cedar Delicacy",
    icon: "🪵",
    rarity: "Nutritious",
    farmerLog: "Farmer's Log: High-tensile cedar fencing, certified for 600 lbs of pressure. The goat ate it like a pretzel stick.",
    goatQuote: "Needs more salt, but 8/10 crunch.",
    description: "Why jump over fences when cured lumber is high in dietary fiber?"
  },
  {
    id: "extreme_parkour",
    title: "The 89-Degree Dam Climber",
    icon: "🧗",
    rarity: "Physics-Defying",
    farmerLog: "Farmer's Log: The goat vaulted vertically, balanced on a 1-millimeter splinter on top of the post on one hoof, winked at me, and hopped outside.",
    goatQuote: "Gravity is merely a polite recommendation.",
    description: "Real goats climb sheer 90-degree dam faces to lick mineral salt. A 4-foot fence is essentially flat ground."
  },
  {
    id: "headbutt_ram",
    title: "The Kinetic Horn Cannon",
    icon: "💥",
    rarity: "Aggressive",
    farmerLog: "Farmer's Log: It backed up three paces, revved its hooves in cartoon dust, and shattered my reinforced oak beam into toothpicks.",
    goatQuote: "BOOM. Out of my way, timber.",
    description: "Direct, blunt-force caprine stubbornness. Newton's third law takes a backseat."
  },
  {
    id: "mole_goat",
    title: "Subterranean Soil Squeeze",
    icon: "🕳️",
    rarity: "Stealth",
    farmerLog: "Farmer's Log: It pulled on an invisible miner's hardhat, dug a tunnel under my foundation, and surfaced next to my pickup truck.",
    goatQuote: "Secret tunnel! Secret tunnel!",
    description: "Burrows beneath the deepest fence posts and pops up outside without even smudging its white coat."
  },
  {
    id: "pole_vault",
    title: "Olympic Bamboo Vault",
    icon: "🎋",
    rarity: "Athletic",
    farmerLog: "Farmer's Log: Where does a goat obtain a 12-foot fiberglass pole? And who taught it the Petrov technical model?!",
    goatQuote: "10 / 10 from the French judge.",
    description: "Graceful, athletic, and deeply insulting to any livestock barrier."
  },
  {
    id: "quantum_tunnel",
    title: "Atomic Resonance Phasing",
    icon: "⚡",
    rarity: "Sci-Fi",
    farmerLog: "Farmer's Log: The goat vibrated at 432 Hz and phased directly through the atomic lattice of the fence. Science has forsaken me.",
    goatQuote: "Matter is 99.999% empty space.",
    description: "Phases through solid cedar like a ghost with an appetite for clover."
  },
  {
    id: "balloon_float",
    title: "Aero-Caprine Thermal Lift",
    icon: "🎈",
    rarity: "Buoyant",
    farmerLog: "Farmer's Log: It inhaled deeply, turned into a fluffy spherical balloon, and floated over the wire on a gentle easterly breeze.",
    goatQuote: "Baaa-llooon mode activated.",
    description: "Defies Archimedes and aerodynamics simultaneously to float peacefully across boundary lines."
  },
  {
    id: "the_accomplice",
    title: "The Syndicate (Raccoon Heist)",
    icon: "🦝",
    rarity: "Criminal",
    farmerLog: "Farmer's Log: A raccoon in a tiny ski mask appeared from the bushes, unscrewed the hinges with a 10mm socket wrench, and tipped its hat.",
    goatQuote: "Union break is over. Open 'er up, Rocky.",
    description: "No goat escapes alone when local woodland creatures form an organized farmyard crime syndicate."
  },
  {
    id: "gap_walk",
    title: "The Obvious Hole",
    icon: "🚪",
    rarity: "Classic",
    farmerLog: "Farmer's Log: I literally left a 4-foot opening on the perimeter. The goat just walked right out. I am an embarrassment to agriculture.",
    goatQuote: "Thanks for the door, buddy!",
    description: "The goat spots your unfinished perimeter and casually walks straight to freedom."
  }
];

// Particle and Animation System for Goat Escapes
class EscapeAnimationController {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.customEntities = []; // temporary visual entities like portals, raccoons, poles
    this.screenShake = 0;
  }

  reset() {
    this.particles = [];
    this.customEntities = [];
    this.screenShake = 0;
  }

  addParticle(p) {
    this.particles.push({
      x: p.x,
      y: p.y,
      vx: p.vx || (Math.random() - 0.5) * 4,
      vy: p.vy || (Math.random() - 0.5) * 4,
      size: p.size || 4,
      color: p.color || '#fff',
      alpha: 1,
      decay: p.decay || 0.03,
      gravity: p.gravity || 0,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2,
      shape: p.shape || 'circle'
    });
  }

  spawnPortalParticles(x, y, color = '#a855f7') {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 16 + Math.random() * 20;
      this.addParticle({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: -Math.cos(angle) * 1.5 - Math.sin(angle) * 1.5,
        vy: -Math.sin(angle) * 1.5 + Math.cos(angle) * 1.5,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.4 ? color : '#38bdf8',
        decay: 0.035,
        shape: 'spark'
      });
    }
  }

  spawnWoodSplinters(x, y) {
    const colors = ['#854d0e', '#a16207', '#ca8a04', '#eab308'];
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        decay: 0.02 + Math.random() * 0.02,
        gravity: 0.15,
        shape: 'splinter'
      });
    }
  }

  spawnDirtParticles(x, y) {
    const colors = ['#713f12', '#582f0e', '#3f2209', '#a16207'];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        decay: 0.025,
        gravity: 0.18,
        shape: 'circle'
      });
    }
  }

  update(dt) {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRot;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update custom entities
    for (let i = this.customEntities.length - 1; i >= 0; i--) {
      const ent = this.customEntities[i];
      if (ent.update) ent.update(dt);
      if (ent.dead) {
        this.customEntities.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // Render custom entities under particles
    for (const ent of this.customEntities) {
      if (ent.render) ent.render(ctx);
    }

    // Render particles
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.shape === 'splinter') {
        ctx.fillRect(-p.size, -p.size * 0.3, p.size * 2, p.size * 0.6);
      } else if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
}

window.ESCAPES_CATALOG = ESCAPES_CATALOG;
window.EscapeAnimationController = EscapeAnimationController;
