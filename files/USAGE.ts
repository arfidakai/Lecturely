// ============================================================
// CARA PAKAI — contoh di Homepage.tsx
// ============================================================

// 1. Import hook
import { useLanguage } from "@/contexts/LanguageContext";

// 2. Di dalam component, tambahkan:
const { t } = useLanguage();

// 3. Ganti semua hardcode text dengan t.xxx

// SEBELUM:
// <h1>Good Morning</h1>
// <p>Ready to record knowledge?</p>
// <button>Start Recording</button>
// <h2>Today's Subjects</h2>
// <h2>Recent</h2>

// SESUDAH:
// <h1>{t.greeting.morning}</h1>          ← atau pakai fungsi getGreeting di bawah
// <p>{t.greeting.subtitle}</p>
// <button>{t.home.startRecording}</button>
// <h2>{t.home.todaySubjects}</h2>
// <h2>{t.home.recent}</h2>

// ============================================================
// GREETING dengan waktu — ganti fungsi getGreeting jadi ini:
// ============================================================

import { useLanguage } from "@/contexts/LanguageContext";

const useGreeting = () => {
  const { t } = useLanguage();
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return { greeting: t.greeting.morning, emoji: "☀️" };
  if (hour >= 12 && hour < 17) return { greeting: t.greeting.afternoon, emoji: "🌤️" };
  if (hour >= 17 && hour < 21) return { greeting: t.greeting.evening, emoji: "🌆" };
  return { greeting: t.greeting.night, emoji: "🌙" };
};

// Pakai di component:
// const { greeting, emoji } = useGreeting();

// ============================================================
// UPCOMING label — ganti hardcode "Tomorrow" / day name:
// ============================================================

// SEBELUM:
// const dayLabel = minDiff === 1 ? "Tomorrow" : dayNames[nearestDayIndex];

// SESUDAH:
// const { t } = useLanguage();
// const dayLabel = minDiff === 1 ? t.home.tomorrow : dayNames[nearestDayIndex];
// (day names tetap bahasa Inggris karena dari schedule_days di DB)

// ============================================================
// LANGUAGE TOGGLE — taruh di header settings page atau di header homepage
// ============================================================

import LanguageToggle from "@/components/LanguageToggle";

// Di JSX header:
// <LanguageToggle />
// Tombolnya otomatis switch EN ↔ ID dan simpan ke Supabase
