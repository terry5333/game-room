import { ref, set, onValue } from 'firebase/database';
import { rtdb } from './firebase';

export interface ItemPriceMap {
  [itemId: string]: number;
}

class ItemPricingService {
  private customPrices: ItemPriceMap = {};
  private listeners: Array<(prices: ItemPriceMap) => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('duo_custom_item_prices');
        if (local) {
          this.customPrices = JSON.parse(local);
        }
      } catch {}
    }

    if (rtdb) {
      try {
        const pricesRef = ref(rtdb, 'app_config/item_prices');
        onValue(pricesRef, (snap) => {
          if (snap.exists()) {
            this.customPrices = snap.val() || {};
            this.saveLocal();
            this.notify();
          }
        });
      } catch (e) {
        console.warn('RTDB item pricing stream error:', e);
      }
    }
  }

  private saveLocal() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('duo_custom_item_prices', JSON.stringify(this.customPrices));
      } catch {}
    }
  }

  public getPrice(itemId: string, defaultPrice: number = 100): number {
    if (this.customPrices[itemId] !== undefined) {
      return this.customPrices[itemId];
    }
    return defaultPrice;
  }

  public getAllCustomPrices(): ItemPriceMap {
    return { ...this.customPrices };
  }

  public async setPrice(itemId: string, price: number): Promise<boolean> {
    this.customPrices[itemId] = Math.max(0, Math.floor(price));
    this.saveLocal();
    this.notify();

    if (rtdb) {
      try {
        await set(ref(rtdb, `app_config/item_prices/${itemId}`), this.customPrices[itemId]);
        return true;
      } catch (e) {
        console.warn('Set item price RTDB error:', e);
      }
    }
    return true;
  }

  public async setBatchPrices(newPrices: ItemPriceMap): Promise<boolean> {
    this.customPrices = { ...this.customPrices, ...newPrices };
    this.saveLocal();
    this.notify();

    if (rtdb) {
      try {
        await set(ref(rtdb, 'app_config/item_prices'), this.customPrices);
        return true;
      } catch (e) {
        console.warn('Set batch item prices RTDB error:', e);
      }
    }
    return true;
  }

  public subscribe(cb: (prices: ItemPriceMap) => void): () => void {
    this.listeners.push(cb);
    cb(this.getAllCustomPrices());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const p = this.getAllCustomPrices();
    this.listeners.forEach((l) => l(p));
  }
}

export const itemPricing = new ItemPricingService();
