/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameStage, GameStats, Mole, MoleType, DIFFICULTY_LEVELS } from './types';
import { audio } from './utils/audio';
import { ScoreBoard } from './components/ScoreBoard';
import { MoleGrid } from './components/MoleGrid';
import { GameMenu } from './components/GameMenu';
import { Sparkles, Trophy, RotateCcw, Volume2, VolumeX, Flame, ShieldAlert, X } from 'lucide-react';

export default function App() {
  // --- 遊戲狀態管理 ---
  const [stage, setStage] = useState<GameStage>(GameStage.START);
  const [moles, setMoles] = useState<(Mole | null)[]>(Array(9).fill(null));
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(audio.getMuted());
  const [flashRed, setFlashRed] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [levelUpText, setLevelUpText] = useState<string | null>(null);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: Number(localStorage.getItem('mole_high_score') || 0),
    totalClicks: 0,
    totalWhacks: 0,
    validWhacks: 0,
    missedMoles: 0,
    bombHits: 0,
    maxCombo: 0,
    currentCombo: 0,
    accuracy: 100,
  });

  // 使用 Ref 來儲存跟蹤即時變化的狀態，避免定時器閉包中獲取舊 state
  const stateRef = useRef({ moles, stats, isPaused, stage, difficultyLevel });
  useEffect(() => {
    stateRef.current = { moles, stats, isPaused, stage, difficultyLevel };
  }, [moles, stats, isPaused, stage, difficultyLevel]);

  // --- 音效開關切換 ---
  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  // --- 暫停/繼續遊戲 ---
  const handleTogglePause = () => {
    setIsPaused((p) => !p);
  };

  // --- 開始新遊戲 ---
  const handleStartGame = () => {
    audio.playGameStart();
    
    // 重置所有基礎數據
    setMoles(Array(9).fill(null));
    setTimeLeft(30);
    setDifficultyLevel(1);
    setIsPaused(false);
    
    const initialHighScore = Number(localStorage.getItem('mole_high_score') || 0);
    setStats({
      score: 0,
      highScore: initialHighScore,
      totalClicks: 0,
      totalWhacks: 0,
      validWhacks: 0,
      missedMoles: 0,
      bombHits: 0,
      maxCombo: 0,
      currentCombo: 0,
      accuracy: 100,
    });

    setStage(GameStage.PLAYING);
    setShowRules(false);
  };

  // --- 遊戲倒數計時器 (30秒) ---
  useEffect(() => {
    if (stage !== GameStage.PLAYING || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }

        // 當剩餘 5 秒內時播放滴答倒數聲
        if (prev <= 6) {
          audio.playTick(prev - 1);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, isPaused]);

  // --- 地鼠活動與自動縮回計時器控制 ---
  useEffect(() => {
    if (stage !== GameStage.PLAYING || isPaused) return;

    // 取得當前難度係數
    const difficultyConfig = DIFFICULTY_LEVELS.find((d) => d.level === difficultyLevel) || DIFFICULTY_LEVELS[0];

    const spawner = setInterval(() => {
      spawnRandomMole();
    }, difficultyConfig.spawnInterval);

    return () => clearInterval(spawner);
  }, [stage, isPaused, difficultyLevel]);

  // --- 核心：地鼠隨機跳出生成函數 ---
  const spawnRandomMole = () => {
    const { moles: currentMoles, difficultyLevel: currLevel } = stateRef.current;
    const activeConfig = DIFFICULTY_LEVELS.find((d) => d.level === currLevel) || DIFFICULTY_LEVELS[0];

    // 1. 檢查當前跳出的地鼠總合，是否大於難度上限
    const activeMolesCount = currentMoles.filter((m) => m && m.isActive).length;
    if (activeMolesCount >= activeConfig.maxSimultaneous) return;

    // 2. 獲取所有空的洞穴
    const emptyIndices: number[] = [];
    currentMoles.forEach((m, idx) => {
      if (!m || !m.isActive) {
        emptyIndices.push(idx);
      }
    });

    if (emptyIndices.length === 0) return;

    // 3. 隨機抽選一個空洞
    const randomHoleId = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

    // 4. 定向隨機抽選地鼠品種 (普通: 70%, 黃金閃爍極速: 15%, 紅色炸彈: 15%)
    const randType = Math.random();
    let type = MoleType.REGULAR;
    if (randType >= 0.85) {
      type = MoleType.BOMB;
    } else if (randType >= 0.70) {
      type = MoleType.GOLDEN;
    }

    // 5. 根據難度係數設定其浮現存在時間
    // 黃金地鼠的存在時間僅有普通及炸彈地鼠的二分之一 (一閃即逝)
    const baseDuration = activeConfig.stayDuration;
    const finalDuration = type === MoleType.GOLDEN ? baseDuration / 2 : baseDuration;

    const newMole: Mole = {
      id: randomHoleId,
      type,
      isActive: true,
      spawnTime: Date.now(),
      duration: finalDuration,
      isHit: false,
    };

    // 6. 更新 state 讓地鼠跳起
    setMoles((prev) => {
      const next = [...prev];
      next[randomHoleId] = newMole;
      return next;
    });

    // 7. 排程本隻地鼠自然潛回與 Combo 中斷檢測
    setTimeout(() => {
      // 獲取最新的地鼠狀態進行對比
      const latestMoles = stateRef.current.moles;
      const targetMole = latestMoles[randomHoleId];

      // 如果地鼠在該洞依然存在、依然是本隻地鼠且未被擊爆
      if (targetMole && targetMole.isActive && !targetMole.isHit && targetMole.spawnTime === newMole.spawnTime) {
        
        // 潛回隱身
        setMoles((prev) => {
          const next = [...prev];
          next[randomHoleId] = null;
          return next;
        });

        // 規則：如果地鼠是 普通 或 黃金 被縮回 (代表漏掉了) -> Combo 歸零！
        if (targetMole.type !== MoleType.BOMB) {
          audio.playMiss();
          setStats((prev) => {
            const newCombo = 0; // 歸零
            return {
              ...prev,
              currentCombo: newCombo,
              missedMoles: prev.missedMoles + 1,
            };
          });
        }
      }
    }, finalDuration);
  };

  // --- 核心：擊打地鼠機制 ---
  const handleWhack = (id: number, clickX: number, clickY: number) => {
    if (stage !== GameStage.PLAYING || isPaused) return;

    const targetMole = moles[id];
    if (!targetMole || !targetMole.isActive || targetMole.isHit) return;

    // 1. 新增一次總點擊記錄
    setStats((prev) => {
      const nextClicks = prev.totalClicks + 1;
      const nextTotalWhacks = prev.totalWhacks + 1;

      let scoreDelta = 0;
      let nextCombo = prev.currentCombo;
      let nextValidWhacks = prev.validWhacks;
      let nextBombHits = prev.bombHits;

      // 2. 判斷品種，計算得分加重與 Combo 倍數
      if (targetMole.type === MoleType.REGULAR) {
        // 普通地鼠：+10分
        audio.playHitRegular();
        
        let multiplier = 1.0;
        if (prev.currentCombo >= 10) multiplier = 2.0;
        else if (prev.currentCombo >= 5) multiplier = 1.5;

        scoreDelta = Math.round(10 * multiplier);
        nextCombo += 1;
        nextValidWhacks += 1;
      } 
      else if (targetMole.type === MoleType.GOLDEN) {
        // 黃金閃爍地鼠：+50分，浮現時間極短
        audio.playHitGolden();

        let multiplier = 1.0;
        if (prev.currentCombo >= 10) multiplier = 2.0;
        else if (prev.currentCombo >= 5) multiplier = 1.5;

        scoreDelta = Math.round(50 * multiplier);
        nextCombo += 1;
        nextValidWhacks += 1;
      } 
      else if (targetMole.type === MoleType.BOMB) {
        // 炸彈地鼠：扣20分！螢幕閃爍紅光且 Combo 歸零！
        audio.playHitBomb();
        scoreDelta = -20;
        nextCombo = 0; // 連擊歸零
        nextBombHits += 1;

        // 觸發紅光閃動
        setFlashRed(true);
        setTimeout(() => setFlashRed(false), 500);
      }

      // 進算分數，防止分數跌破 0 分
      const finalScore = Math.max(0, prev.score + scoreDelta);
      const isRecord = finalScore > prev.highScore;
      const nextHighScore = isRecord ? finalScore : prev.highScore;

      // 如果破了紀錄，同步存入 localStorage
      if (isRecord) {
        localStorage.setItem('mole_high_score', String(finalScore));
      }

      // 檢查是否達成了 Combo 里程碑播放特殊音效
      if (nextCombo > 0 && nextCombo !== prev.currentCombo) {
        audio.playComboStreak(nextCombo);
      } else if (targetMole.type === MoleType.BOMB || nextCombo === 0) {
        audio.playComboBreak();
      }

      const nextMaxCombo = Math.max(prev.maxCombo, nextCombo);
      const nextAccuracy = Math.round((nextValidWhacks / nextClicks) * 100);

      // 3. 回傳最新的 Stats
      return {
        ...prev,
        score: finalScore,
         highScore: nextHighScore,
        totalClicks: nextClicks,
        totalWhacks: nextTotalWhacks,
        validWhacks: nextValidWhacks,
        bombHits: nextBombHits,
        currentCombo: nextCombo,
        maxCombo: nextMaxCombo,
        accuracy: nextAccuracy,
      };
    });

    // 4. 將地鼠設為「擊中」狀態
    setMoles((prev) => {
      const next = [...prev];
      if (next[id]) {
        next[id] = { ...next[id]!, isHit: true, hitX: clickX, hitY: clickY };
      }
      return next;
    });

    // 5. 預留 340 毫秒展現地鼠眩暈(受傷x_x)的流暢表情，再將其收回
    setTimeout(() => {
      setMoles((prev) => {
        const next = [...prev];
        if (next[id] && next[id]?.isHit) {
          next[id] = null;
        }
        return next;
      });
    }, 340);
  };

  // --- 動態難度升級監聽器 ---
  useEffect(() => {
    if (stage !== GameStage.PLAYING) return;
    
    // 根據當前 score 找到對應難度
    const correctLevelConfig = DIFFICULTY_LEVELS.reduce((acc, curr) => {
      if (stats.score >= curr.minScore && stats.score <= curr.maxScore) {
        return curr;
      }
      return acc;
    }, DIFFICULTY_LEVELS[0]);

    if (correctLevelConfig.level !== difficultyLevel) {
      setDifficultyLevel(correctLevelConfig.level);
      
      // 彈跳一個震撼的升級通知
      setLevelUpText(`難度升級！LEVEL ${correctLevelConfig.level} 級 🔥`);
      setTimeout(() => setLevelUpText(null), 2000);
    }
  }, [stats.score, stage]);

  // --- 遊戲結算 (GameOver) ---
  const handleGameOver = () => {
    audio.playGameOver();
    setStage(GameStage.GAMEOVER);
  };

  return (
    <div 
      id="app-container"
      className="relative min-h-screen w-full select-none text-slate-100 font-sans radial-bg flex flex-col justify-between overflow-x-hidden"
    >
      {/* 炸彈紅光震撼閃爍層 */}
      <AnimatePresence>
        {flashRed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-600/40 z-40 pointer-events-none animate-flash-red"
          />
        )}
      </AnimatePresence>

      {/* 1. 精美頂部導覽列 (帶有發光質感) */}
      <header className="relative z-30 w-full max-w-4xl mx-auto px-4 pt-5 pb-2 flex justify-between items-center border-b border-white/5 select-none">
        <div className="flex items-center gap-2">
          {/* 設計一個非常霸氣的復古動態霓虹圓點 */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
          </span>
          <h2 className="text-lg font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-100 to-indigo-100 tracking-wider">
            打地鼠特訓營
          </h2>
        </div>

        {/* 快捷分數指標 */}
        {stage === GameStage.PLAYING && (
          <div className="flex items-center gap-2 font-mono text-sm px-3 py-1 bg-white/5 rounded-full border border-white/5 shadow-inner">
            <span className="text-slate-400">Score:</span>
            <span className="text-yellow-400 font-black">{stats.score}</span>
          </div>
        )}
      </header>

      {/* 2. 核心主體顯示區 */}
      <main className="relative z-20 flex-1 w-full max-w-4xl mx-auto px-4 py-4 flex flex-col items-center justify-center gap-6">
        
        {/* 開始、遊戲結束 覆蓋選單與統計面板 */}
        {stage !== GameStage.PLAYING ? (
          <GameMenu
            stage={stage}
            stats={stats}
            isMuted={isMuted}
            onStartGame={handleStartGame}
            onToggleMute={handleToggleMute}
            showRulesFirst={showRules}
            onCloseRulesFirst={() => setShowRules(false)}
          />
        ) : (
          /* 核心進行中的打擊遊戲畫盤 */
          <div className="w-full flex flex-col gap-5">
            {/* 上部計分板 HUD */}
            <ScoreBoard
              stats={stats}
              timeLeft={timeLeft}
              difficultyLevel={difficultyLevel}
              isPaused={isPaused}
              isMuted={isMuted}
              onTogglePause={handleTogglePause}
              onToggleMute={handleToggleMute}
              onShowRules={() => setShowRules(true)}
            />

            {/* 中部暫停鎖定遮罩 */}
            <div className="relative w-full">
              <MoleGrid moles={moles} onWhack={handleWhack} />

              <AnimatePresence>
                {isPaused && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 backdrop-blur-md bg-slate-950/70 rounded-3xl flex flex-col items-center justify-center border border-white/10"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      className="text-center p-6 bg-slate-900/90 border border-white/5 rounded-2xl shadow-2xl max-w-xs"
                    >
                      <h3 className="text-xl font-display font-black text-amber-300 tracking-wide mb-2">
                        🎮 戰鬥正在暫停
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        地底軍團在此時此刻靜止了，稍作休息後，隨時點擊按鈕重返戰場！
                      </p>
                      <button
                        onClick={handleTogglePause}
                        className="py-2.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-sans font-extrabold text-xs tracking-wider rounded-lg shadow-lg active:scale-95 duration-100 cursor-pointer"
                      >
                        返回挑戰
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* 3. 難度升等巨幅浮空通知 Toast  */}
      <AnimatePresence>
        {levelUpText && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1.15 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white font-display font-black text-sm border-2 border-violet-400/40 shadow-[0_0_25px_rgba(139,92,246,0.55)] pointer-events-none tracking-widest uppercase flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
            {levelUpText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. 玩法說明規則懸浮小彈窗 */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl relative"
            >
              <button
                onMouseDown={(e) => { e.preventDefault(); setShowRules(false); }}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>

              <h3 className="text-lg font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-300 mb-4 border-b border-white/5 pb-2">
                🎮 打地鼠操作手冊
              </h3>

              <div className="space-y-4 text-slate-300 text-xs leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> 地鼠類型說明
                  </h4>
                  <p className="mt-1 pl-3 text-slate-400">
                    - <span className="text-amber-300 font-bold">普通地鼠 (🟫)</span>：+10 分。最常見的礦工地鼠。<br />
                    - <span className="text-yellow-300 font-bold">金色地鼠 (✨)</span>：+50 分。速度快，停留時間只有普通的一半！<br />
                    - <span className="text-rose-400 font-bold">炸彈地鼠 (💣)</span>：-20 分，擊中會爆炸，Combo 歸零！
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> 連擊與加成機制 (Combo)
                  </h4>
                  <p className="mt-1 pl-3 text-slate-400">
                    - 每連續打中一隻普通/黃金地鼠得 1 Combo。<br />
                    - <span className="text-amber-400 font-bold">5 Combo+</span> 擁有 <span className="text-white font-bold">1.5 倍</span> 擊殺得分！<br />
                    - <span className="text-yellow-400 font-bold">10 Combo+</span> 擁有 <span className="text-white font-bold">2.0 倍</span> 暴擊得分！<br />
                    - <span className="text-rose-400">若有地鼠未打中而縮回，或是打到炸彈，Combo 將當場歸零。</span>
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> 多段動態難度
                  </h4>
                  <p className="mt-1 pl-3 text-slate-400">
                    分數越高，級別越大（1至6級），地鼠出土間隔越短、停留時間遞減（最快 450ms 縮回），同時出現在場上的地鼠上限也會提升。
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                我瞭解了，關閉說明
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. 底部版權聲明 */}
      <footer className="relative z-30 w-full text-center py-4 border-t border-white/5 select-none text-[10px] text-slate-600 tracking-wider">
        <p>© 2026 WHACK-A-MOLE Arcade. Crafted with premium Glassmorphism & Web Audio API synthesizer.</p>
      </footer>
    </div>
  );
}
