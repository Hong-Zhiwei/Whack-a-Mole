/**
 * AudioHelper - 網頁音效與合成器工具
 * 採用 HTML5 Web Audio API 實現免外部檔案的高音質復古街機音效，
 * 便於在任何瀏覽器中即開即玩，並保留了自訂音效檔案路徑的替代介面。
 */
class AudioHelper {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.4; // 預設主音量 40%

  constructor() {
    // 延遲初始化，待玩家首次點擊畫面時啟動
    this.isMuted = localStorage.getItem('game_muted') === 'true';
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('game_muted', String(this.isMuted));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  /**
   * 播放自訂的音效檔案路徑 (預留介面)
   * 如果玩家以後加入了音樂/音效檔，可以直接填入路徑
   */
  public playSoundFile(filePath: string) {
    if (this.isMuted) return;
    try {
      const audio = new Audio(filePath);
      audio.volume = this.masterVolume;
      audio.play().catch(() => {
        // 忽視自動播放限制導致的錯誤
      });
    } catch (e) {
      console.warn("播放音效檔案失敗:", e);
    }
  }

  // --- 合成器音效：擊中普通地鼠 ---
  public playHitRegular() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    // 建立音源與音量控制
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // 參數：向上快速微滑音，類啵啵聲
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

    gain.gain.setValueAtTime(this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // --- 合成器音效：擊中金色地鼠 ---
  public playHitGolden() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    // 金色地鼠為高亢闪耀的雙音和弦或快速上升琶音
    const notes = [440, 554.37, 659.25, 880]; // A4 Major Chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.8, now + i * 0.03 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.03 + 0.25);

      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.26);
    });
  }

  // --- 合成器音效：擊中炸彈 (爆炸低沉震動) ---
  public playHitBomb() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    const oscNode = ctx.createOscillator();
    const noiseNode = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    // 1. 生成白噪音用於爆炸沙沙感
    const bufferSize = ctx.sampleRate * 0.4; // 0.4秒
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseNode.buffer = buffer;

    // 2. 低音正弦波代表震耳感
    oscNode.type = 'sawtooth';
    oscNode.frequency.setValueAtTime(120, now);
    oscNode.frequency.linearRampToValueAtTime(40, now + 0.3);

    const filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(250, now);

    oscNode.connect(filterNode);
    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(this.masterVolume * 1.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    oscNode.start(now);
    noiseNode.start(now);

    oscNode.stop(now + 0.4);
    noiseNode.stop(now + 0.4);
  }

  // --- 合成器音效：地鼠漏打/縮回 ---
  public playMiss() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // 短滑降音
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.15);

    gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // --- 合成器音效：連擊進階 (高昂上升音) ---
  public playComboStreak(combo: number) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // 隨連擊次數增加音高與和弦層次
    const baseFreq = 523.25; // C5
    // 依連擊數計算音程 (五度、八度、十二度等)
    const factor = 1 + (combo % 8) * 0.15;
    const finalFreq = baseFreq * factor;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.setValueAtTime(finalFreq, now + 0.05);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.7, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // --- 合成器音效：連擊中斷 (嗡嗡聲) ---
  public playComboBreak() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(130, now + 0.1);

    gain.gain.setValueAtTime(this.masterVolume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // --- 合成器音效：遊戲開始 (快樂和弦) ---
  public playGameStart() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    // 快速彈奏 C4 -> E4 -> G4 -> C5
    const melody = [261.63, 329.63, 392.00, 523.25];
    melody.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.6, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.1 + 0.25);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.3);
    });
  }

  // --- 合成器音效：遊戲結束 (悲傷和弦) ---
  public playGameOver() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    // 彈奏 G4 -> E4 -> C4
    const melody = [392.00, 329.63, 261.63, 196.00];
    melody.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0, now + idx * 0.15);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.6, now + idx * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.15 + 0.4);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.5);
    });
  }

  // --- 倒數秒針提醒 (輕脆喀答聲) ---
  public playTick(secondsLeft: number) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // 如果剩餘秒數小於5，喀答聲變高亢，其餘清脆
    const freq = secondsLeft <= 5 ? 1200 : 800;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const audio = new AudioHelper();
