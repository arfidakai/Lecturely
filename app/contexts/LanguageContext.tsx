"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { translations, Locale } from "../lib/translations";
import { supabase } from "../lib/supabase"; // sesuaikan path supabase client kamu

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations["en"];
};

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: translations["en"],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
 

  // Load bahasa dari Supabase user_metadata saat mount
  useEffect(() => {
    const loadLocale = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const savedLocale = user?.user_metadata?.locale as Locale;
      if (savedLocale === "en" || savedLocale === "id") {
        setLocaleState(savedLocale);
      }
    };
    loadLocale();
  }, []);

  // Simpan ke Supabase user_metadata saat ganti bahasa
  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    await supabase.auth.updateUser({
      data: { locale: newLocale },
    });
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t: translations[locale],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
