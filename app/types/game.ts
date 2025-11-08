export interface Character {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  facing: 'left' | 'right';
  state: 'idle' | 'walk' | 'jump' | 'punch' | 'kick' | 'special' | 'hit' | 'block';
  isGrounded: boolean;
  animationFrame: number;
  animationTimer: number;
  attackCooldown: number;
  hitCooldown: number;
  blockStun: number;
  isAttacking: boolean;
  isBlocking: boolean;
  combo: number;
}

export interface Attack {
  x: number;
  y: number;
  width: number;
  height: number;
  damage: number;
  owner: 'player1' | 'player2';
  type: 'punch' | 'kick' | 'special';
  active: boolean;
  duration: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  damage: number;
  owner: 'player1' | 'player2';
  type: 'rasengan' | 'chidori';
  active: boolean;
  animationFrame: number;
}

export interface GameState {
  player1: Character;
  player2: Character;
  attacks: Attack[];
  projectiles: Projectile[];
  round: number;
  timeLeft: number;
  gameOver: boolean;
  winner: 'player1' | 'player2' | null;
}

export interface Controls {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  punch: boolean;
  kick: boolean;
  special: boolean;
  block: boolean;
}
