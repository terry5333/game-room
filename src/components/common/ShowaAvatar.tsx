import React from 'react';
import type { UserWardrobe } from '../../types';
import { DEFAULT_WARDROBE } from '../../data/wardrobeCatalog';

interface ShowaAvatarProps {
  wardrobe?: Partial<UserWardrobe>;
  photoURL?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPedestal?: boolean;
  showAccessory?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

const SIZE_CONFIGS = {
  sm: { width: 44, height: 52, scale: 0.28, font: 'text-[9px]' },
  md: { width: 72, height: 86, scale: 0.46, font: 'text-[11px]' },
  lg: { width: 130, height: 160, scale: 0.82, font: 'text-xs' },
  xl: { width: 190, height: 235, scale: 1.2, font: 'text-sm' }
};

export const ShowaAvatar: React.FC<ShowaAvatarProps> = ({
  wardrobe = DEFAULT_WARDROBE,
  photoURL,
  size = 'md',
  showPedestal = false,
  showAccessory = true,
  animated = true,
  className = '',
  onClick
}) => {
  const headId = wardrobe.head || 'none';
  const outfitId = wardrobe.outfit || 'default';
  const accessoryId = wardrobe.accessory || 'none';
  const cfg = SIZE_CONFIGS[size];

  // Whether user has a custom photo to display in the face aperture
  const hasCustomPhoto = photoURL && !photoURL.includes('dicebear.com');

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center justify-end select-none ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      } ${className}`}
      style={{ width: cfg.width, height: cfg.height }}
    >
      <svg
        viewBox="0 0 160 190"
        className={`w-full h-full overflow-visible ${animated ? 'animate-float-gentle' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="pedestalWood" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8D5B4C" />
            <stop offset="50%" stopColor="#5D3A1A" />
            <stop offset="100%" stopColor="#3B2211" />
          </linearGradient>

          <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="50%" stopColor="#FFB300" />
            <stop offset="100%" stopColor="#D48800" />
          </linearGradient>

          <linearGradient id="gakuranCloth" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A3038" />
            <stop offset="100%" stopColor="#15191E" />
          </linearGradient>

          <linearGradient id="sailorBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2E5B88" />
            <stop offset="100%" stopColor="#1B3A57" />
          </linearGradient>

          <linearGradient id="haoriGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3D6B58" />
            <stop offset="100%" stopColor="#234336" />
          </linearGradient>

          <linearGradient id="jinbeiNavy" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B4F69" />
            <stop offset="100%" stopColor="#202F44" />
          </linearGradient>

          <linearGradient id="skinTone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE8D6" />
            <stop offset="100%" stopColor="#FCD5B5" />
          </linearGradient>

          <clipPath id="faceClip">
            <circle cx="80" cy="72" r="30" />
          </clipPath>
          <clipPath id="photoClip">
            <circle cx="80" cy="72" r="28" />
          </clipPath>
        </defs>

        {/* 1. PEDESTAL (擂台席位底座) */}
        {showPedestal && (
          <g id="pedestal" transform="translate(0, 160)">
            {/* Wooden Hexagonal base */}
            <ellipse cx="80" cy="18" rx="66" ry="12" fill="#000000" fillOpacity="0.25" />
            <path
              d="M 22 14 L 138 14 L 148 24 L 12 24 Z"
              fill="url(#pedestalWood)"
              stroke="#2A180E"
              strokeWidth="1.5"
            />
            {/* Gold lacquer trim line */}
            <path d="M 26 15 L 134 15" stroke="url(#goldTrim)" strokeWidth="2" />
            {/* Tatami / Velvet green mat top */}
            <ellipse cx="80" cy="14" rx="58" ry="7" fill="#627B5A" stroke="#485D42" strokeWidth="1" />
          </g>
        )}

        {/* 2. BODY / OUTFIT (服裝戰袍) */}
        <g id="body-outfit">
          {/* Base neck & shoulders */}
          <path d="M 72 96 L 88 96 L 90 106 L 70 106 Z" fill="url(#skinTone)" />

          {/* OUTFIT SPECIFICS */}
          {outfitId === 'gakuran' && (
            <g id="outfit-gakuran">
              {/* Black Gakuran Body */}
              <path
                d="M 50 104 L 110 104 L 118 160 L 42 160 Z"
                fill="url(#gakuranCloth)"
                stroke="#111"
                strokeWidth="1.5"
              />
              {/* Stand-up Mandarin Collar */}
              <rect x="68" y="96" width="24" height="10" rx="2" fill="#1E232A" stroke="#333" strokeWidth="1" />
              <rect x="78" y="96" width="4" height="10" fill="#FFF" opacity="0.8" />
              {/* Golden School Buttons */}
              <circle cx="80" cy="114" r="3" fill="url(#goldTrim)" stroke="#664600" strokeWidth="0.8" />
              <circle cx="80" cy="126" r="3" fill="url(#goldTrim)" stroke="#664600" strokeWidth="0.8" />
              <circle cx="80" cy="138" r="3" fill="url(#goldTrim)" stroke="#664600" strokeWidth="0.8" />
              <circle cx="80" cy="150" r="3" fill="url(#goldTrim)" stroke="#664600" strokeWidth="0.8" />
              {/* Chest Pocket & Badge */}
              <path d="M 56 118 L 68 118" stroke="#444" strokeWidth="1.5" />
              <rect x="60" y="114" width="4" height="3" fill="#D32F2F" />
              {/* Sleeves */}
              <path d="M 50 104 L 32 142 L 44 146 L 56 122 Z" fill="url(#gakuranCloth)" stroke="#111" strokeWidth="1" />
              <path d="M 110 104 L 128 142 L 116 146 L 104 122 Z" fill="url(#gakuranCloth)" stroke="#111" strokeWidth="1" />
            </g>
          )}

          {outfitId === 'sailor' && (
            <g id="outfit-sailor">
              {/* Navy Dress / Skirt Base */}
              <path
                d="M 52 104 L 108 104 L 118 160 L 42 160 Z"
                fill="url(#sailorBlue)"
                stroke="#10253A"
                strokeWidth="1.5"
              />
              {/* White Inner Shirt */}
              <path d="M 68 104 L 92 104 L 80 126 Z" fill="#FFFFFF" />
              {/* Navy Sailor Collar with White Lines */}
              <path
                d="M 60 104 L 100 104 L 108 122 L 80 134 L 52 122 Z"
                fill="#203E5F"
                stroke="#10253A"
                strokeWidth="1.2"
              />
              <path d="M 62 108 L 98 108" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 1" />
              {/* Bright Red Scarf Ribbon */}
              <polygon points="76,124 84,124 88,142 80,136 72,142" fill="#E53935" stroke="#B71C1C" strokeWidth="0.8" />
              <circle cx="80" cy="126" r="3.5" fill="#C62828" />
              {/* Pleated Skirt lines */}
              <line x1="62" y1="144" x2="58" y2="160" stroke="#152B40" strokeWidth="1.5" />
              <line x1="80" y1="144" x2="80" y2="160" stroke="#152B40" strokeWidth="1.5" />
              <line x1="98" y1="144" x2="102" y2="160" stroke="#152B40" strokeWidth="1.5" />
              {/* Sleeves */}
              <path d="M 52 104 L 36 138 L 46 142 L 58 120 Z" fill="url(#sailorBlue)" stroke="#10253A" strokeWidth="1" />
              <path d="M 108 104 L 124 138 L 114 142 L 102 120 Z" fill="url(#sailorBlue)" stroke="#10253A" strokeWidth="1" />
            </g>
          )}

          {outfitId === 'haori' && (
            <g id="outfit-haori">
              {/* Inner White Kimono */}
              <path d="M 66 102 L 94 102 L 86 160 L 74 160 Z" fill="#F5F5F0" />
              <path d="M 72 102 L 88 126" stroke="#DDD" strokeWidth="1.5" />
              {/* Traditional Pine Green Haori Coat */}
              <path
                d="M 46 104 L 70 104 L 72 160 L 38 160 Z"
                fill="url(#haoriGreen)"
                stroke="#1B362A"
                strokeWidth="1.5"
              />
              <path
                d="M 114 104 L 90 104 L 88 160 L 122 160 Z"
                fill="url(#haoriGreen)"
                stroke="#1B362A"
                strokeWidth="1.5"
              />
              {/* Wide Kimono Sleeves */}
              <path d="M 46 104 L 24 134 L 28 152 L 50 144 Z" fill="url(#haoriGreen)" stroke="#1B362A" strokeWidth="1.2" />
              <path d="M 114 104 L 136 134 L 132 152 L 110 144 Z" fill="url(#haoriGreen)" stroke="#1B362A" strokeWidth="1.2" />
              {/* Golden Haori Himo Cord Tie */}
              <circle cx="74" cy="122" r="2" fill="url(#goldTrim)" />
              <circle cx="86" cy="122" r="2" fill="url(#goldTrim)" />
              <path d="M 74 122 Q 80 130 86 122" stroke="url(#goldTrim)" strokeWidth="1.8" fill="none" />
              {/* Geometric hem trim */}
              <rect x="40" y="154" width="28" height="3" fill="#D4AF37" />
              <rect x="92" y="154" width="28" height="3" fill="#D4AF37" />
            </g>
          )}

          {outfitId === 'jinbei' && (
            <g id="outfit-jinbei">
              {/* Indigo Summer Jinbei */}
              <path
                d="M 50 104 L 110 104 L 116 160 L 44 160 Z"
                fill="url(#jinbeiNavy)"
                stroke="#182434"
                strokeWidth="1.5"
              />
              {/* Cross Wrap Collar */}
              <polygon points="62,104 98,104 84,134 76,134" fill="#2E4058" />
              <line x1="62" y1="104" x2="84" y2="134" stroke="#FFF" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="98" y1="104" x2="76" y2="134" stroke="#FFF" strokeWidth="1" strokeDasharray="2 2" />
              {/* Side Tie Knot */}
              <circle cx="68" cy="136" r="2.5" fill="#DFD5A5" />
              <path d="M 68 136 Q 62 144 60 148" stroke="#DFD5A5" strokeWidth="1.2" fill="none" />
              {/* Short Sleeves */}
              <path d="M 50 104 L 32 130 L 44 136 L 56 120 Z" fill="url(#jinbeiNavy)" stroke="#182434" strokeWidth="1" />
              <path d="M 110 104 L 128 130 L 116 136 L 104 120 Z" fill="url(#jinbeiNavy)" stroke="#182434" strokeWidth="1" />
            </g>
          )}

          {outfitId === 'dojo' && (
            <g id="outfit-dojo">
              {/* Martial Arts White Gi */}
              <path
                d="M 50 104 L 110 104 L 116 160 L 44 160 Z"
                fill="#FAFAFA"
                stroke="#CCC"
                strokeWidth="1.5"
              />
              {/* Deep V-neck Collar */}
              <polygon points="64,104 96,104 80,132" fill="#E8E8E8" />
              <line x1="64" y1="104" x2="84" y2="136" stroke="#999" strokeWidth="1.5" />
              <line x1="96" y1="104" x2="76" y2="136" stroke="#BBB" strokeWidth="1.5" />
              {/* Master Black Belt */}
              <rect x="46" y="132" width="68" height="10" rx="1" fill="#1C1B1A" stroke="#000" strokeWidth="1" />
              {/* Black Belt Knot dangling */}
              <path d="M 78 132 L 74 156 L 82 156 L 80 132 Z" fill="#1C1B1A" />
              <path d="M 80 132 L 86 154 L 92 153 L 84 132 Z" fill="#1C1B1A" />
              {/* Sleeves */}
              <path d="M 50 104 L 34 134 L 46 138 L 56 118 Z" fill="#FFFFFF" stroke="#CCC" strokeWidth="1" />
              <path d="M 110 104 L 126 134 L 114 138 L 104 118 Z" fill="#FFFFFF" stroke="#CCC" strokeWidth="1" />
            </g>
          )}

          {outfitId === 'suit' && (
            <g id="outfit-suit">
              {/* 1930s Showa Wool Suit */}
              <path
                d="M 48 104 L 112 104 L 118 160 L 42 160 Z"
                fill="#3E3835"
                stroke="#25211F"
                strokeWidth="1.5"
              />
              {/* White Shirt Collar */}
              <polygon points="72,102 88,102 80,118" fill="#FFFFFF" />
              {/* Striped Silk Necktie */}
              <polygon points="78,110 82,110 84,136 80,140 76,136" fill="#8B1E1E" />
              <line x1="77" y1="116" x2="83" y2="114" stroke="#DFD5A5" strokeWidth="1" />
              <line x1="77" y1="126" x2="83" y2="124" stroke="#DFD5A5" strokeWidth="1" />
              {/* Double Breasted Lapels */}
              <path d="M 56 104 L 72 132 L 56 132 Z" fill="#4D4642" stroke="#25211F" strokeWidth="1" />
              <path d="M 104 104 L 88 132 L 104 132 Z" fill="#4D4642" stroke="#25211F" strokeWidth="1" />
              {/* Gold Pocket Watch chain */}
              <path d="M 94 134 Q 100 142 104 136" stroke="url(#goldTrim)" strokeWidth="1.2" fill="none" />
              {/* Sleeves */}
              <path d="M 48 104 L 32 142 L 44 146 L 56 122 Z" fill="#3E3835" stroke="#25211F" strokeWidth="1" />
              <path d="M 112 104 L 128 142 L 116 146 L 104 122 Z" fill="#3E3835" stroke="#25211F" strokeWidth="1" />
            </g>
          )}

          {outfitId === 'default' && (
            <g id="outfit-default">
              {/* Classic White Student Shirt */}
              <path
                d="M 52 104 L 108 104 L 114 160 L 46 160 Z"
                fill="#F7F6F2"
                stroke="#D0CEB5"
                strokeWidth="1.5"
              />
              {/* Shirt Collar */}
              <polygon points="68,102 78,114 80,104" fill="#FFFFFF" stroke="#CCC" strokeWidth="1" />
              <polygon points="92,102 82,114 80,104" fill="#FFFFFF" stroke="#CCC" strokeWidth="1" />
              {/* Front button strip */}
              <line x1="80" y1="114" x2="80" y2="160" stroke="#DDD" strokeWidth="1.5" />
              <circle cx="80" cy="124" r="1.5" fill="#777" />
              <circle cx="80" cy="136" r="1.5" fill="#777" />
              <circle cx="80" cy="148" r="1.5" fill="#777" />
              {/* Sleeves */}
              <path d="M 52 104 L 36 138 L 46 142 L 58 120 Z" fill="#F7F6F2" stroke="#D0CEB5" strokeWidth="1" />
              <path d="M 108 104 L 124 138 L 114 142 L 102 120 Z" fill="#F7F6F2" stroke="#D0CEB5" strokeWidth="1" />
            </g>
          )}

          {/* Hands */}
          <circle cx="38" cy="144" r="6" fill="url(#skinTone)" stroke="#E0B693" strokeWidth="1" />
          <circle cx="122" cy="144" r="6" fill="url(#skinTone)" stroke="#E0B693" strokeWidth="1" />
        </g>

        {/* 3. HEAD & FACE (臉龐與自訂相片) */}
        <g id="head-face">
          {/* Base Face Circle */}
          <circle cx="80" cy="72" r="30" fill="url(#skinTone)" stroke="#5D4037" strokeWidth="1.5" />

          {/* If user uploaded custom photo, frame it neatly in the face aperture */}
          {hasCustomPhoto ? (
            <g clipPath="url(#photoClip)">
              <image
                href={photoURL}
                x="52"
                y="44"
                width="56"
                height="56"
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
          ) : (
            /* Chibi Anime Expression */
            <g id="chibi-face">
              {/* Cheeks blush */}
              <ellipse cx="64" cy="78" rx="4" ry="2.5" fill="#FF8A80" opacity="0.6" />
              <ellipse cx="96" cy="78" rx="4" ry="2.5" fill="#FF8A80" opacity="0.6" />

              {/* Eyes */}
              <ellipse cx="68" cy="70" rx="3.5" ry="4.5" fill="#2E2925" />
              <circle cx="67" cy="68" r="1.5" fill="#FFFFFF" />
              <ellipse cx="92" cy="70" rx="3.5" ry="4.5" fill="#2E2925" />
              <circle cx="91" cy="68" r="1.5" fill="#FFFFFF" />

              {/* Eyebrows (Focused & determined) */}
              <path d="M 63 63 Q 69 61 74 64" stroke="#3E2723" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M 97 63 Q 91 61 86 64" stroke="#3E2723" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Determined / Cheerful Mouth */}
              <path d="M 76 81 Q 80 85 84 81" stroke="#5D4037" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* Ears */}
          <ellipse cx="49" cy="74" rx="4" ry="6" fill="url(#skinTone)" stroke="#E0B693" strokeWidth="1" />
          <ellipse cx="111" cy="74" rx="4" ry="6" fill="url(#skinTone)" stroke="#E0B693" strokeWidth="1" />
        </g>

        {/* 4. HEADGEAR / HATS (頭飾帽子) */}
        <g id="headgear">
          {headId === 'student_cap' && (
            <g id="cap-student">
              {/* Cap Crown */}
              <path
                d="M 46 54 Q 80 34 114 54 L 118 64 Q 80 60 42 64 Z"
                fill="#1E232A"
                stroke="#0E1217"
                strokeWidth="1.5"
              />
              {/* Leather Visor / Brim */}
              <path
                d="M 40 63 Q 80 72 120 63 Q 80 67 40 63 Z"
                fill="#0A0D10"
                stroke="#000"
                strokeWidth="1.2"
              />
              <path d="M 44 63 Q 80 70 116 63" stroke="#FFF" strokeWidth="0.8" opacity="0.3" fill="none" />
              {/* Golden High-school Cherry Blossom Crest */}
              <circle cx="80" cy="52" r="4.5" fill="url(#goldTrim)" stroke="#664600" strokeWidth="0.8" />
              <polygon points="80,48 82,51 85,52 82,54 80,57 78,54 75,52 78,51" fill="#FFF" />
              {/* Golden chin strap buttons */}
              <circle cx="47" cy="62" r="1.8" fill="url(#goldTrim)" />
              <circle cx="113" cy="62" r="1.8" fill="url(#goldTrim)" />
            </g>
          )}

          {headId === 'hachimaki' && (
            <g id="cap-hachimaki">
              {/* White Cloth Headband */}
              <path
                d="M 46 56 Q 80 50 114 56 L 115 65 Q 80 59 45 65 Z"
                fill="#FAFAFA"
                stroke="#C5B5A5"
                strokeWidth="1.5"
              />
              {/* Red Kanji: 必勝 (Victory) */}
              <text
                x="80"
                y="63"
                textAnchor="middle"
                fill="#D32F2F"
                fontSize="8"
                fontWeight="900"
                fontFamily="sans-serif"
                letterSpacing="1"
              >
                必勝
              </text>
              {/* Flowing Ribbon tails behind ear */}
              <path
                d="M 114 62 Q 128 65 132 78 Q 126 80 116 68 Z"
                fill="#FFFFFF"
                stroke="#C5B5A5"
                strokeWidth="1"
              />
              <path
                d="M 115 65 Q 134 74 136 90 Q 129 91 118 72 Z"
                fill="#FFFFFF"
                stroke="#C5B5A5"
                strokeWidth="1"
              />
            </g>
          )}

          {headId === 'fox_mask' && (
            <g id="cap-fox" transform="translate(14, -6) rotate(12 80 50)">
              {/* Slanted Kitsune Fox Mask on side of head */}
              <path
                d="M 70 30 Q 80 20 90 30 Q 98 42 90 56 Q 80 62 70 56 Q 62 42 70 30 Z"
                fill="#FFFFFF"
                stroke="#2E2925"
                strokeWidth="1.5"
              />
              {/* Fox Ears */}
              <polygon points="68,30 64,16 76,24" fill="#D32F2F" stroke="#2E2925" strokeWidth="1.2" />
              <polygon points="92,30 96,16 84,24" fill="#D32F2F" stroke="#2E2925" strokeWidth="1.2" />
              {/* Red Whisker & Eye markings */}
              <path d="M 72 38 Q 76 42 74 46" stroke="#D32F2F" strokeWidth="1.5" fill="none" />
              <path d="M 88 38 Q 84 42 86 46" stroke="#D32F2F" strokeWidth="1.5" fill="none" />
              <ellipse cx="80" cy="46" rx="2" ry="1.2" fill="#2E2925" />
              <path d="M 70 48 Q 64 52 62 58" stroke="#D32F2F" strokeWidth="1.2" fill="none" />
              <path d="M 90 48 Q 96 52 98 58" stroke="#D32F2F" strokeWidth="1.2" fill="none" />
              {/* Red cord & bells */}
              <circle cx="63" cy="52" r="2.5" fill="url(#goldTrim)" />
              <path d="M 63 54 Q 60 62 62 68" stroke="#D32F2F" strokeWidth="1.5" fill="none" />
            </g>
          )}

          {headId === 'ronin_band' && (
            <g id="cap-ronin">
              {/* Weathered Indigo Tied Cloth */}
              <path
                d="M 44 56 Q 80 51 116 56 L 116 66 Q 80 61 44 66 Z"
                fill="#2B3A4A"
                stroke="#1B2530"
                strokeWidth="1.5"
              />
              {/* Forged Steel Plate */}
              <rect x="65" y="54" width="30" height="9" rx="1.5" fill="#78909C" stroke="#37474F" strokeWidth="1" />
              {/* Steel plate scratch & rivets */}
              <circle cx="68" cy="58.5" r="1" fill="#263238" />
              <circle cx="92" cy="58.5" r="1" fill="#263238" />
              <line x1="74" y1="56" x2="84" y2="61" stroke="#ECEFF1" strokeWidth="0.8" />
            </g>
          )}

          {headId === 'fedora' && (
            <g id="cap-fedora">
              {/* Fedora Brim */}
              <ellipse cx="80" cy="56" rx="42" ry="8" fill="#42342B" stroke="#271E18" strokeWidth="1.5" />
              {/* Fedora Crown */}
              <path
                d="M 54 54 C 54 34 68 28 80 30 C 92 28 106 34 106 54 Z"
                fill="#544337"
                stroke="#271E18"
                strokeWidth="1.5"
              />
              {/* Top Crease indentation */}
              <path d="M 72 32 Q 80 36 88 32" stroke="#271E18" strokeWidth="1.5" fill="none" />
              {/* Silk Ribbon Band */}
              <path
                d="M 54 50 Q 80 47 106 50 L 106 54 Q 80 51 54 54 Z"
                fill="#1A1817"
                stroke="#000"
                strokeWidth="0.8"
              />
              {/* Small feather tucked in ribbon */}
              <path d="M 60 48 Q 56 36 62 30 Q 64 38 62 48 Z" fill="#D32F2F" />
            </g>
          )}

          {headId === 'ninja_mask' && (
            <g id="cap-ninja">
              {/* Black Ninja Cowl wrapping head */}
              <path
                d="M 46 54 Q 80 32 114 54 L 118 84 Q 80 92 42 84 Z"
                fill="#1A1A1D"
                stroke="#0D0D0E"
                strokeWidth="1.5"
              />
              {/* Eye Opening slit */}
              <ellipse cx="80" cy="70" rx="26" ry="9" fill="url(#skinTone)" stroke="#0D0D0E" strokeWidth="1.2" />
              {/* Eyes looking out from dark mask */}
              <ellipse cx="68" cy="70" rx="3.5" ry="3" fill="#2E2925" />
              <ellipse cx="92" cy="70" rx="3.5" ry="3" fill="#2E2925" />
              <path d="M 64 66 L 73 68" stroke="#FFF" strokeWidth="1" />
              <path d="M 96 66 L 87 68" stroke="#FFF" strokeWidth="1" />
            </g>
          )}

          {headId === 'none' && !hasCustomPhoto && (
            /* Neatly styled retro side-part hair */
            <g id="hair-classic">
              <path
                d="M 50 64 Q 52 42 80 40 Q 108 42 110 64 Q 102 54 82 52 Q 62 52 50 64 Z"
                fill="#2E2925"
              />
              <path d="M 58 52 Q 74 46 94 48" stroke="#4E3E37" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>
          )}
        </g>

        {/* 5. HANDHELD ACCESSORY (隨身手持道具) */}
        {showAccessory && (
          <g id="handheld-accessory">
            {accessoryId === 'brush' && (
              <g id="item-brush" transform="translate(118, 115) rotate(25)">
                {/* Bamboo Calligraphy Brush */}
                <rect x="0" y="0" width="4.5" height="42" rx="2" fill="#B48247" stroke="#684720" strokeWidth="1" />
                <rect x="0" y="32" width="4.5" height="5" fill="#3E2723" />
                {/* Fine White/Black Goat Hair Tip */}
                <path d="M 0 37 Q 2.2 49 2.2 52 Q 4.5 49 4.5 37 Z" fill="#263238" stroke="#111" strokeWidth="0.8" />
                {/* Red Thread loop */}
                <circle cx="2.2" cy="3" r="1.5" fill="#D32F2F" />
              </g>
            )}

            {accessoryId === 'shinai' && (
              <g id="item-shinai" transform="translate(120, 100) rotate(20)">
                {/* Bamboo Kendo Shinai */}
                <rect x="0" y="0" width="4" height="60" rx="1" fill="#E8D5B5" stroke="#9A7B4F" strokeWidth="1" />
                <line x1="2" y1="15" x2="2" y2="50" stroke="#7A5F3A" strokeWidth="0.8" strokeDasharray="6 2" />
                {/* Round Tsuba (Handguard) */}
                <ellipse cx="2" cy="46" rx="6" ry="2.5" fill="#5D4037" stroke="#3E2723" strokeWidth="1" />
                {/* White leather grip */}
                <rect x="0.5" y="48" width="3" height="15" fill="#FFFFFF" stroke="#999" strokeWidth="0.8" />
              </g>
            )}

            {accessoryId === 'abacus' && (
              <g id="item-abacus" transform="translate(116, 128) rotate(-10)">
                {/* Wooden 5-bead Soroban */}
                <rect x="0" y="0" width="22" height="15" rx="1.5" fill="#6D4C41" stroke="#3E2723" strokeWidth="1.2" />
                {/* Dividing Beam */}
                <line x1="0" y1="4.5" x2="22" y2="4.5" stroke="#D7CCC8" strokeWidth="1" />
                {/* Beads */}
                <circle cx="4" cy="2.5" r="1.2" fill="url(#goldTrim)" />
                <circle cx="8.5" cy="2.5" r="1.2" fill="url(#goldTrim)" />
                <circle cx="13" cy="2.5" r="1.2" fill="url(#goldTrim)" />
                <circle cx="17.5" cy="2.5" r="1.2" fill="url(#goldTrim)" />
                <circle cx="4" cy="8" r="1.2" fill="url(#goldTrim)" />
                <circle cx="8.5" cy="11" r="1.2" fill="url(#goldTrim)" />
                <circle cx="13" cy="8" r="1.2" fill="url(#goldTrim)" />
                <circle cx="17.5" cy="12" r="1.2" fill="url(#goldTrim)" />
              </g>
            )}

            {accessoryId === 'fan' && (
              <g id="item-fan" transform="translate(114, 120) rotate(15)">
                {/* Golden Sensu Fan */}
                <path
                  d="M 12 24 L 0 6 Q 16 -6 32 6 Z"
                  fill="url(#goldTrim)"
                  stroke="#8D6E63"
                  strokeWidth="1.2"
                />
                {/* Rising Red Sun on Fan */}
                <ellipse cx="16" cy="7" rx="5" ry="3.5" fill="#D32F2F" />
                {/* Bamboo Ribs radiating */}
                <line x1="12" y1="24" x2="6" y2="4" stroke="#5D4037" strokeWidth="0.8" />
                <line x1="12" y1="24" x2="16" y2="1" stroke="#5D4037" strokeWidth="0.8" />
                <line x1="12" y1="24" x2="26" y2="4" stroke="#5D4037" strokeWidth="0.8" />
              </g>
            )}

            {accessoryId === 'katana' && (
              <g id="item-katana" transform="translate(122, 92) rotate(28)">
                {/* Curved Japanese Katana */}
                <path
                  d="M 2 0 Q 3 25 1 55 L -1 55 Q 1 25 0 0 Z"
                  fill="#CFD8DC"
                  stroke="#546E7A"
                  strokeWidth="0.8"
                />
                {/* Black Lacquer Saya (Scabbard) */}
                <path d="M 0 25 Q 3 45 1 65 L -2 65 Q 0 45 -1 25 Z" fill="#212121" stroke="#000" strokeWidth="1" />
                {/* Gold Tsuba Guard */}
                <ellipse cx="1" cy="24" rx="5" ry="2" fill="url(#goldTrim)" stroke="#5D4037" strokeWidth="0.8" />
                {/* Wrapped Tsuka Handle */}
                <rect x="-0.5" y="10" width="3" height="14" fill="#B71C1C" stroke="#212121" strokeWidth="0.8" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
