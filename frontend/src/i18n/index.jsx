import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./translations/en.json";
import uk from "./translations/uk.json";

const resources = {
  en: { translation: en },
  uk: { translation: uk },
};

// Read saved language from localStorage so the choice persists across
// reloads, restarts, and crashes. Falls back to English only if nothing saved.
function getSavedLanguage() {
  try {
    const direct = localStorage.getItem("ktaliman-ui-language");
    if (direct === "en" || direct === "uk") return direct;
    const settings = localStorage.getItem("ktaliman-app-settings");
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.uiLanguage === "en" || parsed.uiLanguage === "uk") {
        return parsed.uiLanguage;
      }
    }
  } catch (err) {
    console.error("Failed to read saved language", err);
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uk: { translation: uk },
  },
  lng: getSavedLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Persist whenever language changes
i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem("ktaliman-ui-language", lng);
  } catch (err) {
    console.error("Failed to persist language", err);
  }
});

export default i18n;