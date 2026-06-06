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

  // ── Email alert language (variant C) — stored on backend ──
  const [emailLang, setEmailLang] = React.useState("sync")

  React.useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (s?.email_language) setEmailLang(s.email_language) })
      .catch(() => {})
  }, [])

  const handleEmailLangChange = (code) => {
    setEmailLang(code)
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_language: code }),
    }).catch(() => {})
  }

  // When UI language changes, also persist it to backend so "sync" mode works
  const handleUiChange = (code) => {
    onChangeUiLanguage(code)
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ui_language: code }),
    }).catch(() => {})
  }

  const EMAIL_LANG_OPTIONS = [
    { value: "sync", label: t("settings.emailLangSync") },
    { value: "uk",   label: t("settings.emailLangUk") },
    { value: "en",   label: t("settings.emailLangEn") },
  ]

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
          onChange={handleUiChange}
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

      {/* ── Email alert language ── */}
      <div className="space-y-2 pt-2">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          {t("settings.emailLanguage")}
        </div>
        <CustomSelect
          value={emailLang}
          onChange={handleEmailLangChange}
          options={EMAIL_LANG_OPTIONS}
          minWidth="100%"
        />
      </div>
    </section>
  )
}