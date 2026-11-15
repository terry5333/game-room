import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';
import type { UserPetProfile } from '../../types';
import { CHAIR_CATALOG, PET_CATALOG, DEFAULT_PET_PROFILE } from '../../data/petAndChairCatalog';
import { sound } from '../../services/soundService';

interface PixelStageProps {
  profile?: UserPetProfile;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onPetClick?: () => void;
  onCharacterClick?: () => void;
  showFloor?: boolean;
  actionEffect?: 'feed' | 'pet' | 'ball' | 'bath' | null;
}

export const PixelStage: React.FC<PixelStageProps> = ({
  profile = DEFAULT_PET_PROFILE,
  size = 'md',
  interactive = true,
  onPetClick,
  onCharacterClick,
  showFloor = true,
  actionEffect = null
}) => {
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [petJump, setPetJump] = useState(false);

  const character = profile.character || DEFAULT_PET_PROFILE.character;
  const pet = profile.pet || DEFAULT_PET_PROFILE.pet;

  const currentChair =
    CHAIR_CATALOG.find((c) => c.id === character.chairId) || CHAIR_CATALOG[0];
  const currentPetInfo =
    PET_CATALOG.find((p) => p.id === pet.id) || PET_CATALOG[0];

  // Natural blinking effect every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const triggerHeartBurst = (startX: number = 70, startY: number = 40) => {
    const newHearts = [
      { id: Date.now() + 1, x: startX - 10 + Math.random() * 20, y: startY - 15 },
      { id: Date.now() + 2, x: startX - 15 + Math.random() * 30, y: startY - 25 },
      { id: Date.now() + 3, x: startX - 5 + Math.random() * 20, y: startY - 35 }
    ];
    setHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
    }, 1200);
  };

  const handlePetInteraction = () => {
    if (!interactive) return;

    if (pet.isDead) {
      sound.playClick();
      setSpeechText(`「👻（${pet.name} 的幽靈飄了過來）嗚嗚...肚子好餓...請在工坊為我舉行復活儀式...」`);
      setTimeout(() => setSpeechText(null), 3500);
      if (onPetClick) onPetClick();
      return;
    }

    sound.playPop();
    setPetJump(true);
    setTimeout(() => setPetJump(false), 400);
    triggerHeartBurst(62, 50);

    const phrases = [
      currentPetInfo.catchphrase,
      `「${pet.name} 蹭了蹭你的手心～」`,
      `「${pet.name} 開心地搖晃著身體！」`,
      `「親密度 +5！${pet.name} 感到無比幸福！」`
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    setSpeechText(phrase);
    setTimeout(() => setSpeechText(null), 3000);

    if (onPetClick) onPetClick();
  };

  const handleCharacterInteraction = () => {
    if (!interactive) return;
    sound.playClick();
    triggerHeartBurst(35, 25);

    const phrases = [
      `「這張【${currentChair.name}】坐起來真是氣定神閒！」`,
      `「有 ${pet.name} 陪在身邊，感覺今天解密靈感爆棚！」`,
      `「受驗生就位！隨時準備迎接下一場對決！」`,
      `「摸摸 ${pet.name}，牠會為我們帶來連勝好運喔！」`
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    setSpeechText(phrase);
    setTimeout(() => setSpeechText(null), 3000);

    if (onCharacterClick) onCharacterClick();
  };

  // Dimension scaling
  const dimensions = {
    sm: { width: 140, height: 110, scale: 'scale-90' },
    md: { width: 240, height: 180, scale: 'scale-100' },
    lg: { width: 320, height: 230, scale: 'scale-110' }
  }[size];

  // Colors & styles
  const hairColor = character.hairColor || '#2C3E50';
  const outfitColor = character.outfitColor || '#628395';
  const isGirl = character.gender === 'female';

  // Multi-accessory check helper
  const equippedAccessories: string[] =
    Array.isArray(character.accessories) && character.accessories.length > 0
      ? character.accessories
      : character.accessory && character.accessory !== 'none'
      ? [character.accessory]
      : [];
  const hasAccessory = (id: string) => equippedAccessories.includes(id);

  return (
    <div
      className={`relative select-none flex items-center justify-center ${dimensions.scale}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {/* Speech bubble pop-up */}
      <AnimatePresence>
        {speechText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.9 }}
            className="absolute -top-6 sm:-top-8 z-30 max-w-[210px] bg-[#FAF8F5] text-[#2E2925] font-extrabold text-[11px] px-3 py-1.5 rounded-2xl shadow-lg border-2 border-[#8D5B4C]/40 text-center pointer-events-none"
          >
            <span>{speechText}</span>
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-[#FAF8F5] rotate-45 border-r-2 border-b-2 border-[#8D5B4C]/40" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating heart bursts */}
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, x: h.x, y: h.y, scale: 0.8 }}
          animate={{ opacity: 0, y: h.y - 35, scale: 1.4 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="absolute z-20 pointer-events-none text-rose-500 font-black text-sm"
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
        >
          ❤️
        </motion.div>
      ))}

      {/* Action Effect: Bouncing Ball */}
      {actionEffect === 'ball' && (
        <motion.div
          initial={{ x: -30, y: -20, scale: 0.8 }}
          animate={{
            x: [ -30, 20, 45, 65 ],
            y: [ -20, 25, 0, 22 ],
            rotate: 720
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute z-25 pointer-events-none text-2xl"
          style={{ left: '40%', top: '45%' }}
        >
          🎾
        </motion.div>
      )}

      {/* Action Effect: Bath Soap Bubbles */}
      {actionEffect === 'bath' && (
        <>
          {[1, 2, 3, 4, 5].map((b) => (
            <motion.div
              key={`bubble-${b}`}
              initial={{ opacity: 0, y: 15, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -35 - b * 8, x: (b % 2 === 0 ? 1 : -1) * b * 6, scale: 1.2 }}
              transition={{ duration: 1.3, delay: b * 0.15, ease: 'easeOut' }}
              className="absolute z-25 pointer-events-none text-lg select-none"
              style={{ left: `${60 + (b % 3) * 6}%`, top: '55%' }}
            >
              🫧
            </motion.div>
          ))}
        </>
      )}

      {/* Action Effect: Feeding Snack */}
      {actionEffect === 'feed' && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0], y: [ -20, 5, 12, 16 ], scale: [0.6, 1.2, 1, 0.7] }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute z-25 pointer-events-none text-2xl select-none"
          style={{ left: '62%', top: '40%' }}
        >
          {currentPetInfo.foodIcon || '🍖'}
        </motion.div>
      )}

      {/* Retro 16-Bit Crisp SVG Stage */}
      <svg
        viewBox="0 0 100 85"
        className="w-full h-full filter drop-shadow-sm"
        style={{ shapeRendering: 'crispEdges' }}
      >
        <defs>
          <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8D5B4C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8D5B4C" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tatamiBorder" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E74C3C" />
            <stop offset="50%" stopColor="#C0392B" />
            <stop offset="100%" stopColor="#E74C3C" />
          </linearGradient>
        </defs>

        {/* --- 1. Floor & Rug --- */}
        {showFloor && (
          <g id="stage-floor">
            {/* Ground shadow ellipse */}
            <ellipse cx="50" cy="74" rx="42" ry="7" fill="url(#floorShadow)" />
            {/* Retro woven rug mat */}
            <rect x="12" y="70" width="76" height="5" rx="2" fill="#EADBC8" stroke="#8D5B4C" strokeWidth="0.6" />
            <line x1="16" y1="72" x2="84" y2="72" stroke="#8D5B4C" strokeWidth="0.4" strokeDasharray="1,1" />
          </g>
        )}

        {/* --- 2. The Chair (椅子) --- */}
        <g id="chair-group" className="cursor-pointer">
          {/* Chair Style A: 昭和學堂木椅 (wooden_chair) */}
          {character.chairId === 'wooden_chair' && (
            <g id="wooden-chair">
              {/* Backrest posts */}
              <rect x="23" y="24" width="2" height="34" fill="#6B4423" />
              <rect x="43" y="24" width="2" height="34" fill="#6B4423" />
              {/* Backrest slats */}
              <rect x="23" y="26" width="22" height="6" rx="1" fill="#A0522D" stroke="#5C3317" strokeWidth="0.5" />
              <rect x="25" y="34" width="18" height="3" fill="#8B4513" />
              {/* Wooden seat cushion slab */}
              <rect x="20" y="52" width="28" height="5" rx="1" fill="#CD853F" stroke="#6B4423" strokeWidth="0.5" />
              {/* Legs */}
              <rect x="22" y="57" width="2" height="17" fill="#6B4423" />
              <rect x="44" y="57" width="2" height="17" fill="#6B4423" />
              <rect x="26" y="57" width="2" height="15" fill="#4A2F13" />
              <rect x="40" y="57" width="2" height="15" fill="#4A2F13" />
              {/* Leg stretcher crossbar */}
              <rect x="22" y="66" width="24" height="1.5" fill="#5C3317" />
            </g>
          )}

          {/* Chair Style B: 復古牛皮沙發 (retro_sofa) */}
          {character.chairId === 'retro_sofa' && (
            <g id="retro-sofa">
              {/* Thick deep red leather backrest */}
              <rect x="18" y="22" width="32" height="34" rx="3" fill="#78281F" stroke="#4A1510" strokeWidth="0.8" />
              {/* Tufted button indentations */}
              <circle cx="26" cy="30" r="1" fill="#4A1510" />
              <circle cx="34" cy="30" r="1" fill="#4A1510" />
              <circle cx="42" cy="30" r="1" fill="#4A1510" />
              <circle cx="30" cy="38" r="1" fill="#4A1510" />
              <circle cx="38" cy="38" r="1" fill="#4A1510" />
              {/* Left & Right plush armrests */}
              <rect x="15" y="44" width="6" height="12" rx="2" fill="#922B21" stroke="#4A1510" strokeWidth="0.6" />
              <rect x="47" y="44" width="6" height="12" rx="2" fill="#922B21" stroke="#4A1510" strokeWidth="0.6" />
              {/* Seat cushion */}
              <rect x="18" y="50" width="32" height="8" rx="2" fill="#922B21" stroke="#4A1510" strokeWidth="0.8" />
              {/* Brass wood legs */}
              <rect x="19" y="58" width="3" height="14" rx="1" fill="#5D4037" />
              <rect x="46" y="58" width="3" height="14" rx="1" fill="#5D4037" />
              <circle cx="20.5" cy="71" r="1.2" fill="#D4AF37" />
              <circle cx="47.5" cy="71" r="1.2" fill="#D4AF37" />
            </g>
          )}

          {/* Chair Style C: 帝國黃金御座 (royal_throne) */}
          {character.chairId === 'royal_throne' && (
            <g id="royal-throne">
              {/* Crown top finial */}
              <polygon points="34,16 31,19 33,21 35,17 37,21 39,19 36,16" fill="#F1C40F" stroke="#B7950B" strokeWidth="0.5" />
              {/* Gold frame arch */}
              <rect x="18" y="19" width="32" height="36" rx="4" fill="#B7950B" stroke="#7D6608" strokeWidth="0.8" />
              {/* Crimson velvet tufted inner cushion */}
              <rect x="21" y="22" width="26" height="31" rx="3" fill="#900C3F" stroke="#51041B" strokeWidth="0.6" />
              <circle cx="34" cy="32" r="1.2" fill="#F1C40F" />
              <circle cx="28" cy="38" r="1" fill="#F1C40F" />
              <circle cx="40" cy="38" r="1" fill="#F1C40F" />
              {/* Ornate Gold Lion Armrests */}
              <rect x="15" y="42" width="6" height="14" rx="2" fill="#F1C40F" stroke="#B7950B" strokeWidth="0.6" />
              <circle cx="18" cy="42" r="2" fill="#D4AC0D" />
              <rect x="47" y="42" width="6" height="14" rx="2" fill="#F1C40F" stroke="#B7950B" strokeWidth="0.6" />
              <circle cx="50" cy="42" r="2" fill="#D4AC0D" />
              {/* Gold seat base */}
              <rect x="17" y="51" width="34" height="7" rx="1.5" fill="#900C3F" stroke="#F1C40F" strokeWidth="0.8" />
              {/* Gilded carved legs */}
              <rect x="18" y="58" width="4" height="15" fill="#F1C40F" stroke="#B7950B" strokeWidth="0.5" />
              <rect x="46" y="58" width="4" height="15" fill="#F1C40F" stroke="#B7950B" strokeWidth="0.5" />
            </g>
          )}

          {/* Chair Style D: 霓虹電競椅 (gaming_chair) */}
          {character.chairId === 'gaming_chair' && (
            <g id="gaming-chair">
              {/* High racing bucket backrest */}
              <polygon points="26,18 42,18 46,26 44,52 24,52 22,26" fill="#1C2833" stroke="#00FFFF" strokeWidth="0.8" />
              {/* RGB racing stripes */}
              <line x1="28" y1="20" x2="26" y2="50" stroke="#FF007F" strokeWidth="1" />
              <line x1="40" y1="20" x2="42" y2="50" stroke="#00FFFF" strokeWidth="1" />
              {/* Neck pillow */}
              <rect x="29" y="22" width="10" height="4" rx="2" fill="#00FFFF" />
              {/* 3D Armrests */}
              <rect x="17" y="45" width="5" height="10" rx="1.5" fill="#2C3E50" stroke="#00FFFF" strokeWidth="0.5" />
              <rect x="46" y="45" width="5" height="10" rx="1.5" fill="#2C3E50" stroke="#00FFFF" strokeWidth="0.5" />
              {/* Bucket Seat */}
              <rect x="20" y="51" width="28" height="6" rx="2" fill="#1C2833" stroke="#00FFFF" strokeWidth="0.8" />
              {/* Central gas lift & 5-star roller base */}
              <rect x="33" y="57" width="2" height="10" fill="#7F8C8D" />
              <polygon points="34,67 22,73 46,73" fill="#2C3E50" />
              <circle cx="22" cy="73.5" r="1.5" fill="#1C2833" />
              <circle cx="46" cy="73.5" r="1.5" fill="#1C2833" />
              <circle cx="34" cy="73.5" r="1.5" fill="#1C2833" />
            </g>
          )}

          {/* Chair Style E: 舒壓懶骨頭 (beanbag) */}
          {character.chairId === 'beanbag' && (
            <g id="beanbag-chair">
              {/* Puffy soft beanbag contour */}
              <ellipse cx="34" cy="55" rx="19" ry="15" fill="#E8DAEF" stroke="#AF7AC5" strokeWidth="0.8" />
              <ellipse cx="34" cy="50" rx="14" ry="9" fill="#D2B4DE" />
              {/* Crease lines */}
              <path d="M 22 52 Q 34 56 46 52" stroke="#AF7AC5" strokeWidth="0.6" fill="none" />
              <path d="M 26 62 Q 34 65 42 62" stroke="#AF7AC5" strokeWidth="0.6" fill="none" />
            </g>
          )}

          {/* Chair Style F: 和風座蒲團 (tatami) */}
          {character.chairId === 'tatami' && (
            <g id="tatami-chair">
              {/* Backrest support (Zaisu floor chair) */}
              <rect x="23" y="32" width="22" height="24" rx="2" fill="#8B4513" stroke="#5C3317" strokeWidth="0.7" />
              <rect x="26" y="35" width="16" height="18" fill="#FDFEFE" opacity="0.2" />
              {/* Woven Tatami rush seat cushion */}
              <rect x="18" y="56" width="32" height="8" rx="2" fill="#A9DFBF" stroke="#229954" strokeWidth="0.7" />
              {/* Tatami edge brocade cloth (Heri) */}
              <rect x="18" y="56" width="4" height="8" fill="url(#tatamiBorder)" />
              <rect x="46" y="56" width="4" height="8" fill="url(#tatamiBorder)" />
            </g>
          )}
        </g>

        {/* --- 3. The Seated Pixel Character (像素小人) --- */}
        <g id="character-group" onClick={handleCharacterInteraction} className="cursor-pointer">
          {/* Subtle breathing bob animation using group transform */}
          <g className="transition-transform duration-700 ease-in-out">
            {/* Seated Legs and Shoes (bent over chair) */}
            {/* Thighs */}
            <rect x="27" y="51" width="6" height="8" fill={outfitColor} />
            <rect x="35" y="51" width="6" height="8" fill={outfitColor} />
            {/* Lower legs / shins */}
            <rect x="27" y="57" width="5" height="10" fill={outfitColor} />
            <rect x="36" y="57" width="5" height="10" fill={outfitColor} />
            {/* Retro school shoes */}
            <rect x="25" y="66" width="7" height="3" rx="1" fill="#1C2833" stroke="#000" strokeWidth="0.3" />
            <rect x="36" y="66" width="7" height="3" rx="1" fill="#1C2833" stroke="#000" strokeWidth="0.3" />

            {/* Back Accessories: Angel Wings or Bat Wings (Behind Torso) */}
            {hasAccessory('wings') && (
              <g id="accessory-wings">
                {/* Left Feather Wing */}
                <path d="M 26 38 C 16 32 14 44 26 48 Z" fill="#FDFEFE" stroke="#D5D8DC" strokeWidth="0.5" />
                <path d="M 26 40 C 18 36 17 46 26 47 Z" fill="#EBF5FB" />
                {/* Right Feather Wing */}
                <path d="M 42 38 C 52 32 54 44 42 48 Z" fill="#FDFEFE" stroke="#D5D8DC" strokeWidth="0.5" />
                <path d="M 42 40 C 50 36 51 46 42 47 Z" fill="#EBF5FB" />
              </g>
            )}
            {hasAccessory('bat_wings') && (
              <g id="accessory-bat-wings">
                {/* Left Demon Wing */}
                <polygon points="26,38 15,31 19,41 14,44 26,47" fill="#2C3E50" stroke="#1A252F" strokeWidth="0.5" />
                {/* Right Demon Wing */}
                <polygon points="42,38 53,31 49,41 54,44 42,47" fill="#2C3E50" stroke="#1A252F" strokeWidth="0.5" />
              </g>
            )}

            {/* Torso / Outfits based on outfitStyle */}
            <rect x="26" y="37" width="16" height="16" rx="2" fill={outfitColor} stroke="#2C3E50" strokeWidth="0.5" />

            {/* 1. Gakuran (昭和帝國制服) */}
            {(!character.outfitStyle || character.outfitStyle === 'gakuran') && (
              <g id="outfit-gakuran">
                <rect x="31" y="36.5" width="6" height="3" fill="#1C2833" stroke="#F1C40F" strokeWidth="0.4" />
                <circle cx="34" cy="41" r="0.7" fill="#F1C40F" />
                <circle cx="34" cy="45" r="0.7" fill="#F1C40F" />
                <circle cx="34" cy="49" r="0.7" fill="#F1C40F" />
                <line x1="28" y1="42" x2="31" y2="42" stroke="#1C2833" strokeWidth="0.8" />
              </g>
            )}

            {/* 2. Sailor (學院水手風制服) */}
            {character.outfitStyle === 'sailor' && (
              <g id="outfit-sailor">
                <polygon points="34,37 31,43 37,43" fill="#FFFFFF" />
                <polygon points="26,37 34,44 42,37 40,36 34,41 28,36" fill="#FFFFFF" stroke="#2980B9" strokeWidth="0.4" />
                <polygon points="33,42 35,42 36,47 34,45 32,47" fill="#E74C3C" />
                <circle cx="34" cy="42.5" r="1" fill="#C0392B" />
                <rect x="23" y="46" width="4" height="1" fill="#FFFFFF" />
                <rect x="41" y="46" width="4" height="1" fill="#FFFFFF" />
              </g>
            )}

            {/* 3. Trench Coat (復古厚呢風衣) */}
            {character.outfitStyle === 'trench' && (
              <g id="outfit-trench">
                <polygon points="34,37 30,42 34,45" fill="#8D6E63" stroke="#4E342E" strokeWidth="0.4" />
                <polygon points="34,37 38,42 34,45" fill="#8D6E63" stroke="#4E342E" strokeWidth="0.4" />
                <circle cx="32" cy="42" r="0.6" fill="#3E2723" />
                <circle cx="36" cy="42" r="0.6" fill="#3E2723" />
                <circle cx="32" cy="46" r="0.6" fill="#3E2723" />
                <circle cx="36" cy="46" r="0.6" fill="#3E2723" />
                <rect x="26" y="48" width="16" height="2" fill="#4E342E" />
                <rect x="33" y="47.5" width="2" height="3" fill="#D4AF37" />
              </g>
            )}

            {/* 4. Hoodie (街頭連帽休閒衫) */}
            {character.outfitStyle === 'hoodie' && (
              <g id="outfit-hoodie">
                <path d="M 29 37 Q 34 39 39 37" stroke="#FFFFFF" strokeWidth="1" fill="none" />
                <rect x="28.5" y="45" width="11" height="5" rx="1.5" fill="#2C3E50" opacity="0.25" />
                <line x1="28.5" y1="46" x2="39.5" y2="46" stroke="#FFFFFF" strokeWidth="0.4" strokeDasharray="1,1" />
                <line x1="32.5" y1="38" x2="32.5" y2="44" stroke="#FFFFFF" strokeWidth="0.6" />
                <circle cx="32.5" cy="44.5" r="0.5" fill="#FFFFFF" />
                <line x1="35.5" y1="38" x2="35.5" y2="44" stroke="#FFFFFF" strokeWidth="0.6" />
                <circle cx="35.5" cy="44.5" r="0.5" fill="#FFFFFF" />
              </g>
            )}

            {/* 5. Haori / Jinbei (日式傳統羽織甚平) */}
            {character.outfitStyle === 'haori' && (
              <g id="outfit-haori">
                <line x1="28" y1="37" x2="37" y2="48" stroke="#FAF0E6" strokeWidth="1.2" />
                <line x1="40" y1="37" x2="31" y2="48" stroke="#FAF0E6" strokeWidth="0.8" />
                <rect x="26" y="46.5" width="16" height="3.5" fill="#C0392B" stroke="#922B21" strokeWidth="0.4" />
                <rect x="33" y="47" width="2" height="2" fill="#F1C40F" />
                <rect x="22" y="44" width="5" height="5" fill={outfitColor} stroke="#2C3E50" strokeWidth="0.4" />
                <rect x="41" y="44" width="5" height="5" fill={outfitColor} stroke="#2C3E50" strokeWidth="0.4" />
              </g>
            )}

            {/* 6. Cyber Tactical (賽博霓虹特工裝) */}
            {character.outfitStyle === 'cyber' && (
              <g id="outfit-cyber">
                <rect x="30" y="36.5" width="8" height="2" fill="#00FFFF" />
                <line x1="27" y1="40" x2="33" y2="45" stroke="#00FFFF" strokeWidth="0.8" />
                <line x1="41" y1="40" x2="35" y2="45" stroke="#FF007F" strokeWidth="0.8" />
                <circle cx="34" cy="45" r="1.5" fill="#00FFFF" />
                <circle cx="34" cy="45" r="0.6" fill="#FFFFFF" />
                <rect x="23" y="47" width="4" height="1" fill="#00FFFF" />
                <rect x="41" y="47" width="4" height="1" fill="#FF007F" />
              </g>
            )}

            {/* 7. Tuxedo (昭和洋風執事燕尾服) */}
            {character.outfitStyle === 'tuxedo' && (
              <g id="outfit-tuxedo">
                <polygon points="34,37 30,44 38,44" fill="#FFFFFF" />
                <polygon points="34,37 28,45 34,48 40,45" fill="#1C2833" />
                <circle cx="34" cy="39" r="1.1" fill="#922B21" />
                <circle cx="34" cy="43" r="0.6" fill="#D4AC0D" />
                <line x1="28" y1="44" x2="33" y2="47" stroke="#17202A" strokeWidth="0.6" />
                <line x1="40" y1="44" x2="35" y2="47" stroke="#17202A" strokeWidth="0.6" />
              </g>
            )}

            {/* 8. Kimono (櫻吹雪大正振袖和服) */}
            {character.outfitStyle === 'kimono' && (
              <g id="outfit-kimono">
                <polygon points="26,37 34,48 42,37" fill="#F8BBD0" />
                <line x1="28" y1="37" x2="38" y2="47" stroke="#FFFFFF" strokeWidth="1" />
                <rect x="26" y="46" width="16" height="4" fill="#E91E63" />
                <rect x="32" y="47" width="4" height="2" fill="#FFD700" />
                <rect x="21" y="43" width="5" height="7" rx="1" fill="#F8BBD0" />
                <rect x="42" y="43" width="5" height="7" rx="1" fill="#F8BBD0" />
              </g>
            )}

            {/* 9. Wizard (星空占星大魔導長袍) */}
            {character.outfitStyle === 'wizard' && (
              <g id="outfit-wizard">
                <rect x="26" y="37" width="16" height="16" fill="#1A237E" />
                <polygon points="34,37 31,44 37,44" fill="#311B92" />
                <circle cx="29" cy="41" r="0.8" fill="#FFD700" />
                <circle cx="39" cy="44" r="0.8" fill="#FFD700" />
                <circle cx="34" cy="48" r="0.8" fill="#FFD700" />
                <line x1="26" y1="52" x2="42" y2="52" stroke="#FFD700" strokeWidth="0.8" />
              </g>
            )}

            {/* 10. Gold Armor (帝國黃金重裝鎧甲) */}
            {character.outfitStyle === 'gold_armor' && (
              <g id="outfit-gold-armor">
                <rect x="27" y="37" width="14" height="15" rx="1.5" fill="#FFD700" stroke="#B7950B" strokeWidth="0.7" />
                <polygon points="34,38 31,43 37,43" fill="#D4AC0D" />
                <rect x="23" y="38" width="5" height="5" rx="1" fill="#FFD700" stroke="#B7950B" strokeWidth="0.5" />
                <rect x="40" y="38" width="5" height="5" rx="1" fill="#FFD700" stroke="#B7950B" strokeWidth="0.5" />
                <circle cx="34" cy="44" r="1.5" fill="#E74C3C" />
              </g>
            )}

            {/* 11. Ninja (暗夜影忍隱密裝束) */}
            {character.outfitStyle === 'ninja' && (
              <g id="outfit-ninja">
                <rect x="26" y="37" width="16" height="16" fill="#1C2833" />
                <line x1="27" y1="37" x2="37" y2="48" stroke="#900C3F" strokeWidth="1.2" />
                <line x1="41" y1="37" x2="31" y2="48" stroke="#900C3F" strokeWidth="1.2" />
                <rect x="26" y="47" width="16" height="2" fill="#E74C3C" />
              </g>
            )}

            {/* 12. Tracksuit (昭和熱血必勝運動衫) */}
            {character.outfitStyle === 'tracksuit' && (
              <g id="outfit-tracksuit">
                <rect x="26" y="37" width="16" height="16" fill="#C0392B" />
                <line x1="34" y1="37" x2="34" y2="52" stroke="#FFFFFF" strokeWidth="0.8" />
                <line x1="25" y1="40" x2="25" y2="50" stroke="#FFFFFF" strokeWidth="0.8" />
                <line x1="43" y1="40" x2="43" y2="50" stroke="#FFFFFF" strokeWidth="0.8" />
                <rect x="29" y="41" width="3" height="3" rx="0.5" fill="#FFFFFF" />
              </g>
            )}

            {/* Multi-Accessories: Neck Area (Tie, Ribbon, Scarf) */}
            {hasAccessory('tie') && (
              <polygon points="33,40 35,40 34.5,46 34,48 33.5,46" fill="#C0392B" />
            )}
            {hasAccessory('ribbon') && (
              <polygon points="32,40 36,40 35,42 36,44 32,44 33,42" fill="#E74C3C" />
            )}
            {hasAccessory('scarf') && (
              <g id="accessory-scarf">
                <rect x="28" y="37" width="12" height="4" rx="1.5" fill="#C0392B" stroke="#922B21" strokeWidth="0.4" />
                <polygon points="35,39 39,39 40,47 36,47" fill="#C0392B" stroke="#922B21" strokeWidth="0.4" />
                <line x1="36" y1="47" x2="40" y2="47" stroke="#F1C40F" strokeWidth="0.6" strokeDasharray="1,1" />
              </g>
            )}

            {/* Arms resting on knees/lap */}
            <rect x="23" y="39" width="4" height="11" rx="1" fill={outfitColor} />
            <circle cx="25" cy="50" r="1.8" fill={character.skinTone || '#FDDCB5'} />
            <rect x="41" y="39" width="4" height="11" rx="1" fill={outfitColor} />
            <circle cx="43" cy="50" r="1.8" fill={character.skinTone || '#FDDCB5'} />

            {/* Head & Neck */}
            <rect x="32" y="34" width="4" height="4" fill={character.skinTone || '#FDDCB5'} />
            {/* Cute Pixel Face */}
            <rect x="27" y="24" width="14" height="12" rx="2" fill={character.skinTone || '#FDDCB5'} stroke="#E59866" strokeWidth="0.3" />

            {/* Rosy blush cheeks */}
            <circle cx="28.5" cy="31.5" r="1.2" fill="#FF8DA1" opacity="0.8" />
            <circle cx="39.5" cy="31.5" r="1.2" fill="#FF8DA1" opacity="0.8" />

            {/* Eyes (Blinking animation) */}
            {isBlinking ? (
              <>
                <line x1="30" y1="29" x2="33" y2="29" stroke="#1C2833" strokeWidth="1" strokeLinecap="round" />
                <line x1="35" y1="29" x2="38" y2="29" stroke="#1C2833" strokeWidth="1" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Left eye with anime spark highlight */}
                <rect x="30" y="27.5" width="2.5" height="3" rx="0.5" fill="#1C2833" />
                <rect x="30" y="27.5" width="1" height="1" fill="#FFFFFF" />
                {/* Right eye with anime spark highlight */}
                <rect x="35.5" y="27.5" width="2.5" height="3" rx="0.5" fill="#1C2833" />
                <rect x="35.5" y="27.5" width="1" height="1" fill="#FFFFFF" />
              </>
            )}

            {/* Cute smiling mouth */}
            <path d="M 33 32 Q 34 33.5 35 32" stroke="#1C2833" strokeWidth="0.6" fill="none" strokeLinecap="round" />

            {/* Multi-Accessories: Face Area (Glasses, Monocle) */}
            {hasAccessory('glasses') && (
              <g id="accessory-glasses">
                <rect x="29" y="26.5" width="4.5" height="4" rx="1" fill="none" stroke="#2C3E50" strokeWidth="0.7" />
                <rect x="34.5" y="26.5" width="4.5" height="4" rx="1" fill="none" stroke="#2C3E50" strokeWidth="0.7" />
                <line x1="33.5" y1="28.5" x2="34.5" y2="28.5" stroke="#2C3E50" strokeWidth="0.7" />
              </g>
            )}
            {hasAccessory('monocle') && (
              <g id="accessory-monocle">
                <circle cx="36.5" cy="28.5" r="2.2" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
                <line x1="38.7" y1="28.5" x2="41" y2="35" stroke="#D4AF37" strokeWidth="0.4" />
              </g>
            )}

            {/* Hair: Male vs Female Styles */}
            {!isGirl ? (
              /* Boy Short Hair / Gakuran Student Haircut */
              <g id="boy-hair">
                <path
                  d="M 26 26 C 26 21 42 21 42 26 L 43 28 L 41 27 L 39 29 L 36 26 L 33 28 L 30 26 L 27 28 Z"
                  fill={hairColor}
                />
                <rect x="26" y="25" width="2" height="6" fill={hairColor} />
                <rect x="40" y="25" width="2" height="6" fill={hairColor} />
              </g>
            ) : (
              /* Girl Twin Tails / Cute Bangs Haircut */
              <g id="girl-hair">
                <path
                  d="M 25 26 C 25 20 43 20 43 26 L 43 28 L 40 27 L 37 29 L 34 27 L 31 29 L 28 27 L 25 28 Z"
                  fill={hairColor}
                />
                <rect x="23" y="26" width="3" height="14" rx="1.5" fill={hairColor} />
                <rect x="42" y="26" width="3" height="14" rx="1.5" fill={hairColor} />
                <circle cx="24.5" cy="27" r="1.2" fill="#E74C3C" />
                <circle cx="43.5" cy="27" r="1.2" fill="#E74C3C" />
              </g>
            )}

            {/* Multi-Accessories: Head Area (Hachimaki, Cap, Fox Mask, Cat Ears, Devil Horns, Halo, Crown) */}
            {hasAccessory('hachimaki') && (
              <g id="accessory-hachimaki">
                <rect x="26" y="24" width="16" height="2.5" fill="#FFFFFF" stroke="#C0392B" strokeWidth="0.3" />
                <circle cx="34" cy="25.2" r="0.8" fill="#E74C3C" />
              </g>
            )}
            {hasAccessory('cap') && (
              <g id="accessory-cap">
                <ellipse cx="34" cy="22" rx="9" ry="3" fill="#1C2833" />
                <polygon points="27,22 41,22 38,18 30,18" fill="#2C3E50" />
                <circle cx="34" cy="21" r="1" fill="#F1C40F" />
              </g>
            )}
            {hasAccessory('fox_mask') && (
              <g id="accessory-fox-mask">
                <polygon points="38,20 44,22 42,28 37,25" fill="#FFFFFF" stroke="#E74C3C" strokeWidth="0.4" />
                <polygon points="39,20 40,17 41,20" fill="#E74C3C" />
                <circle cx="41" cy="23" r="0.6" fill="#E74C3C" />
              </g>
            )}
            {hasAccessory('cat_ears') && (
              <g id="accessory-cat-ears">
                <polygon points="27,23 29,17 31,23" fill="#2C3E50" />
                <polygon points="28,22 29,18 30,22" fill="#FF8DA1" />
                <polygon points="37,23 39,17 41,23" fill="#2C3E50" />
                <polygon points="38,22 39,18 40,22" fill="#FF8DA1" />
              </g>
            )}
            {hasAccessory('devil_horns') && (
              <g id="accessory-devil-horns">
                <polygon points="28,23 26,17 30,22" fill="#C0392B" stroke="#922B21" strokeWidth="0.4" />
                <polygon points="40,23 42,17 38,22" fill="#C0392B" stroke="#922B21" strokeWidth="0.4" />
              </g>
            )}
            {hasAccessory('halo') && (
              <g id="accessory-halo">
                <ellipse cx="34" cy="18" rx="7" ry="2" fill="none" stroke="#F1C40F" strokeWidth="1" />
                <ellipse cx="34" cy="18" rx="6.5" ry="1.7" fill="none" stroke="#FFFFFF" strokeWidth="0.4" />
              </g>
            )}
            {hasAccessory('crown') && (
              <g id="accessory-crown">
                <polygon points="31,21 32,17 34,19 36,17 37,21" fill="#F1C40F" stroke="#B7950B" strokeWidth="0.4" />
                <circle cx="34" cy="20.5" r="0.6" fill="#E74C3C" />
              </g>
            )}
          </g>
        </g>

        {/* --- 4. The Pixel Pet (養寵物，依偎在椅子旁) --- */}
        <g
          id="pet-group"
          onClick={handlePetInteraction}
          className={`cursor-pointer transition-transform duration-300 ${petJump ? '-translate-y-2' : ''}`}
        >
          {/* Dead Pet State: Pixel Ghost with Halo & Gravestone */}
          {pet.isDead ? (
            <g id="pet-ghost" transform="translate(56, 50)">
              {/* Floating shadow */}
              <ellipse cx="14" cy="24" rx="8" ry="2" fill="#8D5B4C" opacity="0.2" />
              {/* Gravestone */}
              <rect x="0" y="10" width="8" height="13" rx="3" fill="#7F8C8D" stroke="#34495E" strokeWidth="0.5" />
              <text x="4" y="15" fontSize="2.8" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">RIP</text>
              <line x1="2" y1="18" x2="6" y2="18" stroke="#BDC3C7" strokeWidth="0.5" />
              {/* Ghost Body (Pale Cyan/White Floating) */}
              <path
                d="M 12 10 C 12 4 22 4 22 10 C 22 14 24 18 21 19 C 19 20 18 18 17 19 C 15 20 14 18 12 19 Z"
                fill="#E8F8F5"
                stroke="#A3E4D7"
                strokeWidth="0.5"
                opacity="0.92"
              />
              {/* Angel Halo above ghost */}
              <ellipse cx="17" cy="4" rx="3.5" ry="1" fill="none" stroke="#F1C40F" strokeWidth="0.6" />
              {/* Ghost Eyes (sad dots) */}
              <circle cx="15" cy="9" r="0.8" fill="#2C3E50" />
              <circle cx="19" cy="9" r="0.8" fill="#2C3E50" />
              {/* Tiny tear */}
              <ellipse cx="19.5" cy="11.5" rx="0.4" ry="0.6" fill="#3498DB" />
              {/* Angel wing on ghost */}
              <path d="M 22 9 Q 25 7 24 11 Z" fill="#FFFFFF" stroke="#BDC3C7" strokeWidth="0.3" />
            </g>
          ) : (
            <>
          {/* Pet A: 赤柴犬 (shiba) */}
          {pet.id === 'shiba' && (
            <g id="pet-shiba" transform="translate(56, 52)">
              {/* Shadow */}
              <ellipse cx="14" cy="22" rx="10" ry="2.5" fill="#8D5B4C" opacity="0.3" />
              {/* Curled tail wagging */}
              <path d="M 2 13 C -2 10 0 6 3 8" stroke="#D35400" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Shiba Body */}
              <rect x="3" y="11" width="16" height="10" rx="3" fill="#E59866" stroke="#BA4A00" strokeWidth="0.5" />
              {/* White belly & chest */}
              <rect x="8" y="13" width="9" height="7" rx="2" fill="#FDFEFE" />
              {/* 4 Paws */}
              <rect x="4" y="20" width="3" height="3" rx="1" fill="#FDFEFE" />
              <rect x="8" y="20" width="3" height="3" rx="1" fill="#FDFEFE" />
              <rect x="13" y="20" width="3" height="3" rx="1" fill="#FDFEFE" />
              <rect x="17" y="20" width="3" height="3" rx="1" fill="#FDFEFE" />
              {/* Shiba Head */}
              <rect x="13" y="5" width="10" height="9" rx="2.5" fill="#E59866" stroke="#BA4A00" strokeWidth="0.5" />
              {/* White cheeks */}
              <rect x="14" y="9" width="4" height="4" rx="1" fill="#FDFEFE" />
              <rect x="19" y="9" width="4" height="4" rx="1" fill="#FDFEFE" />
              {/* Triangular perky ears */}
              <polygon points="14,5 16,1 17,5" fill="#BA4A00" />
              <polygon points="20,5 21,1 23,5" fill="#BA4A00" />
              {/* Cute black nose & mouth */}
              <circle cx="18.5" cy="10" r="0.8" fill="#1C2833" />
              {/* Happy eyes */}
              <circle cx="16" cy="8" r="0.9" fill="#1C2833" />
              <circle cx="21" cy="8" r="0.9" fill="#1C2833" />
              {/* Cute pink panting tongue */}
              <rect x="18" y="11.5" width="1.5" height="2" rx="0.7" fill="#FF7675" />
            </g>
          )}

          {/* Pet B: 慵懶三花貓 (calico_cat) */}
          {pet.id === 'calico_cat' && (
            <g id="pet-calico" transform="translate(56, 54)">
              {/* Shadow */}
              <ellipse cx="13" cy="20" rx="9" ry="2.2" fill="#8D5B4C" opacity="0.3" />
              {/* Swishing Cat Tail */}
              <path d="M 2 12 Q -3 6 1 4" stroke="#D35400" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Cat Body */}
              <rect x="3" y="10" width="15" height="9" rx="3" fill="#FDFEFE" stroke="#5D6D7E" strokeWidth="0.4" />
              {/* Calico Orange & Black Patches */}
              <circle cx="7" cy="12" r="2.5" fill="#E67E22" />
              <circle cx="12" cy="14" r="2" fill="#2C3E50" />
              {/* Paws */}
              <circle cx="5" cy="18.5" r="1.5" fill="#FDFEFE" />
              <circle cx="16" cy="18.5" r="1.5" fill="#FDFEFE" />
              {/* Cat Head */}
              <rect x="12" y="4" width="9" height="8" rx="2" fill="#FDFEFE" stroke="#5D6D7E" strokeWidth="0.4" />
              {/* Orange patch on right ear */}
              <polygon points="12,4 14,1 15,4" fill="#2C3E50" />
              <polygon points="18,4 19,1 21,4" fill="#E67E22" />
              {/* Sleek closed happy smiling eyes */}
              <path d="M 14 8 Q 15 9 16 8" stroke="#1C2833" strokeWidth="0.6" fill="none" />
              <path d="M 18 8 Q 19 9 20 8" stroke="#1C2833" strokeWidth="0.6" fill="none" />
              {/* Pink Nose */}
              <polygon points="17,9.5 16.5,9 17.5,9" fill="#FF8DA1" />
            </g>
          )}

          {/* Pet C: 溫泉水豚 (capybara) */}
          {pet.id === 'capybara' && (
            <g id="pet-capybara" transform="translate(55, 53)">
              {/* Shadow */}
              <ellipse cx="14" cy="21" rx="11" ry="2.8" fill="#8D5B4C" opacity="0.3" />
              {/* Plump Round Capybara Body */}
              <rect x="2" y="9" width="18" height="11" rx="4" fill="#A04000" stroke="#6E2C00" strokeWidth="0.5" />
              {/* Short Cute Legs */}
              <rect x="4" y="19" width="3" height="3" rx="1" fill="#6E2C00" />
              <rect x="8" y="19" width="3" height="3" rx="1" fill="#6E2C00" />
              <rect x="13" y="19" width="3" height="3" rx="1" fill="#6E2C00" />
              <rect x="17" y="19" width="3" height="3" rx="1" fill="#6E2C00" />
              {/* Square Capybara Snout Head */}
              <rect x="12" y="4" width="12" height="10" rx="3" fill="#A04000" stroke="#6E2C00" strokeWidth="0.5" />
              {/* Little cute ear */}
              <ellipse cx="14" cy="4" rx="1.2" ry="1.8" fill="#6E2C00" />
              {/* Zen calm slit eyes */}
              <line x1="16" y1="8" x2="19" y2="8" stroke="#1C2833" strokeWidth="0.8" strokeLinecap="round" />
              {/* Snout nostril */}
              <circle cx="22" cy="10" r="0.8" fill="#3E1F07" />
              {/* Fresh Yuzu Orange on Head */}
              <circle cx="18" cy="2" r="2.2" fill="#F39C12" />
              <polygon points="18,0 19,-1 19,0.5" fill="#27AE60" />
            </g>
          )}

          {/* Pet D: 小企鵝 (penguin) */}
          {pet.id === 'penguin' && (
            <g id="pet-penguin" transform="translate(58, 52)">
              {/* Shadow */}
              <ellipse cx="10" cy="22" rx="7" ry="2" fill="#8D5B4C" opacity="0.3" />
              {/* Round Black Body */}
              <ellipse cx="10" cy="13" rx="7" ry="9" fill="#17202A" stroke="#000" strokeWidth="0.4" />
              {/* White Tuxedo Belly */}
              <ellipse cx="10" cy="14" rx="4.5" ry="6.5" fill="#FFFFFF" />
              {/* Left & Right Flippers */}
              <path d="M 3 11 Q 0 15 2 18" stroke="#17202A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 17 11 Q 20 15 18 18" stroke="#17202A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Cute Yellow Webbed Feet */}
              <ellipse cx="7" cy="21.5" rx="2" ry="1" fill="#F39C12" />
              <ellipse cx="13" cy="21.5" rx="2" ry="1" fill="#F39C12" />
              {/* Blinking Eyes */}
              <circle cx="8" cy="9" r="0.9" fill="#1C2833" />
              <circle cx="12" cy="9" r="0.9" fill="#1C2833" />
              {/* Yellow Beak */}
              <polygon points="9,10 11,10 10,12" fill="#F39C12" />
            </g>
          )}

          {/* Pet E: 招財貓 (lucky_cat) */}
          {pet.id === 'lucky_cat' && (
            <g id="pet-lucky-cat" transform="translate(57, 52)">
              {/* Shadow */}
              <ellipse cx="11" cy="22" rx="8" ry="2.2" fill="#8D5B4C" opacity="0.3" />
              {/* Golden Body */}
              <ellipse cx="11" cy="14" rx="7" ry="8" fill="#F1C40F" stroke="#B7950B" strokeWidth="0.5" />
              {/* White bib */}
              <path d="M 7 12 Q 11 16 15 12" fill="#FDFEFE" />
              {/* Red Collar & Gold Bell */}
              <rect x="7" y="11" width="8" height="1.5" rx="0.5" fill="#E74C3C" />
              <circle cx="11" cy="13.5" r="1.2" fill="#F39C12" />
              {/* Cat Ears with Red Interior */}
              <polygon points="6,6 8,2 10,6" fill="#F1C40F" />
              <polygon points="7,5 8,3 9,5" fill="#E74C3C" />
              <polygon points="12,6 14,2 16,6" fill="#F1C40F" />
              <polygon points="13,5 14,3 15,5" fill="#E74C3C" />
              {/* Eyes & Whiskers */}
              <circle cx="8.5" cy="9" r="0.8" fill="#1C2833" />
              <circle cx="13.5" cy="9" r="0.8" fill="#1C2833" />
              <circle cx="11" cy="10" r="0.5" fill="#E74C3C" />
              {/* Waving Right Paw */}
              <ellipse cx="16" cy="9" rx="2" ry="3" fill="#F1C40F" stroke="#B7950B" strokeWidth="0.4" />
              <circle cx="16" cy="7" r="1.5" fill="#FDFEFE" />
            </g>
          )}

          {/* Pet F: 彈跳史萊姆 (slime) */}
          {pet.id === 'slime' && (
            <g id="pet-slime" transform="translate(58, 55)">
              {/* Shadow */}
              <ellipse cx="10" cy="19" rx="8" ry="2" fill="#8D5B4C" opacity="0.3" />
              {/* Jelly Body */}
              <path
                d="M 10 5 C 16 5 18 10 18 15 C 18 18 15 18.5 10 18.5 C 5 18.5 2 18 2 15 C 2 10 4 5 10 5 Z"
                fill="#5DADE2"
                stroke="#2E86C1"
                strokeWidth="0.6"
              />
              {/* Glint highlight */}
              <ellipse cx="7" cy="8" rx="2" ry="1.2" fill="#EBF5FB" opacity="0.8" />
              {/* Smiling Happy Face */}
              <circle cx="7" cy="13" r="0.9" fill="#1B4F72" />
              <circle cx="13" cy="13" r="0.9" fill="#1B4F72" />
              <path d="M 9 14.5 Q 10 16 11 14.5" stroke="#1B4F72" strokeWidth="0.6" fill="none" />
            </g>
          )}
            </>
          )}
        </g>
      </svg>
    </div>
  );
};
