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
        padding: "4px 10px",
        borderRadius: "6px",
        cursor: "pointer",
        background: "rgba(59,130,246,0.07)",
        border: "1px solid rgba(59,130,246,0.18)",
        color: "rgba(147,197,253,0.65)",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        transition: "all 0.15s",
        outline: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(59,130,246,0.14)"
        e.currentTarget.style.color = "#93c5fd"
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(59,130,246,0.07)"
        e.currentTarget.style.color = "rgba(147,197,253,0.65)"
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.18)"
      }}
    >
      <span style={{ fontSize: "11px" }}>📖</span>
      {label || "How to read this →"}
    </button>
  )
}
