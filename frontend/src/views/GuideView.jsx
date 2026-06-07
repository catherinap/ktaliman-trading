import React from "react";
import { GUIDE_SECTIONS } from "../data/guideSections";

// Renders guide text with [[BOLD_UPPER]], [[BOLD]] markers and auto-links URLs.
function renderGuideContent(text) {
  if (!text) return null

  // Split on double newlines first to get paragraphs
  const paragraphs = text.split(/\n\n/)

  return paragraphs.map((para, pi) => {
    // Check if the entire paragraph is a [[BOLD_UPPER]] block
    const upperMatch = para.match(/^\[\[BOLD_UPPER\]\]([\s\S]*?)\[\[\/\]\]$/)
    if (upperMatch) {
      return (
        <p key={pi} style={{
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontSize: '11px',
          color: '#e2e8f0',
          margin: '18px 0 6px 0',
        }}>
          {upperMatch[1]}
        </p>
      )
    }

    // Otherwise parse inline [[BOLD]]...[[/]] markers
    const parts = para.split(/(\[\[BOLD\]\][\s\S]*?\[\[\/\]\])/)
    const rendered = parts.map((part, i) => {
      const boldMatch = part.match(/^\[\[BOLD\]\]([\s\S]*?)\[\[\/\]\]$/)
      if (boldMatch) {
        return <span key={i} style={{ fontWeight: 700, color: '#e2e8f0' }}>{boldMatch[1]}</span>
      }
      // Plain text — render links as <a> if they look like URLs
      return part.split(/(https?:\/\/[^\s]+)/g).map((chunk, j) => {
        if (/^https?:\/\//.test(chunk)) {
          return (
            <a key={j} href={chunk} target="_blank" rel="noopener noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'underline', wordBreak: 'break-all' }}>
              {chunk}
            </a>
          )
        }
        return <span key={j}>{chunk}</span>
      })
    })

    return (
      <p key={pi} style={{
        margin: '0 0 12px 0',
        lineHeight: '1.7',
        color: '#a1a1aa',
        fontSize: '13px',
      }}>
        {rendered}
      </p>
    )
  })
}

export default function GuideView({ setActive, initialSection = null, uiLanguage = "en" }) {
  const lang = uiLanguage || 'en'
  const [activeKey, setActiveKey] = React.useState(
    initialSection && GUIDE_SECTIONS.find(s => s.key === initialSection)
      ? initialSection
      : GUIDE_SECTIONS[0].key
  )
  const [openBlocks, setOpenBlocks] = React.useState({})

  React.useEffect(() => {
    if (initialSection && GUIDE_SECTIONS.find(s => s.key === initialSection)) {
      setActiveKey(initialSection)
      setOpenBlocks({}) // reset accordion on tab change
    }
  }, [initialSection])

  // When tab changes — reset accordion
  const handleTabChange = (key) => {
    setActiveKey(key)
    setOpenBlocks({})
  }

  const toggleBlock = (bi) => {
    setOpenBlocks(prev => ({ ...prev, [bi]: !prev[bi] }))
  }

  const activeSection = GUIDE_SECTIONS.find(s => s.key === activeKey) || GUIDE_SECTIONS[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(90,104,116,0.5)',
        padding: '20px 28px 0', flexShrink: 0,
      }}>
        <div style={{ fontSize: '14px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#f1f5f9', marginBottom: '20px' }}>
          {lang === 'uk' ? 'Посібник користувача' : 'Platform Guide'}
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2" style={{ paddingBottom: '16px' }}>
          {GUIDE_SECTIONS.map(sec => {
            const isActive = activeKey === sec.key
            const label = typeof sec.title === 'object' ? sec.title[lang] : sec.title
            return (
              <button key={sec.key} onClick={() => handleTabChange(sec.key)}
                className={`min-w-[72px] border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
                  isActive
                    ? 'border-blue-400 bg-zinc-950 text-zinc-100'
                    : 'border-zinc-900 small-panel-color text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <span>{sec.icon}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="guide-content" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {/* Section summary */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)', margin: 0, lineHeight: 1.7 }}>
            {typeof activeSection.summary === 'object' ? activeSection.summary[lang] : activeSection.summary}
          </p>
        </div>

        {/* Accordion blocks */}
        {activeSection.blocks.map((block, bi) => {
          const isOpen = !!openBlocks[bi]
          const title = typeof block.title === 'object' ? block.title[lang] : block.title
          const content = typeof block.content === 'object' ? block.content[lang] : block.content
          return (
            <div key={bi} style={{
              marginBottom: '8px',
              border: `1px solid ${isOpen ? 'rgba(90,104,116,0.6)' : 'rgba(90,104,116,0.25)'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}>
              {/* Accordion header — clickable */}
              <button
                onClick={() => toggleBlock(bi)}
                style={{
                  width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  background: isOpen ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: isOpen ? activeSection.color : '#94a3b8',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  transition: 'color 0.15s',
                }}>
                  {title}
                </span>
                <span style={{
                  fontSize: '12px', color: isOpen ? activeSection.color : '#475569',
                  transition: 'transform 0.2s, color 0.15s',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                }}>
                  ▾
                </span>
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div style={{ padding: '4px 20px 20px', borderTop: '1px solid rgba(90,104,116,0.25)' }}>
                  {renderGuideContent(content)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
