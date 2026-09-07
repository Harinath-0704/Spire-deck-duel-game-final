import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Volume2, VolumeX, Music, Settings as SettingsIcon, 
  Smartphone, LogOut, Globe, Shield, FileText, Info, Zap, User 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsService, type LanguageCode, type GameSettings } from '../services/settingsService';
import { AudioService } from '../services/audio';
import { signOut } from '../services/supabase/client';
import { useTranslation } from '../hooks/useTranslation';

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Use state to force re-renders on settings change
  const [settings, setSettings] = useState<GameSettings>(SettingsService.getSettings());
  const [modalContent, setModalContent] = useState<{title: string, body: React.ReactNode} | null>(null);

  useEffect(() => {
    AudioService.init();
  }, []);

  // Sync state if settings change elsewhere
  useEffect(() => {
    const handleStorage = () => {
      setSettings(SettingsService.getSettings());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateSetting = (key: keyof GameSettings, value: any) => {
    const updated = SettingsService.saveSettings({ [key]: value });
    setSettings(updated);
    AudioService.updateVolumes();
    
    if (key === 'musicEnabled') {
      if (value) AudioService.resumeCurrentMusic();
      else AudioService.stopMusic();
    }
    
    if (key === 'sfxEnabled' && value) AudioService.playCardSelect();
    if (key === 'vibrationEnabled' && value) AudioService.vibrate(50);
  };

  const handleSignOut = async () => {
    AudioService.playCardSelect();
    await signOut();
    navigate('/', { replace: true });
  };

  const openModal = (title: string, body: React.ReactNode) => {
    AudioService.playCardSelect();
    setModalContent({ title, body });
  };

  const closeModal = () => {
    AudioService.playCardSelect();
    setModalContent(null);
  };

  const Modals = {
    Help: (
      <div className="space-y-4 text-sm">
        <h4 className="font-bold text-blue-300">How to Play</h4>
        <p>Goal: Reduce opponent HP to 0.<br/>Energy: Used to play cards. Regenerates per turn.<br/>Cards: Drag to play.</p>
        <h4 className="font-bold text-blue-300 mt-4">Online Battle</h4>
        <p>Create a room, share the 6-letter code or QR, and wait for Player 2.</p>
        <h4 className="font-bold text-blue-300 mt-4">Troubleshooting</h4>
        <p>If disconnected, try refreshing. The match may end automatically if the opponent leaves.</p>
        <h4 className="font-bold text-blue-300 mt-4">Contact</h4>
        <p>Support contact will be available soon.</p>
      </div>
    ),
    Privacy: (
      <div className="space-y-4 text-sm">
        <h4 className="font-bold text-blue-300">Privacy Policy — Version 1.0</h4>
        <p>Authentication: We support Google, Guest, and Email login.<br/>Data: Profile info, game statistics, coins, and collections are securely stored via Supabase.</p>
        <p>We do not sell personal information. Local settings are stored in your browser.</p>
        <p>Security limitations apply as this is a student project.</p>
      </div>
    ),
    Terms: (
      <div className="space-y-4 text-sm">
        <h4 className="font-bold text-blue-300">Terms of Service — Version 1.0</h4>
        <p>Game Usage: This game is provided as-is for tactical card battle entertainment.<br/>Fair Play: Online abuse or exploits are prohibited.</p>
        <p>Virtual Items: Virtual coins and cosmetics have no real-world value and cannot be exchanged.</p>
        <p>Service Availability: Accounts may be terminated for abuse. The service may update or go offline without notice.</p>
      </div>
    ),
    About: (
      <div className="space-y-4 text-sm text-center">
        <h4 className="font-bold text-xl text-blue-300 tracking-widest uppercase">Spire Deck Duel</h4>
        <p className="italic text-slate-400">"An arcane tactical card battle experience."</p>
        <p>Version: 1.0.0</p>
        <p>Technology: React, TypeScript, TailwindCSS, Vite, Supabase.</p>
        <p className="text-xs text-slate-500 mt-4">Audio generated via Web Audio API. Original project assets used.</p>
      </div>
    )
  };

  return (
    <div className="h-[100dvh] flex flex-col items-center p-6 pb-24 bg-transparent text-slate-200 overflow-y-auto overflow-x-hidden font-sans relative scroll-smooth">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-black pointer-events-none"></div>

      <div className="relative top-0 z-50 flex items-center gap-4 w-full max-w-md mx-auto mb-6 mt-4">
        <Link 
          to="/home" 
          onClick={() => AudioService.playCardSelect()} 
          className="p-2 glass-panel rounded-full text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-serif font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200 uppercase">
          {t('settings.title')}
        </h1>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        
        {/* AUDIO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-6 flex items-center gap-2">
            <Volume2 className="w-4 h-4" /> {t('settings.audio')}
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className={`w-5 h-5 ${settings.musicEnabled ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="font-medium tracking-wide">{t('settings.music')}</span>
              </div>
              <button onClick={() => updateSetting('musicEnabled', !settings.musicEnabled)} className={`w-14 h-7 rounded-full p-1 transition-colors ${settings.musicEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.musicEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.sfxEnabled ? <Volume2 className="w-5 h-5 text-blue-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                <span className="font-medium tracking-wide">{t('settings.sfx')}</span>
              </div>
              <button onClick={() => updateSetting('sfxEnabled', !settings.sfxEnabled)} className={`w-14 h-7 rounded-full p-1 transition-colors ${settings.sfxEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.sfxEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
            <hr className="border-slate-800" />
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>{t('settings.masterVol')}</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={settings.masterVolume} onChange={(e) => updateSetting('masterVolume', parseFloat(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>{t('settings.musicVol')}</span>
                <span>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={settings.musicVolume} onChange={(e) => updateSetting('musicVolume', parseFloat(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>{t('settings.sfxVol')}</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={settings.sfxVolume} onChange={(e) => updateSetting('sfxVolume', parseFloat(e.target.value))} className="w-full accent-blue-500" />
            </div>
          </div>
        </motion.div>

        {/* GAMEPLAY SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4" /> {t('settings.gameplay')}
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className={`w-5 h-5 ${settings.vibrationEnabled ? 'text-purple-400' : 'text-slate-500'}`} />
                <span className="font-medium tracking-wide">{t('settings.vibration')}</span>
              </div>
              <button onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)} className={`w-14 h-7 rounded-full p-1 transition-colors ${settings.vibrationEnabled ? 'bg-purple-600' : 'bg-slate-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.vibrationEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className={`w-5 h-5 ${settings.battleAnimationsEnabled ? 'text-purple-400' : 'text-slate-500'}`} />
                <span className="font-medium tracking-wide">{t('settings.animations')}</span>
              </div>
              <button onClick={() => updateSetting('battleAnimationsEnabled', !settings.battleAnimationsEnabled)} className={`w-14 h-7 rounded-full p-1 transition-colors ${settings.battleAnimationsEnabled ? 'bg-purple-600' : 'bg-slate-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.battleAnimationsEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* LANGUAGE SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 mb-6 flex items-center gap-2">
            <Globe className="w-4 h-4" /> {t('settings.language')}
          </h2>
          <div className="flex flex-col gap-3">
            {(['en', 'te', 'ta'] as LanguageCode[]).map((l) => (
              <button
                key={l}
                onClick={() => updateSetting('language', l)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${settings.language === l ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-200' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >
                <span className="font-medium tracking-wide uppercase">
                  {l === 'en' ? 'English' : l === 'te' ? 'Telugu' : 'Tamil'}
                </span>
                {settings.language === l && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ACCOUNT SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-6 flex items-center gap-2">
            <User className="w-4 h-4" /> {t('settings.account')}
          </h2>
          <div className="space-y-4">
            <Link to="/profile" onClick={() => AudioService.playCardSelect()} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all font-bold tracking-wider uppercase">
              <User className="w-5 h-5" /> {t('settings.profile')}
            </Link>
            <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-3 bg-red-950/40 text-red-400 hover:bg-red-900/50 hover:text-red-300 border border-red-900/50 rounded-xl transition-all font-bold tracking-wider uppercase">
              <LogOut className="w-5 h-5" /> {t('settings.signout')}
            </button>
          </div>
        </motion.div>

        {/* OTHER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-6 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" /> {t('settings.other')}
          </h2>
          <div className="space-y-4">
            <button onClick={() => openModal(t('settings.help'), Modals.Help)} className="w-full flex items-center gap-3 text-left hover:text-white text-slate-300 transition-colors py-2">
              <Info className="w-5 h-5" /> {t('settings.help')}
            </button>
            <button onClick={() => openModal(t('settings.privacy'), Modals.Privacy)} className="w-full flex items-center gap-3 text-left hover:text-white text-slate-300 transition-colors py-2">
              <Shield className="w-5 h-5" /> {t('settings.privacy')}
            </button>
            <button onClick={() => openModal(t('settings.terms'), Modals.Terms)} className="w-full flex items-center gap-3 text-left hover:text-white text-slate-300 transition-colors py-2">
              <FileText className="w-5 h-5" /> {t('settings.terms')}
            </button>
            <button onClick={() => openModal(t('settings.about'), Modals.About)} className="w-full flex items-center gap-3 text-left hover:text-white text-slate-300 transition-colors py-2">
              <Info className="w-5 h-5" /> {t('settings.about')}
            </button>
            
            <div className="text-center pt-4 text-xs text-slate-600 font-bold tracking-widest uppercase">
              {t('settings.version')} 1.0.0
            </div>
          </div>
        </motion.div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {modalContent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-serif text-blue-400 mb-4">{modalContent.title}</h3>
              <div className="text-slate-300 mb-6">{modalContent.body}</div>
              <button onClick={closeModal} className="w-full btn-primary py-3 font-bold uppercase tracking-widest">{t('btn.close')}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
