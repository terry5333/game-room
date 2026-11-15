import React from 'react';
import type { UserWardrobe } from '../../types';
import { DEFAULT_WARDROBE } from '../../data/wardrobeCatalog';

interface ShowaAvatarProps {
  wardrobe?: Partial<UserWardrobe>;
  photoURL?: string; // Kept in interface for backward compatibility, but ignored per user request: "臉不要用頭像"
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPedestal?: boolean;
  showAccessory?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

const SIZE_CONFIGS = {
  sm: { width: 36, height: 42 },
  md: { width: 68, height: 78 },
  lg: { width: 136, height: 156 },
  xl: { width: 200, height: 230 }
};

export const ShowaAvatar: React.FC<ShowaAvatarProps> = ({
  wardrobe = DEFAULT_WARDROBE,
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

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center justify-end select-none ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      } ${className}`}
      style={{ width: cfg.width, height: cfg.height }}
    >
      <svg
        viewBox="0 0 32 36"
        className={`w-full h-full overflow-visible ${animated ? 'animate-pixel-bob' : ''}`}
        style={{
          imageRendering: 'pixelated',
          shapeRendering: 'crispEdges'
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ========================================================
            1. PEDESTAL (16-bit 像素對弈擂台底座)
            ======================================================== */}
        {showPedestal && (
          <g id="pixel-pedestal">
            {/* Ground Shadow */}
            <rect x="4" y="35" width="24" height="1" fill="#000000" fillOpacity="0.25" />
            <rect x="6" y="34" width="20" height="1" fill="#000000" fillOpacity="0.15" />

            {/* Dark Lacquer Base (底層深色漆木) */}
            <rect x="2" y="33" width="28" height="2" fill="#2E1B10" />
            <rect x="3" y="32" width="26" height="1" fill="#4A2E1B" />

            {/* Gold Lacquer Trim Line (金箔飾邊) */}
            <rect x="3" y="31" width="26" height="1" fill="#D4AF37" />
            <rect x="4" y="31" width="6" height="1" fill="#FFE082" />

            {/* Tatami Green Mat Surface (榻榻米蓆面) */}
            <rect x="4" y="29" width="24" height="2" fill="#587352" />
            <rect x="5" y="29" width="22" height="1" fill="#6B8A64" />
            {/* Tatami edge binding ribbons (緣錦黑邊) */}
            <rect x="4" y="29" width="1" height="2" fill="#1F291D" />
            <rect x="27" y="29" width="1" height="2" fill="#1F291D" />
          </g>
        )}

        {/* ========================================================
            2. LEGS & SHOES (雙腿與鞋履)
            ======================================================== */}
        <g id="pixel-legs">
          {/* Pants / Legs */}
          {outfitId === 'sailor' ? (
            /* Sailor Girl Legs & White Socks */
            <>
              {/* Bare Legs */}
              <rect x="12" y="27" width="2" height="2" fill="#FFDCB6" />
              <rect x="18" y="27" width="2" height="2" fill="#FFDCB6" />
              {/* White High Socks */}
              <rect x="12" y="29" width="2" height="2" fill="#FFFFFF" />
              <rect x="18" y="29" width="2" height="2" fill="#FFFFFF" />
              {/* Brown Loafers */}
              <rect x="11" y="31" width="3" height="1" fill="#3E2723" />
              <rect x="18" y="31" width="3" height="1" fill="#3E2723" />
            </>
          ) : outfitId === 'haori' ? (
            /* Traditional White Tabi & Zori Sandals */
            <>
              {/* Hakama Pants bottoms */}
              <rect x="11" y="28" width="4" height="2" fill="#1F3628" />
              <rect x="17" y="28" width="4" height="2" fill="#1F3628" />
              {/* White Tabi Socks */}
              <rect x="12" y="30" width="2" height="1" fill="#FFFFFF" />
              <rect x="18" y="30" width="2" height="1" fill="#FFFFFF" />
              {/* Straw Zori Sandals with Red Thong */}
              <rect x="11" y="31" width="3" height="1" fill="#C5A059" />
              <rect x="18" y="31" width="3" height="1" fill="#C5A059" />
              <rect x="12" y="31" width="1" height="1" fill="#D32F2F" />
              <rect x="19" y="31" width="1" height="1" fill="#D32F2F" />
            </>
          ) : outfitId === 'dojo' ? (
            /* Martial Arts White Pants & Bare Feet / Tabi */
            <>
              <rect x="12" y="28" width="3" height="3" fill="#EAE8E0" />
              <rect x="17" y="28" width="3" height="3" fill="#EAE8E0" />
              <rect x="11" y="31" width="4" height="1" fill="#D2CFBF" />
              <rect x="17" y="31" width="4" height="1" fill="#D2CFBF" />
            </>
          ) : outfitId === 'suit' ? (
            /* Gentleman Wool Trousers & Leather Oxford Shoes */
            <>
              <rect x="12" y="28" width="3" height="3" fill="#3D352F" />
              <rect x="17" y="28" width="3" height="3" fill="#3D352F" />
              {/* Shiny Black Dress Shoes */}
              <rect x="11" y="31" width="4" height="1" fill="#181412" />
              <rect x="17" y="31" width="4" height="1" fill="#181412" />
              <rect x="11" y="31" width="1" height="1" fill="#4E443C" />
            </>
          ) : (
            /* Classic Dark Student Trousers & Black Shoes (Gakuran / Default / Jinbei) */
            <>
              <rect x="12" y="28" width="3" height="3" fill="#1E232A" />
              <rect x="17" y="28" width="3" height="3" fill="#1E232A" />
              <rect x="11" y="31" width="4" height="1" fill="#12151A" />
              <rect x="17" y="31" width="4" height="1" fill="#12151A" />
              <rect x="11" y="31" width="1" height="1" fill="#38414E" />
            </>
          )}
        </g>

        {/* ========================================================
            3. BODY / OUTFIT (像素戰袍服裝)
            ======================================================== */}
        <g id="pixel-outfit">
          {outfitId === 'gakuran' && (
            /* 經典黑學蘭立領高校軍裝 */
            <>
              {/* Coat Base */}
              <rect x="9" y="19" width="14" height="9" fill="#1E232A" />
              {/* Shoulder & outline shades */}
              <rect x="8" y="20" width="1" height="5" fill="#14171C" />
              <rect x="23" y="20" width="1" height="5" fill="#14171C" />
              {/* Mandarin Stand Collar */}
              <rect x="13" y="18" width="6" height="2" fill="#14171C" />
              <rect x="15" y="18" width="2" height="2" fill="#FFFFFF" />
              {/* Golden Brass Buttons (金屬鈕扣) */}
              <rect x="15" y="20" width="2" height="1" fill="#FFD700" />
              <rect x="15" y="22" width="2" height="1" fill="#FFD700" />
              <rect x="15" y="24" width="2" height="1" fill="#FFD700" />
              <rect x="15" y="26" width="2" height="1" fill="#FFD700" />
              {/* Chest School Badge (胸前校徽紅標) */}
              <rect x="11" y="21" width="2" height="1" fill="#D32F2F" />
              {/* Coat Flap split */}
              <rect x="15" y="27" width="2" height="1" fill="#14171C" />
            </>
          )}

          {outfitId === 'sailor' && (
            /* 昭和女子海軍水手服 */
            <>
              {/* Navy Dress Torso */}
              <rect x="10" y="19" width="12" height="6" fill="#1F3A5F" />
              {/* White V-neck Insert */}
              <rect x="13" y="19" width="6" height="3" fill="#FFFFFF" />
              {/* White Collar Stripes */}
              <rect x="11" y="19" width="10" height="1" fill="#FFFFFF" />
              <rect x="10" y="20" width="2" height="1" fill="#FFFFFF" />
              <rect x="20" y="20" width="2" height="1" fill="#FFFFFF" />
              {/* Bright Red Scarf Ribbon (鮮紅領巾) */}
              <rect x="15" y="21" width="2" height="1" fill="#C62828" />
              <rect x="14" y="22" width="4" height="2" fill="#E53935" />
              <rect x="15" y="24" width="2" height="1" fill="#B71C1C" />
              {/* Navy Pleated Skirt (百褶裙) */}
              <rect x="9" y="25" width="14" height="3" fill="#182E4B" />
              <rect x="12" y="25" width="1" height="3" fill="#122238" />
              <rect x="16" y="25" width="1" height="3" fill="#122238" />
              <rect x="19" y="25" width="1" height="3" fill="#122238" />
            </>
          )}

          {outfitId === 'haori' && (
            /* 典雅松綠羽織與和服 */
            <>
              {/* Inner White Kimono wrap */}
              <rect x="12" y="19" width="8" height="9" fill="#F7F6F2" />
              <rect x="15" y="19" width="1" height="8" fill="#D5D3CA" />
              {/* Outer Pine Green Haori Coat */}
              <rect x="8" y="19" width="5" height="9" fill="#2E5A44" />
              <rect x="19" y="19" width="5" height="9" fill="#2E5A44" />
              {/* Haori lapel shade */}
              <rect x="12" y="19" width="1" height="9" fill="#224232" />
              <rect x="19" y="19" width="1" height="9" fill="#224232" />
              {/* Gold Haori Himo Cord Tie (羽織紐) */}
              <rect x="13" y="23" width="6" height="1" fill="#FFD54F" />
              <rect x="15" y="24" width="2" height="1" fill="#FFA000" />
            </>
          )}

          {outfitId === 'jinbei' && (
            /* 藍染十字紋夏季甚平 */
            <>
              {/* Indigo Blue Base */}
              <rect x="9" y="19" width="14" height="9" fill="#243750" />
              {/* Cross Wrap Collar */}
              <rect x="13" y="19" width="3" height="4" fill="#334D6E" />
              <rect x="15" y="20" width="3" height="3" fill="#1B293C" />
              {/* White Cross-stitch textures (十字碎花織紋) */}
              <rect x="11" y="22" width="1" height="1" fill="#E8EDF5" />
              <rect x="20" y="22" width="1" height="1" fill="#E8EDF5" />
              <rect x="13" y="25" width="1" height="1" fill="#E8EDF5" />
              <rect x="18" y="25" width="1" height="1" fill="#E8EDF5" />
              {/* Side Tie string knot (側綁繩) */}
              <rect x="10" y="24" width="2" height="1" fill="#DFD5A5" />
              <rect x="10" y="25" width="1" height="1" fill="#DFD5A5" />
            </>
          )}

          {outfitId === 'dojo' && (
            /* 正統極真空手道武道服 */
            <>
              {/* White Gi Body */}
              <rect x="9" y="19" width="14" height="9" fill="#FAFAFA" />
              {/* Lapel V-fold */}
              <rect x="13" y="19" width="3" height="5" fill="#E0DED7" />
              <rect x="15" y="20" width="3" height="4" fill="#D2CFBF" />
              {/* Black Belt (黑帶) */}
              <rect x="9" y="24" width="14" height="2" fill="#1C1B1A" />
              {/* Belt Knot & dangling tails */}
              <rect x="15" y="24" width="2" height="2" fill="#000000" />
              <rect x="14" y="26" width="2" height="2" fill="#1C1B1A" />
              <rect x="16" y="26" width="2" height="3" fill="#1C1B1A" />
            </>
          )}

          {outfitId === 'suit' && (
            /* 昭和洋風毛呢雙排扣西服 */
            <>
              {/* Tweed Brown Jacket */}
              <rect x="9" y="19" width="14" height="9" fill="#42352B" />
              {/* White Dress Shirt V */}
              <rect x="14" y="19" width="4" height="4" fill="#FFFFFF" />
              {/* Crimson Necktie (朱紅領帶) */}
              <rect x="15" y="20" width="2" height="4" fill="#A82323" />
              <rect x="15" y="24" width="2" height="1" fill="#801919" />
              {/* Double-breasted buttons */}
              <rect x="12" y="23" width="1" height="1" fill="#1D1510" />
              <rect x="19" y="23" width="1" height="1" fill="#1D1510" />
              <rect x="12" y="25" width="1" height="1" fill="#1D1510" />
              <rect x="19" y="25" width="1" height="1" fill="#1D1510" />
              {/* Golden Pocket Watch Chain (懷錶金鍊) */}
              <rect x="18" y="26" width="3" height="1" fill="#FFD700" />
            </>
          )}

          {outfitId === 'default' && (
            /* 純樸受驗生白襯衫 */
            <>
              {/* White Shirt Body */}
              <rect x="9" y="19" width="14" height="9" fill="#FFFFFF" />
              {/* Shirt Collar fold */}
              <rect x="13" y="18" width="2" height="2" fill="#E6E4DD" />
              <rect x="17" y="18" width="2" height="2" fill="#E6E4DD" />
              {/* Center Placket & Buttons */}
              <rect x="15" y="19" width="2" height="9" fill="#F0EEE6" />
              <rect x="15" y="21" width="2" height="1" fill="#9E9E9E" />
              <rect x="15" y="23" width="2" height="1" fill="#9E9E9E" />
              <rect x="15" y="25" width="2" height="1" fill="#9E9E9E" />
              <rect x="15" y="27" width="2" height="1" fill="#9E9E9E" />
            </>
          )}

          {/* ARMS & SLEEVES */}
          {outfitId === 'haori' ? (
            /* Wide Kimono Sleeves (寬大振袖) */
            <>
              <rect x="6" y="20" width="3" height="6" fill="#2E5A44" />
              <rect x="23" y="20" width="3" height="6" fill="#2E5A44" />
              {/* Hands */}
              <rect x="6" y="26" width="2" height="2" fill="#FFDCB6" />
              <rect x="24" y="26" width="2" height="2" fill="#FFDCB6" />
            </>
          ) : outfitId === 'sailor' ? (
            /* Short Sailor Sleeves */
            <>
              <rect x="7" y="20" width="2" height="4" fill="#1F3A5F" />
              <rect x="23" y="20" width="2" height="4" fill="#1F3A5F" />
              {/* Bare Arms & Hands */}
              <rect x="7" y="24" width="2" height="3" fill="#FFDCB6" />
              <rect x="23" y="24" width="2" height="3" fill="#FFDCB6" />
            </>
          ) : outfitId === 'jinbei' ? (
            /* Short Jinbei Sleeves */
            <>
              <rect x="7" y="20" width="2" height="3" fill="#243750" />
              <rect x="23" y="20" width="2" height="3" fill="#243750" />
              <rect x="7" y="23" width="2" height="4" fill="#FFDCB6" />
              <rect x="23" y="23" width="2" height="4" fill="#FFDCB6" />
            </>
          ) : (
            /* Long Sleeves (Gakuran, Dojo, Suit, Default) */
            <>
              <rect
                x="7"
                y="20"
                width="2"
                height="6"
                fill={
                  outfitId === 'gakuran'
                    ? '#1E232A'
                    : outfitId === 'dojo'
                    ? '#FAFAFA'
                    : outfitId === 'suit'
                    ? '#42352B'
                    : '#FFFFFF'
                }
              />
              <rect
                x="23"
                y="20"
                width="2"
                height="6"
                fill={
                  outfitId === 'gakuran'
                    ? '#1E232A'
                    : outfitId === 'dojo'
                    ? '#FAFAFA'
                    : outfitId === 'suit'
                    ? '#42352B'
                    : '#FFFFFF'
                }
              />
              {/* Pixel Hands (雙手) */}
              <rect x="7" y="26" width="2" height="2" fill="#FFDCB6" />
              <rect x="23" y="26" width="2" height="2" fill="#FFDCB6" />
            </>
          )}
        </g>

        {/* ========================================================
            4. HEAD & FACE (純像素風動漫人臉，非相片頭像)
            ======================================================== */}
        <g id="pixel-face">
          {/* Neck (頸部) */}
          <rect x="14" y="17" width="4" height="2" fill="#FFDCB6" />
          <rect x="14" y="18" width="4" height="1" fill="#E5B88F" />

          {/* Face Base (膚色輪廓) */}
          <rect x="11" y="9" width="10" height="8" fill="#FFDCB6" />
          <rect x="12" y="17" width="8" height="1" fill="#FFDCB6" />
          <rect x="13" y="18" width="6" height="1" fill="#FFDCB6" />

          {/* Ears (像素小耳朵) */}
          <rect x="10" y="12" width="1" height="3" fill="#FFDCB6" />
          <rect x="21" y="12" width="1" height="3" fill="#FFDCB6" />
          <rect x="10" y="13" width="1" height="1" fill="#E5B88F" />
          <rect x="21" y="13" width="1" height="1" fill="#E5B88F" />

          {/* Retro Anime Hair Base (蓬鬆復古深黑褐色短髮) */}
          <rect x="11" y="6" width="10" height="2" fill="#2B211B" />
          <rect x="10" y="7" width="12" height="2" fill="#2B211B" />
          <rect x="9" y="8" width="14" height="2" fill="#2B211B" />
          {/* Hair shine highlights (天使光環高光) */}
          <rect x="12" y="7" width="3" height="1" fill="#5E483A" />
          <rect x="17" y="7" width="3" height="1" fill="#5E483A" />
          {/* Sideburns & Bangs (瀏海與鬢角) */}
          <rect x="9" y="10" width="2" height="4" fill="#2B211B" />
          <rect x="21" y="10" width="2" height="4" fill="#2B211B" />
          <rect x="11" y="9" width="1" height="2" fill="#2B211B" />
          <rect x="13" y="9" width="2" height="2" fill="#2B211B" />
          <rect x="18" y="9" width="2" height="2" fill="#2B211B" />

          {/* Eyebrows (微皺認真受驗眉) */}
          <rect x="12" y="11" width="3" height="1" fill="#3E2723" />
          <rect x="17" y="11" width="3" height="1" fill="#3E2723" />

          {/* Big Chibi Pixel Eyes (大顆水汪汪像素眼瞳) */}
          {/* Left Eye */}
          <rect x="12" y="13" width="2" height="3" fill="#1C1816" />
          <rect x="12" y="13" width="1" height="1" fill="#FFFFFF" />
          <rect x="13" y="15" width="1" height="1" fill="#3A302A" />

          {/* Right Eye */}
          <rect x="18" y="13" width="2" height="3" fill="#1C1816" />
          <rect x="18" y="13" width="1" height="1" fill="#FFFFFF" />
          <rect x="19" y="15" width="1" height="1" fill="#3A302A" />

          {/* Cheerful Pixel Blush (可愛雙頰微醺腮紅) */}
          <rect x="11" y="15" width="1" height="1" fill="#FF8A80" />
          <rect x="20" y="15" width="1" height="1" fill="#FF8A80" />

          {/* Determined Smile (堅毅微笑) */}
          <rect x="15" y="16" width="2" height="1" fill="#C85A48" />
        </g>

        {/* ========================================================
            5. HEADGEAR / HATS (像素帽子與頭飾)
            ======================================================== */}
        <g id="pixel-headgear">
          {headId === 'student_cap' && (
            /* 帝國高校黑制帽 */
            <>
              {/* Black Cap Crown */}
              <rect x="9" y="4" width="14" height="3" fill="#1E232A" />
              <rect x="8" y="5" width="16" height="2" fill="#1E232A" />
              {/* Crown Highlight */}
              <rect x="11" y="4" width="10" height="1" fill="#363E4A" />
              {/* Golden School Crest (櫻花金徽) */}
              <rect x="15" y="4" width="2" height="2" fill="#FFD700" />
              <rect x="15" y="5" width="2" height="1" fill="#FFFFFF" />
              {/* Black Leather Visor (漆皮帽簷) */}
              <rect x="8" y="7" width="16" height="2" fill="#0E1114" />
              <rect x="9" y="7" width="14" height="1" fill="#4B5668" />
              {/* Gold Side buttons */}
              <rect x="8" y="7" width="1" height="1" fill="#FFD700" />
              <rect x="23" y="7" width="1" height="1" fill="#FFD700" />
            </>
          )}

          {headId === 'hachimaki' && (
            /* 必勝紅白布條 */
            <>
              {/* White Band around forehead */}
              <rect x="9" y="9" width="14" height="2" fill="#FAFAFA" />
              {/* Red Kanji Center "必" (朱紅必勝像素紋) */}
              <rect x="15" y="9" width="2" height="2" fill="#D32F2F" />
              {/* Fluttering Knot Tails on the right */}
              <rect x="23" y="9" width="2" height="2" fill="#FAFAFA" />
              <rect x="24" y="11" width="2" height="2" fill="#E0E0E0" />
              <rect x="25" y="13" width="2" height="2" fill="#FAFAFA" />
              <rect x="26" y="15" width="1" height="2" fill="#E0E0E0" />
            </>
          )}

          {headId === 'fox_mask' && (
            /* 稻荷神社狐狸面具 (斜掛於髮際) */
            <>
              {/* Mask Face Base (斜掛於右上方) */}
              <rect x="18" y="3" width="7" height="6" fill="#FFFFFF" />
              <rect x="19" y="9" width="5" height="2" fill="#FFFFFF" />
              <rect x="21" y="11" width="2" height="1" fill="#FFFFFF" />
              {/* Fox Ears (狐狸尖耳) */}
              <rect x="18" y="1" width="2" height="2" fill="#D32F2F" />
              <rect x="24" y="1" width="2" height="2" fill="#D32F2F" />
              <rect x="19" y="2" width="1" height="1" fill="#FFFFFF" />
              {/* Red Whisker Markings (朱紅狐紋與眼線) */}
              <rect x="19" y="5" width="2" height="1" fill="#D32F2F" />
              <rect x="23" y="5" width="2" height="1" fill="#D32F2F" />
              <rect x="21" y="8" width="1" height="1" fill="#1C1816" />
              {/* Red Bell & Tassel (鈴鐺掛繩) */}
              <rect x="17" y="8" width="1" height="2" fill="#D32F2F" />
              <rect x="16" y="10" width="2" height="2" fill="#FFD700" />
            </>
          )}

          {headId === 'ronin_band' && (
            /* 大正浪人鋼鐵護額 */
            <>
              {/* Indigo Tied Band */}
              <rect x="9" y="9" width="14" height="2" fill="#253342" />
              {/* Steel Armor Plate (金屬鋼鐵護額板) */}
              <rect x="12" y="9" width="8" height="2" fill="#78909C" />
              {/* Steel reflection scratch */}
              <rect x="14" y="9" width="4" height="1" fill="#ECEFF1" />
              {/* Metal Rivets (兩側柳釘) */}
              <rect x="12" y="9" width="1" height="1" fill="#263238" />
              <rect x="19" y="9" width="1" height="1" fill="#263238" />
            </>
          )}

          {headId === 'fedora' && (
            /* 昭和紳士軟呢禮帽 */
            <>
              {/* Fedora Crown */}
              <rect x="11" y="3" width="10" height="4" fill="#4E3A2F" />
              <rect x="13" y="2" width="6" height="1" fill="#3D2D24" />
              {/* Crease shadow */}
              <rect x="14" y="3" width="4" height="1" fill="#3D2D24" />
              {/* Black Silk Ribbon Band */}
              <rect x="11" y="6" width="10" height="1" fill="#1C140F" />
              {/* Red Feather (插於帶上的羽毛) */}
              <rect x="12" y="4" width="1" height="3" fill="#D32F2F" />
              {/* Wide Fedora Brim (寬帽簷) */}
              <rect x="7" y="7" width="18" height="2" fill="#3D2D24" />
              <rect x="8" y="7" width="16" height="1" fill="#5E4638" />
            </>
          )}

          {headId === 'ninja_mask' && (
            /* 隱密影忍黑面罩 (覆蓋全頭與下半臉，只露銳利眼神) */
            <>
              {/* Black Cowl wrapping head */}
              <rect x="10" y="5" width="12" height="4" fill="#1C1C20" />
              <rect x="9" y="7" width="14" height="3" fill="#1C1C20" />
              {/* Mask covering lower face (下半臉面罩) */}
              <rect x="10" y="15" width="12" height="4" fill="#1C1C20" />
              <rect x="11" y="18" width="10" height="1" fill="#121215" />
              {/* Forehead Protector Plate */}
              <rect x="13" y="9" width="6" height="2" fill="#546E7A" />
              <rect x="14" y="9" width="4" height="1" fill="#B0BEC5" />
            </>
          )}
        </g>

        {/* ========================================================
            6. HANDHELD ACCESSORY (隨身手持道具，右側手持)
            ======================================================== */}
        {showAccessory && (
          <g id="pixel-accessory">
            {accessoryId === 'katana' && (
              /* 武士刀 / 太刀 */
              <>
                {/* Silver Curved Blade (銀白刀刃) */}
                <rect x="26" y="9" width="1" height="13" fill="#ECEFF1" />
                <rect x="27" y="10" width="1" height="11" fill="#B0BEC5" />
                <rect x="26" y="8" width="1" height="1" fill="#FFFFFF" />
                {/* Gold Tsuba (金色刀鐔) */}
                <rect x="25" y="22" width="3" height="1" fill="#FFD700" />
                {/* Red Wrapped Tsuka (紅繩纏黑刀柄) */}
                <rect x="26" y="23" width="1" height="5" fill="#B71C1C" />
                <rect x="26" y="24" width="1" height="1" fill="#1A1A1A" />
                <rect x="26" y="26" width="1" height="1" fill="#1A1A1A" />
                {/* Gold Kashira Pommel */}
                <rect x="26" y="28" width="1" height="1" fill="#FFD700" />
              </>
            )}

            {accessoryId === 'shinai' && (
              /* 劍道竹劍 */
              <>
                {/* Bamboo Slats (竹條劍身) */}
                <rect x="26" y="9" width="1" height="13" fill="#E6D5B8" />
                <rect x="27" y="11" width="1" height="10" fill="#CBB691" />
                <rect x="26" y="13" width="1" height="1" fill="#8D734E" />
                <rect x="26" y="18" width="1" height="1" fill="#8D734E" />
                {/* Round Tsuba Guard (深色皮鐔) */}
                <rect x="25" y="22" width="3" height="1" fill="#5D4037" />
                {/* White Leather Grip (白柄卷) */}
                <rect x="26" y="23" width="1" height="5" fill="#FFFFFF" />
                <rect x="26" y="24" width="1" height="1" fill="#D5D5D5" />
                <rect x="26" y="26" width="1" height="1" fill="#D5D5D5" />
              </>
            )}

            {accessoryId === 'brush' && (
              /* 大師書法竹管毛筆 */
              <>
                {/* Bamboo Shaft (竹毛筆桿) */}
                <rect x="26" y="12" width="1" height="10" fill="#B48247" />
                <rect x="26" y="15" width="1" height="1" fill="#7A5323" />
                {/* Red top loop */}
                <rect x="26" y="11" width="1" height="1" fill="#D32F2F" />
                {/* Ferrule */}
                <rect x="26" y="22" width="2" height="1" fill="#3E2723" />
                {/* Black Ink Brush Tip (深黑毫毛筆頭) */}
                <rect x="26" y="23" width="2" height="3" fill="#1C1816" />
                <rect x="26" y="26" width="1" height="1" fill="#1C1816" />
              </>
            )}

            {accessoryId === 'abacus' && (
              /* 昭和五珠傳統算盤 */
              <>
                {/* Wooden Frame (木質外框) */}
                <rect x="24" y="20" width="6" height="7" fill="#5D4037" />
                {/* Inner cutout */}
                <rect x="25" y="21" width="4" height="5" fill="#2E1B10" />
                {/* Dividing Beam (樑) */}
                <rect x="24" y="22" width="6" height="1" fill="#A1887F" />
                {/* Golden Beads (算盤金珠) */}
                <rect x="25" y="21" width="1" height="1" fill="#FFD700" />
                <rect x="26" y="21" width="1" height="1" fill="#FFD700" />
                <rect x="27" y="21" width="1" height="1" fill="#FFD700" />
                <rect x="28" y="21" width="1" height="1" fill="#FFD700" />
                <rect x="25" y="24" width="1" height="1" fill="#FFD700" />
                <rect x="26" y="25" width="1" height="1" fill="#FFD700" />
                <rect x="27" y="23" width="1" height="1" fill="#FFD700" />
                <rect x="28" y="25" width="1" height="1" fill="#FFD700" />
              </>
            )}

            {accessoryId === 'fan' && (
              /* 泥金折扇 / 旭日扇 */
              <>
                {/* Open Golden Sensu Fan (金箔折扇面) */}
                <rect x="24" y="18" width="7" height="6" fill="#FFD54F" />
                <rect x="25" y="17" width="5" height="1" fill="#FFE082" />
                {/* Rising Red Sun (扇中旭日紋) */}
                <rect x="26" y="19" width="3" height="3" fill="#D32F2F" />
                <rect x="27" y="20" width="1" height="1" fill="#FF5252" />
                {/* Bamboo Sticks (竹骨) */}
                <rect x="24" y="24" width="1" height="1" fill="#8D6E63" />
                <rect x="27" y="24" width="1" height="2" fill="#8D6E63" />
                <rect x="30" y="24" width="1" height="1" fill="#8D6E63" />
                {/* Pivot Pin */}
                <rect x="27" y="26" width="1" height="1" fill="#D4AF37" />
              </>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
