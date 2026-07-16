import { useEffect, useRef, useState } from 'react'

type Point = { x: number, y: number }
type Direction = 'up' | 'down' | 'left' | 'right'
type GameState = 'idle' | 'running' | 'paused' | 'over'

type SnakeGameProps = {
  title: string
  startLabel: string
  pauseLabel: string
  resumeLabel: string
  restartLabel: string
  scoreLabel: string
  idleMessage: string
  pausedMessage: string
  gameOverMessage: string
}

// ─── Board ────────────────────────────────────────────────────────
const BOARD_SIZE = 14
const CANVAS_SIZE = 560
const TICK = 145
const INITIAL_SNAKE: Point[] = [{ x: 6, y: 7 }, { x: 5, y: 7 }, { x: 4, y: 7 }]
const INITIAL_FOOD: Point = { x: 10, y: 7 }

// ─── Colors ───────────────────────────────────────────────────────
const C = {
  panel: '#161b18',
  screen: '#07140c',
  border: 'rgba(255,255,255,0.07)',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.35)',
  score: '#bef264',
  btnBg: 'rgba(255,255,255,0.06)',
  btnBorder: 'rgba(255,255,255,0.10)',
  btnText: '#ffffff',
  accentGreen: '#22c55e',
  accentRed: '#ef4444',
  overlayDark: 'rgba(0,0,0,0.52)',
  overlayDarker: 'rgba(3,10,6,0.78)',
} as const

// ─── Dimensions ───────────────────────────────────────────────────
const D = {
  panelMax: 360,
  panelPadX: 20,
  panelPadTop: 14,
  panelPadBottom: 20,
  dpad: 112,
  dpadBtn: 36,
  dpadGap: 2,
  actionBtn: 56,
  screenPad: 16,
  canvasPad: 16,
} as const

// ─── Shadows ──────────────────────────────────────────────────────
const S = {
  panel: '0 24px 64px -32px rgba(0,0,0,0.85)',
  screenInset: 'inset 0 0 20px rgba(0,0,0,0.5)',
  actionGreen: '0 4px 14px -3px rgba(34,197,94,0.45), inset 0 -2px 0 rgba(0,0,0,0.12)',
  actionRed: '0 4px 14px -3px rgba(239,68,68,0.40), inset 0 -2px 0 rgba(0,0,0,0.12)',
} as const

const directionDelta: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const oppositeDirection: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

function samePoint(first: Point, second: Point) {
  return first.x === second.x && first.y === second.y
}

function createFood(snake: Point[]): Point {
  const available: Point[] = []
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const point = { x, y }
      if (!snake.some(segment => samePoint(segment, point))) available.push(point)
    }
  }
  return available[Math.floor(Math.random() * available.length)] ?? INITIAL_FOOD
}

export function SnakeGame(props: SnakeGameProps) {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [food, setFood] = useState(INITIAL_FOOD)
  const [gameState, setGameState] = useState<GameState>('idle')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const directionRef = useRef<Direction>('right')
  const queuedDirectionRef = useRef<Direction>('right')

  const score = snake.length - INITIAL_SNAKE.length

  function resetGame() {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    directionRef.current = 'right'
    queuedDirectionRef.current = 'right'
    setGameState('running')
  }

  function changeDirection(nextDirection: Direction) {
    if (oppositeDirection[directionRef.current] === nextDirection) return
    queuedDirectionRef.current = nextDirection
    if (gameState === 'idle') setGameState('running')
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const map: Record<string, Direction | undefined> = {
        ArrowUp: 'up', w: 'up', W: 'up',
        ArrowDown: 'down', s: 'down', S: 'down',
        ArrowLeft: 'left', a: 'left', A: 'left',
        ArrowRight: 'right', d: 'right', D: 'right',
      }
      const dir = map[event.key]
      if (!dir) return
      event.preventDefault()
      changeDirection(dir)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'running') return

    const timer = window.setInterval(() => {
      setSnake(currentSnake => {
        const direction = queuedDirectionRef.current
        directionRef.current = direction
        const delta = directionDelta[direction]
        const head = currentSnake[0]!
        const nextHead = { x: head.x + delta.x, y: head.y + delta.y }
        const hitWall = nextHead.x < 0 || nextHead.x >= BOARD_SIZE || nextHead.y < 0 || nextHead.y >= BOARD_SIZE
        const ateFood = samePoint(nextHead, food)
        const bodyToCheck = ateFood ? currentSnake : currentSnake.slice(0, -1)

        if (hitWall || bodyToCheck.some(segment => samePoint(segment, nextHead))) {
          setGameState('over')
          return currentSnake
        }

        const nextSnake = [nextHead, ...currentSnake]
        if (ateFood) {
          setFood(createFood(nextSnake))
          return nextSnake
        }
        return nextSnake.slice(0, -1)
      })
    }, TICK)

    return () => window.clearInterval(timer)
  }, [food, gameState])

  const statusMessage = gameState === 'over'
    ? props.gameOverMessage
    : gameState === 'paused'
      ? props.pausedMessage
      : undefined

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const cs = CANVAS_SIZE / BOARD_SIZE

    // Background
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    context.fillStyle = C.screen
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Grid
    context.strokeStyle = 'rgba(255,255,255,0.055)'
    context.lineWidth = 1
    for (let i = 1; i < BOARD_SIZE; i++) {
      const o = i * cs
      context.beginPath()
      context.moveTo(o, 0)
      context.lineTo(o, CANVAS_SIZE)
      context.moveTo(0, o)
      context.lineTo(CANVAS_SIZE, o)
      context.stroke()
    }

    // Snake
    snake.forEach((seg, i) => {
      const inset = i === 0 ? 4 : 6
      const x = seg.x * cs + inset
      const y = seg.y * cs + inset
      const w = cs - inset * 2
      context.beginPath()
      context.roundRect(x, y, w, w, i === 0 ? 10 : 8)
      context.fillStyle = i === 0 ? '#d9f99d' : '#22c55e'
      context.shadowColor = i === 0 ? 'rgba(190,242,100,0.8)' : 'transparent'
      context.shadowBlur = i === 0 ? 14 : 0
      context.fill()

      if (i === 0) {
        const d = directionRef.current
        const eyeR = cs * 0.17
        const eyes = d === 'left' || d === 'right'
          ? [{ x: d === 'right' ? 0.68 : 0.32, y: 0.34 }, { x: d === 'right' ? 0.68 : 0.32, y: 0.66 }]
          : [{ x: 0.34, y: d === 'down' ? 0.68 : 0.32 }, { x: 0.66, y: d === 'down' ? 0.68 : 0.32 }]
        context.shadowBlur = 0
        context.fillStyle = '#111914'
        for (const eye of eyes) {
          context.beginPath()
          context.arc(seg.x * cs + eye.x * cs, seg.y * cs + eye.y * cs, eyeR * 0.24, 0, Math.PI * 2)
          context.fill()
        }
      }
    })

    // Food
    context.shadowColor = 'transparent'
    context.shadowBlur = 0
    const fx = (food.x + 0.5) * cs
    const fy = (food.y + 0.5) * cs
    context.beginPath()
    context.arc(fx, fy, cs * 0.25, 0, Math.PI * 2)
    context.fillStyle = '#fb7185'
    context.shadowColor = 'rgba(251,113,133,0.85)'
    context.shadowBlur = 16
    context.fill()
    context.shadowColor = 'transparent'
    context.shadowBlur = 0
    context.fillStyle = '#bef264'
    context.fillRect(fx + 2, fy - cs * 0.34, 4, 9)

    // Overlays
    const cx = CANVAS_SIZE / 2
    const cy = CANVAS_SIZE / 2
    if (gameState === 'idle') {
      context.fillStyle = C.overlayDark
      context.beginPath()
      context.arc(cx, cy, 96, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = C.text
      context.font = '600 13px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('方向键 / WASD 移动', cx, cy - 10)
      context.fillStyle = 'rgba(255,255,255,0.55)'
      context.font = '12px sans-serif'
      context.fillText('点击右侧按钮开始', cx, cy + 14)
    } else if (statusMessage) {
      context.fillStyle = C.overlayDarker
      context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      context.fillStyle = C.text
      context.font = '600 18px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(statusMessage, cx, cy)
    }
  }, [food, gameState, snake, statusMessage])

  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    width: D.dpadBtn,
    height: D.dpadBtn,
    backgroundColor: C.btnBg,
    border: `1px solid ${C.btnBorder}`,
    color: C.btnText,
    fontSize: '18px',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  }

  const btnUp: React.CSSProperties = { ...btnStyle, top: 0, left: D.dpadBtn + D.dpadGap, borderRadius: '8px 8px 0 0' }
  const btnLeft: React.CSSProperties = { ...btnStyle, top: D.dpadBtn + D.dpadGap, left: 0, borderRadius: '8px 0 0 8px' }
  const btnRight: React.CSSProperties = { ...btnStyle, top: D.dpadBtn + D.dpadGap, right: 0, borderRadius: '0 8px 8px 0' }
  const btnDown: React.CSSProperties = { ...btnStyle, bottom: 0, left: D.dpadBtn + D.dpadGap, borderRadius: '0 0 8px 8px' }

  const actionBtnBg = gameState === 'paused' || gameState === 'idle' || gameState === 'over' ? C.accentGreen : C.accentRed
  const actionShadow = gameState === 'paused' || gameState === 'idle' || gameState === 'over' ? S.actionGreen : S.actionRed
  const actionIcon = gameState === 'running' ? '⏸' : '▶'
  const actionLabel = gameState === 'running' ? props.pauseLabel : gameState === 'paused' ? props.resumeLabel : props.startLabel

  return (
    <section
      className="not-prose my-8 overflow-hidden"
      style={{
        backgroundColor: C.panel,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        boxShadow: S.panel,
        color: C.text,
        marginInline: 'auto',
        maxWidth: D.panelMax,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: `${D.panelPadTop}px ${D.panelPadX}px 10px` }}>
        <div className="flex items-center gap-2">
          <div
            className="grid place-items-center font-mono text-xs font-bold"
            style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: C.score, color: '#111914' }}
          >
            S
          </div>
          <span className="text-[15px] font-semibold">{props.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase" style={{ color: C.textMuted, letterSpacing: '0.1em' }}>
            {props.scoreLabel}
          </span>
          <span className="font-mono text-lg font-bold" style={{ color: C.score }}>
            {String(score).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Screen */}
      <div style={{ padding: `0 ${D.panelPadX}px 2px` }}>
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 10,
            backgroundColor: C.screen,
            boxShadow: S.screenInset,
          }}
        >
          <canvas
            aria-label={`${props.title}: ${statusMessage ?? `${props.scoreLabel} ${score}`}`}
            className="block aspect-square h-auto w-full touch-none"
            height={CANVAS_SIZE}
            ref={canvasRef}
            role="img"
            width={CANVAS_SIZE}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between" style={{ padding: `${D.panelPadTop}px ${D.panelPadX + 4}px ${D.panelPadBottom}px` }}>
        {/* D-Pad */}
        <div
          style={{
            position: 'relative',
            width: D.dpad,
            height: D.dpad,
            flexShrink: 0,
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderRadius: 8,
          }}
          aria-label="Direction controls"
        >
          <button style={btnUp} onClick={() => changeDirection('up')} type="button" aria-label="Up">↑</button>
          <button style={btnLeft} onClick={() => changeDirection('left')} type="button" aria-label="Left">←</button>
          <div
            className="grid place-items-center"
            style={{
              position: 'absolute',
              top: D.dpadBtn + D.dpadGap,
              left: D.dpadBtn + D.dpadGap,
              width: D.dpadBtn,
              height: D.dpadBtn,
            }}
          >
            <div className="rounded-full" style={{ width: 12, height: 12, backgroundColor: 'rgba(255,255,255,0.07)' }} />
          </div>
          <button style={btnRight} onClick={() => changeDirection('right')} type="button" aria-label="Right">→</button>
          <button style={btnDown} onClick={() => changeDirection('down')} type="button" aria-label="Down">↓</button>
        </div>

        {/* Action */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            className="grid place-items-center"
            style={{
              width: D.actionBtn,
              height: D.actionBtn,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: actionBtnBg,
              color: '#111914',
              fontSize: 20,
              cursor: 'pointer',
              boxShadow: actionShadow,
            }}
            onClick={gameState === 'idle' || gameState === 'over' ? resetGame : () => setGameState(s => s === 'paused' ? 'running' : 'paused')}
            type="button"
          >
            {actionIcon}
          </button>
          <span className="text-[9px] font-medium uppercase" style={{ color: 'rgba(255,255,255,0.30)', letterSpacing: '0.12em' }}>
            {actionLabel}
          </span>
        </div>
      </div>
    </section>
  )
}
