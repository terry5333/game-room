import { ref, get, set, push, onValue, query, limitToLast } from 'firebase/database';
import { rtdb } from './firebase';

export interface CasinoSettings {
  // 🎰 Lucky Slot
  slotJackpot777Chance: number;      // % (e.g. 1.0)
  slotTwin77Chance: number;          // % (e.g. 6.0)
  slotNormalMatchChance: number;     // % (e.g. 20.0)
  slotJackpotPayoutPct: number;      // % (e.g. 50)
  slotRtpTarget: number;             // % (e.g. 88)

  // 🎟️ Scratchcard
  scratchJackpotChance: number;      // % (e.g. 2.5)
  scratchSecondChance: number;       // % (e.g. 7.5)
  scratchThirdChance: number;        // % (e.g. 15.0)
  scratchBreakevenChance: number;    // % (e.g. 25.0)

  // 🎯 Russian Roulette
  rouletteRound1Survival: number;    // % (e.g. 83.3)
  rouletteRound2Survival: number;    // % (e.g. 80.0)
  rouletteRound3Survival: number;    // % (e.g. 75.0)
  rouletteRound4Survival: number;    // % (e.g. 66.7)
  rouletteRound5Survival: number;    // % (e.g. 50.0)
  rouletteJackpotPayoutPct: number;  // % (e.g. 50)

  // General House Rules
  jackpotContributionPct: number;   // % (e.g. 100)
  minBet: number;
  maxBet: number;
  updatedAt: number;
  updatedBy?: string;
}

export const DEFAULT_CASINO_SETTINGS: CasinoSettings = {
  slotJackpot777Chance: 1.0,
  slotTwin77Chance: 6.0,
  slotNormalMatchChance: 22.0,
  slotJackpotPayoutPct: 50,
  slotRtpTarget: 90,

  scratchJackpotChance: 2.5,
  scratchSecondChance: 8.0,
  scratchThirdChance: 16.0,
  scratchBreakevenChance: 25.0,

  rouletteRound1Survival: 83.3,
  rouletteRound2Survival: 80.0,
  rouletteRound3Survival: 75.0,
  rouletteRound4Survival: 66.7,
  rouletteRound5Survival: 50.0,
  rouletteJackpotPayoutPct: 50,

  jackpotContributionPct: 100,
  minBet: 10,
  maxBet: 1000,
  updatedAt: Date.now()
};

export interface CasinoHistoryRecord {
  id: string;
  uid: string;
  displayName: string;
  userTag: string;
  game: 'slot' | 'scratch' | 'roulette';
  bet: number;
  payout: number;
  netProfit: number; // payout - bet
  jackpotContribution: number;
  detail: string;
  timestamp: number;
}

class CasinoSettingsService {
  private currentSettings: CasinoSettings = { ...DEFAULT_CASINO_SETTINGS };
  private listeners: Array<(s: CasinoSettings) => void> = [];
  private historyListeners: Array<(records: CasinoHistoryRecord[]) => void> = [];
  private cachedHistory: CasinoHistoryRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('duo_casino_settings');
        if (local) {
          this.currentSettings = { ...DEFAULT_CASINO_SETTINGS, ...JSON.parse(local) };
        }
        const localHist = localStorage.getItem('duo_casino_history');
        if (localHist) {
          this.cachedHistory = JSON.parse(localHist);
        }
      } catch {}
    }

    if (rtdb) {
      try {
        const settingsRef = ref(rtdb, 'app_config/casino_settings');
        onValue(settingsRef, (snap) => {
          if (snap.exists()) {
            this.currentSettings = { ...DEFAULT_CASINO_SETTINGS, ...snap.val() };
            this.saveLocalSettings();
            this.notify();
          }
        });

        const historyRef = query(ref(rtdb, 'casino_history'), limitToLast(50));
        onValue(historyRef, (snap) => {
          if (snap.exists()) {
            const val = snap.val();
            const list: CasinoHistoryRecord[] = Object.values(val);
            list.sort((a, b) => b.timestamp - a.timestamp);
            this.cachedHistory = list;
            this.saveLocalHistory();
            this.notifyHistory();
          }
        });
      } catch (err) {
        console.warn('RTDB casino settings stream error:', err);
      }
    }
  }

  private saveLocalSettings() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('duo_casino_settings', JSON.stringify(this.currentSettings));
      } catch {}
    }
  }

  private saveLocalHistory() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('duo_casino_history', JSON.stringify(this.cachedHistory.slice(0, 50)));
      } catch {}
    }
  }

  public getSettings(): CasinoSettings {
    return { ...this.currentSettings };
  }

  public subscribe(cb: (s: CasinoSettings) => void): () => void {
    this.listeners.push(cb);
    cb(this.getSettings());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const s = this.getSettings();
    this.listeners.forEach((l) => l(s));
  }

  public async updateSettings(newSettings: Partial<CasinoSettings>, adminName?: string): Promise<boolean> {
    this.currentSettings = {
      ...this.currentSettings,
      ...newSettings,
      updatedAt: Date.now(),
      updatedBy: adminName || 'Admin'
    };
    this.saveLocalSettings();
    this.notify();

    if (rtdb) {
      try {
        await set(ref(rtdb, 'app_config/casino_settings'), this.currentSettings);
        return true;
      } catch (e) {
        console.warn('Update casino settings RTDB error:', e);
      }
    }
    return true;
  }

  public async resetSettings(): Promise<void> {
    await this.updateSettings(DEFAULT_CASINO_SETTINGS, 'Admin (Reset)');
  }

  // --- CASINO HISTORY RECORDING ---
  public async logBet(record: Omit<CasinoHistoryRecord, 'id' | 'timestamp'>): Promise<void> {
    const newRecord: CasinoHistoryRecord = {
      ...record,
      id: 'bet_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now()
    };

    this.cachedHistory.unshift(newRecord);
    if (this.cachedHistory.length > 100) this.cachedHistory.pop();
    this.saveLocalHistory();
    this.notifyHistory();

    if (rtdb) {
      try {
        await push(ref(rtdb, 'casino_history'), newRecord);
      } catch (e) {
        console.warn('Log casino bet RTDB error:', e);
      }
    }
  }

  public getHistory(): CasinoHistoryRecord[] {
    return [...this.cachedHistory];
  }

  public subscribeHistory(cb: (records: CasinoHistoryRecord[]) => void): () => void {
    this.historyListeners.push(cb);
    cb(this.getHistory());
    return () => {
      this.historyListeners = this.historyListeners.filter((l) => l !== cb);
    };
  }

  private notifyHistory() {
    const hist = this.getHistory();
    this.historyListeners.forEach((l) => l(hist));
  }
}

export const casinoSettings = new CasinoSettingsService();
