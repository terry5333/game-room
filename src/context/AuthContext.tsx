import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, CoinTransaction, UserWardrobe } from '../types';
import {
  auth,
  rtdb,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  ref,
  set,
  get,
  child,
  onValue
} from '../services/firebase';
import { matchService } from '../services/matchService';
import { r2Service } from '../services/r2Service';

export const ADMIN_EMAIL = 'terrylie0215@gmail.com';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { displayName: string; photoURL: string; userTag: string }) => Promise<void>;
  updateWardrobe: (newWardrobe: UserWardrobe, newUnlockedItem?: string) => Promise<void>;
  updateCoins: (amount: number, type: CoinTransaction['type'], description: string, gameId?: any) => Promise<number>;
  recordGameResult: (isWin: boolean, multiplier?: number, gameId?: any) => Promise<void>;
  completeTutorial: () => Promise<void>;
  transactions: CoinTransaction[];
  allUsers: UserProfile[];
  adminUpdateUserCoins: (uid: string, delta: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateUserTag(): string {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits 1000-9999
}

function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('duo_current_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Check redirect result on mount
  useEffect(() => {
    if (auth) {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            handleFirebaseUser(result.user);
          }
        })
        .catch((err) => {
          console.error('Redirect auth error:', err);
        });
    }
  }, []);

  // Subscribe to all users in RTDB (for Admin & Friends search)
  useEffect(() => {
    if (rtdb) {
      const usersRef = ref(rtdb, 'users');
      const unsub = onValue(usersRef, (snap) => {
        if (snap.exists()) {
          setAllUsers(Object.values(snap.val()));
        }
      });
      return () => unsub();
    }
  }, []);

  // Auto-migrate legacy base64 avatar to Cloudflare R2 to eliminate network lag
  useEffect(() => {
    if (currentUser?.photoURL && currentUser.photoURL.startsWith('data:')) {
      const base64 = currentUser.photoURL;
      const uid = currentUser.uid;
      // Immediately set temporary lightweight avatar in local storage to stop sending 2.6MB packets
      const safeTemp = `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`;
      const updated = { ...currentUser, photoURL: safeTemp };
      setCurrentUser(updated);
      localStorage.setItem('duo_current_user', JSON.stringify(updated));

      // Asynchronously upload to Cloudflare R2
      r2Service
        .uploadBase64Avatar(base64, uid)
        .then((signedUrl) => {
          updateUserProfile({
            displayName: currentUser.displayName,
            photoURL: signedUrl,
            userTag: currentUser.userTag
          });
        })
        .catch(console.warn);
    }
  }, [currentUser?.photoURL, currentUser?.uid]);

  const handleFirebaseUser = async (fbUser: any) => {
    const isAdmin = fbUser.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

    // Try reading existing profile from RTDB
    let existingProfile: UserProfile | null = null;
    if (rtdb) {
      try {
        const snap = await get(child(ref(rtdb), `users/${fbUser.uid}`));
        if (snap.exists()) {
          existingProfile = snap.val();
        }
      } catch (e) {
        console.warn('RTDB read user error:', e);
      }
    }

    const profile: UserProfile = {
      uid: fbUser.uid,
      displayName: existingProfile?.displayName || fbUser.displayName || '玩家_' + fbUser.uid.substring(0, 4),
      photoURL: existingProfile?.photoURL || fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
      email: fbUser.email || '',
      userTag: existingProfile?.userTag || generateUserTag(),
      coins: existingProfile ? existingProfile.coins : 100,
      wins: existingProfile ? existingProfile.wins : 0,
      losses: existingProfile ? existingProfile.losses : 0,
      gamesPlayed: existingProfile ? existingProfile.gamesPlayed : 0,
      profileCompleted: existingProfile ? Boolean(existingProfile.profileCompleted) : false,
      tutorialCompleted: existingProfile ? Boolean(existingProfile.tutorialCompleted) : false,
      role: isAdmin ? 'admin' : (existingProfile?.role || 'user'),
      friendCode: existingProfile?.friendCode || generateFriendCode(),
      createdAt: existingProfile?.createdAt || Date.now()
    };

    setCurrentUser(profile);
    localStorage.setItem('duo_current_user', JSON.stringify(profile));
    setAuthError(null);

    // Save to RTDB
    if (rtdb) {
      set(ref(rtdb, `users/${profile.uid}`), profile).catch(console.warn);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await handleFirebaseUser(fbUser);
      } else {
        setCurrentUser(null);
        localStorage.removeItem('duo_current_user');
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const saveUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('duo_current_user', JSON.stringify(user));
    if (rtdb) {
      set(ref(rtdb, `users/${user.uid}`), user).catch(console.warn);
    }
  };

  // Mandatory Google Login
  const loginWithGoogle = async () => {
    if (!auth) {
      setAuthError('Firebase 尚未就緒，請檢查連線');
      return;
    }

    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await handleFirebaseUser(result.user);
      }
    } catch (err: any) {
      console.warn('Google popup error:', err);

      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirErr: any) {
          console.warn('Redirect error:', redirErr);
        }
      }

      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }

      let msg = err.message || 'Google 登入失敗';
      if (err.code === 'auth/unauthorized-domain') {
        msg = '此網域尚未在 Firebase 授權網域清單中，請在 Firebase 控制台新增。';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Firebase Authentication 尚未啟用 Google 登入提供者。';
      } else if (err.code === 'auth/popup-blocked') {
        msg = '瀏覽器阻擋了登入彈出視窗，請允許彈跳視窗。';
      }
      setAuthError(msg);
    }
  };

  // Update profile (Name, Avatar, 4-digit ID)
  const updateUserProfile = async (data: { displayName: string; photoURL: string; userTag: string }) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      displayName: data.displayName.trim() || currentUser.displayName,
      photoURL: data.photoURL || currentUser.photoURL,
      userTag: data.userTag.trim() || currentUser.userTag,
      profileCompleted: true
    };
    saveUser(updated);

    // Immediately propagate updated avatar & name to live presence
    matchService.updatePresence({
      uid: updated.uid,
      displayName: updated.displayName,
      photoURL: updated.photoURL,
      userTag: updated.userTag,
      status: 'lobby',
      lastActive: Date.now()
    });

    // Sync updated avatar & name to all mutual friends' friend lists in RTDB
    matchService.syncProfileToFriends(updated);
  };

  // Update wardrobe equipment and optionally register a new unlocked wardrobe item
  const updateWardrobe = async (newWardrobe: UserWardrobe, newUnlockedItem?: string) => {
    if (!currentUser) return;
    const existingUnlocked = currentUser.unlockedItems || ['none', 'default', 'candidate'];
    const updatedUnlocked =
      newUnlockedItem && !existingUnlocked.includes(newUnlockedItem)
        ? [...existingUnlocked, newUnlockedItem]
        : existingUnlocked;

    const updated: UserProfile = {
      ...currentUser,
      wardrobe: newWardrobe,
      unlockedItems: updatedUnlocked
    };

    saveUser(updated);

    // Sync to live presence so room lobbies and friends see outfit immediately
    matchService.updatePresence({
      uid: updated.uid,
      displayName: updated.displayName,
      photoURL: updated.photoURL,
      userTag: updated.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: newWardrobe
    });

    matchService.syncProfileToFriends(updated);

    if (rtdb) {
      set(ref(rtdb, `users/${updated.uid}/wardrobe`), newWardrobe).catch(console.warn);
      set(ref(rtdb, `users/${updated.uid}/unlockedItems`), updatedUnlocked).catch(console.warn);
    }
  };

  const logout = async () => {
    if (currentUser) {
      matchService.updatePresence({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        status: 'offline',
        lastActive: Date.now()
      });
    }
    if (auth) {
      try {
        await fbSignOut(auth);
      } catch {}
    }
    setCurrentUser(null);
    localStorage.removeItem('duo_current_user');
  };

  const updateCoins = async (
    amount: number,
    type: CoinTransaction['type'],
    description: string,
    gameId?: any
  ): Promise<number> => {
    if (!currentUser) return 0;

    const newBalance = Math.max(0, currentUser.coins + amount);
    const updatedUser = { ...currentUser, coins: newBalance };
    saveUser(updatedUser);

    const tx: CoinTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      uid: currentUser.uid,
      amount,
      type,
      description,
      timestamp: Date.now(),
      gameId
    };

    setTransactions((prev) => [tx, ...prev]);
    return newBalance;
  };

  const recordGameResult = async (isWin: boolean, multiplier: number = 1, gameId?: any) => {
    if (!currentUser) return;
    const baseAmount = isWin ? 50 : 10;
    const coinReward = Math.round(baseAmount * multiplier);

    await updateCoins(
      coinReward,
      isWin ? 'win_reward' : 'consolation',
      isWin ? `遊戲獲勝獎勵 (x${multiplier})` : '遊戲安慰獎',
      gameId
    );

    const updatedUser: UserProfile = {
      ...currentUser,
      coins: currentUser.coins + coinReward,
      gamesPlayed: currentUser.gamesPlayed + 1,
      wins: isWin ? currentUser.wins + 1 : currentUser.wins,
      losses: !isWin ? currentUser.losses + 1 : currentUser.losses
    };
    saveUser(updatedUser);
  };

  const completeTutorial = async () => {
    if (!currentUser) return;
    const updated = { ...currentUser, tutorialCompleted: true };
    saveUser(updated);
  };

  const adminUpdateUserCoins = async (uid: string, delta: number) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          const newCoins = Math.max(0, u.coins + delta);
          if (currentUser && currentUser.uid === uid) {
            setCurrentUser({ ...currentUser, coins: newCoins });
          }
          return { ...u, coins: newCoins };
        }
        return u;
      })
    );

    if (rtdb) {
      try {
        const uSnap = await get(child(ref(rtdb), `users/${uid}`));
        if (uSnap.exists()) {
          const curr = uSnap.val() as UserProfile;
          set(ref(rtdb, `users/${uid}/coins`), Math.max(0, curr.coins + delta)).catch(console.warn);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authError,
        loginWithGoogle,
        logout,
        updateUserProfile,
        updateWardrobe,
        updateCoins,
        recordGameResult,
        completeTutorial,
        transactions,
        allUsers,
        adminUpdateUserCoins
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
