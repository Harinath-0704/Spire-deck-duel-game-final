import { SettingsService } from './settingsService';

// Import ONLY the allowed assets
import battleMusicUrl from '../assets/audio/music/battle.wav';
import cardPlayUrl from '../assets/audio/sfx/card_play.wav';
import combatImpactUrl from '../assets/audio/sfx/combat_impact.wav';

class AudioManagerImpl {
  private audioCtx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;

  private musicSource: HTMLAudioElement | null = null;
  private currentMusicContext: 'battle' | null = null;
  private isMusicPlaying = false;

  private sfxBuffers: Record<string, AudioBuffer> = {};
  private initialized = false;

  private async fetchAndDecode(url: string): Promise<AudioBuffer | null> {
    if (!this.audioCtx) return null;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error(`Failed to load audio: ${url}`, e);
      return null;
    }
  }

  async init() {
    if (this.initialized) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API not supported in this browser.');
        return;
      }

      this.audioCtx = new AudioContextClass();

      this.sfxGain = this.audioCtx.createGain();
      this.sfxGain.connect(this.audioCtx.destination);

      this.updateVolumes();
      this.initialized = true;

      // Preload the two allowed SFX
      const sfxToLoad = [
        { key: 'cardPlay', url: cardPlayUrl },
        { key: 'combatImpact', url: combatImpactUrl },
      ];

      for (const item of sfxToLoad) {
        const buffer = await this.fetchAndDecode(item.url);
        if (buffer) {
          this.sfxBuffers[item.key] = buffer;
        }
      }

    } catch (e) {
      console.error('Failed to initialize AudioManager:', e);
    }
  }

  updateVolumes() {
    const settings = SettingsService.getSettings();
    const musicVol = settings.musicEnabled ? settings.musicVolume : 0;
    
    if (this.musicSource) {
      this.musicSource.volume = musicVol * settings.masterVolume;
    }

    if (this.sfxGain && this.audioCtx) {
      const sfxVol = settings.sfxEnabled ? settings.sfxVolume : 0;
      this.sfxGain.gain.setTargetAtTime(sfxVol * settings.masterVolume, this.audioCtx.currentTime + 0.05, 0.1);
    }
  }

  // --- MUSIC ---
  private playMusic(url: string, context: 'battle') {
    this.currentMusicContext = context;
    if (!this.initialized) this.init();

    const settings = SettingsService.getSettings();
    if (!settings.musicEnabled) {
      this.stopMusic();
      return;
    }

    if (this.musicSource) {
      this.musicSource.pause();
      this.musicSource.src = '';
    }

    this.musicSource = new Audio(url);
    this.musicSource.loop = true;
    this.musicSource.volume = settings.musicVolume * settings.masterVolume;
    
    this.musicSource.play().then(() => {
      this.isMusicPlaying = true;
    }).catch(e => {
      if (e.name === 'AbortError') {
        // Ignored: caused by React strict mode rapid unmount/remount
        return;
      }
      console.warn('Browser prevented audio autoplay. Waiting for user interaction.', e);
      this.isMusicPlaying = false;
      
      const resumeOnInteraction = () => {
        if (this.currentMusicContext === context && !this.isMusicPlaying && settings.musicEnabled) {
           this.musicSource?.play().then(() => {
             this.isMusicPlaying = true;
           }).catch(() => {});
        }
        window.removeEventListener('click', resumeOnInteraction);
        window.removeEventListener('touchstart', resumeOnInteraction);
      };
      window.addEventListener('click', resumeOnInteraction);
      window.addEventListener('touchstart', resumeOnInteraction);
    });
  }

  playMenuMusic() {
    // Intentionally empty per user request "Home page must be SILENT."
    this.stopMusic(); 
  }

  playBattleMusic() {
    if (this.currentMusicContext === 'battle' && this.isMusicPlaying) return;
    this.playMusic(battleMusicUrl, 'battle');
  }

  resumeCurrentMusic() {
    // Only resume battle music if we were in battle context
    if (this.currentMusicContext === 'battle') {
      this.playBattleMusic();
    }
  }

  stopMusic() {
    if (this.musicSource) {
      this.musicSource.pause();
      this.musicSource.src = '';
      this.musicSource = null;
    }
    this.isMusicPlaying = false;
  }

  clearContext() {
    this.stopMusic();
    this.currentMusicContext = null;
  }

  // --- SFX ---
  private playBuffer(key: string, volScale: number = 1.0) {
    if (!this.initialized || !this.audioCtx || !this.sfxGain) return;
    const settings = SettingsService.getSettings();
    if (!settings.sfxEnabled) return;

    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const buffer = this.sfxBuffers[key];
    if (!buffer) return;

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioCtx.createGain();
    gainNode.gain.value = volScale;

    source.connect(gainNode);
    gainNode.connect(this.sfxGain);

    source.start(0);
  }

  playCardSelect() {
    this.init();
    this.playBuffer('cardPlay', 0.8);
  }
  
  playAttack() {
    this.init();
    this.playBuffer('combatImpact', 1.0);
    this.vibrate(30);
  }

  // All other sounds intentionally silenced per user request "Do NOT add annoying sounds for every tiny action."
  playConfirm() {}
  playInvalid() {}
  playDefend() {}
  playSpecial() {
    this.init();
    this.playBuffer('combatImpact', 1.0);
    this.vibrate([20, 20, 50]);
  }
  playHit() {}
  playTurnChange() {}
  playVictory() {
    this.stopMusic();
  }
  playDefeat() {
    this.stopMusic();
  }

  vibrate(pattern: number | number[]) {
    const settings = SettingsService.getSettings();
    if (settings.vibrationEnabled && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }
}

export const AudioManager = new AudioManagerImpl();
export const AudioService = AudioManager;
