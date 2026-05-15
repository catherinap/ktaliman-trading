import React, { useState, useRef, useEffect } from "react"

/**
 * CustomSelect — красивий кастомний dropdown
 * Замінює нативний <select> для Settings
 *
 * Props:
 *   value      — поточне значення
 *   onChange   — callback(value)
 *   options    — [{ value, label }]
 *   disabled   — boolean
 *   minWidth   — string, default "260px"
 *   placeholder — string
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  disabled = false,
  minWidth = "260px",
  placeholder = "Select...",
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: "relative", minWidth, userSelect: "none" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "9px 12px",
          background: open
            ? "rgba(14, 24, 52, 0.95)"
            : "rgba(10, 16, 40, 0.85)",
          border: `1px solid ${open ? "rgba(59,130,246,0.45)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: open ? "10px 10px 0 0" : "10px",
          color: disabled ? "rgba(148,163,184,0.4)" : "#e2e8f0",
          fontSize: "14px",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color 0.15s, background 0.15s",
          outline: "none",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>{selected?.label || placeholder}</span>
        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
            color: "rgba(148,163,184,0.5)",
          }}
        >
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "rgba(8, 14, 35, 0.98)",
          border: "1px solid rgba(59,130,246,0.3)",
          borderTop: "1px solid rgba(59,130,246,0.15)",
          borderRadius: "0 0 10px 10px",
          overflow: "hidden",
          boxShadow: "0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.1)",
          backdropFilter: "blur(20px)",
          maxHeight: "280px",
          overflowY: "auto",
        }}>
          {options.map((opt) => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                style={{
                  width: "100%",
                  display: "block",
                  textAlign: "left",
                  padding: "9px 12px",
                  fontSize: "13px",
                  color: isActive ? "#93c5fd" : "rgba(226,232,240,0.85)",
                  background: isActive
                    ? "rgba(59,130,246,0.15)"
                    : "transparent",
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "background 0.1s, color 0.1s",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent"
                }}
              >
                {isActive && (
                  <span style={{ marginRight: "8px", color: "#3b82f6" }}>✓</span>
                )}
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
