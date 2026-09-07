import { useState, useEffect, useCallback } from 'react';
import { SettingsService, LANGUAGE_CHANGE_EVENT, type LanguageCode } from '../services/settingsService';

// Fallback to English if translation is missing
const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Shared
    'app.loading': 'Checking session...',
    'btn.back': 'Back',
    'btn.close': 'Close',

    // Settings
    'settings.title': 'Settings',
    'settings.audio': 'Audio',
    'settings.music': 'Music',
    'settings.sfx': 'Sound Effects',
    'settings.masterVol': 'Master Volume',
    'settings.musicVol': 'Music Volume',
    'settings.sfxVol': 'SFX Volume',
    'settings.gameplay': 'Gameplay',
    'settings.vibration': 'Vibration',
    'settings.animations': 'Battle Animations',
    'settings.language': 'Language',
    'settings.account': 'Account',
    'settings.profile': 'Open Profile',
    'settings.signout': 'Sign Out',
    'settings.other': 'Other',
    'settings.help': 'Help & Support',
    'settings.privacy': 'Privacy Policy',
    'settings.terms': 'Terms of Service',
    'settings.about': 'About',
    'settings.version': 'Version',
    
    // Login
    'login.title': 'Spire Deck Duel',
    'login.subtitle': 'Enter the Arcane Arena',
    'login.google': 'Continue with Google',
    'login.guest': 'Play as Guest',
    'login.email.signin': 'Sign In with Email',
    'login.email.signup': 'Create Account',
    'login.email.placeholder': 'Email Address',
    'login.password.placeholder': 'Password',
    'login.error.auth': 'Authentication failed. Please try again.',
    'login.guest.warning': 'Guest accounts may be lost if you clear your browser data.',
    'login.guest.continue': 'Continue as Guest',

    // Home
    'home.play': 'Play',
    'home.vs_computer': 'VS Computer',
    'home.online_pvp': 'Online PvP',
    'home.collection': 'Collection',
    'home.shop': 'Shop',
    'home.rewards': 'Rewards',
    
    // Profile
    'profile.title': 'Player Profile',
    'profile.edit': 'Edit Profile',
    'profile.save': 'Save Changes',
    'profile.username': 'Username',
    'profile.displayName': 'Display Name',
    'profile.memberSince': 'Member Since',
    'profile.stats': 'Statistics',
    'profile.matches': 'Matches Played',
    'profile.wins': 'Wins',
    'profile.winRate': 'Win Rate',
    
    // Battle HUD
    'battle.player_turn': 'Your Turn',
    'battle.opponent_turn': 'Opponent Turn',
    'battle.waiting': 'Waiting for opponent...',
    'battle.hp': 'HP',
    'battle.energy': 'Energy',
    'battle.end_turn': 'End Turn',
    'battle.victory': 'VICTORY',
    'battle.defeat': 'DEFEAT',
    'battle.draw': 'DRAW',
    'battle.return_home': 'Return to Menu',

    // Room
    'room.create': 'Create Room',
    'room.join': 'Join Room',
    'room.code': 'Room Code',
    'room.scan': 'Scan QR',
    'room.waiting': 'Waiting for Player 2...',
    'room.start': 'Start Battle',

    // Misc
    'misc.placeholder': 'This feature will be implemented in a future step.',
  },
  te: {
    // Shared
    'app.loading': 'సెషన్ తనిఖీ చేయబడుతోంది...',
    'btn.back': 'వెనుకకు',
    'btn.close': 'మూసివేయి',

    // Settings
    'settings.title': 'సెట్టింగులు',
    'settings.audio': 'ఆడియో',
    'settings.music': 'సంగీతం',
    'settings.sfx': 'సౌండ్ ఎఫెక్ట్స్',
    'settings.masterVol': 'మాస్టర్ వాల్యూమ్',
    'settings.musicVol': 'సంగీత వాల్యూమ్',
    'settings.sfxVol': 'SFX వాల్యూమ్',
    'settings.gameplay': 'గేమ్ ప్లే',
    'settings.vibration': 'వైబ్రేషన్',
    'settings.animations': 'యుద్ధ యానిమేషన్లు',
    'settings.language': 'భాష',
    'settings.account': 'ఖాతా',
    'settings.profile': 'ప్రొఫైల్ తెరవండి',
    'settings.signout': 'సైన్ అవుట్',
    'settings.other': 'ఇతర',
    'settings.help': 'సహాయం & మద్దతు',
    'settings.privacy': 'గోప్యతా విధానం',
    'settings.terms': 'సేవా నిబంధనలు',
    'settings.about': 'గురించి',
    'settings.version': 'వెర్షన్',
    
    // Login
    'login.title': 'స్పైర్ డెక్ డ్యూయల్',
    'login.subtitle': 'ఆర్కేన్ అరేనాలోకి ప్రవేశించండి',
    'login.google': 'Google తో కొనసాగండి',
    'login.guest': 'అతిథిగా ఆడండి',
    'login.email.signin': 'ఈమెయిల్‌తో సైన్ ఇన్ చేయండి',
    'login.email.signup': 'ఖాతాను సృష్టించండి',
    'login.email.placeholder': 'ఈమెయిల్ చిరునామా',
    'login.password.placeholder': 'పాస్వర్డ్',
    'login.error.auth': 'ప్రామాణీకరణ విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    'login.guest.warning': 'మీరు బ్రౌజర్ డేటాను క్లియర్ చేస్తే గెస్ట్ ఖాతాలు కోల్పోవచ్చు.',
    'login.guest.continue': 'అతిథిగా కొనసాగండి',

    // Home
    'home.play': 'ఆడండి',
    'home.vs_computer': 'కంప్యూటర్‌తో ఆడు',
    'home.online_pvp': 'ఆన్‌లైన్ PvP',
    'home.collection': 'సేకరణ',
    'home.shop': 'షాప్',
    'home.rewards': 'బహుమతులు',
    
    // Profile
    'profile.title': 'ఆటగాడి ప్రొఫైల్',
    'profile.edit': 'ప్రొఫైల్ సవరించండి',
    'profile.save': 'మార్పులను సేవ్ చేయండి',
    'profile.username': 'వినియోగదారు పేరు',
    'profile.displayName': 'ప్రదర్శన పేరు',
    'profile.memberSince': 'సభ్యులు',
    'profile.stats': 'గణాంకాలు',
    'profile.matches': 'ఆడిన మ్యాచ్‌లు',
    'profile.wins': 'విజయాలు',
    'profile.winRate': 'విజయ రేటు',
    
    // Battle HUD
    'battle.player_turn': 'మీ వంతు',
    'battle.opponent_turn': 'ప్రత్యర్థి వంతు',
    'battle.waiting': 'ప్రత్యర్థి కోసం వేచి ఉంది...',
    'battle.hp': 'HP',
    'battle.energy': 'శక్తి',
    'battle.end_turn': 'టర్న్ ముగించు',
    'battle.victory': 'విజయం',
    'battle.defeat': 'అపజయం',
    'battle.draw': 'డ్రా',
    'battle.return_home': 'మెనూకి తిరిగి వెళ్ళు',

    // Room
    'room.create': 'గదిని సృష్టించండి',
    'room.join': 'గదిలో చేరండి',
    'room.code': 'గది కోడ్',
    'room.scan': 'QR స్కాన్ చేయండి',
    'room.waiting': 'ప్లేయర్ 2 కోసం వేచి ఉంది...',
    'room.start': 'యుద్ధం ప్రారంభించండి',

    // Misc
    'misc.placeholder': 'ఈ ఫీచర్ భవిష్యత్తు దశలో అమలు చేయబడుతుంది.',
  },
  ta: {
    // Shared
    'app.loading': 'அமர்வு சரிபார்க்கப்படுகிறது...',
    'btn.back': 'பின்செல்',
    'btn.close': 'மூடு',

    // Settings
    'settings.title': 'அமைப்புகள்',
    'settings.audio': 'ஆடியோ',
    'settings.music': 'இசை',
    'settings.sfx': 'ஒலி விளைவுகள்',
    'settings.masterVol': 'முக்கிய ஒலி',
    'settings.musicVol': 'இசை ஒலி',
    'settings.sfxVol': 'SFX ஒலி',
    'settings.gameplay': 'விளையாட்டு',
    'settings.vibration': 'அதிர்வு',
    'settings.animations': 'போர் அனிமேஷன்கள்',
    'settings.language': 'மொழி',
    'settings.account': 'கணக்கு',
    'settings.profile': 'சுயவிவரம் திற',
    'settings.signout': 'வெளியேறு',
    'settings.other': 'மற்றவை',
    'settings.help': 'உதவி & ஆதரவு',
    'settings.privacy': 'தனியுரிமைக் கொள்கை',
    'settings.terms': 'சேவை விதிமுறைகள்',
    'settings.about': 'பற்றி',
    'settings.version': 'பதிப்பு',
    
    // Login
    'login.title': 'ஸ்பைர் டெக் டியூவல்',
    'login.subtitle': 'ஆர்கேன் அரங்கில் நுழைக',
    'login.google': 'Google உடன் தொடரவும்',
    'login.guest': 'விருந்தினராக விளையாடு',
    'login.email.signin': 'மின்னஞ்சலுடன் உள்நுழைக',
    'login.email.signup': 'கணக்கை உருவாக்கு',
    'login.email.placeholder': 'மின்னஞ்சல் முகவரி',
    'login.password.placeholder': 'கடவுச்சொல்',
    'login.error.auth': 'அங்கீகாரம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
    'login.guest.warning': 'உலாவி தரவை அழித்தால் விருந்தினர் கணக்குகள் இழக்கப்படலாம்.',
    'login.guest.continue': 'விருந்தினராக தொடரவும்',

    // Home
    'home.play': 'விளையாடு',
    'home.vs_computer': 'கணினியுடன் விளையாடு',
    'home.online_pvp': 'ஆன்லைன் PvP',
    'home.collection': 'சேகரிப்பு',
    'home.shop': 'கடை',
    'home.rewards': 'வெகுமதிகள்',
    
    // Profile
    'profile.title': 'வீரர் சுயவிவரம்',
    'profile.edit': 'சுயவிவரத்தைத் திருத்து',
    'profile.save': 'மாற்றங்களைச் சேமி',
    'profile.username': 'பயனர்பெயர்',
    'profile.displayName': 'காட்சி பெயர்',
    'profile.memberSince': 'உறுப்பினர்',
    'profile.stats': 'புள்ளிவிவரங்கள்',
    'profile.matches': 'விளையாடிய போட்டிகள்',
    'profile.wins': 'வெற்றிகள்',
    'profile.winRate': 'வெற்றி விகிதம்',
    
    // Battle HUD
    'battle.player_turn': 'உங்கள் முறை',
    'battle.opponent_turn': 'எதிராளியின் முறை',
    'battle.waiting': 'எதிராளியிடம் காத்திருக்கிறது...',
    'battle.hp': 'HP',
    'battle.energy': 'ஆற்றல்',
    'battle.end_turn': 'முறையை முடி',
    'battle.victory': 'வெற்றி',
    'battle.defeat': 'தோல்வி',
    'battle.draw': 'சமம்',
    'battle.return_home': 'மெனுவுக்குத் திரும்பு',

    // Room
    'room.create': 'அறையை உருவாக்கு',
    'room.join': 'அறையில் சேரவும்',
    'room.code': 'அறை குறியீடு',
    'room.scan': 'QR ஸ்கேன்',
    'room.waiting': 'வீரர் 2 க்காக காத்திருக்கிறது...',
    'room.start': 'போரைத் தொடங்கு',

    // Misc
    'misc.placeholder': 'இந்த அம்சம் எதிர்காலத்தில் செயல்படுத்தப்படும்.',
  }
};

export function useTranslation() {
  const [lang, setLang] = useState<LanguageCode>(SettingsService.getSettings().language || 'en');

  useEffect(() => {
    const handleLangChange = () => {
      setLang(SettingsService.getSettings().language);
    };
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLangChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLangChange);
  }, []);

  const t = useCallback((key: string): string => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || key;
  }, [lang]);

  return { t, lang };
}
