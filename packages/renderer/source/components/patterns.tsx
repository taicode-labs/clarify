import { useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

type GridPatternProps = ComponentPropsWithoutRef<'svg'> & {
  width: number
  height: number
  x: string | number
  y: string | number
  squares?: Array<[x: number, y: number]>
}

export function GridPattern(arg0: GridPatternProps) {  const {
  width,
  height,
  x,
  y,
  squares,
  ...props
} = arg0

  const patternId = useId()

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      {squares ? (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([squareX, squareY]) => (
            <rect
              key={`${squareX}-${squareY}`}
              width={width + 1}
              height={height + 1}
              x={squareX * width}
              y={squareY * height}
              strokeWidth="0"
            />
          ))}
        </svg>
      ) : null}
    </svg>
  )
}

export function HeroPattern() {
  return (
    <div className="absolute inset-0 -z-10 mx-0 max-w-none overflow-hidden">
      <div className="clarify-hero-pattern-mask absolute top-0 left-1/2 -ml-152 h-100 w-325">
        <div className="clarify-hero-pattern-gradient absolute inset-0 opacity-35 dark:opacity-55">
          <GridPattern
            width={72}
            height={56}
            x={-12}
            y={4}
            squares={[
              [4, 3],
              [2, 1],
              [7, 3],
              [10, 6],
            ]}
            className="clarify-hero-pattern-grid absolute inset-x-0 w-full -skew-y-18 fill-black/40 stroke-black/50 mix-blend-overlay dark:fill-white/2.5 dark:stroke-white/5"
          />
        </div>
        <svg
          viewBox="0 0 1113 440"
          aria-hidden="true"
          className="absolute top-0 left-1/2 -ml-76 w-278.25 fill-white blur-xl dark:hidden"
        >
          <path d="M.016 439.5s-9.5-300 434-300S882.516 20 882.516 20V0h230.004v439.5H.016Z" />
        </svg>
      </div>
    </div>
  )
}
