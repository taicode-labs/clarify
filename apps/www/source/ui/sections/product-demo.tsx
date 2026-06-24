import { useEffect, useState } from 'react'

import { Screenshot } from '../elements/screenshot'

type TerminalLineKind = 'command' | 'success' | 'info' | 'muted'
type TerminalLine = { kind: TerminalLineKind; text: string }
type TerminalSession = { title: string; command: string; lines: TerminalLine[]; startDelay: number }
type TerminalPlaybackState = { commandText: string; visibleLineCount: number; isTyping: boolean; isComplete: boolean }

const terminalTypeDelay = 48
const terminalOutputDelay = 520
const terminalReplayPause = 2600
const initialTerminalPlaybackState = { commandText: '', visibleLineCount: 0, isTyping: false, isComplete: false } satisfies TerminalPlaybackState

const terminalSessions = [
  {
    title: 'Local preview',
    command: 'clarify dev',
    startDelay: 350,
    lines: [
      { kind: 'info', text: 'Loading clarify.ts' },
      { kind: 'success', text: 'Docs ready at http://localhost:5173' },
      { kind: 'muted', text: 'Watching source/, openapi/, public/' },
    ],
  },
  {
    title: 'Static output',
    command: 'clarify build',
    startDelay: 2400,
    lines: [
      { kind: 'info', text: 'Rendering MDX and OpenAPI routes' },
      { kind: 'success', text: 'Generated output/ with 69 pages' },
      { kind: 'muted', text: 'Includes llms.txt, sitemap.xml, api.openapi.json' },
    ],
  },
] satisfies TerminalSession[]

export function ProductDemo() {
  return (
    <Screenshot className="rounded-lg" wallpaper="blue" placement="bottom">
      <div className="grid min-h-[28rem] gap-4 p-4 !ring-0 sm:p-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-0 flex-col gap-4">
          {terminalSessions.map((session) => (
            <TerminalWindow key={session.command} session={session} />
          ))}
        </div>
        <div className="hidden min-h-0 rounded-2xl bg-white/85 p-5 text-slate-950 shadow-2xl shadow-slate-950/15 backdrop-blur-md dark:bg-slate-950/60 dark:text-white dark:shadow-slate-950/30 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs/5 font-semibold text-emerald-700 ring-1 ring-emerald-700/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/20">Two commands</div>
            <h3 className="mt-4 text-2xl/8 font-semibold tracking-tight text-slate-950 dark:text-white">From source to live docs in seconds.</h3>
            <p className="mt-3 text-sm/7 text-slate-700 dark:text-zinc-300">Run one command while writing, one command when shipping. Clarify handles routes, OpenAPI pages, static assets, search output, and AI-readable files.</p>
          </div>
          <div className="mt-8 grid gap-3 text-sm/6">
            <div className="rounded-xl bg-slate-950/[0.04] p-3 ring-1 ring-slate-950/10 dark:bg-white/[0.06] dark:ring-white/10">
              <div className="font-medium text-slate-950 dark:text-white">Live development</div>
              <div className="mt-1 text-slate-600 dark:text-zinc-400">Hot reload for MDX, config, and API specs.</div>
            </div>
            <div className="rounded-xl bg-slate-950/[0.04] p-3 ring-1 ring-slate-950/10 dark:bg-white/[0.06] dark:ring-white/10">
              <div className="font-medium text-slate-950 dark:text-white">Portable production build</div>
              <div className="mt-1 text-slate-600 dark:text-zinc-400">Plain static files ready for any host.</div>
            </div>
          </div>
        </div>
      </div>
    </Screenshot>
  )
}

type TerminalWindowProps = { session: TerminalSession }

function TerminalWindow(arg0: TerminalWindowProps) {
  const { session } = arg0
  const playback = useTerminalPlayback(session)

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-slate-950/85 shadow-2xl shadow-slate-950/25 backdrop-blur-md dark:bg-slate-950/75 dark:shadow-slate-950/35">
      <div className="flex items-center gap-2 bg-slate-900/75 px-4 py-3 dark:bg-slate-900/60">
        <span className="size-2.5 rounded-full bg-rose-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 truncate text-xs/5 font-medium text-zinc-300">{session.title}</span>
        <span className="ml-auto hidden w-16 justify-center rounded-full bg-emerald-400/10 px-2 py-0.5 text-[0.625rem]/4 font-semibold text-emerald-300 ring-1 ring-emerald-300/15 sm:inline-flex">
          {playback.isComplete ? 'done' : playback.isTyping ? 'typing' : 'running'}
        </span>
      </div>
      <div className="grid grid-rows-[1.5rem_repeat(3,1.5rem)] gap-2 p-4 font-mono text-xs/6 sm:text-sm/6">
        <div className="flex min-w-0 gap-2 text-white">
          <span className="text-emerald-300">$</span>
          <span className="min-w-0 truncate">{playback.commandText}</span>
          <span className="ml-1 inline-block h-4 w-2 shrink-0 translate-y-0.5 animate-pulse rounded-sm bg-emerald-300" />
        </div>
        {session.lines.map((line, index) => (
          <TerminalLineView key={line.text} line={line} isVisible={index < playback.visibleLineCount} />
        ))}
      </div>
    </div>
  )
}

function useTerminalPlayback(session: TerminalSession): TerminalPlaybackState {
  const [playback, setPlayback] = useState<TerminalPlaybackState>(initialTerminalPlaybackState)

  useEffect(() => {
    const timeoutIds: number[] = []

    function schedule(callback: () => void, delay: number) {
      timeoutIds.push(window.setTimeout(callback, delay))
    }

    function showFinalState() {
      setPlayback({
        commandText: session.command,
        visibleLineCount: session.lines.length,
        isTyping: false,
        isComplete: true,
      })
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showFinalState()
      return () => undefined
    }

    function play() {
      setPlayback(initialTerminalPlaybackState)

      for (let index = 0; index <= session.command.length; index += 1) {
        schedule(() => {
          setPlayback({
            commandText: session.command.slice(0, index),
            visibleLineCount: 0,
            isTyping: index < session.command.length,
            isComplete: false,
          })
        }, index * terminalTypeDelay)
      }

      const outputStart = session.command.length * terminalTypeDelay + 360

      session.lines.forEach((line, index) => {
        schedule(() => {
          setPlayback({
            commandText: session.command,
            visibleLineCount: index + 1,
            isTyping: false,
            isComplete: index === session.lines.length - 1,
          })
        }, outputStart + index * terminalOutputDelay)
      })

      schedule(play, outputStart + session.lines.length * terminalOutputDelay + terminalReplayPause)
    }

    schedule(play, session.startDelay)

    return () => {
      for (const timeoutId of timeoutIds) window.clearTimeout(timeoutId)
    }
  }, [session])

  return playback
}

type TerminalLineViewProps = { isVisible: boolean; line: TerminalLine }

function TerminalLineView(arg0: TerminalLineViewProps) {
  const { isVisible, line } = arg0
  const className = {
    command: 'text-white',
    success: 'text-emerald-300',
    info: 'text-sky-300',
    muted: 'text-zinc-400',
  }[line.kind]
  const marker = {
    command: '›',
    success: '✓',
    info: '•',
    muted: ' ',
  }[line.kind]

  return (
    <div className={`flex min-w-0 gap-2 transition-opacity duration-200 ${className} ${isVisible ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!isVisible}>
      <span className="w-4 shrink-0 text-right">{marker}</span>
      <span className="min-w-0 truncate">{line.text}</span>
    </div>
  )
}
