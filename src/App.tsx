import { useEffect, useRef, useState, useCallback } from 'react';

// ==================== MUSIC SYSTEM ====================
// Note frequencies
const NOTES: { [key: string]: number } = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
  'C6': 1046.50, 'Db': 277.18, 'Eb': 311.13, 'Gb': 369.99, 'Ab': 415.30, 'Bb': 466.16,
  'Db3': 138.59, 'Eb3': 155.56, 'Gb3': 185.00, 'Ab3': 207.65, 'Bb3': 233.08,
  'Db4': 277.18, 'Eb4': 311.13, 'Gb4': 369.99, 'Ab4': 415.30, 'Bb4': 466.16,
  'REST': 0
};

// Musical patterns - inspired by classic arcade games
const PATTERNS = {
  // Menu theme - mysterious space vibe
  menu: {
    bpm: 100,
    melody: [
      ['E4', 0.5], ['REST', 0.25], ['E4', 0.25], ['G4', 0.5], ['REST', 0.5],
      ['A4', 0.5], ['G4', 0.5], ['E4', 0.5], ['REST', 0.5],
      ['D4', 0.5], ['REST', 0.25], ['D4', 0.25], ['E4', 0.5], ['REST', 0.5],
      ['G4', 0.5], ['E4', 0.5], ['D4', 0.5], ['C4', 0.5],
    ],
    bass: [
      ['C3', 1], ['G2', 1], ['A2', 1], ['E2', 1],
      ['F2', 1], ['C3', 1], ['G2', 1], ['G2', 1],
    ],
  },
  // Main gameplay - intense and driving
  gameplay: {
    bpm: 140,
    melody: [
      ['C5', 0.25], ['REST', 0.25], ['G4', 0.25], ['REST', 0.25],
      ['C5', 0.25], ['REST', 0.25], ['Eb5', 0.5],
      ['C5', 0.25], ['REST', 0.25], ['G4', 0.25], ['REST', 0.25],
      ['Bb4', 0.5], ['G4', 0.5],
      ['C5', 0.25], ['REST', 0.25], ['G4', 0.25], ['REST', 0.25],
      ['C5', 0.25], ['F5', 0.25], ['E5', 0.25], ['C5', 0.25],
      ['G4', 0.5], ['REST', 0.5],
    ],
    bass: [
      ['C3', 0.5], ['C3', 0.5], ['Eb3', 0.5], ['C3', 0.5],
      ['Bb2', 0.5], ['G2', 0.5], ['C3', 0.5], ['G2', 0.5],
    ],
    arp: [
      ['C4', 0.25], ['E4', 0.25], ['G4', 0.25], ['C5', 0.25],
      ['C4', 0.25], ['E4', 0.25], ['G4', 0.25], ['C5', 0.25],
    ],
  },
  // Intense phase - when few aliens remain
  intense: {
    bpm: 160,
    melody: [
      ['C5', 0.125], ['C5', 0.125], ['REST', 0.125], ['C5', 0.125],
      ['REST', 0.125], ['C5', 0.125], ['Bb4', 0.125], ['C5', 0.125],
      ['G4', 0.25], ['REST', 0.25], ['C5', 0.125], ['C5', 0.125],
      ['REST', 0.125], ['C5', 0.125], ['Eb5', 0.25], ['C5', 0.25],
    ],
    bass: [
      ['C3', 0.25], ['C3', 0.25], ['C3', 0.25], ['C3', 0.25],
      ['G2', 0.25], ['G2', 0.25], ['Bb2', 0.25], ['Bb2', 0.25],
    ],
  },
  // Level complete jingle
  victory: {
    bpm: 120,
    melody: [
      ['C5', 0.25], ['E5', 0.25], ['G5', 0.5], ['REST', 0.25],
      ['E5', 0.25], ['G5', 0.5], ['C6', 1],
    ],
  },
};

class AudioManager {
  private audioContext: AudioContext | null = null;
  private initialized = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  private currentPattern: string | null = null;
  private isPlaying = false;
  private schedulerInterval: number | null = null;
  private nextNoteTime = 0;
  private currentBeat = 0;
  
  private musicVolume = 0.3;
  private sfxVolume = 0.5;

  init() {
    if (this.initialized) return;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create gain nodes for mixing
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.audioContext.destination);
    
    this.musicGain = this.audioContext.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.masterGain);
    
    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);
    
    this.initialized = true;
  }

  private playNote(frequency: number, type: OscillatorType, duration: number, gainNode: GainNode, volume: number = 0.3, detune: number = 0) {
    if (!this.audioContext || frequency === 0) return;
    
    const osc = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();
    
    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = detune;
    
    noteGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    osc.connect(noteGain);
    noteGain.connect(gainNode);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration + 0.05);
  }

  private playArpNote(frequency: number, type: OscillatorType, duration: number, gainNode: GainNode, volume: number = 0.15) {
    if (!this.audioContext || frequency === 0) return;
    
    const osc = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = type;
    osc.frequency.value = frequency;
    
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    
    noteGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(gainNode);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration + 0.05);
  }

  // Background music system
  startMusic(patternName: 'menu' | 'gameplay' | 'intense') {
    this.init();
    if (!this.audioContext || !this.musicGain) return;
    
    if (this.currentPattern === patternName && this.isPlaying) return;
    
    this.stopMusic();
    this.currentPattern = patternName;
    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.1;
    
    const pattern = PATTERNS[patternName];
    const secondsPerBeat = 60 / pattern.bpm;
    
    const scheduleNotes = () => {
      if (!this.audioContext || !this.musicGain || !this.isPlaying) return;
      
      while (this.nextNoteTime < this.audioContext.currentTime + 0.2) {
        const melodyIndex = this.currentBeat % pattern.melody.length;
        const bassIndex = this.currentBeat % pattern.bass.length;
        
        const melodyItem = pattern.melody[melodyIndex];
        const bassItem = pattern.bass[bassIndex];
        const melodyNote = melodyItem[0] as string;
        const melodyDuration = melodyItem[1] as number;
        const bassNote = bassItem[0] as string;
        const bassDuration = bassItem[1] as number;
        
        // Play melody
        const melodyFreq = NOTES[melodyNote];
        if (melodyFreq > 0) {
          this.playNote(melodyFreq, 'square', melodyDuration * secondsPerBeat * 0.9, this.musicGain, 0.2);
        }
        
        // Play bass
        const bassFreq = NOTES[bassNote];
        if (bassFreq > 0) {
          this.playNote(bassFreq, 'triangle', bassDuration * secondsPerBeat * 0.9, this.musicGain, 0.3);
        }
        
        // Play arp if available
        if ('arp' in pattern && pattern.arp) {
          const arpPattern = pattern.arp as [string, number][];
          const arpIndex = this.currentBeat % arpPattern.length;
          const arpItem = arpPattern[arpIndex];
          const arpNote = arpItem[0] as string;
          const arpDuration = arpItem[1] as number;
          const arpFreq = NOTES[arpNote];
          if (arpFreq > 0) {
            this.playArpNote(arpFreq * 2, 'sawtooth', arpDuration * secondsPerBeat * 0.8, this.musicGain, 0.1);
          }
        }
        
        this.nextNoteTime += secondsPerBeat * 0.5;
        this.currentBeat++;
      }
    };
    
    this.schedulerInterval = window.setInterval(scheduleNotes, 50);
  }

  stopMusic() {
    this.isPlaying = false;
    this.currentPattern = null;
    if (this.schedulerInterval !== null) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  playVictory() {
    this.init();
    if (!this.audioContext || !this.musicGain) return;
    
    this.stopMusic();
    
    const pattern = PATTERNS.victory;
    const secondsPerBeat = 60 / pattern.bpm;
    let time = 0;
    
    pattern.melody.forEach((item) => {
      const note = item[0] as string;
      const duration = item[1] as number;
      const freq = NOTES[note];
      if (freq > 0) {
        setTimeout(() => {
          if (this.musicGain) {
            this.playNote(freq, 'square', duration * secondsPerBeat * 0.9, this.musicGain, 0.25);
            this.playNote(freq * 0.5, 'triangle', duration * secondsPerBeat * 0.9, this.musicGain, 0.2);
          }
        }, time * 1000);
      }
      time += duration * secondsPerBeat;
    });
  }

  // Sound effects
  playPlayerShoot() {
    this.init();
    if (!this.sfxGain) return;
    this.playNote(880, 'square', 0.08, this.sfxGain, 0.2);
    setTimeout(() => {
      if (this.sfxGain) this.playNote(660, 'square', 0.04, this.sfxGain, 0.15);
    }, 40);
  }

  playAlienShoot() {
    this.init();
    if (!this.audioContext || !this.sfxGain) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  playExplosion() {
    this.init();
    if (!this.audioContext || !this.sfxGain) return;
    
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const noise = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    
    noise.start();
  }

  playPlayerDeath() {
    this.init();
    if (!this.sfxGain) return;
    
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (this.sfxGain) this.playNote(400 - i * 60, 'square', 0.12, this.sfxGain, 0.25);
      }, i * 70);
    }
    setTimeout(() => this.playExplosion(), 180);
  }

  playUFO() {
    this.init();
    if (!this.audioContext || !this.sfxGain) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 400;
    
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 10;
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    
    gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.12);
    lfo.stop(this.audioContext.currentTime + 0.12);
  }

  playUFODestroy() {
    this.init();
    if (!this.sfxGain) return;
    
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.sfxGain) this.playNote(freq, 'square', 0.08, this.sfxGain, 0.2);
      }, i * 50);
    });
  }

  playGameOver() {
    this.init();
    if (!this.sfxGain) return;
    this.stopMusic();
    
    const notes = [440, 415, 392, 370, 349, 330, 311, 294, 277, 262];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.sfxGain) this.playNote(freq, 'square', 0.2, this.sfxGain, 0.2);
      }, i * 140);
    });
  }

  playMarch() {
    this.init();
    if (!this.sfxGain) return;
    
    const freq = this.lastMarchNote === 440 ? 392 : 440;
    this.lastMarchNote = freq;
    this.playNote(freq, 'square', 0.04, this.sfxGain, 0.06);
  }

  playShieldHit() {
    this.init();
    if (!this.sfxGain) return;
    this.playNote(150 + Math.random() * 50, 'square', 0.03, this.sfxGain, 0.1);
  }

  setMusicVolume(vol: number) {
    this.musicVolume = vol;
    if (this.musicGain) this.musicGain.gain.value = vol;
  }

  setSfxVolume(vol: number) {
    this.sfxVolume = vol;
    if (this.sfxGain) this.sfxGain.gain.value = vol;
  }

  getCurrentPattern(): string | null {
    return this.currentPattern;
  }

  private lastMarchNote = 440;
}

const audioManager = new AudioManager();

// Game constants
const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ALIEN_ROWS = 5;
const ALIEN_COLS = 11;
const ALIEN_WIDTH = 30;
const ALIEN_HEIGHT = 24;
const ALIEN_PADDING = 8;
const ALIEN_BULLET_SPEED = 5;
const SHIELD_COUNT = 4;
const SHIELD_WIDTH = 60;
const SHIELD_HEIGHT = 45;
const UFO_WIDTH = 48;
const UFO_HEIGHT = 20;
const UFO_SPEED = 2;

// Types
interface Position {
  x: number;
  y: number;
}

interface Alien extends Position {
  type: number;
  alive: boolean;
}

interface Bullet extends Position {
  isAlien: boolean;
}

interface Shield {
  x: number;
  y: number;
  pixels: boolean[][];
}

interface UFO extends Position {
  active: boolean;
  direction: number;
  points: number;
}

interface Explosion extends Position {
  frame: number;
}

interface GameState {
  player: Position;
  aliens: Alien[];
  bullets: Bullet[];
  shields: Shield[];
  ufo: UFO;
  explosions: Explosion[];
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  gameWon: boolean;
  paused: boolean;
  started: boolean;
  alienDirection: number;
  alienSpeed: number;
  alienMoveTimer: number;
  alienShootTimer: number;
  ufoTimer: number;
}

// Pixel art for aliens
const ALIEN_SPRITES = [
  // Type 0 - Squid (top row)
  [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,0,1,0,0,1,0,0],
    [0,1,0,1,1,0,1,0],
    [1,0,1,0,0,1,0,1],
  ],
  // Type 1 - Crab (middle rows)
  [
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,1],
    [0,0,0,1,1,0,1,1,0,0,0],
  ],
  // Type 2 - Octopus (bottom rows)
  [
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,0,0,1,1,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,1,1,0,0,1,1,0,0,0],
    [0,0,1,1,0,1,1,0,1,1,0,0],
    [1,1,0,0,0,0,0,0,0,0,1,1],
  ],
];

const PLAYER_SPRITE = [
  [0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1],
];

const UFO_SPRITE = [
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,0,1,0,1,0,1,1,0,1,0,1,0,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,0,0,1,1,0,0,1,1,1,0,0],
  [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
];

// Initialize game state
function createInitialState(): GameState {
  const aliens: Alien[] = [];
  const startX = (GAME_WIDTH - ALIEN_COLS * (ALIEN_WIDTH + ALIEN_PADDING)) / 2;
  const startY = 60;

  for (let row = 0; row < ALIEN_ROWS; row++) {
    for (let col = 0; col < ALIEN_COLS; col++) {
      aliens.push({
        x: startX + col * (ALIEN_WIDTH + ALIEN_PADDING),
        y: startY + row * (ALIEN_HEIGHT + ALIEN_PADDING),
        type: row < 1 ? 0 : row < 3 ? 1 : 2,
        alive: true,
      });
    }
  }

  // Create shields
  const shields: Shield[] = [];
  const shieldSpacing = GAME_WIDTH / (SHIELD_COUNT + 1);
  
  for (let i = 0; i < SHIELD_COUNT; i++) {
    const pixels: boolean[][] = [];
    // Create shield shape
    for (let y = 0; y < SHIELD_HEIGHT; y++) {
      pixels[y] = [];
      for (let x = 0; x < SHIELD_WIDTH; x++) {
        // Shield shape with notch at bottom
        const inShield = 
          y >= 0 && 
          y < SHIELD_HEIGHT - 10 && 
          x >= 5 && 
          x < SHIELD_WIDTH - 5;
        const notch = 
          y >= SHIELD_HEIGHT - 15 && 
          x >= SHIELD_WIDTH / 2 - 10 && 
          x < SHIELD_WIDTH / 2 + 10;
        pixels[y][x] = inShield && !notch;
      }
    }
    shields.push({
      x: shieldSpacing * (i + 1) - SHIELD_WIDTH / 2,
      y: GAME_HEIGHT - 120,
      pixels,
    });
  }

  return {
    player: { x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2, y: GAME_HEIGHT - 40 },
    aliens,
    bullets: [],
    shields,
    ufo: { x: -UFO_WIDTH, y: 30, active: false, direction: 1, points: 100 },
    explosions: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    gameWon: false,
    paused: false,
    started: false,
    alienDirection: 1,
    alienSpeed: 55,
    alienMoveTimer: 0,
    alienShootTimer: 0,
    ufoTimer: 0,
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Draw pixel sprite
  const drawSprite = useCallback((
    ctx: CanvasRenderingContext2D,
    sprite: number[][],
    x: number,
    y: number,
    scale: number,
    color: string
  ) => {
    ctx.fillStyle = color;
    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        if (sprite[row][col]) {
          ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
        }
      }
    }
  }, []);

  // Check collision between bullet and rectangle (with expanded hitbox)
  const checkBulletCollision = useCallback((
    bullet: Bullet,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean => {
    const bulletWidth = 4;
    const bulletHeight = 10;
    return (
      bullet.x + bulletWidth >= x &&
      bullet.x <= x + width &&
      bullet.y + bulletHeight >= y &&
      bullet.y <= y + height
    );
  }, []);

  // Check pixel-perfect collision with shield
  const checkShieldCollision = useCallback((
    bullet: Bullet,
    shield: Shield
  ): { hit: boolean; damageX: number; damageY: number } => {
    const relX = Math.floor(bullet.x - shield.x);
    const relY = Math.floor(bullet.y - shield.y);
    
    if (relX < 0 || relX >= SHIELD_WIDTH || relY < 0 || relY >= SHIELD_HEIGHT) {
      return { hit: false, damageX: 0, damageY: 0 };
    }

    if (shield.pixels[relY]?.[relX]) {
      return { hit: true, damageX: relX, damageY: relY };
    }

    return { hit: false, damageX: 0, damageY: 0 };
  }, []);

  // Apply damage to shield
  const damageShield = useCallback((shield: Shield, centerX: number, centerY: number, radius: number) => {
    for (let y = Math.max(0, centerY - radius); y < Math.min(SHIELD_HEIGHT, centerY + radius); y++) {
      for (let x = Math.max(0, centerX - radius); x < Math.min(SHIELD_WIDTH, centerX + radius); x++) {
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (dist < radius && Math.random() > 0.3) {
          shield.pixels[y][x] = false;
        }
      }
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameState.started || gameState.gameOver || gameState.gameWon || gameState.paused) {
      return;
    }

    const gameLoop = (): void => {
      setGameState((prev) => {
        const newState = { ...prev };
        const keys = keysRef.current;

        // Move player
        if (keys.has('ArrowLeft') || keys.has('a')) {
          newState.player = {
            ...newState.player,
            x: Math.max(0, newState.player.x - PLAYER_SPEED),
          };
        }
        if (keys.has('ArrowRight') || keys.has('d')) {
          newState.player = {
            ...newState.player,
            x: Math.min(GAME_WIDTH - PLAYER_WIDTH, newState.player.x + PLAYER_SPEED),
          };
        }

        // Player shooting
        const now = Date.now();
        if (keys.has(' ') && now - lastShotRef.current > 300) {
          const playerBullets = newState.bullets.filter(b => !b.isAlien);
          if (playerBullets.length < 1) {
            newState.bullets = [
              ...newState.bullets,
              {
                x: newState.player.x + PLAYER_WIDTH / 2 - 2,
                y: newState.player.y - 10,
                isAlien: false,
              },
            ];
            lastShotRef.current = now;
            audioManager.playPlayerShoot();
          }
        }

        // Update bullets
        newState.bullets = newState.bullets
          .map((b) => ({
            ...b,
            y: b.isAlien ? b.y + ALIEN_BULLET_SPEED : b.y - BULLET_SPEED,
          }))
          .filter((b) => b.y > 0 && b.y < GAME_HEIGHT);

        // Update explosions
        newState.explosions = newState.explosions
          .map((e) => ({ ...e, frame: e.frame + 1 }))
          .filter((e) => e.frame < 15);

        // Alien movement
        newState.alienMoveTimer++;
        const aliveAliens = newState.aliens.filter((a) => a.alive);
        const speedMultiplier = Math.max(1, (ALIEN_ROWS * ALIEN_COLS) / Math.max(1, aliveAliens.length));
        const currentSpeed = Math.max(5, newState.alienSpeed / speedMultiplier);

        if (newState.alienMoveTimer >= currentSpeed) {
          newState.alienMoveTimer = 0;

          let shouldMoveDown = false;
          const newDirection = newState.alienDirection;

          // Check boundaries
          for (const alien of aliveAliens) {
            if (
              (newDirection > 0 && alien.x + ALIEN_WIDTH + 5 >= GAME_WIDTH) ||
              (newDirection < 0 && alien.x - 5 <= 0)
            ) {
              shouldMoveDown = true;
              break;
            }
          }

          newState.aliens = newState.aliens.map((alien) => {
            if (!alien.alive) return alien;
            if (shouldMoveDown) {
              return { ...alien, y: alien.y + 18 };
            }
            return { ...alien, x: alien.x + newDirection * 10 };
          });

          if (shouldMoveDown) {
            newState.alienDirection = -newDirection;
          }
          audioManager.playMarch();
        }

        // Alien shooting
        newState.alienShootTimer++;
        if (newState.alienShootTimer >= 35) {
          newState.alienShootTimer = 0;
          
          // Find lowest alien in each column
          const columns: { [key: number]: Alien } = {};
          for (const alien of aliveAliens) {
            const col = Math.round(alien.x / (ALIEN_WIDTH + ALIEN_PADDING));
            if (!columns[col] || alien.y > columns[col].y) {
              columns[col] = alien;
            }
          }

          const shooters = Object.values(columns);
          if (shooters.length > 0 && Math.random() < 0.35) {
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            newState.bullets = [
              ...newState.bullets,
              {
                x: shooter.x + ALIEN_WIDTH / 2,
                y: shooter.y + ALIEN_HEIGHT,
                isAlien: true,
              },
            ];
            audioManager.playAlienShoot();
            // 15% chance for double shot
            if (Math.random() < 0.15 && shooters.length > 1) {
              const shooter2 = shooters[Math.floor(Math.random() * shooters.length)];
              newState.bullets.push({
                x: shooter2.x + ALIEN_WIDTH / 2,
                y: shooter2.y + ALIEN_HEIGHT,
                isAlien: true,
              });
            }
          }
        }

        // UFO logic
        newState.ufoTimer++;
        if (!newState.ufo.active && newState.ufoTimer > 600 && Math.random() < 0.01) {
          newState.ufo = {
            ...newState.ufo,
            active: true,
            direction: Math.random() < 0.5 ? 1 : -1,
            x: newState.ufo.direction > 0 ? -UFO_WIDTH : GAME_WIDTH,
            points: [50, 100, 150, 300][Math.floor(Math.random() * 4)],
          };
          newState.ufoTimer = 0;
          audioManager.playUFO();
        }

        if (newState.ufo.active) {
          newState.ufo = {
            ...newState.ufo,
            x: newState.ufo.x + UFO_SPEED * newState.ufo.direction,
          };
          if (newState.ufo.x < -UFO_WIDTH || newState.ufo.x > GAME_WIDTH) {
            newState.ufo = { ...newState.ufo, active: false };
          }
        }

        // Collision detection - bullets vs aliens
        for (const bullet of newState.bullets) {
          if (bullet.isAlien) continue;

          for (const alien of newState.aliens) {
            if (!alien.alive) continue;

            if (checkBulletCollision(bullet, alien.x, alien.y, ALIEN_WIDTH, ALIEN_HEIGHT)) {
              alien.alive = false;
              bullet.y = -100; // Remove bullet
              const points = alien.type === 0 ? 30 : alien.type === 1 ? 20 : 10;
              newState.score += points;
              newState.explosions.push({ x: alien.x, y: alien.y, frame: 0 });
              audioManager.playExplosion();
              break;
            }
          }

          // Bullet vs UFO
          if (newState.ufo.active && checkBulletCollision(bullet, newState.ufo.x, newState.ufo.y, UFO_WIDTH, UFO_HEIGHT)) {
            newState.score += newState.ufo.points;
            newState.explosions.push({ x: newState.ufo.x, y: newState.ufo.y, frame: 0 });
            newState.ufo = { ...newState.ufo, active: false };
            bullet.y = -100;
            audioManager.playUFODestroy();
          }

          // Bullet vs shields
          for (const shield of newState.shields) {
            const collision = checkShieldCollision(bullet, shield);
            if (collision.hit) {
              damageShield(shield, collision.damageX, collision.damageY, 5);
              bullet.y = -100;
              audioManager.playShieldHit();
              break;
            }
          }
        }

        // Collision detection - alien bullets vs player
        for (const bullet of newState.bullets) {
          if (!bullet.isAlien) continue;

          // Alien bullet vs player
          if (checkBulletCollision(bullet, newState.player.x, newState.player.y, PLAYER_WIDTH, PLAYER_HEIGHT)) {
            bullet.y = GAME_HEIGHT + 100;
            newState.lives--;
            if (newState.lives <= 0) {
              newState.gameOver = true;
              audioManager.playGameOver();
            } else {
              audioManager.playPlayerDeath();
            }
            newState.explosions.push({ x: newState.player.x, y: newState.player.y, frame: 0 });
          }

          // Alien bullet vs shields
          for (const shield of newState.shields) {
            const collision = checkShieldCollision(bullet, shield);
            if (collision.hit) {
              damageShield(shield, collision.damageX, collision.damageY, 5);
              bullet.y = GAME_HEIGHT + 100;
              break;
            }
          }
        }

        // Check if aliens reached bottom or player
        for (const alien of newState.aliens) {
          if (!alien.alive) continue;
          if (alien.y + ALIEN_HEIGHT >= newState.player.y) {
            newState.gameOver = true;
          }
          // Check collision with shields
          for (const shield of newState.shields) {
            if (
              alien.x + ALIEN_WIDTH > shield.x &&
              alien.x < shield.x + SHIELD_WIDTH &&
              alien.y + ALIEN_HEIGHT > shield.y &&
              alien.y < shield.y + SHIELD_HEIGHT
            ) {
              // Destroy shield section
              shield.pixels = shield.pixels.map(row => row.map(() => false));
            }
          }
        }

        // Check win condition
        if (aliveAliens.length === 0) {
          newState.level++;
          // Play victory jingle then restart music
          audioManager.playVictory();
          setTimeout(() => audioManager.startMusic('gameplay'), 1500);
          // Reset aliens for next level
          const startX = (GAME_WIDTH - ALIEN_COLS * (ALIEN_WIDTH + ALIEN_PADDING)) / 2;
          const startY = 60;
          newState.aliens = [];
          for (let row = 0; row < ALIEN_ROWS; row++) {
            for (let col = 0; col < ALIEN_COLS; col++) {
              newState.aliens.push({
                x: startX + col * (ALIEN_WIDTH + ALIEN_PADDING),
                y: startY + row * (ALIEN_HEIGHT + ALIEN_PADDING),
                type: row < 1 ? 0 : row < 3 ? 1 : 2,
                alive: true,
              });
            }
          }
          newState.alienSpeed = Math.max(30, 60 - (newState.level - 1) * 5);
          newState.bullets = [];
        }

        // Switch to intense music when few aliens remain
        if (aliveAliens.length > 0 && aliveAliens.length <= 15) {
          if (audioManager.getCurrentPattern() !== 'intense') {
            audioManager.startMusic('intense');
          }
        }

        return newState;
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.started, gameState.gameOver, gameState.gameWon, gameState.paused, checkBulletCollision, checkShieldCollision, damageShield]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw stars background
    ctx.fillStyle = '#333';
    for (let i = 0; i < 50; i++) {
      const x = (i * 13) % GAME_WIDTH;
      const y = (i * 17) % GAME_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw shields
    ctx.fillStyle = '#0f0';
    for (const shield of gameState.shields) {
      for (let y = 0; y < SHIELD_HEIGHT; y++) {
        for (let x = 0; x < SHIELD_WIDTH; x++) {
          if (shield.pixels[y][x]) {
            ctx.fillRect(shield.x + x, shield.y + y, 1, 1);
          }
        }
      }
    }

    // Draw aliens
    for (const alien of gameState.aliens) {
      if (!alien.alive) continue;
      const colors = ['#ff0', '#0ff', '#f0f'];
      const sprite = ALIEN_SPRITES[alien.type];
      const scale = ALIEN_WIDTH / sprite[0].length;
      drawSprite(ctx, sprite, alien.x, alien.y, scale, colors[alien.type]);
    }

    // Draw UFO
    if (gameState.ufo.active) {
      const scale = UFO_WIDTH / UFO_SPRITE[0].length;
      drawSprite(ctx, UFO_SPRITE, gameState.ufo.x, gameState.ufo.y, scale, '#f00');
    }

    // Draw player
    const playerScale = PLAYER_WIDTH / PLAYER_SPRITE[0].length;
    drawSprite(ctx, PLAYER_SPRITE, gameState.player.x, gameState.player.y, playerScale, '#0f0');

    // Draw bullets
    for (const bullet of gameState.bullets) {
      ctx.fillStyle = bullet.isAlien ? '#f00' : '#fff';
      ctx.fillRect(bullet.x, bullet.y, 4, 10);
    }

    // Draw explosions
    for (const exp of gameState.explosions) {
      const alpha = 1 - exp.frame / 15;
      ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
      const size = 20 + exp.frame;
      ctx.fillRect(exp.x - size / 4, exp.y - size / 4, size, size);
    }

    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`SCORE: ${gameState.score}`, 10, 25);
    ctx.fillText(`LEVEL: ${gameState.level}`, GAME_WIDTH / 2 - 40, 25);
    ctx.fillText(`LIVES: ${gameState.lives}`, GAME_WIDTH - 100, 25);

    // Draw start screen
    if (!gameState.started) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = '#0f0';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACEINVADERS', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
      ctx.fillText('(RE-CREATION)', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText('Press SPACE to Start', GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.fillText('Arrow Keys or A/D to Move', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
      ctx.fillText('SPACE to Shoot', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 55);
      
      // Draw alien point values
      ctx.fillText('🛸 = ???', GAME_WIDTH / 2 - 80, GAME_HEIGHT / 2 + 100);
      ctx.fillStyle = '#ff0';
      ctx.fillText('👾 = 30', GAME_WIDTH / 2 - 80, GAME_HEIGHT / 2 + 125);
      ctx.fillStyle = '#0ff';
      ctx.fillText('👾 = 20', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 125);
      ctx.fillStyle = '#f0f';
      ctx.fillText('👾 = 10', GAME_WIDTH / 2 + 80, GAME_HEIGHT / 2 + 125);
      
      ctx.textAlign = 'left';
    }

    // Draw game over screen
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = '#f00';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText(`Final Score: ${gameState.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
      ctx.font = '16px monospace';
      ctx.fillText('Press SPACE to Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 55);
      ctx.textAlign = 'left';
    }

    // Draw paused screen
    if (gameState.paused && gameState.started && !gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = '#ff0';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText('Press P to Resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);
      ctx.textAlign = 'left';
    }
  }, [gameState, drawSprite]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);

      if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
      }

      // Start game
      if (e.key === ' ' && !gameState.started) {
        lastShotRef.current = 0;
        setGameState((prev) => ({ ...prev, started: true }));
        audioManager.startMusic('gameplay');
      }

      // Restart game
      if (e.key === ' ' && gameState.gameOver) {
        lastShotRef.current = 0;
        setGameState({ ...createInitialState(), started: true });
        audioManager.startMusic('gameplay');
      }

      // Toggle pause
      if (e.key === 'p' && gameState.started && !gameState.gameOver) {
        setGameState((prev) => {
          if (prev.paused) {
            audioManager.startMusic(prev.aliens.filter(a => a.alive).length <= 15 ? 'intense' : 'gameplay');
          } else {
            audioManager.stopMusic();
          }
          return { ...prev, paused: !prev.paused };
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.started, gameState.gameOver]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-green-400 mb-4 font-mono tracking-wider">
        SPACEINVADERS (RE-CREATION)
      </h1>
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="border-2 border-green-500 shadow-lg shadow-green-500/30"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="mt-4 text-gray-400 text-sm font-mono text-center">
        <p>🎮 Arrow Keys / A-D: Move | SPACE: Shoot | P: Pause</p>
      </div>
    </div>
  );
}
