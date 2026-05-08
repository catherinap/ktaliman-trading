import React from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "uk", label: "Українська" }
];

export default function LanguageSettings({
  uiLanguage,
  aiLanguage,
  syncAiWithUi,
  onChangeUiLanguage,
  onChangeAiLanguage,
  onToggleSyncAiWithUi
}) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm uppercase tracking-[0.22em] text-zinc-400">
          {t("settings.language.title")}
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          {t("settings.language.subtitle")}
        </p>
      </div>

      <label className="block space-y-2">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          {t("settings.language.interface")}
        </div>
        <select
          value={uiLanguage}
          onChange={(e) => onChangeUiLanguage(e.target.value)}
          className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
        >
          {LANGUAGES.map((lng) => (
            <option key={lng.code} value={lng.code}>
              {lng.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          {t("settings.language.ai")}
        </div>
        <select
          value={aiLanguage}
          onChange={(e) => onChangeAiLanguage(e.target.value)}
          disabled={syncAiWithUi}
          className="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none disabled:opacity-50"
        >
          {LANGUAGES.map((lng) => (
            <option key={lng.code} value={lng.code}>
              {lng.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={syncAiWithUi}
          onChange={(e) => onToggleSyncAiWithUi(e.target.checked)}
        />
        <span>{t("settings.language.sync")}</span>
      </label>
    </section>
  );
}