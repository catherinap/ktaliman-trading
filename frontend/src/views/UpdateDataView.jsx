import React from "react";
import { useTranslation } from "react-i18next";
import { Panel, cls, TIMEZONES } from "../App";

function HistoryBootstrapButton() {
  const { t } = useTranslation()
  const [state, setState] = React.useState('idle')
  const [msg, setMsg] = React.useState('')
  const [lastRun, setLastRun] = React.useState(null)

  React.useEffect(() => {
    if (state !== 'running') return
    const iv = setInterval(async () => {
      try {
        const r = await fetch('/api/system/worker-status')
        const d = await r.json()
        const w = d?.worker?.history
        if (!w?.running) {
          setState(w?.last_status === 'ok' ? 'ok' : 'error')
          setMsg(w?.last_status || '')
          setLastRun(w?.last_run)
          clearInterval(iv)
        }
      } catch {}
    }, 4000)
    return () => clearInterval(iv)
  }, [state])

  const run = async () => {
    setState('running'); setMsg('')
    try {
      const r = await fetch('/api/system/run-history', { method: 'POST' })
      const d = await r.json()
      if (!d.ok) { setState('error'); setMsg(d.message) }
    } catch { setState('error'); setMsg('Network error') }
  }

  const color = state === 'ok' ? '#4ade80' : state === 'error' ? '#f87171' : state === 'running' ? '#fbbf24' : '#60a5fa'

  return (
    <div className="space-y-2">
      <button
        onClick={run}
        disabled={state === 'running'}
        className={cls(
          'border px-4 py-3 text-sm uppercase tracking-[0.22em] transition',
          state === 'running'
            ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
            : 'border-blue-400 text-blue-300 hover:bg-blue-400/10'
        )}
      >
        {state === 'running' ? '⟳  ' + t('ui.running') : t('ui.historyBootstrap')}
      </button>
      {state === 'running' && (
        <div className="text-xs text-amber-400 tracking-[0.1em]">
          Worker is running in background. Page can be closed safely.
        </div>
      )}
      {msg && state !== 'running' && (
        <div style={{ fontSize: '12px', color, letterSpacing: '0.08em' }}>
          {state === 'ok' ? '✓ Completed successfully' : `✗ ${msg}`}
        </div>
      )}
      {lastRun && (
        <div className="text-xs text-zinc-600">
          Last run: {new Date(lastRun).toLocaleString('en-GB')}
        </div>
      )}
    </div>
  )
}

export default function UpdateDataView({ updateState, updateBusy, onRun, schedulerState, timezone = "Europe/Copenhagen" }) {
  const { t } = useTranslation()
  const isRunning   = updateState?.status === 'running'
  const statusTone  = updateState?.status === 'success'  ? 'text-emerald-400'
                    : updateState?.status === 'error'    ? 'text-rose-400'
                    : updateState?.status === 'running'  ? 'text-blue-400'
                    : 'text-zinc-400'
 
const fmtUtc = (iso) => {
    if (!iso) return '—'
    try {
      const label = TIMEZONES.find((tz) => tz.value === timezone)?.label?.match(/\(([^)]+)\)/)?.[1] || timezone
      return new Date(iso).toLocaleString('en-GB', {
        timeZone: timezone,
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }) + ` (${label})`
    } catch { return iso }
  }
 
  return (
    <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
 
        {/* Manual run */}
        <Panel title={t("panels.updateControl")}>
          <div className="space-y-4">
            <div className="text-sm leading-7 text-zinc-300">
              {t('ui.runWorkerDesc')} <span className="text-zinc-100">cot_analytics</span>.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onRun}
                disabled={updateBusy || isRunning}
                className={cls(
                  'border px-4 py-3 text-sm uppercase tracking-[0.22em] transition',
                  updateBusy || isRunning
                    ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
                    : 'border-blue-400 text-blue-300 hover:bg-blue-400/10'
                )}
              >
                {isRunning ? '⟳  ' + t('ui.running') : t('ui.runWorker')}
              </button>
              <div className={cls('text-sm uppercase tracking-[0.2em]', statusTone)}>
                {updateState?.status || t('ui.idle')}
              </div>
            </div>
          </div>
        </Panel>
        {/* History Bootstrap */}
        <Panel title={t('ui.historyBootstrap')}>
          <div className="space-y-4">
            <div className="text-sm leading-7 text-zinc-300">
              {t('ui.runHistoryDesc')} <span className="text-zinc-100">{t('ui.presentLabel')}</span> {t('ui.runHistoryDesc2')}
              {t('ui.takesMinutes')} <span className="text-amber-300">{t('ui.minutesRange')}</span> — {t('ui.nonBlocking')}.
            </div>
            <HistoryBootstrapButton />
          </div>
        </Panel>
        {/* Worker Log */}
        <Panel title={t('ui.workerLog')}>
          <pre className="max-h-[420px] min-h-[78px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-zinc-300">
            {updateState?.log || t('ui.noLogOutput')}
          </pre>
        </Panel>
      </div>
 
      <div className="space-y-4">
 
        {/* Auto-Schedule status */}
        <Panel title={t('ui.autoSchedule')}>
          <div className="space-y-3 text-sm text-zinc-300">
            {schedulerState ? (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">{t('ui.statusLabel')}</span>
                  <span className={schedulerState.scheduler_running ? 'text-emerald-400' : 'text-rose-400'}>
                    {schedulerState.scheduler_running ? t('ui.scheduleActive') : t('ui.scheduleStopped')}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">{t('ui.scheduleLabel')}</span>
                  <span className="text-zinc-300">{t('__lang__') === 'uk' ? 'Щоп\'ятниці о 18:30 UTC (20:30 CEST / час Данії)' : schedulerState.schedule}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">{t('ui.nextRun')}</span>
                  <span className="text-amber-300">{fmtUtc(schedulerState.next_run_utc)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">{t('ui.lastAutoRun')}</span>
                  <span>{fmtUtc(schedulerState.last_auto_run_utc)}</span>
                </div>
                <div className="mt-2 border border-zinc-900 bg-zinc-950 p-3 text-xs text-slate-200">
                  {t('ui.cftcPublishesNote')}
                </div>
              </>
            ) : (
              <div className="text-zinc-600">
                {t('ui.schedulerUnavailable')}
              </div>
            )}
          </div>
        </Panel>
 
        {/* Run Status */}
        <Panel title={t('ui.runStatus')}>
          <div className="space-y-3 text-sm text-zinc-300">
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">{t('ui.statusLabel')}</span>
              <span className={statusTone}>{updateState?.status || t('ui.idle')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">{t('ui.started')}</span>
              <span>{fmtUtc(updateState?.started_at)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">{t('ui.finished')}</span>
              <span>{fmtUtc(updateState?.finished_at)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">{t('ui.returnCode')}</span>
              <span>{updateState?.return_code ?? '—'}</span>
            </div>
          </div>
        </Panel>
 
        {/* Errors */}
        <Panel title={t('ui.errors')}>
          <div className="text-sm leading-7 text-zinc-300">
            {updateState?.error || t('ui.noErrorsReported')}
          </div>
        </Panel>
 
      </div>
    </div>
  )
}
