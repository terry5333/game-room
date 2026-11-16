import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Coins, Sparkles, Award, BookOpen, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LpcAvatarView } from '../profile/LpcAvatarView';
import { getTitleById } from '../../data/titleCatalog';
import { sound } from '../../services/soundService';

interface TopWealthLeaderboardProps {
  onInspectUser?: (user: any) => void;
}

const RANK_CONFIGS = [
  {
    rank: 1,
    label: '金座・榜首',
    medal: '🥇',
    borderColor: 'border-[#D4AF37]',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white',
    bgGradient: 'from-[#FFFDF5] via-[#FAF3E0] to-[#F5E6C4]',
    glow: 'shadow-amber-500/20 shadow-lg hover:shadow-amber-500/35',
    ribbonColor: '#D4AF37'
  },
  {
    rank: 2,
    label: '銀座・次席',
    medal: '🥈',
    borderColor: 'border-[#9EACB8]',
    badgeBg: 'bg-gradient-to-r from-slate-400 to-gray-500 text-white',
    bgGradient: 'from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0]',
    glow: 'shadow-slate-400/20 shadow-md hover:shadow-slate-400/30',
    ribbonColor: '#9EACB8'
  },
  {
    rank: 3,
    label: '銅座・季席',
    medal: '🥉',
    borderColor: 'border-[#CD7F32]',
    badgeBg: 'bg-gradient-to-r from-amber-700 to-orange-800 text-white',
    bgGradient: 'from-[#FDF8F3] via-[#FAF0E6] to-[#EFE0D3]',
    glow: 'shadow-orange-700/20 shadow-md hover:shadow-orange-700/30',
    ribbonColor: '#CD7F32'
  }
];

export const TopWealthLeaderboard: React.FC<TopWealthLeaderboardProps> = ({ onInspectUser }) => {
  const { allUsers } = useAuth();

  const topThree = useMemo(() => {
    const list = [...(allUsers || [])].filter((u) => u && u.uid);
    return list
      .sort((a, b) => Number(b.coins || 0) - Number(a.coins || 0))
      .slice(0, 3);
  }, [allUsers]);

  if (!topThree.length) return null;

  return (
    <div className="w-full mb-6">
      {/* Leaderboard Header Banner */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-xs">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#3B2211] font-serif tracking-wide flex items-center gap-1.5">
              <span>帝國受驗競技場・財富排行榜 TOP 3</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-[10px] text-[#8D5B4C] font-bold">
              依全體受驗生當前持有金幣即時排定・點擊卡片可檢視受驗准考證
            </p>
          </div>
        </div>
      </div>

      {/* 3 Square Cards Grid (一人一張正方形卡片) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {RANK_CONFIGS.map((cfg, idx) => {
          const player = topThree[idx];
          if (!player) {
            return (
              <div
                key={`empty-${cfg.rank}`}
                className={`relative rounded-3xl p-4 sm:p-5 border-2 border-dashed ${cfg.borderColor}/50 bg-white/40 flex flex-col items-center justify-center text-center aspect-square shadow-2xs`}
              >
                <div className="text-3xl mb-1 opacity-50">{cfg.medal}</div>
                <div className="text-xs font-black text-[#8D5B4C]/70 font-serif">
                  {cfg.label}
                </div>
                <div className="text-[11px] text-[#8D5B4C]/50 mt-1">虛位以待・等待強者</div>
              </div>
            );
          }

          const pAny = player as any;
          const wins = Number(player.wins ?? pAny.stats?.wins ?? 0);
          const losses = Number(player.losses ?? pAny.stats?.losses ?? 0);
          const total = Number(player.gamesPlayed ?? pAny.stats?.totalGames ?? (wins + losses));
          const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
          const coins = Number(player.coins ?? 0);
          const userTag = player.userTag || (player.uid ? player.uid.substring(0, 4) : '0215');
          const bio = player.bio || pAny.motto || '';
          const title = getTitleById(typeof player.equippedTitle === 'string' ? player.equippedTitle : undefined);

          return (
            <motion.div
              key={player.uid || `rank-${cfg.rank}`}
              whileHover={{ y: -4, scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              onClick={() => {
                sound.playClick();
                if (onInspectUser) onInspectUser(player);
              }}
              className={`relative rounded-3xl p-4 sm:p-5 border-2 ${cfg.borderColor} bg-gradient-to-b ${cfg.bgGradient} ${cfg.glow} flex flex-col justify-between cursor-pointer transition-all select-none overflow-hidden aspect-square`}
              title={`點擊翻閱 ${player.displayName} 的帝國受驗准考證`}
            >
              {/* Top Card Header */}
              <div className="flex items-center justify-between gap-1.5 shrink-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs ${cfg.badgeBg}`}>
                  <span>{cfg.medal}</span>
                  <span>{cfg.label}</span>
                </span>

                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 border border-[#D5C0A1] shadow-2xs font-mono font-black text-xs text-[#B26A00]">
                  <Coins className="w-3.5 h-3.5 text-[#E09F3E]" />
                  <span>{coins.toLocaleString()}</span>
                </div>
              </div>

              {/* Center Profile & LPC Avatar Area */}
              <div className="flex flex-col items-center justify-center my-auto py-1">
                {/* 2D LPC Pixel Character in Round Mount */}
                <div className="relative mb-1 flex flex-col items-center">
                  <div className="w-[76px] h-[76px] flex items-center justify-center rounded-2xl bg-[#FAF3E0] border border-[#D5C0A1] shadow-inner overflow-hidden p-1">
                    <LpcAvatarView
                      config={player.lpcCharacter}
                      size={72}
                      scale={1.5}
                      direction="down"
                    />
                  </div>
                  {/* Floor Shadow Under Feet */}
                  <div className="w-12 h-2 bg-[#5D3A1A]/20 rounded-full blur-[1px] -mt-1" />
                </div>

                {/* Player Name & Code */}
                <div className="text-center min-w-0 w-full px-1">
                  <div className="flex items-center justify-center gap-1 truncate">
                    <span className="text-xs sm:text-sm font-black text-[#3B2211] font-serif truncate">
                      {player.displayName}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#8D5B4C] shrink-0">
                      #{userTag}
                    </span>
                  </div>

                  {/* Equipped Title Badge */}
                  {title ? (
                    <div className="mt-0.5 truncate">
                      <span className={`inline-block px-2 py-0.2 rounded-full text-[9px] font-black border shadow-2xs max-w-full truncate ${title.badgeStyle || ''} ${title.textColor || ''}`}>
                        {title.name}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-0.5 text-[9px] text-[#8D5B4C]/70 font-bold">
                      初出茅廬的受驗生
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer: Win Rate & Bio Quote */}
              <div className="shrink-0 space-y-1.5 pt-1.5 border-t border-[#8D5B4C]/20">
                {/* Win Rate Stats */}
                <div className="flex items-center justify-between text-[10px] font-black text-[#5D3A1A]">
                  <span className="flex items-center gap-1 text-[#8D5B4C]">
                    <Flame className="w-3 h-3 text-[#C84A31]" />
                    勝率
                  </span>
                  <span className="font-mono text-emerald-700">
                    {winRate}% ({wins}勝/{losses}負)
                  </span>
                </div>

                {/* User Bio Quote (受驗生個人自介) */}
                <div className="px-2 py-1 rounded-xl bg-white/70 border border-[#D5C0A1]/60 shadow-2xs">
                  <p className="text-[10px] text-[#3B2211] font-serif italic line-clamp-1 text-center">
                    {bio ? `"${bio}"` : '「專注對弈，暫未留下自介。」'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
