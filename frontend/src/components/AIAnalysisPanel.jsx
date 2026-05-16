import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

function renderAIText(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-3" />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <span key={j} className="text-zinc-100 font-semibold">{part.slice(2, -2)}</span>;
      }
      return <span key={j}>{part}</span>;
    });
    return <div key={i} className="leading-7">{rendered}</div>;
  });
}

/**
 * AIAnalysisPanel
 * Props:
 *   type        — "asset" | "macro" | "signals"
 *   data        — object passed to the backend prompt builder
 *   aiLanguage  — "en" | "uk"
 *   title       — panel header string (optional)
 *   autoLoad    — if true, fetches on mount (default false)
 *   compact     — if true, uses smaller padding (default false)
 *   fillHeight  — if true, section stretches to fill parent flex height
 */
export default function AIAnalysisPanel({
  type,
  data,
  aiLanguage = "en",
  title,
  autoLoad = false,
  compact = false,
  fillHeight = false,
}) {
  const { t } = useTranslation();
  const [state, setState] = useState("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [lastLanguage, setLastLanguage] = useState(null);

  const fetch_analysis = useCallback(async () => {
    setState("loading");
    setError("");
    setText("");
    try {
      const res = await fetch("/api/gpt/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, language: aiLanguage, data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setText(json.text || "");
      setLastLanguage(aiLanguage);
      setState("done");
    } catch (err) {
      setError(err.message || "Unknown error");
      setState("error");
    }
  }, [type, aiLanguage, data]);

  React.useEffect(() => {
    if (autoLoad) fetch_analysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const languageChanged = state === "done" && lastLanguage !== null && lastLanguage !== aiLanguage;
  const panelTitle = title || (aiLanguage === "uk" ? "AI-Аналіз" : "AI Analysis");

  return (
    <section
      className="border border-zinc-800 bg-[#0a0a0a]"
      style={fillHeight ? { display: "flex", flexDirection: "column", flex: 1 } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
            {panelTitle}
          </span>
          {lastLanguage && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              · {lastLanguage === "uk" ? "uk" : "en"}
            </span>
          )}
        </div>
        <button
          onClick={fetch_analysis}
          disabled={state === "loading"}
          className={[
            "border px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] transition",
            state === "loading"
              ? "cursor-not-allowed border-zinc-800 text-zinc-600"
              : languageChanged
              ? "border-violet-500/60 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
              : state === "done"
              ? "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              : "border-violet-600/50 bg-violet-600/10 text-violet-300 hover:bg-violet-600/20",
          ].join(" ")}
        >
          {state === "loading"
            ? aiLanguage === "uk" ? "Аналізую..." : "Analysing..."
            : languageChanged
            ? aiLanguage === "uk" ? "Оновити мову" : "Update language"
            : state === "done"
            ? aiLanguage === "uk" ? "Оновити" : "Refresh"
            : aiLanguage === "uk" ? "Згенерувати аналіз" : "Generate analysis"}
        </button>
      </div>

      {/* Body — fills remaining height when fillHeight=true */}
      <div
        className={compact ? "px-4 py-3" : "px-4 py-4"}
        style={fillHeight ? { flex: 1 } : {}}
      >
        {state === "idle" && (
          <p className="text-sm text-zinc-600">
            {aiLanguage === "uk"
              ? "Натисни кнопку щоб отримати AI-інтерпретацію поточних даних."
              : "Press the button to get an AI interpretation of current data."}
          </p>
        )}
        {state === "loading" && (
          <div className="space-y-2.5">
            {[100, 88, 75, 60].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-zinc-800" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
        {state === "error" && (
          <div className="border border-rose-900/50 bg-rose-950/20 p-3 text-sm text-rose-400">
            {aiLanguage === "uk" ? "Помилка: " : "Error: "}{error}
          </div>
        )}
        {state === "done" && text && (
          <div className="space-y-1 text-sm text-zinc-300">
            {renderAIText(text)}
          </div>
        )}
        {languageChanged && state === "done" && (
          <div className="mt-3 border-t border-zinc-900 pt-3 text-[11px] text-zinc-600">
            {aiLanguage === "uk"
              ? "Мову аналізу змінено. Натисни «Оновити мову» щоб отримати нову версію."
              : "Analysis language changed. Click 'Update language' to regenerate."}
          </div>
        )}
      </div>
    </section>
  );
}