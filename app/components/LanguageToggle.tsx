"use client";
import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "id" : "en")}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-xs font-semibold text-purple-600 border border-purple-100"
    >
      <span>{locale === "en" ? "🇮🇩" : "🇬🇧"}</span>
      <span>{locale === "en" ? "ID" : "EN"}</span>
    </button>
  );
}
