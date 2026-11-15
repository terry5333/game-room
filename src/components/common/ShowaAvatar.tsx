import React from 'react';
import type { UserWardrobe } from '../../types';
import { DEFAULT_WARDROBE } from '../../data/wardrobeCatalog';

const R2_BASE = 'https://pub-07c6d3cdd65a45bb860edea4d63f3beb.r2.dev/wardrobe';

interface ShowaAvatarProps {
  wardrobe?: Partial<UserWardrobe>;
  photoURL?: string; // Kept in interface for backward compatibility, ignored per user request: "臉不要用頭像"
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showChair?: boolean;
  showPedestal?: boolean; // Backward compatibility alias for showChair
  showAccessory?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

const SIZE_CONFIGS = {
  sm: { width: 54, height: 64 },
  md: { width: 88, height: 105 },
  lg: { width: 148, height: 176 },
  xl: { width: 215, height: 256 }
};

export const ShowaAvatar: React.FC<ShowaAvatarProps> = ({
  wardrobe = DEFAULT_WARDROBE,
  size = 'md',
  showChair = true,
  showPedestal = true,
  showAccessory = true,
  animated = true,
  className = '',
  onClick
}) => {
  const gender = wardrobe.gender || 'male';
  const headId = wardrobe.head || 'none';
  const outfitId = wardrobe.outfit || 'default';
  const accessoryId = wardrobe.accessory || 'none';
  const cfg = SIZE_CONFIGS[size];
  const shouldRenderChair = showChair && showPedestal;

  // Resolve R2 CDN URLs for each layer
  const chairUrl = `${R2_BASE}/chairs/duel_chair.svg`;
  const baseUrl = `${R2_BASE}/bases/${gender}_base.svg`;

  // Outfit mapping for male/female
  let outfitFile = `${gender}_${outfitId}.svg`;
  if (gender === 'female') {
    if (outfitId === 'gakuran') outfitFile = 'female_sailor.svg';
  } else {
    if (outfitId === 'sailor') outfitFile = 'male_gakuran.svg';
  }
  const outfitUrl = `${R2_BASE}/outfits/${outfitFile}`;

  const headUrl = headId !== 'none' ? `${R2_BASE}/heads/${headId}.svg` : null;
  const accessoryUrl =
    showAccessory && accessoryId !== 'none'
      ? `${R2_BASE}/accessories/${accessoryId}.svg`
      : null;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      } ${className}`}
      style={{ width: cfg.width, height: cfg.height }}
    >
      <div
        className={`relative w-full h-full ${animated ? 'animate-float-gentle' : ''}`}
        style={{ aspectRatio: '200 / 240' }}
      >
        {/* Layer 1: Vintage Showa Wooden Duel Chair with Velvet Cushion */}
        {shouldRenderChair && (
          <img
            src={chairUrl}
            alt="對弈木椅"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
            loading="eager"
          />
        )}

        {/* Layer 2: Seated Character Base Body (Anime Face, Hair, Seated Posture) */}
        <img
          src={baseUrl}
          alt={gender === 'female' ? '少女受驗生' : '少年受驗生'}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
          loading="eager"
        />

        {/* Layer 3: Seated Tailored Outfit (Clearly visible collar, folds, buttons, sleeves) */}
        <img
          src={outfitUrl}
          alt={outfitId}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-30"
          loading="eager"
          onError={(e) => {
            // Fallback to default outfit if a specific combination file is missing
            const target = e.currentTarget;
            target.src = `${R2_BASE}/outfits/${gender}_default.svg`;
          }}
        />

        {/* Layer 4: Headgear / Cap / Mask */}
        {headUrl && (
          <img
            src={headUrl}
            alt={headId}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-40"
            loading="eager"
          />
        )}

        {/* Layer 5: Handheld Accessory (Katana, Shinai, Brush, Abacus, Fan) */}
        {accessoryUrl && (
          <img
            src={accessoryUrl}
            alt={accessoryId}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-50"
            loading="eager"
          />
        )}
      </div>
    </div>
  );
};
