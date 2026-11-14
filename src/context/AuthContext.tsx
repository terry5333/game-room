import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, CoinTransaction } from '../types';
import {
  auth,
  db,
  rtdb,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  ref,
  set,
  get,
  child
} from '../services/firebase';
import { matchService } from '../services/matchService';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithNickname: (nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCoins: (amount: number, type: CoinTransaction['type'], description: string, gameId?: any) => Promise<number>;
  recordGameResult: (isWin: boolean, multiplier?: number, gameId?: any) => Promise<void>;
  completeTutorial: () => Promise<void>;
  setUserRole: (role: 'user' | 'admin') => Promise<void>;
  transactions: CoinTransaction[];
  allUsers: UserProfile[];
  adminUpdateUserCoins: (uid: string, delta: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const handleFirebaseUser = async (fbUser: any) => {
    // 1. Try to read from Realtime Database first (which is 100% active)
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

    const profile: UserProfile = existingProfile || {
      uid: fbUser.uid,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || '玩家_' + fbUser.uid.substring(0, 4),
      photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
      email: fbUser.email || '',
      coins: existingProfile ? existingProfile.coins : 100,
      wins: existingProfile ? existingProfile.wins : 0,
      losses: existingProfile ? existingProfile.losses : 0,
      gamesPlayed: existingProfile ? existingProfile.gamesPlayed : 0,
      tutorialCompleted: existingProfile ? existingProfile.tutorialCompleted : false,
      role: fbUser.email?.includes('admin') ? 'admin' : 'user',
      friendCode: existingProfile?.friendCode || generateFriendCode(),
      createdAt: existingProfile?.createdAt || Date.now()
    };

    // ALWAYS set current user immediately so user enters the app
    setCurrentUser(profile);
    localStorage.setItem('duo_current_user', JSON.stringify(profile));
    setAuthError(null);

    // Save to RTDB
    if (rtdb) {
      set(ref(rtdb, `users/${profile.uid}`), profile).catch(console.warn);
    }

    // Try saving to Firestore if available
    if (db) {
      try {
        setDoc(doc(db, 'users', profile.uid), profile, { merge: true }).catch(() => {});
      } catch {}
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
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Sync presence status to Realtime Database
  useEffect(() => {
    if (!currentUser) return;

    matchService.updatePresence({
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      status: 'online',
      lastActive: Date.now()
    });

    const interval = setInterval(() => {
      matchService.updatePresence({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        status: 'online',
        lastActive: Date.now()
      });
    }, 20000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const saveUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('duo_current_user', JSON.stringify(user));
    if (rtdb) {
      set(ref(rtdb, `users/${user.uid}`), user).catch(console.warn);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      setAuthError('Firebase 認證模組尚未就緒，請重試。');
      return;
    }

    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // First attempt standard popup
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await handleFirebaseUser(result.user);
      }
    } catch (err: any) {
      console.warn('Google popup error:', err);

      // If popup is blocked by browser/webview, attempt redirect
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

      // Friendly explanatory error
      let msg = err.message || 'Google 登入失敗';
      if (err.code === 'auth/unauthorized-domain') {
        msg = '此網域尚未在 Firebase 授權網域清單中，請在 Firebase 控制台新增 localhost。';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Firebase Authentication 尚未啟用 Google 登入提供者。';
      } else if (err.code === 'auth/popup-blocked') {
        msg = '瀏覽器阻擋了登入彈出視窗，請允許彈跳視窗或使用下方暱稱快速進入。';
      }
      setAuthError(msg);
    }
  };

  // Instant sign-in with nickname (guaranteed access even if browser popup is blocked)
  const loginWithNickname = async (nickname: string) => {
    const cleanName = nickname.trim();
    if (!cleanName) return;

    const uid = 'user_' + Math.random().toString(36).substring(2, 10);
    const profile: UserProfile = {
      uid,
      displayName: cleanName,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanName}`,
      email: `${cleanName.toLowerCase()}@player.local`,
      coins: 100,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      tutorialCompleted: false,
      role: 'user',
      friendCode: generateFriendCode(),
      createdAt: Date.now()
    };

    saveUser(profile);
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

  const setUserRole = async (role: 'user' | 'admin') => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
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
        loginWithNickname,
        logout,
        updateCoins,
        recordGameResult,
        completeTutorial,
        setUserRole,
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
