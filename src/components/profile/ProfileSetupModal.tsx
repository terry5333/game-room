import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Upload,
  Hash,
  Sparkles,
  ArrowRight,
  Check,
  Shuffle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../services/soundService';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna'
];

interface ProfileSetupModalProps {
  isOpen: boolean;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen }) => {
  const { currentUser, updateUserProfile } = useAuth();

  const [name, setName] = useState(currentUser?.displayName || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || PRESET_AVATARS[0]);
  const [userTag, setUserTag] = useState(currentUser?.userTag || Math.floor(1000 + Math.random() * 9000).toString());
  const [uploading, setUploading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleRandomizeTag = () => {
    sound.playClick();
    setUserTag(Math.floor(1000 + Math.random() * 9000).toString());
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoURL(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!name.trim()) {
      alert('請輸入玩家暱稱！');
      return;
    }

    if (!/^\d{4}$/.test(userTag.trim())) {
      alert('專屬 ID 必須為 4 位數字 (0000 - 9999)！');
      return;
    }

    await updateUserProfile({
      displayName: name.trim(),
      photoURL,
      userTag: userTag.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-7 border-2 border-white/80 shadow-2xl relative"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#628395] text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-[#2E2925]">
            設定玩家檔案
          </h2>
          <p className="text-xs text-[#96897B] font-medium mt-0.5">
            在進入新手教學與遊戲大廳前，請自訂你的代表頭像與稱號
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Section */}
          <div>
            <label className="block text-xs font-bold text-[#2E2925] mb-2 text-center">
              選擇頭像或自訂上傳
            </label>

            {/* Current Selected Avatar Preview */}
            <div className="flex justify-center mb-3">
              <div className="relative group">
                <img
                  src={photoURL}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#628395] shadow-sm"
                />
                <label className="absolute inset-0 bg-black/40 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Preset Avatars Row */}
            <div className="flex items-center justify-center gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    sound.playClick();
                    setPhotoURL(url);
                  }}
                  className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    photoURL === url ? 'border-[#628395] scale-105' : 'border-white/60 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}

              {/* Upload custom button */}
              <label className="w-9 h-9 rounded-xl border-2 border-dashed border-[#96897B]/40 hover:border-[#628395] flex items-center justify-center text-[#96897B] hover:text-[#628395] transition-colors cursor-pointer bg-white/40">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-bold text-[#2E2925] mb-1">
              玩家暱稱
            </label>
            <input
              type="text"
              required
              maxLength={15}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入顯示名稱"
              className="w-full px-3 py-2.5 rounded-xl bg-white/80 border border-[#96897B]/20 text-xs font-bold text-[#2E2925] focus:outline-none focus:border-[#628395]"
            />
          </div>

          {/* 4-digit ID Tag */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#2E2925]">
                專屬 4 位數字 ID (#XXXX)
              </label>
              <button
                type="button"
                onClick={handleRandomizeTag}
                className="text-[11px] font-bold text-[#628395] hover:underline flex items-center gap-1"
              >
                <Shuffle className="w-3 h-3" />
                <span>隨機生成</span>
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-[#96897B]">
                #
              </span>
              <input
                type="text"
                required
                maxLength={4}
                value={userTag}
                onChange={(e) => setUserTag(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white/80 border border-[#96897B]/20 font-mono text-sm font-extrabold tracking-widest text-[#2E2925] focus:outline-none focus:border-[#628395]"
              />
            </div>
            <p className="text-[11px] text-[#96897B] mt-1">
              朋友可透過您的暱稱加上 4 位數字 ID 新增您為好友。
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[#628395] hover:bg-[#526f7f] text-white font-extrabold text-sm shadow-md shadow-[#628395]/20 flex items-center justify-center gap-2 cursor-pointer transition-all mt-4"
          >
            <span>確認檔案，進入遊戲室</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
