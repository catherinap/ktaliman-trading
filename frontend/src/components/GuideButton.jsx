/**
 * GuideButton — кнопка переходу в конкретну секцію гайду.
 */

import { BookOpen } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function GuideButton({ sectionKey, openGuide, label }) {
  const { t } = useTranslation()
  if (!openGuide) return null

  return (
    <button
      onClick={() => openGuide(sectionKey)}
      title={t("ui.openGuide", { section: sectionKey })}
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
      {label || t("ui.howToReadThis")}
    </button>
  )
}