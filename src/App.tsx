import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useRoom } from './context/RoomContext';
import { Header } from './components/common/Header';
import { LandingPage } from './components/auth/LandingPage';
import { Lobby } from './components/lobby/Lobby';
import { FriendsModal } from './components/lobby/FriendsModal';
import { RuleDrawer } from './components/common/RuleDrawer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OnboardingTour } from './components/common/OnboardingTour';
import { ProfileSetupModal } from './components/profile/ProfileSetupModal';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { GameShell } from './components/games/GameShell';
import { Game1A2B } from './components/games/game1a2b/Game1A2B';
import { GameBattleship } from './components/games/battleship/GameBattleship';
import { GameBingo } from './components/games/bingo/GameBingo';
import { GameDotsAndBoxes } from './components/games/dotsandboxes/GameDotsAndBoxes';
import { GameOOXX } from './components/games/ooxx/GameOOXX';
import type { GameId } from './types';

export const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { currentRoom } = useRoom();

  const [ruleDrawerOpen, setRuleDrawerOpen] = useState(false);
  const [selectedRuleGame, setSelectedRuleGame] = useState<GameId>('1a2b');
  const [adminOpen, setAdminOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#DFD5A5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-[#628395] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-[#96897B] font-mono">載入中...</span>
        </div>
      </div>
    );
  }

  // Pure Google Sign-in Landing Page
  if (!currentUser) {
    return <LandingPage />;
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
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenFriends={() => setFriendsOpen(true)}
        onOpenEditProfile={() => setEditProfileOpen(true)}
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
            </GameShell>
          ) : (
            <div className="flex-1 flex max-w-5xl mx-auto w-full">
              <Lobby
                onOpenRulesForGame={(gid) => handleOpenRules(gid)}
                onOpenFriends={() => setFriendsOpen(true)}
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

      {/* Interactive Onboarding Spotlight Tour (shows only after profile setup completed) */}
      <OnboardingTour
        isOpen={Boolean(currentUser && currentUser.profileCompleted && !currentUser.tutorialCompleted)}
        onClose={() => {}}
      />
    </div>
  );
};
