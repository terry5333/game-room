import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Flame,
  Radio,
  CheckCircle2,
  Save,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';
import {
  getStoredFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  isFirebaseConfigured,
  type FirebaseCustomConfig
} from '../../services/firebase';
import { sound } from '../../services/soundService';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose
}) => {
  const current = getStoredFirebaseConfig() || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    databaseURL: ''
  };

  const [form, setForm] = useState<FirebaseCustomConfig>(current);
  const isConfigured = isFirebaseConfigured();

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (!form.apiKey || !form.projectId) {
      alert('請至少填寫 API Key 與 Project ID！');
      return;
    }
    saveCustomFirebaseConfig(form);
  };

  const handleClear = () => {
    sound.playClick();
    if (confirm('確定要清除自訂 Firebase 設定並切換為本機即時模式嗎？')) {
      clearCustomFirebaseConfig();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 border-2 border-white/80 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#96897B]/20 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#CF995F] text-white flex items-center justify-center shadow-sm">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#2E2925]">
                Firebase 雲端連線設定
              </h3>
              <p className="text-xs text-[#96897B]">
                Authentication, Firestore 與 Realtime Database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/60 hover:bg-white text-[#2E2925] border border-[#96897B]/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status card */}
        <div
          className={`p-3.5 rounded-2xl border mb-5 flex items-center justify-between ${
            isConfigured
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-[#628395]/15 border-[#628395]/30 text-[#2E2925]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Radio
              className={`w-5 h-5 ${
                isConfigured ? 'text-emerald-600 animate-pulse' : 'text-[#628395]'
              }`}
            />
            <div>
              <div className="text-xs font-bold">
                {isConfigured
                  ? '已成功連接至 Firebase 雲端伺服器！'
                  : '目前模式：即時跨分頁同網廣播同步 (開箱即玩)'}
              </div>
              <div className="text-[11px] opacity-80">
                {isConfigured
                  ? '支援跨裝置多人遠端連線與 Google 登入'
                  : '在兩個瀏覽器視窗中開啟本應用，即可直接體驗雙人即時對戰'}
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#2E2925] mb-1">
              API Key <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/30 focus:outline-none focus:border-[#628395] text-[#2E2925] font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-[#2E2925] mb-1">
                Project ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                placeholder="my-duo-app"
                className="w-full px-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/30 focus:outline-none focus:border-[#628395] text-[#2E2925] font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-[#2E2925] mb-1">
                Auth Domain
              </label>
              <input
                type="text"
                value={form.authDomain}
                onChange={(e) => setForm({ ...form, authDomain: e.target.value })}
                placeholder="my-duo-app.firebaseapp.com"
                className="w-full px-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/30 focus:outline-none focus:border-[#628395] text-[#2E2925] font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#2E2925] mb-1">
              Realtime Database URL (支援即時對弈與燈號)
            </label>
            <input
              type="text"
              value={form.databaseURL || ''}
              onChange={(e) => setForm({ ...form, databaseURL: e.target.value })}
              placeholder="https://my-duo-app-default-rtdb.firebaseio.com"
              className="w-full px-3 py-2 rounded-xl bg-white/80 border border-[#96897B]/30 focus:outline-none focus:border-[#628395] text-[#2E2925] font-mono text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清除自訂</span>
            </button>

            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold transition-all shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>儲存並重啟連線</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
