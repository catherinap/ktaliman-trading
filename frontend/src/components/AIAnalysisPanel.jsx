import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BookmarkPlus, Bookmark } from "lucide-react";

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

// Unique cache key per panel
function cacheKey(type, data) {
  const sym = data?.symbol || data?.type || "";
  return `ai_cache_${type}_${sym}`;
}

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
  const key = cacheKey(type, data);

  // Restore from sessionStorage on mount
  const [state, setState] = useState(() => {
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.text && parsed.language === aiLanguage) return "done";
      }
    } catch {}
    return "idle";
  });

  const [text, setText] = useState(() => {
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) return JSON.parse(cached).text || "";
    } catch {}
    return "";
  });

  const [error, setError]             = useState("");
  const [lastLanguage, setLastLanguage] = useState(() => {
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) return JSON.parse(cached).language || null;
    } catch {}
    return null;
  });
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  const fetch_analysis = useCallback(async () => {
    setState("loading");
    setError("");
    setText("");
    setSaved(false);
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
      const newText = json.text || "";
      setText(newText);
      setLastLanguage(aiLanguage);
      setState("done");
      // Cache in sessionStorage
      try {
        sessionStorage.setItem(key, JSON.stringify({ text: newText, language: aiLanguage }));
      } catch {}
    } catch (err) {
      setError(err.message || "Unknown error");
      setState("error");
    }
  }, [type, aiLanguage, data, key]);

  const saveToNotes = useCallback(async () => {
    if (!text || saving) return;
    setSaving(true);
    try {
      const noteTitle = title
        || (data?.symbol ? `${data.symbol} — ${type}` : type);
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: noteTitle,
          content: text,
          metadata: {
            symbol:   data?.symbol   || null,
            sector:   data?.sector   || null,
            language: aiLanguage,
          },
        }),
      });
      setSaved(true);
    } catch {}
    setSaving(false);
  }, [text, type, title, data, aiLanguage, saving]);

  React.useEffect(() => {
    if (autoLoad) fetch_analysis();
  }, []);

  const languageChanged = state === "done" && lastLanguage !== null && lastLanguage !== aiLanguage;
  const panelTitle = title || (aiLanguage === "uk" ? "AI-Аналіз" : "AI Analysis");

  return (
    <section
      className="border border-zinc-800"
      style={fillHeight ? { display: "flex", flexDirection: "column", flex: 1 } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
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
            "border px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] transition ai-button",
            state === "loading"
              ? "cursor-not-allowed border-zinc-800 text-zinc-600"
              : languageChanged
              ? "text-blue-50 hover:bg-blue-300/20"
              : state === "done"
              ? "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-blue-300"
              : "border-blue-500 bg-blue-500/10 text-blue-50 hover:bg-blue-500/20",
          ].join(" ")}
        >
          {state === "loading"
            ? aiLanguage === "uk" ? "Аналізую..." : "Analysing..."
            : languageChanged
            ? aiLanguage === "uk" ? "Оновити мову" : "Update language"
            : state === "done"
            ? aiLanguage === "uk" ? "Оновити" : "Refresh"
            : aiLanguage === "uk" ? "Згенерувати" : "Generate"}
        </button>
      </div>

      {/* Body */}
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
          <>
            <div className="space-y-1 text-sm text-zinc-300">
              {renderAIText(text)}
            </div>
            {/* Save to Notes button */}
            <div className="mt-4 pt-3 flex items-center gap-2">
              <button
                onClick={saveToNotes}
                disabled={saving || saved}
                className="flex items-center gap-2 border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition hover:border-zinc-600 hover:text-zinc-200"
                style={{
                  color: saved ? '#4ade80' : '#71717a',
                  borderColor: saved ? 'rgba(74,222,128,0.3)' : undefined,
                  background: saved ? 'rgba(74,222,128,0.05)' : 'transparent',
                  cursor: saved ? 'default' : saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saved
                  ? <><Bookmark size={12} />{aiLanguage === "uk" ? "Збережено" : "Saved"}</>
                  : <><BookmarkPlus size={12} />{aiLanguage === "uk" ? "Зберегти в нотатки" : "Save to Notes"}</>
                }
              </button>

              {/* Clear button — скидає текст але не видаляє з нотаток */}
              <button
                onClick={() => {
                  setText('')
                  setState('idle')
                  setSaved(false)
                  try { sessionStorage.removeItem(key) } catch {}
                }}
                className="flex items-center gap-2 border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 transition"
                style={{ background: 'transparent', cursor: 'pointer' }}
              >
                {aiLanguage === "uk" ? "Очистити" : "Clear"}
              </button>
            </div>
          </>
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