// ============================================
// PIXEL SURVIVORS - Vampire Survivors Clone
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Disable smoothing for pixel art
ctx.imageSmoothingEnabled = false;

// ============================================
// SOUND SYSTEM (Web Audio API - No files needed)
// ============================================
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3;
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  play(type) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(this.volume, now);

      switch(type) {
        case 'shoot':
          osc.type = 'square';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case 'hit':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        case 'kill':
          osc.type = 'square';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        case 'xp':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.setValueAtTime(1100, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case 'levelup':
          osc.type = 'square';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(550, now + 0.1);
          osc.frequency.setValueAtTime(660, now + 0.2);
          osc.frequency.setValueAtTime(880, now + 0.3);
          gain.gain.setValueAtTime(this.volume * 0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        case 'hurt':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        case 'coin':
          osc.type = 'square';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.setValueAtTime(1500, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case 'gameover':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
          osc.start(now);
          osc.stop(now + 1);
          break;
      }
    } catch(e) {}
  }
}

const sound = new SoundManager();

// ============================================
// PIXEL SPRITE GENERATOR
// ============================================
class PixelSprite {
  static cache = {};

  static create(pattern, colors, scale = 1) {
    const key = pattern.join('') + colors.join('') + scale;
    if (this.cache[key]) return this.cache[key];

    const rows = pattern.length;
    const cols = pattern[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = cols * scale;
    canvas.height = rows * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const char = pattern[y][x];
        if (char !== ' ' && char !== '.') {
          const colorIndex = parseInt(char) || 0;
          ctx.fillStyle = colors[colorIndex] || colors[0];
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    this.cache[key] = canvas;
    return canvas;
  }
}

// ============================================
// SPRITE DEFINITIONS
// ============================================
const SPRITES = {
  player: {
    idle: [
      '..0000..',
      '.011110.',
      '01211210',
      '01111110',
      '.011110.',
      '..0220..',
      '.022220.',
      '.02..20.',
    ],
    walk1: [
      '..0000..',
      '.011110.',
      '01211210',
      '01111110',
      '.011110.',
      '..0220..',
      '.02.220.',
      '.02...0.',
    ],
    walk2: [
      '..0000..',
      '.011110.',
      '01211210',
      '01111110',
      '.011110.',
      '..0220..',
      '.022.20.',
      '.0...20.',
    ],
    colors: ['#2c3e50', '#3498db', '#fff', '#1a252f']
  },
  zombie: {
    pattern: [
      '.00000.',
      '0111110',
      '0121210',
      '0111110',
      '.01110.',
      '.02220.',
      '.02.20.',
    ],
    colors: ['#1e3d1e', '#2ecc71', '#c0392b']
  },
  bat: {
    pattern: [
      '0.....0',
      '00...00',
      '0001000',
      '0011100',
      '.01110.',
      '..010..',
    ],
    colors: ['#8e44ad', '#9b59b6', '#e74c3c']
  },
  skeleton: {
    pattern: [
      '.00000.',
      '0111110',
      '0102010',
      '0111110',
      '.01110.',
      '.02220.',
      '.0...0.',
    ],
    colors: ['#7f8c8d', '#ecf0f1', '#2c3e50']
  },
  demon: {
    pattern: [
      '0.....0',
      '00...00',
      '0011100',
      '0121210',
      '0111110',
      '.02220.',
      '.0...0.',
    ],
    colors: ['#c0392b', '#e74c3c', '#f1c40f']
  },
  ghost: {
    pattern: [
      '..000..',
      '.01110.',
      '0121210',
      '0111110',
      '0111110',
      '0.0.0.0',
    ],
    colors: ['#5dade2', '#aed6f1', '#1a5276']
  },
  boss: {
    pattern: [
      '..0000..',
      '.011110.',
      '01122110',
      '01111110',
      '00111100',
      '02222220',
      '02022020',
      '00.00.00',
    ],
    colors: ['#7d3c98', '#9b59b6', '#e74c3c']
  },
  xpGem: {
    pattern: [
      '.00.',
      '0110',
      '0110',
      '.00.',
    ],
    colors: ['#2980b9', '#3498db']
  },
  coin: {
    pattern: [
      '.00.',
      '0110',
      '0110',
      '.00.',
    ],
    colors: ['#d68910', '#f1c40f']
  }
};

// ============================================
// GAME STATE
// ============================================
let gameRunning = false;
let gamePaused = false;
let gameTime = 0;
let lastTime = 0;
let deltaTime = 0;

// Camera
const camera = { x: 0, y: 0 };

// Player
const player = {
  x: 0, y: 0,
  vx: 0, vy: 0,
  width: 32, height: 32,
  speed: 120,
  maxHealth: 100,
  health: 100,
  xp: 0,
  xpToLevel: 50,
  level: 1,
  invincible: false,
  invincibleTimer: 0,
  animFrame: 0,
  animTimer: 0,
  facingRight: true,
  weapons: [],
  // Stats
  damage: 10,
  armor: 0,
  regen: 0,
  regenTimer: 0,
  pickupRange: 60,
  luck: 1,
  cooldownReduction: 1
};

// Game arrays
let enemies = [];
let projectiles = [];
let particles = [];
let xpGems = [];
let coins = [];
let damageTexts = [];

// Stats
let kills = 0;
let gold = 0;
let bestTime = parseInt(localStorage.getItem('pixelSurvivorsBest') || '0');
let totalKills = parseInt(localStorage.getItem('pixelSurvivorsKills') || '0');

// Input
const keys = {};

// ============================================
// WEAPON DEFINITIONS
// ============================================
const WEAPONS = {
  knife: {
    name: 'Throwing Knife',
    icon: '🗡️',
    damage: 10,
    cooldown: 1,
    projectiles: 1,
    speed: 300,
    pierce: 0,
    color: '#bdc3c7'
  },
  fireball: {
    name: 'Fireball',
    icon: '🔥',
    damage: 20,
    cooldown: 1.5,
    projectiles: 1,
    speed: 200,
    pierce: 0,
    color: '#e74c3c',
    size: 12
  },
  orb: {
    name: 'Magic Orb',
    icon: '🔮',
    damage: 8,
    cooldown: 0,
    orbCount: 2,
    orbSpeed: 2,
    orbRadius: 70,
    color: '#9b59b6'
  },
  lightning: {
    name: 'Lightning',
    icon: '⚡',
    damage: 15,
    cooldown: 2,
    chains: 3,
    color: '#f1c40f'
  },
  aura: {
    name: 'Holy Aura',
    icon: '✨',
    damage: 5,
    radius: 80,
    color: '#f39c12'
  },
  garlic: {
    name: 'Garlic',
    icon: '🧄',
    damage: 3,
    radius: 60,
    knockback: 50,
    color: '#ecf0f1'
  }
};

// ============================================
// UPGRADE DEFINITIONS
// ============================================
const UPGRADES = [
  { id: 'knife', type: 'weapon', name: 'Throwing Knife', desc: 'Throws knives at enemies', icon: '🗡️', rarity: 'common' },
  { id: 'fireball', type: 'weapon', name: 'Fireball', desc: 'Launches fireballs', icon: '🔥', rarity: 'uncommon' },
  { id: 'orb', type: 'weapon', name: 'Magic Orb', desc: 'Orbiting projectiles', icon: '🔮', rarity: 'rare' },
  { id: 'lightning', type: 'weapon', name: 'Lightning', desc: 'Chain lightning attack', icon: '⚡', rarity: 'epic' },
  { id: 'aura', type: 'weapon', name: 'Holy Aura', desc: 'Damages nearby enemies', icon: '✨', rarity: 'rare' },
  { id: 'garlic', type: 'weapon', name: 'Garlic', desc: 'Repels and damages enemies', icon: '🧄', rarity: 'common' },
  { id: 'maxhp', type: 'stat', name: 'Max Health', desc: '+20 Max HP', icon: '❤️', rarity: 'common', apply: () => { player.maxHealth += 20; player.health += 20; }},
  { id: 'armor', type: 'stat', name: 'Armor', desc: '+3 Armor', icon: '🛡️', rarity: 'common', apply: () => player.armor += 3 },
  { id: 'speed', type: 'stat', name: 'Speed', desc: '+15% Move Speed', icon: '👟', rarity: 'common', apply: () => player.speed *= 1.15 },
  { id: 'damage', type: 'stat', name: 'Might', desc: '+15% Damage', icon: '💪', rarity: 'uncommon', apply: () => player.damage *= 1.15 },
  { id: 'regen', type: 'stat', name: 'Recovery', desc: '+1 HP/sec', icon: '💚', rarity: 'uncommon', apply: () => player.regen += 1 },
  { id: 'pickup', type: 'stat', name: 'Magnet', desc: '+30% Pickup Range', icon: '🧲', rarity: 'common', apply: () => player.pickupRange *= 1.3 },
  { id: 'cooldown', type: 'stat', name: 'Cooldown', desc: '-10% Cooldowns', icon: '⏱️', rarity: 'rare', apply: () => player.cooldownReduction *= 0.9 },
  { id: 'luck', type: 'stat', name: 'Luck', desc: '+20% Luck', icon: '🍀', rarity: 'uncommon', apply: () => player.luck *= 1.2 },
];

// ============================================
// ENEMY DEFINITIONS
// ============================================
const ENEMY_TYPES = [
  { id: 'zombie', sprite: SPRITES.zombie, width: 28, height: 28, speed: 40, health: 20, damage: 10, xp: 5 },
  { id: 'bat', sprite: SPRITES.bat, width: 28, height: 24, speed: 80, health: 10, damage: 5, xp: 3 },
  { id: 'skeleton', sprite: SPRITES.skeleton, width: 28, height: 28, speed: 50, health: 30, damage: 12, xp: 8 },
  { id: 'ghost', sprite: SPRITES.ghost, width: 28, height: 24, speed: 60, health: 15, damage: 8, xp: 6 },
  { id: 'demon', sprite: SPRITES.demon, width: 28, height: 28, speed: 35, health: 60, damage: 20, xp: 15 },
  { id: 'boss', sprite: SPRITES.boss, width: 48, height: 48, speed: 25, health: 300, damage: 30, xp: 100, isBoss: true },
];

// ============================================
// CANVAS SETUP
// ============================================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ============================================
// INPUT
// ============================================
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Touch controls
let touchDir = { x: 0, y: 0 };
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const touch = e.touches[0];
  touchDir.startX = touch.clientX;
  touchDir.startY = touch.clientY;
});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const touch = e.touches[0];
  touchDir.x = (touch.clientX - touchDir.startX) / 50;
  touchDir.y = (touch.clientY - touchDir.startY) / 50;
  touchDir.x = Math.max(-1, Math.min(1, touchDir.x));
  touchDir.y = Math.max(-1, Math.min(1, touchDir.y));
});
canvas.addEventListener('touchend', () => {
  touchDir.x = 0;
  touchDir.y = 0;
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angle(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ============================================
// SPAWN FUNCTIONS
// ============================================
function spawnEnemy() {
  const difficulty = 1 + gameTime / 60;
  
  // Choose enemy type based on time
  let typeIndex = 0;
  const rand = Math.random();
  if (gameTime > 300 && rand < 0.03) typeIndex = 5; // Boss
  else if (gameTime > 180 && rand < 0.15) typeIndex = 4; // Demon
  else if (gameTime > 120 && rand < 0.25) typeIndex = 2; // Skeleton
  else if (gameTime > 60 && rand < 0.35) typeIndex = 3; // Ghost
  else if (rand < 0.4) typeIndex = 1; // Bat
  
  const type = ENEMY_TYPES[typeIndex];
  
  // Spawn outside screen
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 100;
  
  switch(side) {
    case 0: x = player.x + randomInRange(-canvas.width/2, canvas.width/2); y = player.y - canvas.height/2 - margin; break;
    case 1: x = player.x + randomInRange(-canvas.width/2, canvas.width/2); y = player.y + canvas.height/2 + margin; break;
    case 2: x = player.x - canvas.width/2 - margin; y = player.y + randomInRange(-canvas.height/2, canvas.height/2); break;
    case 3: x = player.x + canvas.width/2 + margin; y = player.y + randomInRange(-canvas.height/2, canvas.height/2); break;
  }
  
  enemies.push({
    x, y,
    width: type.width,
    height: type.height,
    speed: type.speed * (1 + difficulty * 0.05),
    health: type.health * difficulty,
    maxHealth: type.health * difficulty,
    damage: type.damage * (1 + difficulty * 0.03),
    xp: Math.floor(type.xp * difficulty),
    sprite: type.sprite,
    isBoss: type.isBoss || false,
    hitTimer: 0,
    facingRight: true
  });
}

function spawnXP(x, y, amount) {
  const count = Math.min(Math.ceil(amount / 5), 10);
  for (let i = 0; i < count; i++) {
    xpGems.push({
      x: x + randomInRange(-20, 20),
      y: y + randomInRange(-20, 20),
      amount: Math.ceil(amount / count),
      width: 16,
      height: 16
    });
  }
}

function spawnCoin(x, y) {
  if (Math.random() < 0.2 * player.luck) {
    coins.push({
      x: x + randomInRange(-10, 10),
      y: y + randomInRange(-10, 10),
      amount: Math.floor(randomInRange(1, 5) * player.luck),
      width: 16,
      height: 16
    });
  }
}

function spawnParticle(x, y, color, count = 5) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: randomInRange(-100, 100),
      vy: randomInRange(-100, 100),
      size: randomInRange(2, 6),
      color,
      life: 1
    });
  }
}

function showDamage(x, y, amount, isCrit = false) {
  damageTexts.push({
    x: x + randomInRange(-10, 10),
    y,
    amount: Math.round(amount),
    life: 1,
    vy: -80,
    isCrit
  });
}

// ============================================
// WEAPON SYSTEMS
// ============================================
const weaponTimers = {};

function initWeapon(id) {
  if (!player.weapons.find(w => w.id === id)) {
    const def = WEAPONS[id];
    player.weapons.push({
      id,
      level: 1,
      ...def
    });
    weaponTimers[id] = 0;
    updateWeaponsUI();
  } else {
    // Level up existing weapon
    const weapon = player.weapons.find(w => w.id === id);
    weapon.level++;
    weapon.damage *= 1.2;
    if (weapon.cooldown) weapon.cooldown *= 0.9;
    if (weapon.projectiles) weapon.projectiles++;
    if (weapon.orbCount) weapon.orbCount++;
    if (weapon.chains) weapon.chains++;
    if (weapon.radius) weapon.radius *= 1.15;
  }
}

function updateWeapons(dt) {
  player.weapons.forEach(weapon => {
    weaponTimers[weapon.id] = (weaponTimers[weapon.id] || 0) - dt;
    
    if (weapon.id === 'knife' && weaponTimers[weapon.id] <= 0) {
      fireKnife(weapon);
      weaponTimers[weapon.id] = weapon.cooldown * player.cooldownReduction;
    }
    
    if (weapon.id === 'fireball' && weaponTimers[weapon.id] <= 0) {
      fireFireball(weapon);
      weaponTimers[weapon.id] = weapon.cooldown * player.cooldownReduction;
    }
    
    if (weapon.id === 'lightning' && weaponTimers[weapon.id] <= 0) {
      fireLightning(weapon);
      weaponTimers[weapon.id] = weapon.cooldown * player.cooldownReduction;
    }
    
    if (weapon.id === 'orb') {
      updateOrbs(weapon, dt);
    }
    
    if (weapon.id === 'aura') {
      updateAura(weapon, dt);
    }
    
    if (weapon.id === 'garlic') {
      updateGarlic(weapon, dt);
    }
  });
}

function findNearestEnemy() {
  let nearest = null;
  let nearestDist = Infinity;
  enemies.forEach(e => {
    const d = dist(player, e);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = e;
    }
  });
  return nearest;
}

function fireKnife(weapon) {
  const target = findNearestEnemy();
  if (!target) return;
  
  sound.play('shoot');
  const baseAngle = angle(player, target);
  const spread = 0.2;
  
  for (let i = 0; i < weapon.projectiles; i++) {
    const a = baseAngle + (i - (weapon.projectiles - 1) / 2) * spread;
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(a) * weapon.speed,
      vy: Math.sin(a) * weapon.speed,
      damage: weapon.damage * player.damage / 10,
      size: 8,
      color: weapon.color,
      pierce: weapon.pierce + weapon.level - 1,
      life: 3
    });
  }
}

function fireFireball(weapon) {
  const target = findNearestEnemy();
  if (!target) return;
  
  sound.play('shoot');
  const a = angle(player, target);
  
  for (let i = 0; i < weapon.projectiles; i++) {
    const offset = (i - (weapon.projectiles - 1) / 2) * 0.3;
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(a + offset) * weapon.speed,
      vy: Math.sin(a + offset) * weapon.speed,
      damage: weapon.damage * player.damage / 10,
      size: weapon.size + weapon.level * 2,
      color: weapon.color,
      pierce: weapon.level - 1,
      life: 4,
      isFireball: true
    });
  }
}

function fireLightning(weapon) {
  if (enemies.length === 0) return;
  
  sound.play('shoot');
  const sorted = [...enemies].sort((a, b) => dist(player, a) - dist(player, b));
  const targets = sorted.slice(0, weapon.chains + weapon.level);
  
  targets.forEach(enemy => {
    damageEnemy(enemy, weapon.damage * player.damage / 10);
    spawnParticle(enemy.x, enemy.y, weapon.color, 8);
  });
}

function updateOrbs(weapon, dt) {
  const count = weapon.orbCount + weapon.level - 1;
  const radius = weapon.orbRadius + weapon.level * 10;
  
  for (let i = 0; i < count; i++) {
    const a = gameTime * weapon.orbSpeed + (i * Math.PI * 2 / count);
    const ox = player.x + Math.cos(a) * radius;
    const oy = player.y + Math.sin(a) * radius;
    
    enemies.forEach(enemy => {
      if (dist({ x: ox, y: oy }, enemy) < enemy.width / 2 + 15) {
        if (!enemy.orbHitTimer || enemy.orbHitTimer <= 0) {
          damageEnemy(enemy, weapon.damage * player.damage / 10);
          enemy.orbHitTimer = 0.3;
        }
      }
    });
  }
  
  enemies.forEach(e => {
    if (e.orbHitTimer > 0) e.orbHitTimer -= dt;
  });
}

function updateAura(weapon, dt) {
  const radius = weapon.radius + player.weapons.find(w => w.id === 'aura').level * 15;
  const damage = weapon.damage * player.damage / 10 * dt;
  
  enemies.forEach(enemy => {
    if (dist(player, enemy) < radius + enemy.width / 2) {
      enemy.health -= damage;
      if (Math.random() < 0.05) spawnParticle(enemy.x, enemy.y, weapon.color, 2);
    }
  });
}

function updateGarlic(weapon, dt) {
  const radius = weapon.radius + player.weapons.find(w => w.id === 'garlic').level * 10;
  const damage = weapon.damage * player.damage / 10 * dt;
  
  enemies.forEach(enemy => {
    const d = dist(player, enemy);
    if (d < radius + enemy.width / 2) {
      enemy.health -= damage;
      // Knockback
      const a = angle(player, enemy);
      enemy.x += Math.cos(a) * weapon.knockback * dt;
      enemy.y += Math.sin(a) * weapon.knockback * dt;
    }
  });
}

// ============================================
// DAMAGE SYSTEM
// ============================================
function damageEnemy(enemy, damage) {
  const isCrit = Math.random() < 0.1 * player.luck;
  const finalDamage = isCrit ? damage * 2 : damage;
  
  enemy.health -= finalDamage;
  enemy.hitTimer = 0.1;
  
  showDamage(enemy.x, enemy.y - enemy.height / 2, finalDamage, isCrit);
  spawnParticle(enemy.x, enemy.y, '#fff', 3);
  sound.play('hit');
}

function damagePlayer(damage) {
  if (player.invincible) return;
  
  const finalDamage = Math.max(1, damage - player.armor);
  player.health -= finalDamage;
  player.invincible = true;
  player.invincibleTimer = 1;
  
  sound.play('hurt');
  spawnParticle(player.x, player.y, '#e74c3c', 10);
  document.getElementById('game-container').classList.add('shake');
  setTimeout(() => document.getElementById('game-container').classList.remove('shake'), 300);
  
  if (player.health <= 0) {
    gameOver();
  }
}

// ============================================
// UPDATE FUNCTIONS
// ============================================
function updatePlayer(dt) {
  // Input
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy = -1;
  if (keys['s'] || keys['arrowdown']) dy = 1;
  if (keys['a'] || keys['arrowleft']) dx = -1;
  if (keys['d'] || keys['arrowright']) dx = 1;
  
  // Touch input
  if (Math.abs(touchDir.x) > 0.1 || Math.abs(touchDir.y) > 0.1) {
    dx = touchDir.x;
    dy = touchDir.y;
  }
  
  // Normalize and apply
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    player.x += (dx / len) * player.speed * dt;
    player.y += (dy / len) * player.speed * dt;
    player.facingRight = dx > 0;
    
    // Animation
    player.animTimer += dt;
    if (player.animTimer > 0.15) {
      player.animTimer = 0;
      player.animFrame = (player.animFrame + 1) % 2;
    }
  } else {
    player.animFrame = 0;
  }
  
  // Invincibility
  if (player.invincible) {
    player.invincibleTimer -= dt;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }
  
  // Regeneration
  if (player.regen > 0) {
    player.regenTimer += dt;
    if (player.regenTimer >= 1) {
      player.regenTimer = 0;
      player.health = Math.min(player.health + player.regen, player.maxHealth);
    }
  }
  
  // Update camera
  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;
}

function updateEnemies(dt) {
  enemies.forEach(enemy => {
    // Move towards player
    const a = angle(enemy, player);
    enemy.x += Math.cos(a) * enemy.speed * dt;
    enemy.y += Math.sin(a) * enemy.speed * dt;
    enemy.facingRight = player.x > enemy.x;
    
    // Hit timer
    if (enemy.hitTimer > 0) enemy.hitTimer -= dt;
    
    // Collision with player
    const d = dist(enemy, player);
    if (d < (enemy.width + player.width) / 2) {
      damagePlayer(enemy.damage);
    }
  });
  
  // Remove dead enemies
  enemies = enemies.filter(enemy => {
    if (enemy.health <= 0) {
      kills++;
      totalKills++;
      spawnXP(enemy.x, enemy.y, enemy.xp);
      spawnCoin(enemy.x, enemy.y);
      spawnParticle(enemy.x, enemy.y, '#e74c3c', 15);
      sound.play('kill');
      return false;
    }
    return true;
  });
  
  // Remove enemies too far away
  enemies = enemies.filter(e => dist(e, player) < 1500);
}

function updateProjectiles(dt) {
  projectiles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    
    // Collision with enemies
    enemies.forEach(enemy => {
      if (dist(p, enemy) < (p.size + enemy.width) / 2) {
        damageEnemy(enemy, p.damage);
        if (p.pierce <= 0) {
          p.life = 0;
        } else {
          p.pierce--;
        }
        
        if (p.isFireball) {
          spawnParticle(p.x, p.y, '#e74c3c', 10);
        }
      }
    });
  });
  
  projectiles = projectiles.filter(p => p.life > 0);
}

function updateXPGems(dt) {
  xpGems.forEach(gem => {
    const d = dist(gem, player);
    
    // Magnet effect
    if (d < player.pickupRange) {
      const a = angle(gem, player);
      const speed = 300 * (1 - d / player.pickupRange) + 100;
      gem.x += Math.cos(a) * speed * dt;
      gem.y += Math.sin(a) * speed * dt;
    }
    
    // Collect
    if (d < 20) {
      player.xp += gem.amount;
      gem.collected = true;
      sound.play('xp');
      
      if (player.xp >= player.xpToLevel) {
        levelUp();
      }
    }
  });
  
  xpGems = xpGems.filter(g => !g.collected);
}

function updateCoins(dt) {
  coins.forEach(coin => {
    const d = dist(coin, player);
    
    if (d < player.pickupRange * 0.8) {
      const a = angle(coin, player);
      const speed = 250;
      coin.x += Math.cos(a) * speed * dt;
      coin.y += Math.sin(a) * speed * dt;
    }
    
    if (d < 20) {
      gold += coin.amount;
      coin.collected = true;
      sound.play('coin');
    }
  });
  
  coins = coins.filter(c => !c.collected);
}

function updateParticles(dt) {
  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * 2;
    p.size *= 0.95;
  });
  particles = particles.filter(p => p.life > 0 && p.size > 0.5);
}

function updateDamageTexts(dt) {
  damageTexts.forEach(d => {
    d.y += d.vy * dt;
    d.vy += 100 * dt;
    d.life -= dt * 1.5;
  });
  damageTexts = damageTexts.filter(d => d.life > 0);
}

// ============================================
// DRAW FUNCTIONS
// ============================================
function drawSprite(sprite, x, y, scale = 4, flipX = false) {
  const img = PixelSprite.create(sprite.pattern || sprite, sprite.colors, scale);
  const sx = x - camera.x - img.width / 2;
  const sy = y - camera.y - img.height / 2;
  
  if (flipX) {
    ctx.save();
    ctx.translate(sx + img.width, sy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(img, sx, sy);
  }
}

function draw() {
  // Clear
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid (ground tiles)
  const tileSize = 64;
  const startX = Math.floor(camera.x / tileSize) * tileSize;
  const startY = Math.floor(camera.y / tileSize) * tileSize;
  
  for (let x = startX; x < camera.x + canvas.width + tileSize; x += tileSize) {
    for (let y = startY; y < camera.y + canvas.height + tileSize; y += tileSize) {
      const screenX = x - camera.x;
      const screenY = y - camera.y;
      
      // Checkerboard pattern
      const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isLight ? '#1a1a2e' : '#16213e';
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
      
      // Grass tufts
      if (Math.abs((x * 7 + y * 13) % 17) < 3) {
        ctx.fillStyle = '#2d4a3e';
        ctx.fillRect(screenX + 20, screenY + 40, 4, 8);
        ctx.fillRect(screenX + 26, screenY + 42, 4, 6);
        ctx.fillRect(screenX + 32, screenY + 40, 4, 8);
      }
    }
  }
  
  // Draw XP gems
  xpGems.forEach(gem => {
    drawSprite(SPRITES.xpGem, gem.x, gem.y, 4);
  });
  
  // Draw coins
  coins.forEach(coin => {
    drawSprite(SPRITES.coin, coin.x, coin.y, 4);
  });
  
  // Draw enemies
  enemies.forEach(enemy => {
    if (enemy.hitTimer > 0) {
      ctx.globalAlpha = 0.5;
    }
    drawSprite(enemy.sprite, enemy.x, enemy.y, 4, !enemy.facingRight);
    ctx.globalAlpha = 1;
    
    // Boss health bar
    if (enemy.isBoss) {
      const barWidth = 60;
      const barX = enemy.x - camera.x - barWidth / 2;
      const barY = enemy.y - camera.y - 40;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, 8);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(barX, barY, barWidth * (enemy.health / enemy.maxHealth), 8);
    }
  });
  
  // Draw projectiles
  projectiles.forEach(p => {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    
    if (p.isFireball) {
      // Fireball with trail
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(sx - p.size/2, sy - p.size/2, p.size, p.size);
    }
    ctx.shadowBlur = 0;
  });
  
  // Draw orbs
  const orbWeapon = player.weapons.find(w => w.id === 'orb');
  if (orbWeapon) {
    const count = orbWeapon.orbCount + orbWeapon.level - 1;
    const radius = orbWeapon.orbRadius + orbWeapon.level * 10;
    
    for (let i = 0; i < count; i++) {
      const a = gameTime * orbWeapon.orbSpeed + (i * Math.PI * 2 / count);
      const ox = player.x + Math.cos(a) * radius - camera.x;
      const oy = player.y + Math.sin(a) * radius - camera.y;
      
      ctx.fillStyle = orbWeapon.color;
      ctx.shadowColor = orbWeapon.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(ox, oy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  // Draw aura
  const auraWeapon = player.weapons.find(w => w.id === 'aura');
  if (auraWeapon) {
    const radius = auraWeapon.radius + auraWeapon.level * 15;
    const px = player.x - camera.x;
    const py = player.y - camera.y;
    
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    gradient.addColorStop(0, 'rgba(243, 156, 18, 0.1)');
    gradient.addColorStop(0.7, 'rgba(243, 156, 18, 0.05)');
    gradient.addColorStop(1, 'rgba(243, 156, 18, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw garlic
  const garlicWeapon = player.weapons.find(w => w.id === 'garlic');
  if (garlicWeapon) {
    const radius = garlicWeapon.radius + garlicWeapon.level * 10;
    const px = player.x - camera.x;
    const py = player.y - camera.y;
    
    ctx.strokeStyle = 'rgba(236, 240, 241, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Draw player
  if (!player.invincible || Math.floor(gameTime * 10) % 2 === 0) {
    const frames = [SPRITES.player.idle, SPRITES.player.walk1, SPRITES.player.walk2];
    const frame = player.animFrame === 0 ? frames[0] : frames[player.animFrame];
    const sprite = { pattern: frame, colors: SPRITES.player.colors };
    drawSprite(sprite, player.x, player.y, 4, !player.facingRight);
  }
  
  // Draw particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - camera.x - p.size/2, p.y - camera.y - p.size/2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
  
  // Draw damage texts
  ctx.textAlign = 'center';
  damageTexts.forEach(d => {
    ctx.globalAlpha = d.life;
    ctx.fillStyle = d.isCrit ? '#f1c40f' : '#fff';
    ctx.font = `bold ${d.isCrit ? 20 : 14}px "Courier New"`;
    ctx.fillText(d.amount, d.x - camera.x, d.y - camera.y);
  });
  ctx.globalAlpha = 1;
}

// ============================================
// UI FUNCTIONS
// ============================================
function updateUI() {
  document.getElementById('health-fill').style.width = `${(player.health / player.maxHealth) * 100}%`;
  document.getElementById('health-text').textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;
  document.getElementById('xp-fill').style.width = `${(player.xp / player.xpToLevel) * 100}%`;
  document.getElementById('level-text').textContent = `LV ${player.level}`;
  document.getElementById('time-display').textContent = formatTime(gameTime);
  document.getElementById('kill-display').textContent = `☠ ${kills}`;
  document.getElementById('gold-display').textContent = `💰 ${gold}`;
}

function updateWeaponsUI() {
  const container = document.getElementById('weapons-bar');
  container.innerHTML = '';
  player.weapons.forEach(w => {
    const div = document.createElement('div');
    div.className = 'weapon-icon';
    div.textContent = w.icon;
    div.title = `${w.name} Lv.${w.level}`;
    container.appendChild(div);
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

// ============================================
// LEVEL UP SYSTEM
// ============================================
function levelUp() {
  player.level++;
  player.xp = 0;
  player.xpToLevel = Math.floor(player.xpToLevel * 1.2);
  gamePaused = true;
  
  sound.play('levelup');
  showUpgradeScreen();
}

function showUpgradeScreen() {
  const screen = document.getElementById('levelup-screen');
  const container = document.getElementById('upgrade-cards');
  screen.classList.remove('hidden');
  container.innerHTML = '';
  
  // Get random upgrades
  const available = [...UPGRADES];
  const selected = [];
  
  for (let i = 0; i < 3 && available.length > 0; i++) {
    const weights = available.map(u => {
      const rarityWeight = { common: 10, uncommon: 6, rare: 3, epic: 1, legendary: 0.5 };
      return rarityWeight[u.rarity] * player.luck;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < weights.length; j++) {
      rand -= weights[j];
      if (rand <= 0) { idx = j; break; }
    }
    selected.push(available.splice(idx, 1)[0]);
  }
  
  selected.forEach(upgrade => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    
    const existingWeapon = player.weapons.find(w => w.id === upgrade.id);
    const levelText = existingWeapon ? ` (Lv.${existingWeapon.level + 1})` : '';
    
    card.innerHTML = `
      <div class="icon">${upgrade.icon}</div>
      <h3>${upgrade.name}${levelText}</h3>
      <p>${upgrade.desc}</p>
      <span class="rarity rarity-${upgrade.rarity}">${upgrade.rarity}</span>
    `;
    
    card.onclick = () => selectUpgrade(upgrade);
    container.appendChild(card);
  });
}

function selectUpgrade(upgrade) {
  if (upgrade.type === 'weapon') {
    initWeapon(upgrade.id);
  } else if (upgrade.apply) {
    upgrade.apply();
  }
  
  document.getElementById('levelup-screen').classList.add('hidden');
  gamePaused = false;
  spawnParticle(player.x, player.y, '#f1c40f', 20);
}

// ============================================
// GAME FLOW
// ============================================
function gameOver() {
  gameRunning = false;
  sound.play('gameover');
  
  // Save stats
  if (gameTime > bestTime) {
    bestTime = Math.floor(gameTime);
    localStorage.setItem('pixelSurvivorsBest', bestTime);
    showToast('🏆 NEW RECORD!');
  }
  localStorage.setItem('pixelSurvivorsKills', totalKills);
  
  // Show game over screen
  document.getElementById('final-stats').innerHTML = `
    Time: ${formatTime(gameTime)}<br>
    Kills: ${kills}<br>
    Level: ${player.level}<br>
    Gold: ${gold}
  `;
  
  // Psychological taunts
  const taunts = [
    "You were so close to the next level...",
    "Just one more try? You can beat that!",
    "The enemies are getting scared of you...",
    "That legendary weapon was about to drop!",
    "You almost had them! Try again?",
    "Your skills are improving. Don't stop now!",
    "The boss was almost dead...",
    "One more run? You've got this!",
    "So close to a new record!",
    "The next upgrade would have been amazing..."
  ];
  document.getElementById('taunt').textContent = taunts[Math.floor(Math.random() * taunts.length)];
  
  document.getElementById('gameover-screen').classList.remove('hidden');
}

function resetGame() {
  // Reset player
  player.x = 0;
  player.y = 0;
  player.health = 100;
  player.maxHealth = 100;
  player.xp = 0;
  player.xpToLevel = 50;
  player.level = 1;
  player.invincible = false;
  player.invincibleTimer = 0;
  player.weapons = [];
  player.damage = 10;
  player.armor = 0;
  player.regen = 0;
  player.regenTimer = 0;
  player.pickupRange = 60;
  player.luck = 1;
  player.cooldownReduction = 1;
  player.animFrame = 0;
  player.facingRight = true;
  
  // Clear arrays
  enemies = [];
  projectiles = [];
  particles = [];
  xpGems = [];
  coins = [];
  damageTexts = [];
  
  // Reset stats
  kills = 0;
  gold = 0;
  gameTime = 0;
  
  // Reset weapon timers
  Object.keys(weaponTimers).forEach(k => delete weaponTimers[k]);
  
  // Give starting weapon
  initWeapon('knife');
  
  // Update UI
  updateWeaponsUI();
}

function startGame() {
  sound.init();
  resetGame();
  
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('levelup-screen').classList.add('hidden');
  
  gameRunning = true;
  gamePaused = false;
}

// ============================================
// SPAWN TIMER
// ============================================
let spawnTimer = 0;

function getSpawnInterval() {
  // Spawn faster as time goes on
  const base = 1.5;
  const min = 0.2;
  return Math.max(min, base - gameTime / 120);
}

function getSpawnCount() {
  return 1 + Math.floor(gameTime / 30);
}

// ============================================
// MAIN GAME LOOP
// ============================================
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;
  
  if (gameRunning && !gamePaused) {
    gameTime += deltaTime;
    
    // Spawn enemies
    spawnTimer -= deltaTime;
    if (spawnTimer <= 0) {
      spawnTimer = getSpawnInterval();
      const count = getSpawnCount();
      for (let i = 0; i < count; i++) {
        spawnEnemy();
      }
    }
    
    // Update
    updatePlayer(deltaTime);
    updateWeapons(deltaTime);
    updateEnemies(deltaTime);
    updateProjectiles(deltaTime);
    updateXPGems(deltaTime);
    updateCoins(deltaTime);
    updateParticles(deltaTime);
    updateDamageTexts(deltaTime);
    
    // Update UI
    updateUI();
  }
  
  // Always draw
  draw();
  
  requestAnimationFrame(gameLoop);
}

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('retry-btn').addEventListener('click', startGame);

// Update records display
function updateRecordsDisplay() {
  document.getElementById('best-time').textContent = formatTime(bestTime);
  document.getElementById('total-kills').textContent = totalKills;
}
updateRecordsDisplay();

// Prevent context menu
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Start loop
requestAnimationFrame(gameLoop);

console.log('Pixel Survivors loaded! Click START to begin.');
