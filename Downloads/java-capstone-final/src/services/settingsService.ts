export type LanguageCode = 'en' | 'te' | 'ta';

export interface GameSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  vibrationEnabled: boolean;
  battleAnimationsEnabled: boolean;
  masterVolume: number; // 0.0 to 1.0
  musicVolume: number; // 0.0 to 1.0
  sfxVolume: number; // 0.0 to 1.0
  language: LanguageCode;
}

const DEFAULT_SETTINGS: GameSettings = {
  musicEnabled: true,
  sfxEnabled: true,
  vibrationEnabled: true,
  battleAnimationsEnabled: true,
  masterVolume: 1.0,
  musicVolume: 0.7,
  sfxVolume: 1.0,
  language: 'en',
};

const SETTINGS_KEY = 'spire_deck_duel_settings';
export const LANGUAGE_CHANGE_EVENT = 'sdd_language_change';

export class SettingsService {
  private static settings: GameSettings | null = null;

  /**
   * Load settings from localStorage or return defaults
   */
  static getSettings(): GameSettings {
    if (this.settings) return this.settings;

    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    } catch (e) {
      console.warn('Failed to load settings', e);
      this.settings = { ...DEFAULT_SETTINGS };
    }

    return this.settings!;
  }

  /**
   * Save settings to localStorage
   */
  static saveSettings(newSettings: Partial<GameSettings>): GameSettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
    
    if (newSettings.language && newSettings.language !== current.language) {
      window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
    }
    
    this.settings = updated;
    return updated as GameSettings;
  }
}
