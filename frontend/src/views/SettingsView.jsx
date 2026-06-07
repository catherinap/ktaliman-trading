import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import CustomSelect from "../components/CustomSelect";
import LanguageSettings from "../components/LanguageSettings";
import { Panel, cls, TIMEZONES } from "../App";

function AlertTestButton() {
  const [email, setEmail]   = useState("")
  const [status, setStatus] = useState(null) // null | "sending" | "ok" | "error"
  const [msg, setMsg]       = useState("")
 
  const sendTest = () => {
    if (!email) return
    setStatus("sending")
    setMsg("")
    fetch("/api/alerts/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_enabled: true, email_to: email }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setStatus("ok")
          setMsg(json.message || "Test email sent!")
        } else {
          setStatus("error")
          setMsg(json.error || "Failed")
        }
      })
      .catch((e) => { setStatus("error"); setMsg(String(e)) })
  }
 
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="recipient@email.com"
          className="border border-zinc-800 bg-[#080808] px-3 py-2 text-sm text-zinc-200 outline-none min-w-[220px] placeholder:text-zinc-700"
        />
        <button
          onClick={sendTest}
          disabled={!email || status === "sending"}
          className={cls(
            "border px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition",
            email && status !== "sending"
              ? "border-sky-500/50 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
              : "cursor-not-allowed border-zinc-800 text-zinc-600"
          )}
        >
          {status === "sending" ? "Sending..." : "Send Test"}
        </button>
      </div>
      {msg && (
        <div className={cls("text-xs", status === "ok" ? "text-emerald-400" : "text-rose-400")}>
          {msg}
        </div>
      )}
    </div>
  )
}

export default function SettingsView({
  uiLanguage,
  aiLanguage,
  syncAiWithUi,
  timezone,
  onChangeUiLanguage,
  onChangeAiLanguage,
  onToggleSyncAiWithUi,
  onChangeTimezone,
}) {
  const { t } = useTranslation();
  
 
  return (
    
    <>
      <div className="settings-panel">
        <Panel title={t("settings.title")}>
      <div className="space-y-6 text-sm text-zinc-300">
        <LanguageSettings
          uiLanguage={uiLanguage}
          aiLanguage={aiLanguage}
          syncAiWithUi={syncAiWithUi}
          onChangeUiLanguage={onChangeUiLanguage}
          onChangeAiLanguage={onChangeAiLanguage}
          onToggleSyncAiWithUi={onToggleSyncAiWithUi} />

        {/* Timezone selector */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">
            Display Timezone
          </div>
          <CustomSelect
            value={timezone}
            onChange={onChangeTimezone}
            options={TIMEZONES}
            minWidth="280px" />
          <div className="text-xs text-zinc-600">
            Used for displaying timestamps in Update tab and scheduler times.
          </div>
        </div>

        {/* Email Alerts */}
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">
            Email Alerts (Test)
          </div>
          <AlertTestButton />
        </div>
      </div>
    </Panel></div></>
  );
}
