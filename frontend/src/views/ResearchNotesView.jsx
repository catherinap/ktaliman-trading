import React from "react";
import { useTranslation } from "react-i18next";
import CustomSelect from "../components/CustomSelect";
import { Panel } from "../App";

function renderNoteText(text) {
  if (!text) return null
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={j}
            className="font-semibold text-zinc-100"
            style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.9em' }}
          >
            {part.slice(2, -2)}
          </span>
        )
      }
      return <span key={j}>{part}</span>
    })
    return <div key={i} className="leading-7">{rendered}</div>
  })
}

export default function ResearchNotesView({ aiLanguage = "en" }) {
  const { t } = useTranslation()
  const [notes, setNotes]       = React.useState([])
  const [loading, setLoading]   = React.useState(true)
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [expanded, setExpanded] = React.useState({})
  const [modalNote, setModalNote] = React.useState(null)
  const [translations, setTranslations] = React.useState({}) // { [note.id]: { text, loading } }

const translateNote = async (note) => {
  const targetLang = note.metadata?.language === 'uk' ? 'en' : 'uk'
  setTranslations(prev => ({ ...prev, [note.id]: { text: '', loading: true } }))
  try {
    const r = await fetch('/api/gpt/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: note.content, target: targetLang }),
    })
    const d = await r.json()
    setTranslations(prev => ({ ...prev, [note.id]: { text: d.text, loading: false } }))
  } catch {
    setTranslations(prev => ({ ...prev, [note.id]: { text: '', loading: false } }))
  }
}

// Блокуємо скрол фону коли модалка відкрита
React.useEffect(() => {
  if (modalNote) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => { document.body.style.overflow = '' }
}, [modalNote])

  const load = React.useCallback(() => {
    setLoading(true)
    fetch(`/api/notes?type=${typeFilter}`)
      .then(r => r.json())
      .then(d => setNotes(d.items || []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [typeFilter])

  React.useEffect(() => { load() }, [load])

  const togglePin = async (id) => {
    await fetch(`/api/notes/${id}/pin`, { method: 'PATCH' })
    load()
  }

  const deleteNote = async (id) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = async () => {
    if (!window.confirm(t('ui.clearAllConfirm'))) return
    await fetch(`/api/notes?type=${typeFilter}`, { method: 'DELETE' })
    load()
  }

  const typeOptions = [
    { value: 'all',         label: t('ui.allTypes') },
    { value: 'macro',       label: t('nav.macro') },
    { value: 'asset',       label: t('ui.asset') },
    { value: 'correlation', label: t('nav.correlation') },
    { value: 'signals',     label: t('nav.signals') },
    { value: 'seasonality', label: t('nav.seasonality') },
  ]

  const typeBadge = (noteType) => {
    const map = {
      macro:       { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  label: 'Macro' },
      asset:       { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  label: 'Asset' },
      correlation: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', label: 'Correlation' },
      signals:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: 'Signals' },
      seasonality: { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  label: 'Seasonality' },
    }
    return map[noteType] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: t }
  }

  const pinnedNotes = notes.filter(n => n.is_pinned)
  const regularNotes = notes.filter(n => !n.is_pinned)

  return (
    <div className="space-y-4">
      {/* Header */}
      <Panel title={t('ui.researchNotes')}
        right={
          <div className="flex items-center gap-3">
            <CustomSelect
              value={typeFilter}
              onChange={setTypeFilter}
              minWidth="0"
              options={typeOptions}
            />
            {notes.length > 0 && (
              <button onClick={clearAll}
                className="border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 hover:border-rose-900 hover:text-rose-400 transition">
                {t('ui.clearAll')}
              </button>
            )}
          </div>
        }
      >
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{notes.length} {t('ui.notesLower')}</span>
          {pinnedNotes.length > 0 && <span>· 📌 {pinnedNotes.length}{t('ui.pinnedLower')}</span>}
        </div>
      </Panel>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="border border-zinc-900 p-4 space-y-2">
              <div className="h-3 animate-pulse rounded bg-zinc-800 w-1/3" />
              <div className="h-3 animate-pulse rounded bg-zinc-800 w-full" />
              <div className="h-3 animate-pulse rounded bg-zinc-800 w-4/5" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="border border-zinc-900 small-panel-color p-10 text-center">
          <div style={{ fontSize: '28px', opacity: 0.2, marginBottom: '12px' }}>📝</div>
          <div className="text-sm text-zinc-500">
            {t('ui.noNotesYet')}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...pinnedNotes, ...regularNotes].map(note => {
            const badge = typeBadge(note.type)
            const isExpanded = !!expanded[note.id]
            const preview = note.content.slice(0, 300) + (note.content.length > 300 ? '...' : '')
            const date = new Date(note.created_at).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })

            return (
              <div key={note.id} className="border rounded-[8px] border-blue-900"
                style={{
                  borderColor: note.is_pinned ? 'rgba(251,191,36,0.25)' : undefined,
                  cursor: 'default',
                  transition: 'border-color 0.15s',
                }}
                onClick={() => setModalNote(note)}
                onMouseEnter={e => e.currentTarget.style.borderColor = note.is_pinned ? 'rgba(251,191,36,0.5)' : 'rgba(96,165,250,0.25)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = note.is_pinned ? 'rgba(251,191,36,0.25)' : ''}>
                {/* Note header */}
                <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-zinc-900">
                  <div className="flex items-start gap-2 min-w-0">
                    {note.is_pinned && <span style={{ fontSize:'13px', flexShrink:0, marginTop:'1px' }}>📌</span>}
                    <div className="min-w-0">
                      <div
                        className="text-sm font-medium text-zinc-100 truncate cursor-pointer hover:text-blue-300 transition"
                        onClick={() => setModalNote(note)}
                      >
                        {note.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{
                          fontSize:'9px', padding:'1px 6px', borderRadius:'3px',
                          textTransform:'uppercase', letterSpacing:'0.1em',
                          color: badge.color, background: badge.bg,
                        }}>{badge.label}</span>
                        {note.metadata?.symbol && (
                          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.1em]">
                            {note.metadata.symbol}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-600">{date}</span>
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    
                    <button onClick={(e) => { e.stopPropagation(); togglePin(note.id) }}
                      title={note.is_pinned ? 'Unpin' : 'Pin'}
                      style={{
                        padding: '4px 6px', fontSize:'12px',
                        color: note.is_pinned ? '#fbbf24' : '#475569',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        transition: 'color 0.15s',
                      }}>
                      {note.is_pinned ? '📌' : '📍'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                      style={{
                        display:'flex', alignItems:'center', justifyContent:'center',
                        width:'24px', height:'24px',
                        border:'1px solid rgba(255,255,255,0.08)',
                        color:'#475569', background:'transparent', cursor:'pointer',
                        fontSize:'12px', transition:'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(248,113,113,0.4)'; e.currentTarget.style.color='#f87171' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#475569' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {/* Note content */}
                <div className="px-4 py-3">
                  <div className="text-sm leading-7 text-zinc-300">
                    {translations[note.id]?.loading
                      ? <div className="flex items-center gap-2 text-zinc-500"><span style={{animation:'spin 1s linear infinite', display:'inline-block'}}>⟳</span> Translating...</div>
                      : renderNoteText(translations[note.id]?.text || (isExpanded ? note.content : preview))
                    }
                  </div>
                  {note.content.length > 180 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpanded(prev => ({ ...prev, [note.id]: !isExpanded })) }}
                      className="mt-2 text-[10px] uppercase tracking-[0.15em] text-blue-400 hover:text-blue-300 transition"
                    >
                      {isExpanded
                        ? (aiLanguage === 'uk' ? '▲ Згорнути' : '▲ Collapse')
                        : (aiLanguage === 'uk' ? '▼ Читати далі' : '▼ Read more')}
                    </button>
                  )}
                </div>
              {/* Modal */}
{modalNote && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 z-50 bg-black/70"
      onClick={() => setModalNote(null)}
    />
    {/* Modal window */}
    <div style={{
      position: 'fixed', zIndex: 51,
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%', maxWidth: '680px',
      maxHeight: '85vh',
      display: 'flex', flexDirection: 'column',
      background: '#0d1117',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
    }}onClick={(e) => e.stopPropagation()}>
      {/* Modal header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-900" style={{ flexShrink: 0 }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            {modalNote.is_pinned && <span style={{ fontSize:'13px' }}>📌</span>}
            <span className="text-sm font-semibold text-zinc-100">{modalNote.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const badge = typeBadge(modalNote.type)
              return (
                <span style={{
                  fontSize:'9px', padding:'1px 6px', borderRadius:'3px',
                  textTransform:'uppercase', letterSpacing:'0.1em',
                  color: badge.color, background: badge.bg,
                }}>{badge.label}</span>
              )
            })()}
            {modalNote.metadata?.symbol && (
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.1em]">
                {modalNote.metadata.symbol}
              </span>
            )}
            <span className="text-[10px] text-zinc-600">
              {new Date(modalNote.created_at).toLocaleDateString('en-GB', {
                day:'2-digit', month:'short', year:'numeric',
                hour:'2-digit', minute:'2-digit'
              })}
            </span>
          </div>
        </div>
        <button
          onClick={() => setModalNote(null)}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            width:'28px', height:'28px', flexShrink: 0,
            border:'1px solid rgba(255,255,255,0.08)',
            color:'#475569', background:'transparent', cursor:'pointer',
            fontSize:'13px', transition:'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(248,113,113,0.4)'; e.currentTarget.style.color='#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#475569' }}
        >
          ✕
        </button>
      </div>
      {/* Modal content — scrollable */}
      <div className="overflow-y-auto px-5 py-4" style={{ flex: 1 }}>
        {translations[modalNote.id]?.loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span>
          Translating...
        </div>
      ) : (
        <div className="text-sm leading-7 text-zinc-300">
          {renderNoteText(translations[modalNote.id]?.text || modalNote.content)}
        </div>
      )}
      </div>
      {/* Modal footer */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-zinc-900" style={{ flexShrink: 0 }}>
      <button
        onClick={() => {
          if (translations[modalNote.id]?.text) {
            setTranslations(prev => { const n = {...prev}; delete n[modalNote.id]; return n })
          } else {
            translateNote(modalNote)
          }
        }}
        style={{
          fontSize:'11px',
          color: translations[modalNote.id]?.text ? '#60a5fa' : '#475569',
          background: translations[modalNote.id]?.text ? 'rgba(96,165,250,0.08)' : 'transparent',
          border: `1px solid ${translations[modalNote.id]?.text ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
          padding:'4px 10px', cursor:'pointer', transition:'all 0.15s',
          textTransform:'uppercase', letterSpacing:'0.12em',
        }}
      >
        {translations[modalNote.id]?.loading
          ? '⟳ Translating...'
          : translations[modalNote.id]?.text
          ? '🌐 Show Original'
          : '🌐 Translate'}
      </button>
      <button onClick={() => { togglePin(modalNote.id); setModalNote(prev => prev ? {...prev, is_pinned: !prev.is_pinned} : null) }}
          style={{
            fontSize:'11px', color: modalNote.is_pinned ? '#fbbf24' : '#475569',
            background:'transparent', border:'1px solid rgba(255,255,255,0.08)',
            padding:'4px 10px', cursor:'pointer', transition:'all 0.15s',
            textTransform:'uppercase', letterSpacing:'0.12em',
          }}
        >
          {modalNote.is_pinned ? '📌 Unpin' : '📍 Pin'}
        </button>
        <button
          onClick={() => { deleteNote(modalNote.id); setModalNote(null) }}
          style={{
            fontSize:'11px', color:'#f87171',
            background:'transparent', border:'1px solid rgba(248,113,113,0.2)',
            padding:'4px 10px', cursor:'pointer', transition:'all 0.15s',
            textTransform:'uppercase', letterSpacing:'0.12em',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </>
)}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
