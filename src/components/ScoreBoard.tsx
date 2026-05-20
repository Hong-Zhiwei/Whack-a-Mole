import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameStats, DIFFICULTY_LEVELS } from '../types';
import { Play, Pause, Volume2, VolumeX, HelpCircle, ShieldAlert } from 'lucide-react';

interface ScoreBoardProps {
  stats: GameStats;
  difficultyLevel: number;
  timeLeft: number;
  isPaused: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onShowRules: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  stats,
  difficultyLevel,
  timeLeft,
  isPaused,
  isMuted,
  onTogglePause,
  onToggleMute,
  onShowRules,
}) => {
  // 取得對應等級的難度上限
  const currentDiff = DIFFICULTY_LEVELS.find((d) => d.level === difficultyLevel) || DIFFICULTY_LEVELS[0];
  const nextDiff = DIFFICULTY_LEVELS.find((d) => d.level === difficultyLevel + 1);
  const nextGoalStr = nextDiff ? nextDiff.minScore.toLocaleString() : 'MAX';

  // 取得 Combo 乘數
  let comboMultiplier = 1.0;
  if (stats.currentCombo >= 10) comboMultiplier = 2.0;
  else if (stats.currentCombo >= 5) comboMultiplier = 1.5;

  // 格式化時間：以 00:XX 形式呈現
  const formattedTime = `00:${timeLeft.toString().padStart(2, '0')}`;

  // 格式化分數：補足多位數字 (如 03,840)
  const formattedScore = stats.score.toLocaleString('en-US', { minimumIntegerDigits: 1 });

  return (
    <div id="scoreboard-hud" className="w-full flex flex-col gap-4">
      {/* 頂部非常精緻之附屬控制列 (選單資訊) */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          {/* 精美小裝飾 */}
          <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[10px] uppercase font-mono tracking-widest text-cyan-400">
            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
            Arcade Edition
          </div>
          
          <button
            onMouseDown={(e) => { e.preventDefault(); onShowRules(); }}
            className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5 text-[10px] font-mono flex items-center gap-1"
            title="查看玩法介紹"
          >
            <HelpCircle size={12} />
            GUIDE
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* 暫停按鈕 */}
          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono tracking-wider border transition-all ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
            }`}
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>

          {/* 靜音切換 */}
          <button
            onClick={onToggleMute}
            className={`p-1 px-1.5 rounded border text-[10px] font-mono transition-all ${
              isMuted
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
            }`}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        </div>
      </div>

      {/* 2. 核心大標面板 - 採 Sleek Interface 的 3 個大型 Glass 卡片面板佈局 */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch z-10">
        
        {/* 左側：極限連擊面板 (設計圖 1) */}
        <div className="glass p-5 flex flex-col gap-1 justify-center">
          <div className="text-xs uppercase tracking-widest opacity-50 font-semibold font-sans">
            Current Combo
          </div>
          <div className="text-5xl font-black text-orange-500 italic flex items-center gap-3 font-mono">
            x{stats.currentCombo}
            {stats.currentCombo >= 5 && (
              <span className="text-xs uppercase not-italic tracking-normal px-2 py-0.5 bg-orange-500/20 rounded border border-orange-500/30 animate-pulse font-sans">
                Bonus Active
              </span>
            )}
          </div>
          <div className="text-xs text-orange-200/60 font-mono">
            Score Multiplier: {comboMultiplier.toFixed(1)}x
          </div>
        </div>

        {/* 中間：精準倒數計時與狀態條 (設計圖 2) */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="glass px-8 py-3.5 flex flex-col items-center w-full">
            <div className="text-[10px] uppercase tracking-tighter opacity-40 font-bold mb-1">
              Time Remaining
            </div>
            <div className={`text-4xl font-mono font-bold tracking-widest ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
              {formattedTime}
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <div className="glass px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider text-green-400 flex-1 text-center font-mono">
              Lv. {difficultyLevel} Hyper
            </div>
            <div className="glass px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider text-pink-400 flex-1 text-center font-mono">
              Record: {stats.highScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 右側：總得分面板 (設計圖 3) */}
        <div className="glass p-5 md:text-right flex flex-col gap-1 justify-center">
          <div className="text-xs uppercase tracking-widest opacity-50 font-semibold font-sans">
            Total Score
          </div>
          <div className="text-5xl font-black tracking-tight text-white font-mono">
            {formattedScore}
          </div>
          <div className="text-xs text-white/40 font-mono">
            Next Level Goal: {nextGoalStr}
          </div>
        </div>

      </div>

      {/* 3. 底部性能回饋狀態條 (設計圖 bottom) */}
      <div className="glass w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-[10px] uppercase opacity-40 font-bold mb-0.5 font-sans">Accuracy Rate</span>
          <div className="text-xl font-bold font-mono text-emerald-300">{stats.accuracy}%</div>
        </div>
        
        {/* 簡單防護與爆炸警報提示 */}
        {stats.bombHits > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-mono">
            <ShieldAlert size={12} />
            BOMB HIT: {stats.bombHits}
          </div>
        )}

        <div className="flex flex-col items-center sm:items-end">
          <span className="text-[10px] uppercase opacity-40 font-bold mb-0.5 font-sans">Best Streak Record</span>
          <div className="text-xl font-bold font-mono text-amber-300">{stats.maxCombo} Hits</div>
        </div>
      </div>
    </div>
  );
};
