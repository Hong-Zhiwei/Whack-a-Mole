export enum MoleType {
  REGULAR = 'REGULAR', // 土黃色: +10分
  GOLDEN = 'GOLDEN',   // 金色閃爍: +50分 (時間折半)
  BOMB = 'BOMB'        // 紅色炸彈: -20分, 螢幕閃爍, Combo歸零
}

export interface Mole {
  id: number;          // 0-8
  type: MoleType;
  isActive: boolean;
  spawnTime: number;   // 毫秒時間戳記
  duration: number;    // 存在時間 (ms)
  isHit: boolean;      // 是否被擊中
  hitX?: number;       // 點擊位置 X (用於粒子效果)
  hitY?: number;       // 點擊位置 Y
}

export interface GameStats {
  score: number;
  highScore: number;
  totalClicks: number;   // 玩家點擊總次數
  totalWhacks: number;   // 點中地鼠(包含炸彈)的次數
  validWhacks: number;   // 點中普通與黃金地鼠的次數
  missedMoles: number;   // 普通/黃金地鼠未擊中縮回的次數
  bombHits: number;      // 擊中炸彈的次數
  maxCombo: number;      // 最大連擊數
  currentCombo: number;  // 當前連擊數
  accuracy: number;      // 命中率 (validWhacks / totalClicks) %
}

export enum GameStage {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export interface DifficultyConfig {
  level: number;
  minScore: number;
  maxScore: number;
  spawnInterval: number; // 生成地鼠的間隔時間 (ms)
  stayDuration: number;  // 地鼠停留時間 (ms)
  maxSimultaneous: number; // 最大同時出現的地鼠數量
}

export const DIFFICULTY_LEVELS: DifficultyConfig[] = [
  { level: 1, minScore: 0, maxScore: 150, spawnInterval: 1400, stayDuration: 1200, maxSimultaneous: 2 },
  { level: 2, minScore: 151, maxScore: 350, spawnInterval: 1200, stayDuration: 1000, maxSimultaneous: 2 },
  { level: 3, minScore: 351, maxScore: 650, spawnInterval: 1000, stayDuration: 850, maxSimultaneous: 3 },
  { level: 4, minScore: 651, maxScore: 1100, spawnInterval: 800, stayDuration: 700, maxSimultaneous: 3 },
  { level: 5, minScore: 1101, maxScore: 1700, spawnInterval: 650, stayDuration: 550, maxSimultaneous: 4 },
  { level: 6, minScore: 1701, maxScore: Infinity, spawnInterval: 500, stayDuration: 450, maxSimultaneous: 4 }
];
