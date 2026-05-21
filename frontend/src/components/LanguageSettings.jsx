import React from "react"
import { useTranslation } from "react-i18next"
import CustomSelect from "./CustomSelect"

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "uk", label: "Українська" },
]

export default function LanguageSettings({
  uiLanguage,
  aiLanguage,
  syncAiWithUi,
  onChangeUiLanguage,
  onChangeAiLanguage,
  onToggleSyncAiWithUi,
}) {
  const { t } = useTranslation()

  return (
    <section className="space-y-4 padding-added">
      <div>
        <h2 className="text-sm uppercase tracking-[0.22em] text-zinc-400">
          {t("settings.language.title")}
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          {t("settings.language.subtitle")}
        </p>
      </div>

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          {t("settings.language.interface")}
        </div>
        <CustomSelect
          value={uiLanguage}
          onChange={onChangeUiLanguage}
          options={LANGUAGES}
          minWidth="100%"
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          {t("settings.language.ai")}
        </div>
        <CustomSelect
          value={aiLanguage}
          onChange={onChangeAiLanguage}
          options={LANGUAGES}
          disabled={syncAiWithUi}
          minWidth="100%"
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
        <input
          type="checkbox"
          checked={syncAiWithUi}
          onChange={(e) => onToggleSyncAiWithUi(e.target.checked)}
          style={{ accentColor: "#3b82f6" }}
        />
        <span>{t("settings.language.sync")}</span>
      </label>
    </section>
  )
}
