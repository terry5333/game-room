import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Upload,
  X,
  Check,
  Shuffle,
  Save
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

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useAuth();

  const [name, setName] = useState(currentUser?.displayName || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || PRESET_AVATARS[0]);
  const [userTag, setUserTag] = useState(currentUser?.userTag || '1000');

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!name.trim()) {
      alert('請輸入玩家暱稱！');
      return;
    }

    if (!/^\d{4}$/.test(userTag.trim())) {
      alert('專屬 ID 必須為 4 位數字！');
      return;
    }

    await updateUserProfile({
      displayName: name.trim(),
      photoURL,
      userTag: userTag.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        className="w-full max-w-sm glass-panel rounded-3xl p-6 border-2 border-white/80 shadow-2xl relative"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#96897B]/15 mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#628395]" />
            <h3 className="font-extrabold text-base text-[#2E2925]">
              編輯個人檔案
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/60 text-[#96897B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Preview & Picker */}
          <div>
            <div className="flex justify-center mb-2.5">
              <div className="relative group">
                <img
                  src={photoURL}
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#628395] shadow-xs"
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

            <div className="flex items-center justify-center gap-1.5">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    sound.playClick();
                    setPhotoURL(url);
                  }}
                  className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    photoURL === url ? 'border-[#628395] scale-105' : 'border-white/60 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}

              <label className="w-8 h-8 rounded-xl border border-dashed border-[#96897B]/40 hover:border-[#628395] flex items-center justify-center text-[#96897B] hover:text-[#628395] transition-colors cursor-pointer bg-white/40">
                <Upload className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-[#2E2925] mb-1">
              暱稱
            </label>
            <input
              type="text"
              required
              maxLength={15}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/20 text-xs font-bold text-[#2E2925] focus:outline-none focus:border-[#628395]"
            />
          </div>

          {/* 4-digit ID Tag */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#2E2925]">
                專屬 4 位數字 ID
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
                className="w-full pl-7 pr-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/20 font-mono text-sm font-extrabold tracking-widest text-[#2E2925] focus:outline-none focus:border-[#628395]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>儲存修改</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
