/**
 * Core game configuration and constants.
 */

export const ARENA = {
  SIZE: 42, // 42x42 world units
  HALF_SIZE: 21,
  WALL_HEIGHT: 12,
  WALL_THICKNESS: 2.0,
};

export const PLAYER = {
  EYE_HEIGHT: 1.7,
  RADIUS: 0.5,
  WALK_SPEED: 5.0,
  SPRINT_SPEED: 8.0,
  JUMP_FORCE: 6.8,
  GRAVITY: 18.0,
  MAX_HEALTH: 100,
};

export const WEAPON = {
  MAGAZINE_SIZE: 30,
  START_AMMO: 30,
  START_RESERVE: 120,
  DAMAGE_BODY: 25,
  DAMAGE_HEAD: 100, // Instant critical kill or decisive hit
  FIRE_RATE: 10, // ~10 shots/sec -> 0.1s interval
  FIRE_INTERVAL: 0.1,
  RELOAD_DURATION: 1.8, // 1.8 seconds
  RECOIL_KICK: 0.04,
  RECOIL_RECOVERY: 12,
  MAX_RANGE: 100,
};

export const ENEMY = {
  BASE_HP: 100,
  SPEED: 2.6,
  CONTACT_DAMAGE: 10,
  ATTACK_COOLDOWN: 1.0,
  ATTACK_RANGE: 1.6,
  BODY_RADIUS: 0.55,
  HEIGHT: 1.85,
  HEAD_RADIUS: 0.28,
};

export const SCORES = {
  KILL: 100,
  HEADSHOT_BONUS: 150,
  WAVE_BONUS: 250,
};
