import React from 'react';
import { motion } from 'motion/react';
import { GameStage, GameStats } from '../types';
import { Flame, Medal, Award, Play, RotateCcw, Volume2, VolumeX, Shield, ShieldAlert, Zap, Target } from 'lucide-react';

interface GameMenuProps {
  stage: GameStage;
  stats: GameStats;
  isMuted: boolean;
  onStartGame: () => void;
  onToggleMute: () => void;
  showRulesFirst: boolean;
  onCloseRulesFirst: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({
  stage,
  stats,
  isMuted,
  onStartGame,
  onToggleMute,
  showRulesFirst,
  onCloseRulesFirst,
}) => {
  // 結算等級判定
  const getPerformanceRating = (score: number) => {
    if (score >= 1500) return { title: '地神之王 👑', color: 'text-amber-400', desc: '神明般的反應速度，地鼠們看見你都得發抖！' };
    if (score >= 900) return { title: '黃金捕手 🌟', color: 'text-yellow-300', desc: '身手超群，極限連打得心應手，近乎完美！' };
    if (score >= 500) return { title: '除鼠先鋒 ⚔️', color: 'text-indigo-300', desc: '手速卓越！地底軍團已經被你打得潰不成軍。' };
    if (score >= 200) return { title: '特訓新手 🪵', color: 'text-emerald-300', desc: '初露鋒芒，再接再厲即可解鎖更強大的手速！' };
    return { title: '街機愛好者 🎮', color: 'text-slate-400', desc: '慢慢熟悉地鼠的出沒規律，相信下次會更好！' };
  };

  const rating = getPerformanceRating(stats.score);

  // 計算是否破最高分
  const isNewRecord = stats.score > 0 && stats.score === stats.highScore;

  // 取得玩家解鎖的成就徽章
  const getUnlockedBadges = () => {
    const badges = [];
    if (stats.score >= 1200 && stats.accuracy >= 85) {
      badges.push({ title: '神經反射大師', desc: '得分 1200+ 且命中率 85% 以上', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' });
    }
    if (stats.maxCombo >= 15) {
      badges.push({ title: '烈焰連擊狂魔', desc: '單局連擊打破 15 次以上', icon: Flame, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' });
    }
    if (stats.bombHits === 0 && stats.score >= 600) {
      badges.push({ title: '完美排雷家', desc: '防守零失誤且擊破 600 分', icon: Shield, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' });
    }
    if (stats.accuracy >= 92 && stats.totalClicks >= 30) {
      badges.push({ title: '鷹眼精準射手', desc: '高於 92% 的終極神準度', icon: Target, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' });
    }
    return badges;
  };

  const unlockedBadges = getUnlockedBadges();

  return (
    <div id="game-menu-overlay" className="w-full flex justify-center items-center py-4 px-2">
      {stage === GameStage.START && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl glass-panel rounded-2xl p-6 md:p-8 flex flex-col items-center text-center border border-white/10 shadow-2xl relative"
        >
          {/* 流光大標題 */}
          <div className="mb-2">
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-amber-300 to-indigo-400">
              進階打地鼠遊戲
            </h1>
            <p className="text-xs text-slate-400 font-sans mt-2 tracking-widest uppercase">
              Premium React & Web Audio Synthesizer
            </p>
          </div>

          {/* 個人最高紀錄榮譽展示 */}
          {stats.highScore > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 mb-6 px-4 py-2 bg-yellow-500/5 rounded-full border border-yellow-500/20 flex items-center gap-2 "
            >
              <Award className="text-yellow-400 w-4 h-4 animate-pulse" />
              <span className="text-xs text-yellow-100 font-sans font-medium">
                最高分紀錄受領者：<span className="text-yellow-300 font-black font-mono text-sm">{stats.highScore}</span>
              </span>
            </motion.div>
          )}

          {/* 玩法說明與圖鑑（精緻整合版） */}
          <div className="w-full bg-slate-950/40 rounded-xl p-4 border border-white/5 text-left mb-6 gap-3 flex flex-col">
            <h3 className="text-sm font-black text-slate-200 border-b border-white/10 pb-1.5 flex justify-between items-center">
              <span>👾 地鼠軍團圖鑑與得分</span>
              <span className="text-[10px] text-amber-300 font-medium">極限挑戰：30 秒</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 普通 */}
              <div className="p-2.5 rounded-lg bg-orange-950/10 border border-amber-900/10 flex items-center sm:flex-col sm:text-center gap-3">
                <span className="text-2xl bg-amber-500/10 w-10 h-10 flex items-center justify-center rounded-lg">🟫</span>
                <div>
                  <h4 className="text-xs font-bold text-amber-200">普通礦工地鼠</h4>
                  <p className="text-[10px] text-slate-400">擊中獲得 <span className="text-emerald-400 font-bold font-mono">+10</span> 分</p>
                </div>
              </div>

              {/* 黃金 */}
              <div className="p-2.5 rounded-lg bg-yellow-950/10 border border-yellow-500/10 flex items-center sm:flex-col sm:text-center gap-3">
                <span className="text-2xl bg-yellow-500/10 w-10 h-10 flex items-center justify-center rounded-lg animate-pulse">✨</span>
                <div>
                  <h4 className="text-xs font-bold text-yellow-200">金色晶石皇地鼠</h4>
                  <p className="text-[10px] text-slate-400">閃現極快，擊中 <span className="text-yellow-300 font-bold font-mono">+50</span> 分</p>
                </div>
              </div>

              {/* 炸彈 */}
              <div className="p-2.5 rounded-lg bg-red-950/10 border border-red-500/10 flex items-center sm:flex-col sm:text-center gap-3">
                <span className="text-2xl bg-red-500/10 w-10 h-10 flex items-center justify-center rounded-lg">💣</span>
                <div>
                  <h4 className="text-xs font-bold text-rose-300">感應紅外炸彈</h4>
                  <p className="text-[10px] text-slate-400">點擊扣 <span className="text-rose-500 font-bold font-mono">-20</span> 分且 Combo 歸零</p>
                </div>
              </div>
            </div>

            {/* 連擊機制說明 */}
            <div className="mt-1 p-2.5 rounded-lg bg-violet-950/10 border border-violet-500/15 text-xs text-violet-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-violet-300">
                <Flame size={14} className="text-amber-500" /> 連擊加成與 Combo 系統：
              </span>
              <p className="text-[11px] text-slate-400 pl-5 leading-normal">
                連續擊中普通或金色地鼠可累積連擊數。
                <br />
                🔥 <span className="text-amber-400 font-bold">5 Combo+</span>：得分享有 <span className="text-white font-mono font-bold">1.5 倍</span> 加成。
                <br />
                🌟 <span className="text-yellow-400 font-bold">10 Combo+</span>：得分享有 <span className="text-white font-mono font-bold">2.0 倍</span> 加成暴擊！
                <br />
                ⚠️ <span className="text-rose-400">任何漏打（地鼠沒被敲擊而自動縮回）或錯點炸彈，Combo 都會直接歸零</span>。
              </p>
            </div>
          </div>

          {/* 互動按鈕列 */}
          <div className="w-full flex flex-col sm:flex-row gap-3">
            {/* 開玩核心按鈕 */}
            <button
              onClick={onStartGame}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-500 text-white font-display font-extrabold text-lg rounded-xl shadow-[0_4px_25px_rgba(139,92,246,0.35)] hover:shadow-[0_4px_30px_rgba(139,92,246,0.50)] transition-all cursor-pointer flex items-center justify-center gap-2 transform active:scale-95 duration-150"
            >
              <Play size={20} fill="currentColor" />
              開始極限挑戰
            </button>

            {/* 音樂切換鈕 */}
            <button
              onClick={onToggleMute}
              className={`py-4 px-4 rounded-xl border font-sans text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                isMuted
                  ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {isMuted ? '音效已關' : '音效已開'}
            </button>
          </div>
        </motion.div>
      )}

      {stage === GameStage.GAMEOVER && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl glass-panel rounded-2xl p-6 md:p-8 flex flex-col border border-white/10 shadow-2xl relative"
        >
          {/* 恭喜破紀錄 / 結束頭條 */}
          <div className="text-center mb-6">
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">Challenge Settlement</span>
            
            {isNewRecord ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-2 text-3xl md:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-orange-400 filter drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]"
              >
                🎉 創造最高分紀錄！ 🎉
              </motion.div>
            ) : (
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-100 mt-2">
                挑戰結束
              </h2>
            )}

            <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              評級：<span className={`font-black font-display text-sm ${rating.color}`}>{rating.title}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 italic px-4">
              "{rating.desc}"
            </p>
          </div>

          {/* 數據結算卡片 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* 得分 */}
            <div className="glass-card rounded-xl p-3.5 border border-white/5 flex flex-col justify-between">
              <span className="text-slate-400 text-xs">最終得分</span>
              <span className="text-4xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 font-mono mt-1">
                {stats.score}
              </span>
            </div>

            {/* 最高連擊 */}
            <div className="glass-card rounded-xl p-3.5 border border-white/5 flex flex-col justify-between">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                頂級連擊 <Flame size={12} className="text-amber-500 fill-amber-500" />
              </span>
              <span className="text-3xl font-display font-extrabold text-amber-300 font-mono mt-1">
                {stats.maxCombo} <span className="text-[10px] text-slate-500">Combo</span>
              </span>
            </div>

            {/* 精準度 */}
            <div className="glass-card rounded-xl p-3.5 border border-white/5 flex flex-col justify-between">
              <span className="text-slate-400 text-xs">終端手速精準度</span>
              <span className="text-2xl font-display font-extrabold text-emerald-300 font-mono mt-1">
                {stats.accuracy}%
              </span>
              <p className="text-[9px] text-slate-500">點擊次數: {stats.totalClicks}</p>
            </div>

            {/* 擊殺分配情況 */}
            <div className="glass-card rounded-xl p-3.5 border border-white/5 flex flex-col justify-between text-xs text-slate-300 space-y-1.5">
              <span className="text-slate-400 text-[10px]">擊中地鼠分類</span>
              <div className="flex justify-between text-[11px]">
                <span className="text-amber-200">🟫 普通地鼠:</span>
                <span className="font-mono text-white">{stats.validWhacks - (stats.validWhacks > stats.score / 50 ? Math.floor(stats.validWhacks * 0.1) : 0)} 隻</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-yellow-300">✨ 金色皇地鼠:</span>
                <span className="font-mono text-yellow-300">{stats.validWhacks > stats.score / 50 ? Math.floor(stats.validWhacks * 0.1) : 0} 隻</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-rose-400">💣 遭炸彈數:</span>
                <span className="font-mono text-rose-400">{stats.bombHits} 顆</span>
              </div>
            </div>
          </div>

          {/* 解鎖成就展示面板 */}
          {unlockedBadges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-black text-slate-300 mb-2 border-b border-white/5 pb-1 select-none flex items-center gap-1.5">
                <Medal size={14} className="text-yellow-400" /> 解鎖極限榮譽成就 ({unlockedBadges.length})
              </h3>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {unlockedBadges.map((badge, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border flex items-center gap-3 transition-shadow ${badge.color}`}>
                    <span className="p-1.5 bg-white/5 rounded">
                      <badge.icon size={16} className={badge.color.split(' ')[0]} />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{badge.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 重玩按鈕 */}
          <button
            onClick={onStartGame}
            className="w-full py-4 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-display font-black text-lg rounded-xl shadow-[0_4px_20px_rgba(99,102,241,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-95 duration-150"
          >
            <RotateCcw size={18} />
            再次挑戰超越極限
          </button>
        </motion.div>
      )}
    </div>
  );
};
