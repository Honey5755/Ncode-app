import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'hi' | 'gu';
const KEY = 'ncode_lang';

let lang: Lang = 'en';
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

// Saved choice loads asynchronously (SecureStore); the UI re-renders when it arrives.
SecureStore.getItemAsync(KEY)
  .then((v) => {
    if (v === 'hi' || v === 'gu') {
      lang = v;
      emit();
    }
  })
  .catch(() => {});

export function setLang(l: Lang) {
  lang = l;
  SecureStore.setItemAsync(KEY, l).catch(() => {});
  emit();
}

const D: Record<string, [string, string, string]> = {
  // key: [English, Hindi, Gujarati]
  attendance: ['Attendance', 'उपस्थिति', 'હાજરી'],
  fieldVisits: ['Field Visits', 'फ़ील्ड विज़िट', 'ફીલ્ડ વિઝિટ'],
  history: ['History', 'इतिहास', 'ઇતિહાસ'],
  profile: ['Profile', 'प्रोफ़ाइल', 'પ્રોફાઇલ'],
  offDuty: ['Off duty', 'ड्यूटी बंद', 'ડ્યુટી બંધ'],
  onDuty: ['On duty', 'ड्यूटी पर', 'ડ્યુટી પર'],
  thisMonth: ['This month', 'इस महीने', 'આ મહિને'],
  daysPresent: ['Days Present', 'उपस्थित दिन', 'હાજર દિવસો'],
  leaveBalance: ['Leave balance', 'छुट्टी शेष', 'રજા બાકી'],
  daysAvailable: ['Days Available', 'उपलब्ध दिन', 'ઉપલબ્ધ દિવસો'],
  lastPunch: ['Last punch', 'अंतिम पंच', 'છેલ્લી પંચ'],
  none: ['None', 'कोई नहीं', 'કોઈ નહીં'],
  myWork: ['My Work', 'मेरा काम', 'મારું કામ'],
  myHr: ['My HR', 'मेरा HR', 'મારું HR'],
  updates: ['Updates', 'अपडेट', 'અપડેટ'],
  account: ['Account', 'खाता', 'ખાતું'],
  viewAttendance: ['View Attendance', 'उपस्थिति देखें', 'હાજરી જુઓ'],
  requestLeave: ['Request Leave', 'छुट्टी का अनुरोध', 'રજાની વિનંતી'],
  holidayList: ['Holiday List', 'अवकाश सूची', 'રજાઓની યાદી'],
  notes: ['Notes', 'नोट्स', 'નોંધો'],
  myRoute: ['My Route', 'मेरा मार्ग', 'મારો માર્ગ'],
  hrProfile: ['HR Profile', 'HR प्रोफ़ाइल', 'HR પ્રોફાઇલ'],
  myDocuments: ['My Documents', 'मेरे दस्तावेज़', 'મારા દસ્તાવેજો'],
  announcements: ['Announcements', 'घोषणाएँ', 'જાહેરાતો'],
  password: ['Password', 'पासवर्ड', 'પાસવર્ડ'],
  language: ['Language', 'भाषा', 'ભાષા'],
  punchReminder: ['Punch Reminder', 'पंच रिमाइंडर', 'પંચ રિમાઇન્ડર'],
  logout: ['Logout', 'लॉगआउट', 'લૉગઆઉટ'],
  save: ['Save', 'सहेजें', 'સાચવો'],
  back: ['Back', 'वापस', 'પાછા'],
  chooseLanguage: ['Choose Display Language', 'भाषा चुनें', 'ભાષા પસંદ કરો'],
  todaysShift: ["Today's Shift Activity", 'आज की शिफ्ट गतिविधि', 'આજની શિફ્ટ પ્રવૃત્તિ'],
  loggedHours: ['Logged Hours', 'दर्ज घंटे', 'નોંધાયેલા કલાકો'],
  shifts: ['Shifts', 'शिफ्ट', 'શિફ્ટ'],
  gpsDrops: ['GPS Drops', 'GPS ड्रॉप', 'GPS ડ્રોપ'],
  fieldNotes: ["Today's Field Notes & Shift Log", 'आज के फ़ील्ड नोट्स', 'આજની ફીલ્ડ નોંધો'],
  saveNotes: ['Save Notes', 'नोट्स सहेजें', 'નોંધો સાચવો'],
  recentShifts: ['Recent Attendance Shifts', 'हाल की उपस्थिति', 'તાજેતરની હાજરી'],
  viewAll: ['View All History →', 'पूरा इतिहास →', 'આખો ઇતિહાસ →'],
};

export function useT() {
  const current = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => lang,
  );
  const idx = current === 'hi' ? 1 : current === 'gu' ? 2 : 0;
  return { t: (k: string) => D[k]?.[idx] ?? D[k]?.[0] ?? k, lang: current };
}
