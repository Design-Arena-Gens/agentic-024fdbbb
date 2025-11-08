'use client';

import { useEffect, useRef, useState } from 'react';
import { GameState, Character, Controls, Attack, Projectile } from '../types/game';
import { narutoSprites, sasukeSprites, colors } from '../utils/sprites';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GROUND_Y = 500;
const GRAVITY = 0.8;
const JUMP_FORCE = -18;
const MOVE_SPEED = 5;
const ROUND_TIME = 99;

export default function FightingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const gameStateRef = useRef<GameState>({
    player1: createCharacter(150, GROUND_Y, 'right'),
    player2: createCharacter(600, GROUND_Y, 'left'),
    attacks: [],
    projectiles: [],
    round: 1,
    timeLeft: ROUND_TIME,
    gameOver: false,
    winner: null
  });

  const controlsRef = useRef({
    player1: {
      left: false,
      right: false,
      up: false,
      down: false,
      punch: false,
      kick: false,
      special: false,
      block: false
    },
    player2: {
      left: false,
      right: false,
      up: false,
      down: false,
      punch: false,
      kick: false,
      special: false,
      block: false
    }
  });

  function createCharacter(x: number, y: number, facing: 'left' | 'right'): Character {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      width: 40,
      height: 60,
      health: 100,
      maxHealth: 100,
      facing,
      state: 'idle',
      isGrounded: true,
      animationFrame: 0,
      animationTimer: 0,
      attackCooldown: 0,
      hitCooldown: 0,
      blockStun: 0,
      isAttacking: false,
      isBlocking: false,
      combo: 0
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle keyboard input
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Player 1 controls (WASD + G/H/J/K)
      if (key === 'a') controlsRef.current.player1.left = true;
      if (key === 'd') controlsRef.current.player1.right = true;
      if (key === 'w') controlsRef.current.player1.up = true;
      if (key === 's') controlsRef.current.player1.down = true;
      if (key === 'g') controlsRef.current.player1.punch = true;
      if (key === 'h') controlsRef.current.player1.kick = true;
      if (key === 'j') controlsRef.current.player1.special = true;
      if (key === 'k') controlsRef.current.player1.block = true;

      // Player 2 controls (Arrow keys + Numpad)
      if (key === 'arrowleft') controlsRef.current.player2.left = true;
      if (key === 'arrowright') controlsRef.current.player2.right = true;
      if (key === 'arrowup') controlsRef.current.player2.up = true;
      if (key === 'arrowdown') controlsRef.current.player2.down = true;
      if (key === '1') controlsRef.current.player2.punch = true;
      if (key === '2') controlsRef.current.player2.kick = true;
      if (key === '3') controlsRef.current.player2.special = true;
      if (key === '0') controlsRef.current.player2.block = true;

      // Start game
      if (key === ' ' && !gameStarted) {
        setGameStarted(true);
      }

      // Restart game
      if (key === 'r' && gameStateRef.current.gameOver) {
        gameStateRef.current = {
          player1: createCharacter(150, GROUND_Y, 'right'),
          player2: createCharacter(600, GROUND_Y, 'left'),
          attacks: [],
          projectiles: [],
          round: 1,
          timeLeft: ROUND_TIME,
          gameOver: false,
          winner: null
        };
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Player 1
      if (key === 'a') controlsRef.current.player1.left = false;
      if (key === 'd') controlsRef.current.player1.right = false;
      if (key === 'w') controlsRef.current.player1.up = false;
      if (key === 's') controlsRef.current.player1.down = false;
      if (key === 'g') controlsRef.current.player1.punch = false;
      if (key === 'h') controlsRef.current.player1.kick = false;
      if (key === 'j') controlsRef.current.player1.special = false;
      if (key === 'k') controlsRef.current.player1.block = false;

      // Player 2
      if (key === 'arrowleft') controlsRef.current.player2.left = false;
      if (key === 'arrowright') controlsRef.current.player2.right = false;
      if (key === 'arrowup') controlsRef.current.player2.up = false;
      if (key === 'arrowdown') controlsRef.current.player2.down = false;
      if (key === '1') controlsRef.current.player2.punch = false;
      if (key === '2') controlsRef.current.player2.kick = false;
      if (key === '3') controlsRef.current.player2.special = false;
      if (key === '0') controlsRef.current.player2.block = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game loop
    let lastTime = Date.now();
    let timeCounter = 0;

    const gameLoop = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (gameStarted && !gameStateRef.current.gameOver) {
        timeCounter += deltaTime;
        if (timeCounter >= 1) {
          gameStateRef.current.timeLeft--;
          timeCounter = 0;

          if (gameStateRef.current.timeLeft <= 0) {
            endRound();
          }
        }

        updateGame(deltaTime);
      }

      render(ctx);
      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted]);

  function updateGame(deltaTime: number) {
    const state = gameStateRef.current;

    updateCharacter(state.player1, controlsRef.current.player1, state.player2);
    updateCharacter(state.player2, controlsRef.current.player2, state.player1);

    updateAttacks(state);
    updateProjectiles(state);
    checkCollisions(state);
  }

  function updateCharacter(char: Character, controls: Controls, opponent: Character) {
    // Update timers
    if (char.attackCooldown > 0) char.attackCooldown--;
    if (char.hitCooldown > 0) char.hitCooldown--;
    if (char.blockStun > 0) char.blockStun--;

    char.animationTimer++;
    if (char.animationTimer > 10) {
      char.animationFrame = (char.animationFrame + 1) % 4;
      char.animationTimer = 0;
    }

    // Blocking
    char.isBlocking = controls.block && char.isGrounded && !char.isAttacking;

    if (char.blockStun > 0 || char.hitCooldown > 0) {
      char.state = 'hit';
      applyGravity(char);
      return;
    }

    // Movement
    if (controls.left && !char.isAttacking && !char.isBlocking) {
      char.vx = -MOVE_SPEED;
      char.facing = 'left';
      if (char.isGrounded) char.state = 'walk';
    } else if (controls.right && !char.isAttacking && !char.isBlocking) {
      char.vx = MOVE_SPEED;
      char.facing = 'right';
      if (char.isGrounded) char.state = 'walk';
    } else {
      char.vx *= 0.8;
      if (Math.abs(char.vx) < 0.1) char.vx = 0;
      if (char.isGrounded && !char.isAttacking && !char.isBlocking) {
        char.state = 'idle';
      }
    }

    // Jump
    if (controls.up && char.isGrounded && !char.isAttacking) {
      char.vy = JUMP_FORCE;
      char.isGrounded = false;
      char.state = 'jump';
    }

    // Attacks
    if (char.attackCooldown === 0 && char.isGrounded) {
      if (controls.punch && !char.isAttacking) {
        performAttack(char, 'punch');
      } else if (controls.kick && !char.isAttacking) {
        performAttack(char, 'kick');
      } else if (controls.special && !char.isAttacking) {
        performSpecial(char);
      }
    }

    // Update attack state
    if (char.isAttacking) {
      char.vx = 0;
      char.attackCooldown--;
      if (char.attackCooldown === 0) {
        char.isAttacking = false;
        char.state = 'idle';
      }
    }

    // Auto-face opponent
    if (!char.isAttacking && char.isGrounded) {
      if (opponent.x < char.x) {
        char.facing = 'left';
      } else {
        char.facing = 'right';
      }
    }

    // Apply physics
    char.x += char.vx;
    applyGravity(char);

    // Boundaries
    if (char.x < 0) char.x = 0;
    if (char.x > CANVAS_WIDTH - char.width) char.x = CANVAS_WIDTH - char.width;
  }

  function applyGravity(char: Character) {
    if (!char.isGrounded) {
      char.vy += GRAVITY;
      char.y += char.vy;

      if (char.y >= GROUND_Y) {
        char.y = GROUND_Y;
        char.vy = 0;
        char.isGrounded = true;
        if (!char.isAttacking) char.state = 'idle';
      }
    }
  }

  function performAttack(char: Character, type: 'punch' | 'kick') {
    char.isAttacking = true;
    char.state = type;
    char.attackCooldown = type === 'punch' ? 20 : 30;

    const attackWidth = type === 'punch' ? 30 : 40;
    const attackHeight = type === 'punch' ? 20 : 30;
    const offsetX = char.facing === 'right' ? char.width : -attackWidth;

    gameStateRef.current.attacks.push({
      x: char.x + offsetX,
      y: char.y + char.height / 2,
      width: attackWidth,
      height: attackHeight,
      damage: type === 'punch' ? 5 : 8,
      owner: char === gameStateRef.current.player1 ? 'player1' : 'player2',
      type,
      active: true,
      duration: 5
    });
  }

  function performSpecial(char: Character) {
    char.isAttacking = true;
    char.state = 'special';
    char.attackCooldown = 60;

    const isNaruto = char === gameStateRef.current.player1;
    const projectileSpeed = char.facing === 'right' ? 8 : -8;

    gameStateRef.current.projectiles.push({
      x: char.x + (char.facing === 'right' ? char.width : 0),
      y: char.y + char.height / 2,
      vx: projectileSpeed,
      vy: 0,
      width: 30,
      height: 30,
      damage: 15,
      owner: char === gameStateRef.current.player1 ? 'player1' : 'player2',
      type: isNaruto ? 'rasengan' : 'chidori',
      active: true,
      animationFrame: 0
    });
  }

  function updateAttacks(state: GameState) {
    state.attacks = state.attacks.filter(attack => {
      attack.duration--;
      return attack.duration > 0;
    });
  }

  function updateProjectiles(state: GameState) {
    state.projectiles.forEach(proj => {
      proj.x += proj.vx;
      proj.animationFrame = (proj.animationFrame + 1) % 8;

      if (proj.x < -50 || proj.x > CANVAS_WIDTH + 50) {
        proj.active = false;
      }
    });

    state.projectiles = state.projectiles.filter(p => p.active);
  }

  function checkCollisions(state: GameState) {
    // Check attacks
    state.attacks.forEach(attack => {
      const target = attack.owner === 'player1' ? state.player2 : state.player1;

      if (checkRectCollision(attack, target)) {
        if (target.isBlocking) {
          target.blockStun = 10;
          target.combo = 0;
        } else if (target.hitCooldown === 0) {
          target.health -= attack.damage;
          target.hitCooldown = 20;
          target.combo++;

          const knockback = attack.owner === 'player1' ? 15 : -15;
          target.vx = knockback;
          target.vy = -5;
          target.isGrounded = false;

          if (target.health <= 0) {
            target.health = 0;
            endRound();
          }
        }
        attack.duration = 0;
      }
    });

    // Check projectiles
    state.projectiles.forEach(proj => {
      const target = proj.owner === 'player1' ? state.player2 : state.player1;

      if (checkRectCollision(proj, target)) {
        if (target.isBlocking) {
          target.blockStun = 15;
          target.health -= proj.damage * 0.3;
        } else if (target.hitCooldown === 0) {
          target.health -= proj.damage;
          target.hitCooldown = 30;

          const knockback = proj.owner === 'player1' ? 20 : -20;
          target.vx = knockback;
          target.vy = -8;
          target.isGrounded = false;

          if (target.health <= 0) {
            target.health = 0;
            endRound();
          }
        }
        proj.active = false;
      }
    });
  }

  function checkRectCollision(rect1: any, rect2: any): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  function endRound() {
    const state = gameStateRef.current;

    if (state.player1.health > state.player2.health) {
      state.winner = 'player1';
    } else if (state.player2.health > state.player1.health) {
      state.winner = 'player2';
    } else {
      state.winner = state.player1.x < state.player2.x ? 'player2' : 'player1';
    }

    state.gameOver = true;
  }

  function render(ctx: CanvasRenderingContext2D) {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GROUND_Y + 60, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 60);

    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, GROUND_Y + 50, CANVAS_WIDTH, 10);

    if (!gameStarted) {
      drawStartScreen(ctx);
      return;
    }

    const state = gameStateRef.current;

    // Draw characters
    drawCharacter(ctx, state.player1, 'naruto');
    drawCharacter(ctx, state.player2, 'sasuke');

    // Draw attacks
    state.attacks.forEach(attack => {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fillRect(attack.x, attack.y, attack.width, attack.height);
    });

    // Draw projectiles
    state.projectiles.forEach(proj => {
      drawProjectile(ctx, proj);
    });

    // Draw UI
    drawUI(ctx, state);

    if (state.gameOver) {
      drawGameOver(ctx, state);
    }
  }

  function drawCharacter(ctx: CanvasRenderingContext2D, char: Character, type: 'naruto' | 'sasuke') {
    let sprite;

    if (type === 'naruto') {
      switch (char.state) {
        case 'walk':
          sprite = narutoSprites.walk.frames[0];
          break;
        case 'punch':
          sprite = narutoSprites.punch.frames[0];
          break;
        case 'kick':
          sprite = narutoSprites.kick.frames[0];
          break;
        case 'special':
          sprite = narutoSprites.rasengan.frames[0];
          break;
        default:
          sprite = narutoSprites.idle.frames[0];
      }
    } else {
      switch (char.state) {
        case 'walk':
          sprite = sasukeSprites.walk.frames[0];
          break;
        case 'punch':
          sprite = sasukeSprites.punch.frames[0];
          break;
        case 'kick':
          sprite = sasukeSprites.kick.frames[0];
          break;
        case 'special':
          sprite = sasukeSprites.chidori.frames[0];
          break;
        default:
          sprite = sasukeSprites.idle.frames[0];
      }
    }

    drawSprite(ctx, sprite, char.x, char.y, char.facing === 'left');

    // Draw hit indicator
    if (char.hitCooldown > 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(char.x, char.y, char.width, char.height);
    }

    // Draw block indicator
    if (char.isBlocking) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(char.x - 5, char.y - 5, char.width + 10, char.height + 10);
    }
  }

  function drawSprite(ctx: CanvasRenderingContext2D, spriteData: string, x: number, y: number, flipH: boolean) {
    const lines = spriteData.trim().split('\n').map(line => line.trim());
    const pixelSize = 1;

    ctx.save();

    if (flipH) {
      ctx.translate(x + lines[0].length * pixelSize, y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(x, y);
    }

    for (let row = 0; row < lines.length; row++) {
      for (let col = 0; col < lines[row].length; col++) {
        const char = lines[row][col];
        if (char !== '.' && colors[char]) {
          ctx.fillStyle = colors[char];
          ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    ctx.restore();
  }

  function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
    const size = proj.width;
    const centerX = proj.x + size / 2;
    const centerY = proj.y + size / 2;

    if (proj.type === 'rasengan') {
      // Rasengan - blue spiral
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#6699ff');
      gradient.addColorStop(1, '#0066ff');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Spiral effect
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      const angle = proj.animationFrame * Math.PI / 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const startAngle = angle + (i * Math.PI * 2 / 3);
        ctx.arc(centerX, centerY, size / 3, startAngle, startAngle + Math.PI / 2);
        ctx.stroke();
      }
    } else {
      // Chidori - electric blue
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#00ffff');
      gradient.addColorStop(1, '#0088ff');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Lightning bolts
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const angle = (proj.animationFrame + i) * Math.PI / 2.5;
        const x1 = centerX + Math.cos(angle) * size / 3;
        const y1 = centerY + Math.sin(angle) * size / 3;
        const x2 = centerX + Math.cos(angle) * size / 1.5;
        const y2 = centerY + Math.sin(angle) * size / 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  }

  function drawUI(ctx: CanvasRenderingContext2D, state: GameState) {
    // Health bars
    const barWidth = 300;
    const barHeight = 30;
    const padding = 20;

    // Player 1 health bar (left)
    ctx.fillStyle = '#000';
    ctx.fillRect(padding, padding, barWidth, barHeight);

    const p1HealthWidth = (state.player1.health / state.player1.maxHealth) * barWidth;
    ctx.fillStyle = state.player1.health > 30 ? '#ff6600' : '#ff0000';
    ctx.fillRect(padding, padding, p1HealthWidth, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, barWidth, barHeight);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('NARUTO', padding + 5, padding + 20);

    // Player 2 health bar (right)
    ctx.fillStyle = '#000';
    ctx.fillRect(CANVAS_WIDTH - padding - barWidth, padding, barWidth, barHeight);

    const p2HealthWidth = (state.player2.health / state.player2.maxHealth) * barWidth;
    const p2HealthX = CANVAS_WIDTH - padding - p2HealthWidth;
    ctx.fillStyle = state.player2.health > 30 ? '#0066ff' : '#ff0000';
    ctx.fillRect(p2HealthX, padding, p2HealthWidth, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(CANVAS_WIDTH - padding - barWidth, padding, barWidth, barHeight);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText('SASUKE', CANVAS_WIDTH - padding - 5, padding + 20);

    // Timer
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(state.timeLeft.toString(), CANVAS_WIDTH / 2, 50);

    // Round
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`ROUND ${state.round}`, CANVAS_WIDTH / 2, 80);

    // Controls hint
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText('P1: WASD + G(Punch) H(Kick) J(Rasengan) K(Block)', 10, CANVAS_HEIGHT - 10);
    ctx.textAlign = 'right';
    ctx.fillText('P2: Arrows + 1(Punch) 2(Kick) 3(Chidori) 0(Block)', CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  }

  function drawStartScreen(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NARUTO vs SASUKE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);

    ctx.font = 'bold 30px Arial';
    ctx.fillText('2D FIGHTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);

    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    let y = CANVAS_HEIGHT / 2 + 100;
    ctx.fillText('Player 1 (Naruto):', 100, y);
    ctx.fillText('WASD - Move', 120, y + 25);
    ctx.fillText('G - Punch', 120, y + 45);
    ctx.fillText('H - Kick', 120, y + 65);
    ctx.fillText('J - Rasengan', 120, y + 85);
    ctx.fillText('K - Block', 120, y + 105);

    ctx.textAlign = 'right';
    ctx.fillText('Player 2 (Sasuke):', CANVAS_WIDTH - 100, y);
    ctx.fillText('Arrow Keys - Move', CANVAS_WIDTH - 120, y + 25);
    ctx.fillText('1 - Punch', CANVAS_WIDTH - 120, y + 45);
    ctx.fillText('2 - Kick', CANVAS_WIDTH - 120, y + 65);
    ctx.fillText('3 - Chidori', CANVAS_WIDTH - 120, y + 85);
    ctx.fillText('0 - Block', CANVAS_WIDTH - 120, y + 105);
  }

  function drawGameOver(ctx: CanvasRenderingContext2D, state: GameState) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';

    const winner = state.winner === 'player1' ? 'NARUTO' : 'SASUKE';
    ctx.fillText(`${winner} WINS!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', background: '#000' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ border: '4px solid #333', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
      />
    </div>
  );
}
