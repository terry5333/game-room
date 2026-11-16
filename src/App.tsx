import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useRoom } from './context/RoomContext';
import { Header } from './components/common/Header';
import { LandingPage } from './components/auth/LandingPage';
import { Lobby } from './components/lobby/Lobby';
import { FriendsModal } from './components/lobby/FriendsModal';
import { IncomingInviteModal } from './components/common/IncomingInviteModal';
import { RuleDrawer } from './components/common/RuleDrawer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OnboardingTour } from './components/common/OnboardingTour';
import { ProfileSetupModal } from './components/profile/ProfileSetupModal';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { CasinoModal, CasinoTab } from './components/casino/CasinoModal';
import { ExamCardModal } from './components/profile/ExamCardModal';
import { LpcWardrobeModal } from './components/profile/LpcWardrobeModal';
import { TitleSelectorModal } from './components/profile/TitleSelectorModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { GameShell } from './components/games/GameShell';
import { Game1A2B } from './components/games/game1a2b/Game1A2B';
import { GameBattleship } from './components/games/battleship/GameBattleship';
import { GameBingo } from './components/games/bingo/GameBingo';
import { GameDotsAndBoxes } from './components/games/dotsandboxes/GameDotsAndBoxes';
import { GameOOXX } from './components/games/ooxx/GameOOXX';
import { GameConnect4 } from './components/games/connect4/GameConnect4';
import { LoadingScreen } from './components/common/LoadingScreen';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import type { GameId } from './types';

export const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { currentRoom } = useRoom();

  const [ruleDrawerOpen, setRuleDrawerOpen] = useState(false);
  const [selectedRuleGame, setSelectedRuleGame] = useState<GameId>('1a2b');
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'rooms' | 'users' | 'casino_boss' | 'shop_pricing' | 'overview'>('rooms');
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [casinoOpen, setCasinoOpen] = useState(false);
  const [casinoTab, setCasinoTab] = useState<CasinoTab>('slot');
  const [examCardUser, setExamCardUser] = useState<any>(null);
  const [lpcWardrobeOpen, setLpcWardrobeOpen] = useState(false);
  const [titleSelectorOpen, setTitleSelectorOpen] = useState(false);

  if (loading) {
    return <LoadingScreen message="對戰平台載入中..." subMessage="正在與雲端伺服器建立加密連線並同步使用者資訊..." />;
  }

  // Pure Google Sign-in Landing Page
  if (!currentUser) {
    return (
      <>
        <LandingPage />
        <PwaInstallPrompt />
      </>
    );
  }

  const handleOpenRules = (gameId: GameId = '1a2b') => {
    setSelectedRuleGame(gameId);
    setRuleDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#DFD5A5] text-[#2E2925] flex flex-col justify-between selection:bg-[#DBAD6A]/30">
      {/* Sleek Minimalist Header */}
      <Header
        onOpenRules={() => handleOpenRules(currentRoom?.gameId || '1a2b')}
        onOpenAdmin={() => { setAdminInitialTab('rooms'); setAdminOpen(true); }}
        onOpenCasinoBoss={() => { setAdminInitialTab('casino_boss'); setAdminOpen(true); }}
        onOpenFriends={() => setFriendsOpen(true)}
        onOpenEditProfile={() => setEditProfileOpen(true)}
        onOpenCasino={() => setCasinoOpen(true)}
        onOpenExamCard={() => setExamCardUser(currentUser)}
        onOpenLpcWardrobe={() => setLpcWardrobeOpen(true)}
        inGame={Boolean(currentRoom)}
      />

      {/* Main Content */}
      <main className="flex-1 flex w-full">
        <ErrorBoundary fallbackTitle="遊戲畫面載入異常">
          {currentRoom ? (
            <GameShell
              title={
                currentRoom.gameId === '1a2b'
                  ? '1A2B'
                  : currentRoom.gameId === 'battleship'
                  ? '海戰棋'
                  : currentRoom.gameId === 'bingo'
                  ? '賓果'
                  : currentRoom.gameId === 'dots'
                  ? '點線棋'
                  : currentRoom.gameId === 'connect4'
                  ? '四子棋 連線爭霸'
                  : '經典 OOXX'
              }
              gameId={currentRoom.gameId}
              onOpenRules={() => handleOpenRules(currentRoom.gameId)}
            >
              {currentRoom.gameId === '1a2b' && <Game1A2B />}
              {currentRoom.gameId === 'battleship' && <GameBattleship />}
              {currentRoom.gameId === 'bingo' && <GameBingo />}
              {currentRoom.gameId === 'dots' && <GameDotsAndBoxes />}
              {currentRoom.gameId === 'ooxx' && <GameOOXX />}
              {currentRoom.gameId === 'connect4' && <GameConnect4 />}
            </GameShell>
          ) : (
            <div className="flex-1 flex max-w-5xl mx-auto w-full">
              <Lobby
                onOpenRulesForGame={(gid) => handleOpenRules(gid)}
                onOpenFriends={() => setFriendsOpen(true)}
                onOpenCasino={(tab) => {
                  setCasinoTab(tab || 'slot');
                  setCasinoOpen(true);
                }}
                onOpenExamCard={(target) => setExamCardUser(target || currentUser)}
                onOpenLpcWardrobe={() => setLpcWardrobeOpen(true)}
                onOpenTitleSelector={() => setTitleSelectorOpen(true)}
              />
            </div>
          )}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="py-2.5 text-center text-[11px] text-[#96897B] font-medium">
        遊戲室 &copy; 2026
      </footer>

      {/* Rule Drawer */}
      <RuleDrawer
        isOpen={ruleDrawerOpen}
        onClose={() => setRuleDrawerOpen(false)}
        initialGameId={selectedRuleGame}
      />

      {/* Friends Modal */}
      <FriendsModal
        isOpen={friendsOpen}
        onClose={() => setFriendsOpen(false)}
      />

      {/* Global Real-time Incoming Battle Invite Modal */}
      <IncomingInviteModal />

      {/* Mandatory Profile Setup Modal before Onboarding */}
      <ProfileSetupModal
        isOpen={Boolean(currentUser && !currentUser.profileCompleted)}
      />

      {/* Edit Profile Modal from Header Menu */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />

      {/* Admin Dashboard */}
      <AdminDashboard
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
      />

      {/* Imperial Underground Casino (Slots, Scratch-off, Dice, Blackjack) */}
      <CasinoModal
        isOpen={casinoOpen}
        onClose={() => setCasinoOpen(false)}
        initialTab={casinoTab}
      />

      {/* Showa Imperial Examinee Student ID Card Modal (Business Card) */}
      <ExamCardModal
        isOpen={Boolean(examCardUser)}
        onClose={() => setExamCardUser(null)}
        user={examCardUser}
        isSelf={examCardUser?.uid === currentUser?.uid}
        onOpenEditProfile={() => {
          setExamCardUser(null);
          setEditProfileOpen(true);
        }}
        onOpenTitleSelector={() => {
          setExamCardUser(null);
          setTitleSelectorOpen(true);
        }}
      />

      {/* Player Title Selector Modal */}
      <TitleSelectorModal
        isOpen={titleSelectorOpen}
        onClose={() => setTitleSelectorOpen(false)}
      />

      {/* 2D Full-body LPC Pixel Character Wardrobe Modal */}
      <LpcWardrobeModal
        isOpen={lpcWardrobeOpen}
        onClose={() => setLpcWardrobeOpen(false)}
      />

      {/* Interactive Onboarding Spotlight Tour (shows only after profile setup completed) */}
      <OnboardingTour
        isOpen={Boolean(currentUser && currentUser.profileCompleted && !currentUser.tutorialCompleted)}
        onClose={() => {}}
      />

      {/* PWA Mobile App Install Prompt */}
      <PwaInstallPrompt />
    </div>
  );
};
