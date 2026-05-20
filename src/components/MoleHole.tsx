import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mole, MoleType } from '../types';

interface MoleHoleProps {
  id: number;
  mole: Mole | null;
  onWhack: (id: number, clickX: number, clickY: number) => void;
}

export const MoleHole: React.FC<MoleHoleProps> = ({ id, mole, onWhack }) => {
  const [localHit, setLocalHit] = useState(false);
  const [pointsPop, setPointsPop] = useState<{ id: number; text: string; x: number; y: number } | null>(null);

  // 當被擊中時，觸發本地震動與分數漂浮特效
  useEffect(() => {
    if (mole?.isHit && !localHit) {
      setLocalHit(true);
      const timer = setTimeout(() => setLocalHit(false), 500);

      // 分數漂浮文字
      let text = '';
      if (mole.type === MoleType.REGULAR) text = '+10';
      else if (mole.type === MoleType.GOLDEN) text = '+50';
      else if (mole.type === MoleType.BOMB) text = '-20';

      setPointsPop({
        id: Date.now(),
        text,
        x: mole.hitX ?? 50,
        y: mole.hitY ?? 30,
      });

      return () => clearTimeout(timer);
    } else if (!mole) {
      setLocalHit(false);
      setPointsPop(null);
    }
  }, [mole?.isHit]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mole || mole.isHit || !mole.isActive) return;

    // 獲取相對於該 hole 容器的點擊位置，用以在點擊點產生分數飄浮與火花
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onWhack(id, x, y);
  };

  // 地鼠類型判斷
  const isRegular = mole?.type === MoleType.REGULAR;
  const isGolden = mole?.type === MoleType.GOLDEN;
  const isBomb = mole?.type === MoleType.BOMB;

  return (
    <div
      id={`hole-container-${id}`}
      onMouseDown={handleMouseDown}
      className={`relative h-32 w-full md:h-40 xl:h-44 flex flex-col items-center justify-end cursor-pointer group select-none`}
    >
      {/* 1. 地穴深處陰影與坑洞本體 (3D立體橢圓) */}
      <div className="absolute bottom-1 w-[90%] h-[36px] bg-[#0c0c12] rounded-[50%] hole-shadow border-t border-white/5 z-0 overflow-hidden">
        {/* 坑洞深色內部 */}
        <div className="w-full h-full bg-[#07070d]/95 flex justify-center items-end" />
      </div>

      {/* 2. 地鼠主體 (帶有 slide 升降動畫 & 死亡旋轉或受敲擊表情) */}
      <div className="absolute bottom-[24px] w-[80%] h-[100px] md:h-[120px] overflow-hidden flex flex-col justify-end z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          {mole && mole.isActive && (
            <motion.div
              id={`mole-anim-${id}`}
              initial={{ y: 120 }}
              animate={mole.isHit 
                ? { 
                    y: 20, 
                    rotate: isBomb ? [0, 15, -15, 0] : [0, -5, 5, 0],
                    scale: isBomb ? [1, 1.3, 0.9, 1] : 1
                  } 
                : { y: 0 }
              }
              exit={{ y: 120 }}
              transition={{
                type: 'spring',
                stiffness: mole.isHit ? 220 : 350,
                damping: mole.isHit ? 18 : 22,
              }}
              className={`w-full h-full flex items-end justify-center`}
            >
              {/* --- 地鼠 SVG 繪製面板 --- */}
              <svg 
                viewBox="0 0 100 120" 
                className={`w-20 md:w-24 h-24 md:h-28 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] filter transition-transform duration-100 ${
                  isGolden && !mole.isHit ? 'animate-gold-shimmer' : ''
                } ${localHit ? 'animate-shake' : ''}`}
              >
                <defs>
                  {/* 普通地鼠漸層 (Sleek Theme: radial #a85e32 -> #633a1e) */}
                  <radialGradient id="regMoleGrad" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#a85e32" />
                    <stop offset="100%" stopColor="#633a1e" />
                  </radialGradient>

                  {/* 黃金地鼠奢華漸層 (Sleek Theme: radial #ffd700 -> #b8860b) */}
                  <radialGradient id="goldMoleGrad" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#ffd700" />
                    <stop offset="100%" stopColor="#b8860b" />
                  </radialGradient>

                  {/* 炸彈本體漸層 (Sleek Theme: radial #ff3e3e -> #8b0000) */}
                  <radialGradient id="bombGrad" cx="30%" cy="30%" r="75%">
                    <stop offset="0%" stopColor="#ff3e3e" />
                    <stop offset="100%" stopColor="#8b0000" />
                  </radialGradient>

                  {/* 炸彈金屬亮塊 */}
                  <radialGradient id="bombShine" cx="30%" cy="30%" r="40%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </radialGradient>
                </defs>

                {/* ================= 普通或黃金地鼠 ================= */}
                {(isRegular || isGolden) && (
                  <g>
                    {/* 地鼠耳朵 */}
                    <ellipse cx="22" cy="35" rx="9" ry="11" fill={isGolden ? '#facc15' : '#854d0e'} />
                    <ellipse cx="22" cy="35" rx="5" ry="6" fill={isGolden ? '#ca8a04' : '#f43f5e'} />
                    <ellipse cx="78" cy="35" rx="9" ry="11" fill={isGolden ? '#facc15' : '#854d0e'} />
                    <ellipse cx="78" cy="35" rx="5" ry="6" fill={isGolden ? '#ca8a04' : '#f43f5e'} />

                    {/* 地鼠身體與頭部 */}
                    <path
                      d="M 12,120 C 12,40 25,12 50,12 C 75,12 88,40 88,120 Z"
                      fill={isGolden ? 'url(#goldMoleGrad)' : 'url(#regMoleGrad)'}
                    />

                    {/* 黃金地鼠特有皇冠 / 精品墨鏡飾品 */}
                    {isGolden && !mole.isHit && (
                      <g>
                        {/* 皇冠 */}
                        <polygon points="35,14 40,3 50,9 60,3 65,14" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                        <circle cx="50" cy="9" r="1.5" fill="#ef4444" />
                        <circle cx="40" cy="3" r="1.5" fill="#3b82f6" />
                        <circle cx="60" cy="3" r="1.5" fill="#3b82f6" />
                      </g>
                    )}

                    {/* 普通地鼠工程帽 - 視覺更精緻 */}
                    {isRegular && !mole.isHit && (
                      <g>
                        {/* 亮黃特製安全帽 */}
                        <path d="M 28,26 C 28,15 35,10 50,10 C 65,10 72,15 72,26 Z" fill="#facc15" />
                        <rect x="25" y="24" width="50" height="4" rx="2" fill="#eab308" />
                        {/* 安全帽反光條 */}
                        <path d="M 45,10 C 47,15 53,15 55,10" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                      </g>
                    )}

                    {/* 臉部的腮紅圈 */}
                    <circle cx="28" cy="72" r="5" fill="#f43f5e" fillOpacity={isGolden ? "0.3" : "0.45"} />
                    <circle cx="72" cy="72" r="5" fill="#f43f5e" fillOpacity={isGolden ? "0.3" : "0.45"} />

                    {/* 地鼠眼睛區 */}
                    {mole.isHit ? (
                      /* 擊中狀態：叉叉眼睛 x_x */
                      <g stroke={isGolden ? '#78350f' : '#3f2105'} strokeWidth="3" strokeLinecap="round">
                        {/* 左眼 X */}
                        <line x1="30" y1="52" x2="40" y2="62" />
                        <line x1="40" y1="52" x2="30" y2="62" />
                        {/* 右眼 X */}
                        <line x1="60" y1="52" x2="70" y2="62" />
                        <line x1="70" y1="52" x2="60" y2="62" />
                        {/* 受傷OK繃在中臉 */}
                        <path d="M 42,42 L 58,50" stroke="#fef08a" strokeWidth="4" opacity="0.9" />
                        <path d="M 58,42 L 42,50" stroke="#fef08a" strokeWidth="4" opacity="0.9" />
                      </g>
                    ) : (
                      /* 正常狀態：閃亮眼晴 */
                      <g>
                        {/* 正常亮亮眼圈 */}
                        <circle cx="36" cy="56" r="6" fill="#1e293b" />
                        <circle cx="38" cy="54" r="2.5" fill="#ffffff" /> {/* 高光 */}
                        <circle cx="64" cy="56" r="6" fill="#1e293b" />
                        <circle cx="66" cy="54" r="2.5" fill="#ffffff" /> {/* 高光 */}
                      </g>
                    )}

                    {/* 鼻子 */}
                    <ellipse cx="50" cy="65" rx="6" ry="4" fill="#f43f5e" />

                    {/* 嘴部與牙齒 */}
                    <g>
                      {/* 厚嘴唇線 */}
                      <path d="M 42,72 Q 50,78 58,72" fill="none" stroke={isGolden ? '#78350f' : '#3f2105'} strokeWidth="2.5" strokeLinecap="round" />
                      {mole.isHit ? (
                        /* 受傷的波浪嘴 */
                        <path d="M 44,72 Q 47,68 50,72 Q 53,75 56,72" fill="none" stroke={isGolden ? '#78350f' : '#3f2105'} strokeWidth="2.5" strokeLinecap="round" />
                      ) : (
                        /* 露兩顆大門牙 */
                        <g>
                          <rect x="46" y="73" width="4" height="6" fill="#ffffff" stroke="#3f2105" strokeWidth="1" />
                          <rect x="50" y="73" width="4" height="6" fill="#ffffff" stroke="#3f2105" strokeWidth="1" />
                        </g>
                      )}
                    </g>

                    {/* 可愛鬍鬚 */}
                    {!mole.isHit && (
                      <g stroke="#3f2105" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
                        <line x1="18" y1="67" x2="6" y2="65" />
                        <line x1="18" y1="71" x2="8" y2="73" />
                        <line x1="82" y1="67" x2="94" y2="65" />
                        <line x1="82" y1="71" x2="92" y2="73" />
                      </g>
                    )}
                  </g>
                )}

                {/* ================= 炸彈地鼠 (💣 經典生動) ================= */}
                {isBomb && (
                  <g>
                    {/* 炸彈頂部引信鐵質扣、導火線 */}
                    <path d="M 50,30 L 50,12 Q 55,2 66,8" fill="none" stroke="#d1d5db" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M 50,30 L 50,12 Q 55,2 66,8" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                    
                    {/* 引信火花 (沒被打中時閃爍，打中時熄滅) */}
                    {!mole.isHit && (
                      <g>
                        <circle cx="66" cy="8" r="4.5" fill="#f59e0b" className="animate-ping" />
                        <polygon points="66,4 69,9 74,9 70,12 72,17 66,14 60,17 62,12 58,9 63,9" fill="#ef4444" />
                        <polygon points="66,6 68,10 72,10 69,12 70,15 66,13 62,15 63,12 60,10 64,10" fill="#facc15" />
                      </g>
                    )}

                    {/* 黑色鑄鐵引信頂部 */}
                    <rect x="42" y="26" width="16" height="8" rx="2" fill="#374151" />

                    {/* 炸彈圓弧軀體 */}
                    <circle cx="50" cy="65" r="34" fill="url(#bombGrad)" />
                    
                    {/* 亮面反光立體光澤 */}
                    <circle cx="50" cy="65" r="34" fill="url(#bombShine)" />

                    {/* 炸彈怒目表情 */}
                    {mole.isHit ? (
                      /* 被擊中時：爆裂煙霧表情 */
                      <g>
                        {/* 兩顆眩暈圓圈 */}
                        <circle cx="36" cy="58" r="7" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 2" />
                        <circle cx="64" cy="58" r="7" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 2" />
                        {/* 驚恐的嘴嘴 */}
                        <circle cx="50" cy="74" r="8" fill="#1e1b4b" stroke="#ffffff" strokeWidth="2" />
                        {/* 裂縫 */}
                        <path d="M 45,38 L 51,46 L 47,51" fill="none" stroke="#facc15" strokeWidth="3" />
                      </g>
                    ) : (
                      /* 未擊中的憤怒表情 */
                      <g>
                        {/* 憤怒挑眉 */}
                        <path d="M 22,46 L 40,53" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M 78,46 L 60,53" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" />
                        
                        {/* 白眼球 + 紅色怒血絲 */}
                        <circle cx="33" cy="58" r="8.5" fill="#ffffff" />
                        <circle cx="33" cy="58" r="4" fill="#ef4444" />
                        <circle cx="33" cy="58" r="1.5" fill="#000000" />
                        
                        <circle cx="67" cy="58" r="8.5" fill="#ffffff" />
                        <circle cx="67" cy="58" r="4" fill="#ef4444" />
                        <circle cx="67" cy="58" r="1.5" fill="#000000" />

                        {/* 咬牙切齒的嘴 */}
                        <rect x="40" y="70" width="20" height="9" rx="1.5" fill="#ffffff" stroke="#111827" strokeWidth="2" />
                        <line x1="40" y1="74.5" x2="60" y2="74.5" stroke="#111827" strokeWidth="1.5" />
                        <line x1="45" y1="70" x2="45" y2="79" stroke="#111827" strokeWidth="1" />
                        <line x1="50" y1="70" x2="50" y2="79" stroke="#111827" strokeWidth="1" />
                        <line x1="55" y1="70" x2="55" y2="79" stroke="#111827" strokeWidth="1" />
                        
                        {/* 炸彈骷髏標誌 */}
                        <path d="M 46,88 Q 50,82 54,88 L 52,94 L 48,94 Z" fill="#ffffff" opacity="0.6"/>
                        <circle cx="48" cy="86" r="1.5" fill="#991b1b" opacity="0.6"/>
                        <circle cx="52" cy="86" r="1.5" fill="#991b1b" opacity="0.6"/>
                      </g>
                    )}
                  </g>
                )}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. 地上碎石泥土堆與坑前飾條 (泥土凸現效果) */}
      <div className="absolute bottom-0 w-[96%] h-[26px] z-20 pointer-events-none flex justify-center">
        {/* 精美泥土裝飾 運用漸層 */}
        <div className="w-full h-full bg-linear-to-b from-amber-900/80 to-amber-950 rounded-b-[45%] opacity-90 border-t-2 border-stone-600 shadow-lg flex justify-around items-center px-4 overflow-hidden">
          {/* 草叢 / 岩石碎片點綴 */}
          <div className="w-1.5 h-1.5 bg-green-700 rounded-full" />
          <div className="w-2.5 h-1 bg-stone-600 rounded-sm" />
          <div className="w-2 h-2 bg-stone-700 rotate-45 rounded-xs" />
          <div className="w-1.5 h-1.5 bg-green-800 rounded-full animate-pulse" />
          <div className="w-3 h-1 bg-stone-600 rounded-sm" />
        </div>
      </div>

      {/* 4. 本地分數漂浮特效 (擊中的即時反應) */}
      <AnimatePresence>
        {pointsPop && (
          <motion.div
            key={pointsPop.id}
            initial={{ opacity: 0, y: pointsPop.y - 10, scale: 0.6 }}
            animate={{ opacity: 1, y: pointsPop.y - 50, scale: 1.15 }}
            exit={{ opacity: 0, y: pointsPop.y - 80, scale: 0.8 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={`absolute pointer-events-none z-30 font-display font-black text-xl md:text-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${
              pointsPop.text.startsWith('+50') 
                ? 'text-yellow-300' 
                : pointsPop.text.startsWith('+10') 
                  ? 'text-emerald-400' 
                  : 'text-rose-500'
            }`}
            style={{ left: pointsPop.x - 15 }}
          >
            {pointsPop.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. 擊中爆炸微粒子效果 */}
      {mole?.isHit && (
        <div className="absolute top-[20%] w-full h-[60%] z-25 pointer-events-none flex justify-center items-center">
          {[...Array(6)].map((_, i) => {
            const angle = (i * 360) / 6;
            const distance = 40 + Math.random() * 20;
            const targetX = Math.cos((angle * Math.PI) / 180) * distance;
            const targetY = Math.sin((angle * Math.PI) / 180) * distance;

            return (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: targetX, y: targetY, scale: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`absolute w-2 h-2 rounded-full ${
                  isGolden ? 'bg-yellow-400' : isBomb ? 'bg-red-500' : 'bg-amber-500'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
