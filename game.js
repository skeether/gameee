// Survivor Chaos - Main Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let gamePaused = false;
let gameTime = 0;
let lastTime = 0;
let deltaTime = 0;

// Player
const player = {
  x: 0, y: 0, radius: 20, speed: 200, maxHealth: 100, health: 100,
  xp: 0, xpToLevel: 100, level: 1, damage: 10, attackSpeed: 1,
  attackCooldown: 0, projectileSpeed: 400, projectileCount: 1,
  critChance: 0.05, critMultiplier: 2, armor: 0, regen: 0, regenTimer: 0,
  magnetRange: 50, weapons: ['basic'], invincible: false, invincibleTimer: 0
};

// Game arrays
let enemies = [];
let projectiles = [];
let particles = [];
let xpOrbs = [];
let damageNumbers = [];
let goldCoins = [];

// Stats
let kills = 0;
let gold = 0;
let combo = 0;
let comboTimer = 0;
let bestTime = parseInt(localStorage.getItem('bestTime') || '0');
let totalKills = parseInt(localStorage.getItem('totalKills') || '0');
let achievements = JSON.parse(localStorage.getItem('achievements') || '[]');

// Input
const keys = {};

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Input handlers
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Upgrades system
const upgrades = [
  { id: 'damage', name: 'Power Strike', desc: '+20% Damage', rarity: 'common', apply: () => player.damage *= 1.2 },
  { id: 'speed', name: 'Swift Feet', desc: '+15% Move Speed', rarity: 'common', apply: () => player.speed *= 1.15 },
  { id: 'health', name: 'Vitality', desc: '+25 Max Health', rarity: 'common', apply: () => { player.maxHealth += 25; player.health += 25; }},
  { id: 'attackSpeed', name: 'Rapid Fire', desc: '+20% Attack Speed', rarity: 'rare', apply: () => player.attackSpeed *= 1.2 },
  { id: 'projectile', name: 'Multi Shot', desc: '+1 Projectile', rarity: 'epic', apply: () => player.projectileCount++ },
  { id: 'crit', name: 'Deadly Precision', desc: '+10% Crit Chance', rarity: 'rare', apply: () => player.critChance += 0.1 },
  { id: 'critDmg', name: 'Executioner', desc: '+50% Crit Damage', rarity: 'epic', apply: () => player.critMultiplier += 0.5 },
  { id: 'armor', name: 'Iron Skin', desc: '+5 Armor', rarity: 'common', apply: () => player.armor += 5 },
  { id: 'regen', name: 'Regeneration', desc: '+2 HP/sec', rarity: 'rare', apply: () => player.regen += 2 },
  { id: 'magnet', name: 'Attraction', desc: '+50% Pickup Range', rarity: 'common', apply: () => player.magnetRange *= 1.5 },
  { id: 'projSpeed', name: 'Velocity', desc: '+30% Projectile Speed', rarity: 'common', apply: () => player.projectileSpeed *= 1.3 },
  { id: 'orbital', name: 'Orbital Shield', desc: 'Orbiting projectiles', rarity: 'legendary', apply: () => { if (!player.weapons.includes('orbital')) player.weapons.push('orbital'); }},
  { id: 'aura', name: 'Damage Aura', desc: 'Damage nearby enemies', rarity: 'legendary', apply: () => { if (!player.weapons.includes('aura')) player.weapons.push('aura'); }},
  { id: 'chain', name: 'Chain Lightning', desc: 'Attacks chain to enemies', rarity: 'epic', apply: () => { if (!player.weapons.includes('chain')) player.weapons.push('chain'); }}
];

// Enemy types
const enemyTypes = [
  { name: 'Zombie', color: '#44aa44', radius: 15, speed: 60, health: 30, damage: 10, xp: 10 },
  { name: 'Bat', color: '#8844aa', radius: 10, speed: 120, health: 15, damage: 5, xp: 8 },
  { name: 'Skeleton', color: '#dddddd', radius: 18, speed: 80, health: 50, damage: 15, xp: 15 },
  { name: 'Demon', color: '#ff4444', radius: 25, speed: 50, health: 100, damage: 25, xp: 30 },
  { name: 'Ghost', color: '#aaddff', radius: 12, speed: 100, health: 20, damage: 8, xp: 12 },
  { name: 'Boss', color: '#ffcc00', radius: 50, speed: 40, health: 500, damage: 40, xp: 100, isBoss: true }
];

// Achievement definitions
const achievementDefs = [
  { id: 'first_kill', name: 'First Blood', condition: () => kills >= 1 },
  { id: 'kill_100', name: 'Centurion', condition: () => kills >= 100 },
  { id: 'kill_500', name: 'Slayer', condition: () => kills >= 500 },
  { id: 'survive_1min', name: 'Survivor', condition: () => gameTime >= 60 },
  { id: 'survive_5min', name: 'Endurance', condition: () => gameTime >= 300 },
  { id: 'level_10', name: 'Veteran', condition: () => player.level >= 10 },
  { id: 'level_20', name: 'Master', condition: () => player.level >= 20 },
  { id: 'combo_50', name: 'Combo King', condition: () => combo >= 50 }
];

// Spawn enemy
function spawnEnemy() {
  const difficulty = 1 + gameTime / 60;
  let typeIndex = 0;
  const rand = Math.random();
  if (gameTime > 180 && rand < 0.05) typeIndex = 5; // Boss
  else if (gameTime > 120 && rand < 0.2) typeIndex = 3; // Demon
  else if (gameTime > 60 && rand < 0.3) typeIndex = 2; // Skeleton
  else if (rand < 0.4) typeIndex = 4; // Ghost
  else if (rand < 0.6) typeIndex = 1; // Bat
  
  const type = enemyTypes[typeIndex];
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.max(canvas.width, canvas.height) / 2 + 100;
  
  enemies.push({
    x: player.x + Math.cos(angle) * dist,
    y: player.y + Math.sin(angle) * dist,
    radius: type.radius,
    speed: type.speed * (1 + difficulty * 0.1),
    health: type.health * difficulty,
    maxHealth: type.health * difficulty,
    damage: type.damage * (1 + difficulty * 0.05),
    xp: type.xp,
    color: type.color,
    isBoss: type.isBoss || false,
    hitFlash: 0
  });
}

// Spawn XP orb
function spawnXP(x, y, amount) {
  const count = Math.ceil(amount / 10);
  for (let i = 0; i < count; i++) {
    xpOrbs.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      amount: Math.ceil(amount / count),
      radius: 8,
      pulse: Math.random() * Math.PI * 2
    });
  }
}

// Spawn gold
function spawnGold(x, y) {
  if (Math.random() < 0.3) {
    goldCoins.push({ x, y, amount: Math.floor(Math.random() * 5) + 1, radius: 6 });
  }
}

// Create particle
function createParticle(x, y, color, count = 5) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
      radius: Math.random() * 4 + 2, color, life: 1
    });
  }
}

// Damage number
function showDamage(x, y, amount, isCrit = false) {
  damageNumbers.push({
    x, y, amount: Math.round(amount), life: 1, isCrit,
    vy: -100, color: isCrit ? '#ffcc00' : '#ffffff'
  });
}

// Player attack
function playerAttack() {
  if (player.attackCooldown > 0) return;
  player.attackCooldown = 1 / player.attackSpeed;
  
  // Find nearest enemy
  let nearest = null;
  let nearestDist = Infinity;
  enemies.forEach(e => {
    const dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist < nearestDist) { nearestDist = dist; nearest = e; }
  });
  
  if (!nearest) return;
  
  const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  const spread = 0.2;
  
  for (let i = 0; i < player.projectileCount; i++) {
    const angle = baseAngle + (i - (player.projectileCount - 1) / 2) * spread;
    projectiles.push({
      x: player.x, y: player.y, vx: Math.cos(angle) * player.projectileSpeed,
      vy: Math.sin(angle) * player.projectileSpeed, damage: player.damage,
      radius: 8, color: '#ffcc00', life: 2, piercing: 0
    });
  }
}

// Orbital weapon
function updateOrbital(dt) {
  if (!player.weapons.includes('orbital')) return;
  const orbitalCount = 3;
  const orbitalDist = 80;
  const orbitalSpeed = 3;
  
  for (let i = 0; i < orbitalCount; i++) {
    const angle = (gameTime * orbitalSpeed) + (i * Math.PI * 2 / orbitalCount);
    const ox = player.x + Math.cos(angle) * orbitalDist;
    const oy = player.y + Math.sin(angle) * orbitalDist;
    
    enemies.forEach(e => {
      const dist = Math.hypot(e.x - ox, e.y - oy);
      if (dist < e.radius + 15) {
        damageEnemy(e, player.damage * 0.5);
      }
    });
  }
}

// Aura weapon
function updateAura(dt) {
  if (!player.weapons.includes('aura')) return;
  const auraRadius = 100;
  const auraDamage = player.damage * 0.3 * dt;
  
  enemies.forEach(e => {
    const dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist < auraRadius + e.radius) {
      e.health -= auraDamage;
      if (Math.random() < 0.1) createParticle(e.x, e.y, '#ff6600', 1);
    }
  });
}

// Chain lightning
let chainCooldown = 0;
function updateChain(dt) {
  if (!player.weapons.includes('chain')) return;
  chainCooldown -= dt;
  if (chainCooldown > 0) return;
  chainCooldown = 0.5;
  
  let targets = [...enemies].sort((a, b) => 
    Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)
  ).slice(0, 5);
  
  if (targets.length === 0) return;
  
  let prev = { x: player.x, y: player.y };
  targets.forEach((t, i) => {
    damageEnemy(t, player.damage * 0.4);
    createParticle(t.x, t.y, '#44aaff', 3);
    prev = t;
  });
}

// Damage enemy
function damageEnemy(enemy, damage) {
  const isCrit = Math.random() < player.critChance;
  const finalDamage = isCrit ? damage * player.critMultiplier : damage;
  enemy.health -= finalDamage;
  enemy.hitFlash = 0.1;
  showDamage(enemy.x, enemy.y - enemy.radius, finalDamage, isCrit);
  createParticle(enemy.x, enemy.y, enemy.color, 3);
  
  // Combo system
  combo++;
  comboTimer = 2;
  updateComboDisplay();
}

// Update combo display
function updateComboDisplay() {
  const comboEl = document.getElementById('combo-display');
  const comboText = document.getElementById('combo-text');
  if (combo > 5) {
    comboEl.classList.remove('hidden');
    comboText.textContent = `COMBO x${combo}`;
    comboText.style.fontSize = Math.min(32 + combo, 64) + 'px';
  } else {
    comboEl.classList.add('hidden');
  }
}

// Level up
function levelUp() {
  player.level++;
  player.xp = 0;
  player.xpToLevel = Math.floor(player.xpToLevel * 1.3);
  gamePaused = true;
  showUpgradeOptions();
  
  // Full heal on level up (psychological hook)
  player.health = Math.min(player.health + player.maxHealth * 0.3, player.maxHealth);
}

// Show upgrade options
function showUpgradeOptions() {
  const screen = document.getElementById('level-up-screen');
  const container = document.getElementById('upgrade-options');
  screen.classList.remove('hidden');
  container.innerHTML = '';
  
  // Weighted random selection
  const available = [...upgrades];
  const selected = [];
  for (let i = 0; i < 3 && available.length > 0; i++) {
    const weights = available.map(u => {
      if (u.rarity === 'legendary') return 1;
      if (u.rarity === 'epic') return 3;
      if (u.rarity === 'rare') return 5;
      return 10;
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
    card.innerHTML = `
      <h3>${upgrade.name}</h3>
      <p>${upgrade.desc}</p>
      <span class="rarity rarity-${upgrade.rarity}">${upgrade.rarity.toUpperCase()}</span>
    `;
    card.onclick = () => selectUpgrade(upgrade);
    container.appendChild(card);
  });
}

// Select upgrade
function selectUpgrade(upgrade) {
  upgrade.apply();
  document.getElementById('level-up-screen').classList.add('hidden');
  gamePaused = false;
  
  // Sound feedback simulation with visual
  createParticle(player.x, player.y, '#44ff88', 20);
}

// Check achievements
function checkAchievements() {
  achievementDefs.forEach(ach => {
    if (!achievements.includes(ach.id) && ach.condition()) {
      achievements.push(ach.id);
      localStorage.setItem('achievements', JSON.stringify(achievements));
      showAchievement(ach.name);
    }
  });
}

// Show achievement
function showAchievement(name) {
  const popup = document.getElementById('achievement-popup');
  const text = document.getElementById('achievement-text');
  text.textContent = `🏆 Achievement: ${name}`;
  popup.classList.remove('hidden');
  setTimeout(() => popup.classList.add('hidden'), 3000);
}

// Update player
function updatePlayer(dt) {
  // Movement
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    player.x += (dx / len) * player.speed * dt;
    player.y += (dy / len) * player.speed * dt;
  }
  
  // Bounds
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
  
  // Attack cooldown
  player.attackCooldown -= dt;
  if (player.attackCooldown <= 0) playerAttack();
  
  // Regeneration
  if (player.regen > 0) {
    player.regenTimer += dt;
    if (player.regenTimer >= 1) {
      player.regenTimer = 0;
      player.health = Math.min(player.health + player.regen, player.maxHealth);
    }
  }
  
  // Invincibility
  if (player.invincible) {
    player.invincibleTimer -= dt;
    if (player.invincibleTimer <= 0) player.invincible = false;
  }
}

// Update enemies
function updateEnemies(dt) {
  enemies.forEach(e => {
    // Move towards player
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 0) {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
    }
    
    // Hit flash
    if (e.hitFlash > 0) e.hitFlash -= dt;
    
    // Collision with player
    if (dist < player.radius + e.radius && !player.invincible) {
      const damage = Math.max(1, e.damage - player.armor);
      player.health -= damage;
      player.invincible = true;
      player.invincibleTimer = 0.5;
      createParticle(player.x, player.y, '#ff4444', 10);
      document.getElementById('game-container').classList.add('screen-shake');
      setTimeout(() => document.getElementById('game-container').classList.remove('screen-shake'), 300);
      
      if (player.health <= 0) gameOver();
    }
  });
  
  // Remove dead enemies
  enemies = enemies.filter(e => {
    if (e.health <= 0) {
      kills++;
      totalKills++;
      spawnXP(e.x, e.y, e.xp);
      spawnGold(e.x, e.y);
      createParticle(e.x, e.y, e.color, 15);
      return false;
    }
    return true;
  });
}

// Update projectiles
function updateProjectiles(dt) {
  projectiles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    
    // Hit enemies
    enemies.forEach(e => {
      const dist = Math.hypot(p.x - e.x, p.y - e.y);
      if (dist < p.radius + e.radius) {
        damageEnemy(e, p.damage);
        p.life = 0;
      }
    });
  });
  
  projectiles = projectiles.filter(p => p.life > 0);
}

// Update XP orbs
function updateXPOrbs(dt) {
  xpOrbs.forEach(orb => {
    orb.pulse += dt * 5;
    const dist = Math.hypot(orb.x - player.x, orb.y - player.y);
    
    // Magnet effect
    if (dist < player.magnetRange) {
      const speed = 300 * (1 - dist / player.magnetRange);
      const dx = player.x - orb.x;
      const dy = player.y - orb.y;
      orb.x += (dx / dist) * speed * dt;
      orb.y += (dy / dist) * speed * dt;
    }
    
    // Collect
    if (dist < player.radius + orb.radius) {
      player.xp += orb.amount;
      orb.collected = true;
      createParticle(orb.x, orb.y, '#4ecdc4', 5);
      
      if (player.xp >= player.xpToLevel) levelUp();
    }
  });
  
  xpOrbs = xpOrbs.filter(o => !o.collected);
}

// Update gold
function updateGold(dt) {
  goldCoins.forEach(coin => {
    const dist = Math.hypot(coin.x - player.x, coin.y - player.y);
    
    if (dist < player.magnetRange * 0.7) {
      const speed = 250;
      const dx = player.x - coin.x;
      const dy = player.y - coin.y;
      coin.x += (dx / dist) * speed * dt;
      coin.y += (dy / dist) * speed * dt;
    }
    
    if (dist < player.radius + coin.radius) {
      gold += coin.amount;
      coin.collected = true;
      createParticle(coin.x, coin.y, '#ffcc00', 5);
    }
  });
  
  goldCoins = goldCoins.filter(c => !c.collected);
}

// Update particles
function updateParticles(dt) {
  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * 2;
    p.radius *= 0.98;
  });
  particles = particles.filter(p => p.life > 0);
}

// Update damage numbers
function updateDamageNumbers(dt) {
  damageNumbers.forEach(d => {
    d.y += d.vy * dt;
    d.vy += 200 * dt;
    d.life -= dt * 1.5;
  });
  damageNumbers = damageNumbers.filter(d => d.life > 0);
}

// Draw functions
function draw() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Grid background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  const offsetX = player.x % gridSize;
  const offsetY = player.y % gridSize;
  for (let x = -offsetX; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = -offsetY; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  
  // Aura effect
  if (player.weapons.includes('aura')) {
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 100);
    gradient.addColorStop(0, 'rgba(255, 100, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 100, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // XP orbs
  xpOrbs.forEach(orb => {
    const pulse = Math.sin(orb.pulse) * 0.3 + 1;
    ctx.fillStyle = '#4ecdc4';
    ctx.shadowColor = '#4ecdc4';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  
  // Gold coins
  goldCoins.forEach(coin => {
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  
  // Enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = e.isBoss ? 30 : 10;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Health bar for bosses
    if (e.isBoss) {
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - 40, e.y - e.radius - 15, 80, 8);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(e.x - 40, e.y - e.radius - 15, 80 * (e.health / e.maxHealth), 8);
    }
  });
  
  // Projectiles
  projectiles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  
  // Orbital weapons
  if (player.weapons.includes('orbital')) {
    const orbitalCount = 3;
    const orbitalDist = 80;
    for (let i = 0; i < orbitalCount; i++) {
      const angle = (gameTime * 3) + (i * Math.PI * 2 / orbitalCount);
      const ox = player.x + Math.cos(angle) * orbitalDist;
      const oy = player.y + Math.sin(angle) * orbitalDist;
      ctx.fillStyle = '#ff66ff';
      ctx.shadowColor = '#ff66ff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(ox, oy, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  // Player
  const playerAlpha = player.invincible ? 0.5 + Math.sin(gameTime * 20) * 0.3 : 1;
  ctx.globalAlpha = playerAlpha;
  ctx.fillStyle = '#4ecdc4';
  ctx.shadowColor = '#4ecdc4';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  
  // Particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  
  // Damage numbers
  damageNumbers.forEach(d => {
    ctx.globalAlpha = d.life;
    ctx.fillStyle = d.color;
    ctx.font = `bold ${d.isCrit ? 24 : 16}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(d.amount, d.x, d.y);
  });
  ctx.globalAlpha = 1;
}

// Update UI
function updateUI() {
  document.getElementById('health-fill').style.width = (player.health / player.maxHealth * 100) + '%';
  document.getElementById('health-text').textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;
  document.getElementById('xp-fill').style.width = (player.xp / player.xpToLevel * 100) + '%';
  document.getElementById('xp-text').textContent = `Level ${player.level}`;
  document.getElementById('kill-count').textContent = `Kills: ${kills}`;
  document.getElementById('gold-count').textContent = `Gold: ${gold}`;
  
  const mins = Math.floor(gameTime / 60);
  const secs = Math.floor(gameTime % 60);
  document.getElementById('time-survived').textContent = `Time: ${mins}:${secs.toString().padStart(2, '0')}`;
}

// Game over
function gameOver() {
  gameRunning = false;
  
  // Save stats
  if (gameTime > bestTime) {
    bestTime = Math.floor(gameTime);
    localStorage.setItem('bestTime', bestTime);
  }
  localStorage.setItem('totalKills', totalKills);
  
  const mins = Math.floor(gameTime / 60);
  const secs = Math.floor(gameTime % 60);
  
  document.getElementById('final-stats').innerHTML = `
    Survived: ${mins}:${secs.toString().padStart(2, '0')}<br>
    Kills: ${kills}<br>
    Level: ${player.level}<br>
    Gold: ${gold}
  `;
  
  // Psychological taunts to encourage retry
  const taunts = [
    "You were so close to the next level...",
    "Just one more try? You can do better!",
    "The enemies are getting scared of you...",
    "Your best run is waiting to be beaten!",
    "That was just a warm-up, right?",
    "The legendary upgrade was about to drop...",
    "You almost had them! Try again?",
    "Your skills are improving. Don't stop now!"
  ];
  document.getElementById('taunt-text').textContent = taunts[Math.floor(Math.random() * taunts.length)];
  
  // Show new achievement if any
  const newAch = achievementDefs.find(a => !achievements.includes(a.id) && a.condition());
  if (newAch) {
    achievements.push(newAch.id);
    localStorage.setItem('achievements', JSON.stringify(achievements));
    document.getElementById('achievement-unlock').textContent = `🏆 New Achievement: ${newAch.name}`;
    document.getElementById('achievement-unlock').classList.remove('hidden');
  } else {
    document.getElementById('achievement-unlock').classList.add('hidden');
  }
  
  document.getElementById('game-over-screen').classList.remove('hidden');
}

// Reset game
function resetGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.health = 100;
  player.maxHealth = 100;
  player.xp = 0;
  player.xpToLevel = 100;
  player.level = 1;
  player.damage = 10;
  player.attackSpeed = 1;
  player.attackCooldown = 0;
  player.projectileSpeed = 400;
  player.projectileCount = 1;
  player.critChance = 0.05;
  player.critMultiplier = 2;
  player.armor = 0;
  player.regen = 0;
  player.magnetRange = 50;
  player.weapons = ['basic'];
  player.invincible = false;
  
  enemies = [];
  projectiles = [];
  particles = [];
  xpOrbs = [];
  damageNumbers = [];
  goldCoins = [];
  
  kills = 0;
  gold = 0;
  combo = 0;
  comboTimer = 0;
  gameTime = 0;
  
  document.getElementById('combo-display').classList.add('hidden');
}

// Spawn timer
let spawnTimer = 0;
function getSpawnRate() {
  // Spawn rate increases over time
  const base = 1.5;
  const min = 0.3;
  return Math.max(min, base - gameTime / 120);
}

// Main game loop
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  
  if (gameRunning && !gamePaused) {
    gameTime += deltaTime;
    
    // Spawn enemies
    spawnTimer -= deltaTime;
    if (spawnTimer <= 0) {
      spawnTimer = getSpawnRate();
      const count = 1 + Math.floor(gameTime / 60);
      for (let i = 0; i < count; i++) spawnEnemy();
    }
    
    // Combo decay
    if (comboTimer > 0) {
      comboTimer -= deltaTime;
      if (comboTimer <= 0) {
        combo = 0;
        updateComboDisplay();
      }
    }
    
    // Update
    updatePlayer(deltaTime);
    updateEnemies(deltaTime);
    updateProjectiles(deltaTime);
    updateXPOrbs(deltaTime);
    updateGold(deltaTime);
    updateParticles(deltaTime);
    updateDamageNumbers(deltaTime);
    updateOrbital(deltaTime);
    updateAura(deltaTime);
    updateChain(deltaTime);
    
    // Check achievements
    checkAchievements();
    
    // Update UI
    updateUI();
  }
  
  draw();
  requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
  resetGame();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-over-screen').classList.add('hidden');
  gameRunning = true;
  gamePaused = false;
}

// Event listeners
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('retry-btn').addEventListener('click', startGame);

// Update best time display
function updateBestTimeDisplay() {
  const mins = Math.floor(bestTime / 60);
  const secs = bestTime % 60;
  document.getElementById('best-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}
updateBestTimeDisplay();

// Start the game loop
requestAnimationFrame(gameLoop);

// Prevent context menu on right click
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  
  keys['arrowleft'] = dx < -20;
  keys['arrowright'] = dx > 20;
  keys['arrowup'] = dy < -20;
  keys['arrowdown'] = dy > 20;
});

canvas.addEventListener('touchend', e => {
  keys['arrowleft'] = false;
  keys['arrowright'] = false;
  keys['arrowup'] = false;
  keys['arrowdown'] = false;
});

// Near-death warning effect
setInterval(() => {
  if (gameRunning && player.health < player.maxHealth * 0.25) {
    document.getElementById('health-bar').style.animation = 'pulse 0.5s ease infinite';
  } else {
    document.getElementById('health-bar').style.animation = 'none';
  }
}, 100);

console.log('Survivor Chaos loaded! Press START to begin.');
