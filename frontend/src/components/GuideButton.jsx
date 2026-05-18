/**
 * GuideButton — кнопка переходу в конкретну секцію гайду.
 *
 * Використання:
 *   import GuideButton from "./components/GuideButton"
 *   <GuideButton sectionKey="signals" openGuide={openGuide} />
 *
 * sectionKey — ключ секції в GuideView:
 *   "workspace" | "macro" | "cot" | "explorer" | "signals" | "seasonality" | "correlation"
 *
 * openGuide — функція з App(): (sectionKey) => void
 *   передається як prop вниз до компоненту де потрібна кнопка
 */

import { BookOpen } from "lucide-react"

export default function GuideButton({ sectionKey, openGuide, label }) {
  if (!openGuide) return null

  return (
    <button
      onClick={() => openGuide(sectionKey)}
      title={`Open Guide: ${sectionKey}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "6px 10px",
        borderRadius: "6px",
        cursor: "pointer",
        background: "rgba(59,130,246,0.07)",
        border: "1px solid var(--accent-border)",
        color: "rgba(219, 231, 255, 0.82)",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        transition: "all 0.15s",
        outline: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(59,130,246,0.14)"
        e.currentTarget.style.color = "var(--accent-color)"
        e.currentTarget.style.borderColor = "var(--accent-border)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(59,130,246,0.07)"
        e.currentTarget.style.color = "rgba(219, 231, 255, 0.82)"
        e.currentTarget.style.borderColor = "var(--accent-border)"
      }}
    >
      <BookOpen size={11} strokeWidth={1.8} />
      {label || "How to read this →"}
    </button>
  )
}
