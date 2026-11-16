import { LpcCharacterConfig } from '../types';
import {
  LPC_ITEMS,
  LPC_SKIN_PALETTES,
  LPC_HAIR_PALETTES,
  LpcItemDef
} from '../data/lpcCatalog';

export type LpcDirection = 'down' | 'left' | 'right' | 'up';

export interface RenderOptions {
  direction?: LpcDirection;
  frameIndex?: number; // 0 = idle stand, 1~8 = walk frames
  scale?: number;      // e.g. 1, 2, 3, 4
}

// Direction row index in standard LPC walk cycle sheet (576 x 256)
// Row 0 = Up, Row 1 = Left, Row 2 = Down (Front), Row 3 = Right
const DIRECTION_ROW_MAP: Record<LpcDirection, number> = {
  up: 0,
  left: 1,
  down: 2,
  right: 3
};

// Helper: parse hex color "#RRGGBB" into [r, g, b]
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

class LpcRendererService {
  private imageCache = new Map<string, HTMLImageElement>();
  private imageLoadingPromises = new Map<string, Promise<HTMLImageElement>>();
  private recoloredCache = new Map<string, HTMLCanvasElement>();

  /**
   * 載入原始精靈圖圖片（具備全域記憶體快取與重複請求合併）
   */
  public async loadImage(relPath: string): Promise<HTMLImageElement> {
    const fullUrl = `/assets/lpc/${relPath.replace(/^\//, '')}`;
    if (this.imageCache.has(fullUrl)) {
      return this.imageCache.get(fullUrl)!;
    }

    if (this.imageLoadingPromises.has(fullUrl)) {
      return this.imageLoadingPromises.get(fullUrl)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(fullUrl, img);
        this.imageLoadingPromises.delete(fullUrl);
        resolve(img);
      };
      img.onerror = (err) => {
        this.imageLoadingPromises.delete(fullUrl);
        console.error(`[LpcRenderer] Failed to load image: ${fullUrl}`, err);
        reject(err);
      };
      img.src = fullUrl;
    });

    this.imageLoadingPromises.set(fullUrl, promise);
    return promise;
  }

  /**
   * 像素級即時色盤替換（CPU Canvas 容錯比對，結果高度快取）
   */
  public async getRecoloredLayer(
    relPath: string,
    paletteType: 'skin' | 'hair',
    targetPaletteId: string
  ): Promise<CanvasImageSource> {
    const cacheKey = `${relPath}::${paletteType}::${targetPaletteId}`;
    if (this.recoloredCache.has(cacheKey)) {
      return this.recoloredCache.get(cacheKey)!;
    }

    const baseImg = await this.loadImage(relPath);

    // 若目標色為基礎色（皮膚 light 或頭髮 blonde），直接使用原圖
    if (
      (paletteType === 'skin' && targetPaletteId === 'light') ||
      (paletteType === 'hair' && targetPaletteId === 'blonde')
    ) {
      return baseImg;
    }

    // 取得基礎色盤與目標色盤
    const basePalette =
      paletteType === 'skin' ? LPC_SKIN_PALETTES[0] : LPC_HAIR_PALETTES[0];
    const targetPalette =
      paletteType === 'skin'
        ? LPC_SKIN_PALETTES.find((p) => p.id === targetPaletteId) || basePalette
        : LPC_HAIR_PALETTES.find((p) => p.id === targetPaletteId) || basePalette;

    if (targetPalette === basePalette) {
      return baseImg;
    }

    const baseRgbList = basePalette.colors.map(hexToRgb);
    const targetRgbList = targetPalette.colors.map(hexToRgb);

    // 建立離線畫布處理像素替換
    const offCanvas = document.createElement('canvas');
    offCanvas.width = baseImg.naturalWidth || baseImg.width;
    offCanvas.height = baseImg.naturalHeight || baseImg.height;
    const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return baseImg;

    ctx.drawImage(baseImg, 0, 0);
    const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;
    const tolerance = 6; // 容許色偏容錯度

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a === 0) continue; // 透明像素直接跳過

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      for (let k = 0; k < baseRgbList.length; k++) {
        const [br, bg, bb] = baseRgbList[k];
        if (
          Math.abs(r - br) <= tolerance &&
          Math.abs(g - bg) <= tolerance &&
          Math.abs(b - bb) <= tolerance
        ) {
          const [tr, tg, tb] = targetRgbList[k];
          data[i] = tr;
          data[i + 1] = tg;
          data[i + 2] = tb;
          break;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this.recoloredCache.set(cacheKey, offCanvas);
    return offCanvas;
  }

  /**
   * 解析角色的當前所有圖層與穿戴清單（依 Z-Index 由底至頂排序）
   */
  public getActiveLayers(config: LpcCharacterConfig): {
    item: LpcItemDef;
    paletteType?: 'skin' | 'hair';
    targetPaletteId?: string;
  }[] {
    const layers: {
      item: LpcItemDef;
      paletteType?: 'skin' | 'hair';
      targetPaletteId?: string;
    }[] = [];

    // 1. 身體 Body
    const bodyItem =
      LPC_ITEMS.find((it) => it.id === config.body) ||
      LPC_ITEMS.find((it) => it.id === (config.gender === 'female' ? 'body_female' : 'body_male')) ||
      LPC_ITEMS[0];
    layers.push({
      item: bodyItem,
      paletteType: 'skin',
      targetPaletteId: config.skinTone || 'light'
    });

    // 2. 褲子/下著 Bottom
    if (config.bottom && config.bottom !== 'none') {
      const bottomItem = LPC_ITEMS.find((it) => it.id === config.bottom);
      if (bottomItem) layers.push({ item: bottomItem });
    }

    // 3. 鞋子 Shoes
    if (config.shoes && config.shoes !== 'none') {
      const shoesItem = LPC_ITEMS.find((it) => it.id === config.shoes);
      if (shoesItem) layers.push({ item: shoesItem });
    }

    // 4. 上衣 Top
    if (config.top && config.top !== 'none') {
      const topItem = LPC_ITEMS.find((it) => it.id === config.top);
      if (topItem) layers.push({ item: topItem });
    }

    // 5. 髮型 Hair
    if (config.hair && config.hair !== 'none') {
      const hairItem = LPC_ITEMS.find((it) => it.id === config.hair);
      if (hairItem) {
        layers.push({
          item: hairItem,
          paletteType: 'hair',
          targetPaletteId: config.hairColor || 'dark_brown'
        });
      }
    }

    // 6. 帽子 Hat
    if (config.hat && config.hat !== 'none') {
      const hatItem = LPC_ITEMS.find((it) => it.id === config.hat);
      if (hatItem) layers.push({ item: hatItem });
    }

    // 7. 配件 Accessories (可同時穿戴多件)
    if (Array.isArray(config.accessories)) {
      for (const accId of config.accessories) {
        if (!accId || accId === 'none') continue;
        const accItem = LPC_ITEMS.find((it) => it.id === accId);
        if (accItem) layers.push({ item: accItem });
      }
    }

    // 依 layerOrder 由小到大排序 (底層至頂層)
    layers.sort((a, b) => a.item.layerOrder - b.item.layerOrder);
    return layers;
  }

  /**
   * 渲染完整角色至指定的 HTML5 Canvas
   */
  public async renderCharacter(
    canvas: HTMLCanvasElement,
    config: LpcCharacterConfig,
    options: RenderOptions = {}
  ): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const direction = options.direction || 'down';
    const frameIndex = options.frameIndex !== undefined ? options.frameIndex : 0;
    const scale = options.scale || 1;

    // 確保像素風格清晰絕不被平滑模糊
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 計算 LPC 幀裁切座標
    const frameWidth = 64;
    const frameHeight = 64;
    const row = DIRECTION_ROW_MAP[direction] ?? 2;
    const sx = (frameIndex % 9) * frameWidth;
    const sy = row * frameHeight;

    const destW = frameWidth * scale;
    const destH = frameHeight * scale;
    const dx = Math.floor((canvas.width - destW) / 2);
    const dy = Math.floor((canvas.height - destH) / 2);

    const activeLayers = this.getActiveLayers(config);

    // 依序疊加繪製所有圖層
    for (const layer of activeLayers) {
      try {
        let imageSource: CanvasImageSource;
        const item = layer.item;

        // 若女性角色且該裝備有專屬女版圖檔則切換
        const relPath =
          config.gender === 'female' && item.femaleImagePath
            ? item.femaleImagePath
            : item.imagePath;

        if (layer.paletteType && layer.targetPaletteId) {
          imageSource = await this.getRecoloredLayer(
            relPath,
            layer.paletteType,
            layer.targetPaletteId
          );
        } else {
          imageSource = await this.loadImage(relPath);
        }

        ctx.drawImage(
          imageSource,
          sx,
          sy,
          frameWidth,
          frameHeight,
          dx,
          dy,
          destW,
          destH
        );
      } catch (err) {
        console.warn(`[LpcRenderer] Failed to render layer ${layer.item.id}:`, err);
      }
    }
  }

  /**
   * 輸出單張 PNG DataURL（可用於名片、即時分享或頭像暫存）
   */
  public async exportDataUrl(
    config: LpcCharacterConfig,
    options: RenderOptions = {}
  ): Promise<string> {
    const scale = options.scale || 2;
    const canvas = document.createElement('canvas');
    canvas.width = 64 * scale;
    canvas.height = 64 * scale;
    await this.renderCharacter(canvas, config, { ...options, scale });
    return canvas.toDataURL('image/png');
  }

  /**
   * 預先載入所有基礎資源，加速後續換裝切換
   */
  public async preloadBaseAssets(): Promise<void> {
    const basePaths = LPC_ITEMS.map((item) => item.imagePath);
    await Promise.allSettled(basePaths.map((p) => this.loadImage(p)));
  }
}

export const lpcRenderer = new LpcRendererService();
