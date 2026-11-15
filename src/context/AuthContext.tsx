import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, CoinTransaction, UserWardrobe, UserPetProfile } from '../types';
import { DEFAULT_PET_PROFILE } from '../data/petAndChairCatalog';
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
import { sound } from '../services/soundService';

export const ADMIN_EMAIL = 'terrylie0215@gmail.com';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { displayName: string; photoURL: string; userTag: string }) => Promise<void>;
  updateWardrobe: (newWardrobe: UserWardrobe, newUnlockedItem?: string) => Promise<void>;
  purchaseWardrobeItem: (newWardrobe: UserWardrobe, unlockedItemId: string, coinCost: number, itemName: string) => Promise<boolean>;
  petProfile: UserPetProfile;
  updatePetProfile: (newProfile: UserPetProfile) => Promise<void>;
  feedPet: () => Promise<boolean>;
  petThePet: () => Promise<boolean>;
  playWithPet: () => Promise<boolean>;
  bathePet: () => Promise<boolean>;
  revivePet: () => Promise<boolean>;
  purchaseChair: (chairId: string, cost: number, chairName: string) => Promise<boolean>;
  purchasePet: (petId: string, cost: number, petName: string) => Promise<boolean>;
  purchaseOutfit: (outfitId: string, cost: number, outfitName: string) => Promise<boolean>;
  purchaseAccessory: (accessoryId: string, cost: number, accessoryName: string) => Promise<boolean>;
  toggleEquipAccessory: (accessoryId: string) => Promise<void>;
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

    // Try reading local cached profile to avoid losing any offline/recent purchases
    let localBackup: UserProfile | null = null;
    try {
      const cached = localStorage.getItem('duo_current_user');
      if (cached) localBackup = JSON.parse(cached);
    } catch {}

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

    // Merge petProfile carefully so unlocked items, outfits, and accessories are NEVER lost upon refresh
    const rawPet = existingProfile?.petProfile?.pet || localBackup?.petProfile?.pet || DEFAULT_PET_PROFILE.pet;
    const now = Date.now();
    const lastFed = rawPet.lastFed || now;
    const hoursSinceFed = Math.max(0, (now - lastFed) / (1000 * 60 * 60));

    // Dynamic hunger & mortality decay
    const calculatedHunger = Math.max(0, Math.round((rawPet.hunger ?? 80) - hoursSinceFed * 3));
    let calculatedHealth = rawPet.health ?? 100;
    let isDead = Boolean(rawPet.isDead);
    let causeOfDeath = rawPet.causeOfDeath;

    // Pet mortality check: if hunger drops to 0 and neglected, health drops to 0
    if (calculatedHunger === 0 && !isDead) {
      const starvingHours = Math.max(0, hoursSinceFed - 12);
      if (starvingHours > 0) {
        calculatedHealth = Math.max(0, calculatedHealth - Math.round(starvingHours * 8));
      }
      if (calculatedHealth <= 0) {
        isDead = true;
        calculatedHealth = 0;
        causeOfDeath = '長時間飢寒交迫，不幸罹難前往天國';
      }
    }

    const mergedPetProfile: UserPetProfile = {
      character: {
        ...DEFAULT_PET_PROFILE.character,
        ...(localBackup?.petProfile?.character || {}),
        ...(existingProfile?.petProfile?.character || {})
      },
      pet: {
        ...DEFAULT_PET_PROFILE.pet,
        ...rawPet,
        hunger: calculatedHunger,
        health: calculatedHealth,
        isDead,
        causeOfDeath: isDead ? (causeOfDeath || '飢寒交迫離世') : undefined
      },
      unlockedChairs: Array.from(new Set([
        ...DEFAULT_PET_PROFILE.unlockedChairs,
        ...(localBackup?.petProfile?.unlockedChairs || []),
        ...(existingProfile?.petProfile?.unlockedChairs || [])
      ])),
      unlockedPets: Array.from(new Set([
        ...DEFAULT_PET_PROFILE.unlockedPets,
        ...(localBackup?.petProfile?.unlockedPets || []),
        ...(existingProfile?.petProfile?.unlockedPets || [])
      ])),
      unlockedOutfits: Array.from(new Set([
        ...(DEFAULT_PET_PROFILE.unlockedOutfits || ['gakuran']),
        ...(localBackup?.petProfile?.unlockedOutfits || []),
        ...(existingProfile?.petProfile?.unlockedOutfits || [])
      ])),
      unlockedAccessories: Array.from(new Set([
        ...(DEFAULT_PET_PROFILE.unlockedAccessories || ['none']),
        ...(localBackup?.petProfile?.unlockedAccessories || []),
        ...(existingProfile?.petProfile?.unlockedAccessories || [])
      ]))
    };

    const profile: UserProfile = {
      uid: fbUser.uid,
      displayName: existingProfile?.displayName || localBackup?.displayName || fbUser.displayName || '玩家_' + fbUser.uid.substring(0, 4),
      photoURL: existingProfile?.photoURL || localBackup?.photoURL || fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
      email: fbUser.email || '',
      userTag: existingProfile?.userTag || localBackup?.userTag || generateUserTag(),
      coins: existingProfile?.coins !== undefined ? existingProfile.coins : (localBackup?.coins ?? 100),
      wins: existingProfile?.wins ?? localBackup?.wins ?? 0,
      losses: existingProfile?.losses ?? localBackup?.losses ?? 0,
      gamesPlayed: existingProfile?.gamesPlayed ?? localBackup?.gamesPlayed ?? 0,
      profileCompleted: Boolean(existingProfile?.profileCompleted ?? localBackup?.profileCompleted),
      tutorialCompleted: Boolean(existingProfile?.tutorialCompleted ?? localBackup?.tutorialCompleted),
      role: isAdmin ? 'admin' : (existingProfile?.role || localBackup?.role || 'user'),
      friendCode: existingProfile?.friendCode || localBackup?.friendCode || generateFriendCode(),
      createdAt: existingProfile?.createdAt || localBackup?.createdAt || Date.now(),
      wardrobe: existingProfile?.wardrobe || localBackup?.wardrobe,
      unlockedItems: Array.from(new Set([
        'none', 'default', 'candidate',
        ...(localBackup?.unlockedItems || []),
        ...(existingProfile?.unlockedItems || [])
      ])),
      petProfile: mergedPetProfile
    };

    setCurrentUser(profile);
    localStorage.setItem('duo_current_user', JSON.stringify(profile));
    setAuthError(null);

    // Save full merged profile to RTDB to ensure no data is lost
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

  // Atomic purchase of a wardrobe item: deducts coins, unlocks item, equips, records transaction, and syncs
  const purchaseWardrobeItem = async (
    newWardrobe: UserWardrobe,
    unlockedItemId: string,
    coinCost: number,
    itemName: string
  ): Promise<boolean> => {
    if (!currentUser) return false;
    if (coinCost > 0 && currentUser.coins < coinCost) {
      return false;
    }

    const newCoins = Math.max(0, currentUser.coins - coinCost);
    const existingUnlocked = currentUser.unlockedItems || ['none', 'default', 'candidate'];
    const updatedUnlocked =
      unlockedItemId && !existingUnlocked.includes(unlockedItemId)
        ? [...existingUnlocked, unlockedItemId]
        : existingUnlocked;

    const updated: UserProfile = {
      ...currentUser,
      coins: newCoins,
      wardrobe: newWardrobe,
      unlockedItems: updatedUnlocked
    };

    saveUser(updated);

    if (coinCost > 0) {
      const tx: CoinTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        uid: currentUser.uid,
        amount: -coinCost,
        type: 'shop_purchase',
        description: `購買服飾：${itemName}`,
        timestamp: Date.now()
      };
      setTransactions((prev) => [tx, ...prev]);
    }

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
      set(ref(rtdb, `users/${updated.uid}/coins`), newCoins).catch(console.warn);
      set(ref(rtdb, `users/${updated.uid}/wardrobe`), newWardrobe).catch(console.warn);
      set(ref(rtdb, `users/${updated.uid}/unlockedItems`), updatedUnlocked).catch(console.warn);
    }

    return true;
  };

  const petProfile: UserPetProfile = currentUser?.petProfile || DEFAULT_PET_PROFILE;

  const updatePetProfile = async (newProfile: UserPetProfile) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      petProfile: newProfile
    };
    saveUser(updated);

    matchService.updatePresence({
      uid: updated.uid,
      displayName: updated.displayName,
      photoURL: updated.photoURL,
      userTag: updated.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updated.wardrobe,
      petProfile: newProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updated.uid}/petProfile`), newProfile).catch(console.warn);
    }
  };

  const feedPet = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const cost = 10;
    if (currentUser.coins < cost) return false;

    const currProfile = currentUser.petProfile || DEFAULT_PET_PROFILE;
    const pet = { ...currProfile.pet };
    if (pet.isDead) return false; // 死亡狀態無法進食

    pet.hunger = Math.min(100, (pet.hunger || 0) + 30);
    pet.health = Math.min(100, (pet.health || 80) + 15);
    pet.intimacy = Math.min(100, (pet.intimacy || 0) + 10);
    pet.exp = (pet.exp || 0) + 25;
    pet.lastFed = Date.now();

    const maxExp = pet.maxExp || pet.level * 50;
    if (pet.exp >= maxExp && pet.level < 10) {
      pet.level += 1;
      pet.exp -= maxExp;
      pet.maxExp = pet.level * 50;
    }

    const newCoins = currentUser.coins - cost;
    const updatedProfile: UserPetProfile = {
      ...currProfile,
      pet
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      coins: newCoins,
      petProfile: updatedProfile
    };

    saveUser(updatedUser);

    const tx: CoinTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      uid: currentUser.uid,
      amount: -cost,
      type: 'shop_purchase',
      description: `餵食寵物（${pet.name}）點心`,
      timestamp: Date.now()
    };
    setTransactions((prev) => [tx, ...prev]);

    matchService.updatePresence({
      uid: updatedUser.uid,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userTag: updatedUser.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updatedUser.wardrobe,
      petProfile: updatedProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updatedUser.uid}/coins`), newCoins).catch(console.warn);
      set(ref(rtdb, `users/${updatedUser.uid}/petProfile`), updatedProfile).catch(console.warn);
    }

    return true;
  };

  const petThePet = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const currProfile = currentUser.petProfile || DEFAULT_PET_PROFILE;
    const pet = { ...currProfile.pet };
    if (pet.isDead) return false;

    pet.intimacy = Math.min(100, (pet.intimacy || 0) + 5);
    pet.mood = Math.min(100, (pet.mood || 80) + 10);
    pet.exp = (pet.exp || 0) + 5;
    pet.lastPetted = Date.now();

    const maxExp = pet.maxExp || pet.level * 50;
    if (pet.exp >= maxExp && pet.level < 10) {
      pet.level += 1;
      pet.exp -= maxExp;
      pet.maxExp = pet.level * 50;
    }

    const updatedProfile: UserPetProfile = {
      ...currProfile,
      pet
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      petProfile: updatedProfile
    };

    saveUser(updatedUser);

    matchService.updatePresence({
      uid: updatedUser.uid,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userTag: updatedUser.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updatedUser.wardrobe,
      petProfile: updatedProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updatedUser.uid}/petProfile`), updatedProfile).catch(console.warn);
    }

    return true;
  };

  const purchaseChair = async (chairId: string, cost: number, chairName: string): Promise<boolean> => {
    if (!currentUser) return false;
    if (cost > 0 && currentUser.coins < cost) return false;

    const currProfile = currentUser.petProfile || DEFAULT_PET_PROFILE;
    const unlockedChairs = currProfile.unlockedChairs || ['wooden_chair'];
    const updatedUnlocked = unlockedChairs.includes(chairId) ? unlockedChairs : [...unlockedChairs, chairId];

    const newCoins = Math.max(0, currentUser.coins - cost);
    const updatedProfile: UserPetProfile = {
      ...currProfile,
      character: {
        ...currProfile.character,
        chairId
      },
      unlockedChairs: updatedUnlocked
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      coins: newCoins,
      petProfile: updatedProfile
    };

    saveUser(updatedUser);

    if (cost > 0) {
      const tx: CoinTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        uid: currentUser.uid,
        amount: -cost,
        type: 'shop_purchase',
        description: `購買座椅：${chairName}`,
        timestamp: Date.now()
      };
      setTransactions((prev) => [tx, ...prev]);
    }

    matchService.updatePresence({
      uid: updatedUser.uid,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userTag: updatedUser.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updatedUser.wardrobe,
      petProfile: updatedProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updatedUser.uid}/coins`), newCoins).catch(console.warn);
      set(ref(rtdb, `users/${updatedUser.uid}/petProfile`), updatedProfile).catch(console.warn);
    }

    return true;
  };

  const purchasePet = async (petId: string, cost: number, petName: string): Promise<boolean> => {
    if (!currentUser) return false;
    if (cost > 0 && currentUser.coins < cost) return false;

    const currProfile = currentUser.petProfile || DEFAULT_PET_PROFILE;
    const unlockedPets = currProfile.unlockedPets || ['shiba'];
    const updatedUnlocked = unlockedPets.includes(petId) ? unlockedPets : [...unlockedPets, petId];

    const newCoins = Math.max(0, currentUser.coins - cost);
    const updatedProfile: UserPetProfile = {
      ...currProfile,
      character: {
        ...currProfile.character,
        petId
      },
      pet: {
        ...currProfile.pet,
        id: petId,
        name: petName
      },
      unlockedPets: updatedUnlocked
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      coins: newCoins,
      petProfile: updatedProfile
    };

    saveUser(updatedUser);

    if (cost > 0) {
      const tx: CoinTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        uid: currentUser.uid,
        amount: -cost,
        type: 'shop_purchase',
        description: `領養萌寵：${petName}`,
        timestamp: Date.now()
      };
      setTransactions((prev) => [tx, ...prev]);
    }

    matchService.updatePresence({
      uid: updatedUser.uid,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userTag: updatedUser.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updatedUser.wardrobe,
      petProfile: updatedProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updatedUser.uid}/coins`), newCoins).catch(console.warn);
      set(ref(rtdb, `users/${updatedUser.uid}/petProfile`), updatedProfile).catch(console.warn);
    }

    return true;
  };

  const playWithPet = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const currProfile = currentUser.petProfile || DEFAULT_PET_PROFILE;
    const pet = { ...currProfile.pet };
    if (pet.isDead) return false;

    pet.mood = Math.min(100, (pet.mood || 80) + 25);
    pet.hunger = Math.max(0, (pet.hunger || 80) - 5);
    pet.exp = (pet.exp || 0) + 15;
    pet.lastPlayed = Date.now();

    const maxExp = pet.maxExp || pet.level * 50;
    if (pet.exp >= maxExp && pet.level < 10) {
      pet.level += 1;
      pet.exp -= maxExp;
      pet.maxExp = pet.level * 50;
    }

    const updatedProfile: UserPetProfile = {
      ...currProfile,
      pet
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      petProfile: updatedProfile
    };

    saveUser(updatedUser);

    matchService.updatePresence({
      uid: updatedUser.uid,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userTag: updatedUser.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updatedUser.wardrobe,
      petProfile: updatedProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updatedUser.uid}/petProfile`), updatedProfile).catch(console.warn);
    }

    return true;
  };

  const bathePet = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const currProfile = currentUser.petProfile || DEFAULT_PET_PROFILE;
    const pet = { ...currProfile.pet };
    if (pet.isDead) return false;

    pet.cleanliness = 100;
    pet.health = Math.min(100, (pet.health || 80) + 10);
    pet.intimacy = Math.min(100, (pet.intimacy || 60) + 10);
    pet.exp = (pet.exp || 0) + 10;
    pet.lastBathed = Date.now();

    const maxExp = pet.maxExp || pet.level * 50;
    if (pet.exp >= maxExp && pet.level < 10) {
      pet.level += 1;
      pet.exp -= maxExp;
      pet.maxExp = pet.level * 50;
    }

    const updatedProfile: UserPetProfile = {
      ...currProfile,
      pet
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      petProfile: updatedProfile
    };

    saveUser(updatedUser);

    matchService.updatePresence({
      uid: updatedUser.uid,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userTag: updatedUser.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updatedUser.wardrobe,
      petProfile: updatedProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updatedUser.uid}/petProfile`), updatedProfile).catch(console.warn);
    }

    return true;
  };

  const revivePet = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const cost = 50;
    if (currentUser.coins < cost) return false;

    const currProfile = currentUser.petProfile || DEFAULT_PET_PROFILE;
    const pet = { ...currProfile.pet };

    pet.isDead = false;
    pet.health = 100;
    pet.hunger = 80;
    pet.cleanliness = 80;
    pet.mood = 80;
    pet.intimacy = Math.min(100, (pet.intimacy || 50) + 10);
    pet.lastFed = Date.now();
    delete pet.causeOfDeath;
    delete pet.diedAt;

    const newCoins = currentUser.coins - cost;
    const updatedProfile: UserPetProfile = {
      ...currProfile,
      pet
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      coins: newCoins,
      petProfile: updatedProfile
    };

    saveUser(updatedUser);

    const tx: CoinTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      uid: currentUser.uid,
      amount: -cost,
      type: 'shop_purchase',
      description: `✨ 聖光奇蹟：復活愛寵（${pet.name}）`,
      timestamp: Date.now()
    };
    setTransactions((prev) => [tx, ...prev]);

    matchService.updatePresence({
      uid: updatedUser.uid,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userTag: updatedUser.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updatedUser.wardrobe,
      petProfile: updatedProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updatedUser.uid}/coins`), newCoins).catch(console.warn);
      set(ref(rtdb, `users/${updatedUser.uid}/petProfile`), updatedProfile).catch(console.warn);
    }

    sound.playPetRevive();
    return true;
  };

  const purchaseOutfit = async (outfitId: string, cost: number, outfitName: string): Promise<boolean> => {
    if (!currentUser) return false;
    if (cost > 0 && currentUser.coins < cost) return false;

    const currProfile = currentUser.petProfile || DEFAULT_PET_PROFILE;
    const unlockedOutfits = currProfile.unlockedOutfits || ['gakuran'];
    const updatedUnlocked = unlockedOutfits.includes(outfitId) ? unlockedOutfits : [...unlockedOutfits, outfitId];

    const newCoins = Math.max(0, currentUser.coins - cost);
    const updatedProfile: UserPetProfile = {
      ...currProfile,
      character: {
        ...currProfile.character,
        outfitStyle: outfitId
      },
      unlockedOutfits: updatedUnlocked
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      coins: newCoins,
      petProfile: updatedProfile
    };

    saveUser(updatedUser);

    if (cost > 0) {
      const tx: CoinTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        uid: currentUser.uid,
        amount: -cost,
        type: 'shop_purchase',
        description: `解鎖服裝：${outfitName}`,
        timestamp: Date.now()
      };
      setTransactions((prev) => [tx, ...prev]);
    }

    matchService.updatePresence({
      uid: updatedUser.uid,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userTag: updatedUser.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updatedUser.wardrobe,
      petProfile: updatedProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updatedUser.uid}/coins`), newCoins).catch(console.warn);
      set(ref(rtdb, `users/${updatedUser.uid}/petProfile`), updatedProfile).catch(console.warn);
    }

    return true;
  };

  const purchaseAccessory = async (
    accessoryId: string,
    cost: number,
    accessoryName: string
  ): Promise<boolean> => {
    if (!currentUser) return false;
    if (cost > 0 && currentUser.coins < cost) return false;

    const currProfile = currentUser.petProfile || DEFAULT_PET_PROFILE;
    const unlockedAccessories = currProfile.unlockedAccessories || ['none'];
    const updatedUnlocked = unlockedAccessories.includes(accessoryId)
      ? unlockedAccessories
      : [...unlockedAccessories, accessoryId];

    // Auto-equip upon purchase into accessories list
    const currentEquipped = currProfile.character.accessories || [];
    const updatedEquipped = currentEquipped.includes(accessoryId)
      ? currentEquipped
      : [...currentEquipped, accessoryId];

    const newCoins = Math.max(0, currentUser.coins - cost);
    const updatedProfile: UserPetProfile = {
      ...currProfile,
      character: {
        ...currProfile.character,
        accessory: accessoryId,
        accessories: updatedEquipped
      },
      unlockedAccessories: updatedUnlocked
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      coins: newCoins,
      petProfile: updatedProfile
    };

    saveUser(updatedUser);

    if (cost > 0) {
      const tx: CoinTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        uid: currentUser.uid,
        amount: -cost,
        type: 'shop_purchase',
        description: `解鎖飾品：${accessoryName}`,
        timestamp: Date.now()
      };
      setTransactions((prev) => [tx, ...prev]);
    }

    matchService.updatePresence({
      uid: updatedUser.uid,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userTag: updatedUser.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updatedUser.wardrobe,
      petProfile: updatedProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updatedUser.uid}/coins`), newCoins).catch(console.warn);
      set(ref(rtdb, `users/${updatedUser.uid}/petProfile`), updatedProfile).catch(console.warn);
    }

    return true;
  };

  const toggleEquipAccessory = async (accessoryId: string) => {
    if (!currentUser) return;
    const currProfile = currentUser.petProfile || DEFAULT_PET_PROFILE;
    const currentEquipped = currProfile.character.accessories || (currProfile.character.accessory ? [currProfile.character.accessory] : []);

    const isEquipped = currentEquipped.includes(accessoryId);
    const newEquipped = isEquipped
      ? currentEquipped.filter((id) => id !== accessoryId)
      : [...currentEquipped, accessoryId];

    const updatedProfile: UserPetProfile = {
      ...currProfile,
      character: {
        ...currProfile.character,
        accessory: newEquipped.length > 0 ? newEquipped[0] : 'none',
        accessories: newEquipped
      }
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      petProfile: updatedProfile
    };

    saveUser(updatedUser);

    matchService.updatePresence({
      uid: updatedUser.uid,
      displayName: updatedUser.displayName,
      photoURL: updatedUser.photoURL,
      userTag: updatedUser.userTag,
      status: 'lobby',
      lastActive: Date.now(),
      wardrobe: updatedUser.wardrobe,
      petProfile: updatedProfile
    });

    if (rtdb) {
      set(ref(rtdb, `users/${updatedUser.uid}/petProfile`), updatedProfile).catch(console.warn);
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
        purchaseWardrobeItem,
        petProfile,
        updatePetProfile,
        feedPet,
        petThePet,
        playWithPet,
        bathePet,
        revivePet,
        purchaseChair,
        purchasePet,
        purchaseOutfit,
        purchaseAccessory,
        toggleEquipAccessory,
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
