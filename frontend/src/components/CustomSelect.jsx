import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

export default function CustomSelect({
  value,
  onChange,
  options = [],
  disabled = false,
  minWidth = "260px",
  placeholder = "Select...",
}) {
  const [open, setOpen]       = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)

  const selected = options.find((o) => o.value === value)

  // Calculate dropdown position when opening
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropPos({
        top:   rect.bottom,
        left:  rect.left,
        width: rect.width,
      })
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Close on Escape or scroll
  useEffect(() => {
    if (!open) return
    const onKey    = (e) => { if (e.key === "Escape") setOpen(false) }
    const onScroll = (e) => {
  // не закривати якщо скролять всередині самого dropdown
    const portal = document.querySelector('[data-custom-select-portal]')
    if (portal && portal.contains(e.target)) return
    setOpen(false)
  }
  window.addEventListener("scroll", onScroll, true)
    return () => {
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [open])

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
  }

  const dropdown = (
    <div
      data-custom-select-portal="true"
      style={{
        position: "fixed",
        top:   dropPos.top,
        left:  dropPos.left,
        width: dropPos.width,
        zIndex: 99999,
        background: "rgba(12, 21, 52, 0.98)",
        border: "1px solid rgba(59,130,246,0.3)",
        borderTop: "1px solid rgba(59,130,246,0.12)",
        borderRadius: "0 0 10px 10px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
        maxHeight: "260px",
        overflowY: "auto",
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.value) }}
            style={{
              width: "100%",
              display: "block",
              textAlign: "left",
              padding: "9px 12px",
              fontSize: "13px",
              color: isActive ? "#93c5fd" : "rgba(226,232,240,0.85)",
              background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
              border: "none",
              borderRadius: 0,
              cursor: "pointer",
              outline: "none",
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent" }}
          >
            {isActive && <span style={{ marginRight: "8px", color: "#3b82f6" }}>✓</span>}
            {opt.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div ref={triggerRef} style={{ position: "relative", minWidth, userSelect: "none" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          minWidth: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "6px",
          padding: "6px 9px",
          background: open ? "rgba(20, 34, 74, 0.95)" : "rgba(14, 21, 52, 0.82)",
          border: `1px solid ${open ? "rgba(59,130,246,0.45)" : "rgba(232, 236, 255, 0.1)"}`,
          borderRadius: open ? "10px 10px 0 0" : "10px",
          color: disabled ? "rgba(148,163,184,0.4)" : "#e2e8f0",
          fontSize: "12px",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color 0.15s, background 0.15s",
          outline: "none",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>{selected?.label || placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s",
            flexShrink: 0, color: "rgba(148,163,184,0.5)" }}>
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown via portal — renders at body level, escapes overflow:hidden */}
      {open && createPortal(dropdown, document.body)}
    </div>
  )
}