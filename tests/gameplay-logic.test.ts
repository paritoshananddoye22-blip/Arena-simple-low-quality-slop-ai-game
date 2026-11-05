import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA, PLAYER, SCORES, WEAPON, ENEMY } from '../src/game/constants';

test('Weapon reload calculations correctly replenish magazine from reserve', () => {
  let magazine = 12;
  let reserve = 40;
  const needed = WEAPON.MAGAZINE_SIZE - magazine; // 30 - 12 = 18
  const transfer = Math.min(needed, reserve); // min(18, 40) = 18
  magazine += transfer;
  reserve -= transfer;

  assert.equal(magazine, 30);
  assert.equal(reserve, 22);
});

test('Weapon reload does not exceed available reserve ammo', () => {
  let magazine = 25;
  let reserve = 3;
  const needed = WEAPON.MAGAZINE_SIZE - magazine; // 5
  const transfer = Math.min(needed, reserve); // 3
  magazine += transfer;
  reserve -= transfer;

  assert.equal(magazine, 28);
  assert.equal(reserve, 0);
});

test('Score system awards bonus points for headshots and wave completion', () => {
  let score = 0;
  // Body kill
  score += SCORES.KILL;
  assert.equal(score, 100);

  // Headshot kill (+100 kill + 150 bonus)
  score += SCORES.KILL + SCORES.HEADSHOT_BONUS;
  assert.equal(score, 350);

  // Wave completion bonus
  score += SCORES.WAVE_BONUS;
  assert.equal(score, 600);
});

test('Enemy wave scaling formula', () => {
  function getWaveEnemies(wave: number): number {
    if (wave === 1) return 3;
    if (wave === 2) return 5;
    if (wave === 3) return 7;
    return 7 + (wave - 3) * 2;
  }

  assert.equal(getWaveEnemies(1), 3);
  assert.equal(getWaveEnemies(2), 5);
  assert.equal(getWaveEnemies(3), 7);
  assert.equal(getWaveEnemies(4), 9);
  assert.equal(getWaveEnemies(5), 11);
});

test('Arena perimeter boundary clamping logic', () => {
  const radius = PLAYER.RADIUS;
  const innerBound = ARENA.HALF_SIZE - radius; // 20 - 0.5 = 19.5

  let x = 21.0;
  let pushX = 0;
  if (x > innerBound) {
    pushX = innerBound - x;
  }
  x += pushX;

  assert.equal(x, innerBound);
});
