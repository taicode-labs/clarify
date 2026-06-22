import clsx from 'clsx'
import { useInView } from 'framer-motion'
import { LinkIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { useSectionStore } from '../app/SectionProvider'
import { remToPx } from '../utils/remToPx'

import { Tag } from './Tag'

type EyebrowProps = { tag?: string; label?: string }

function Eyebrow(arg0: EyebrowProps) {
  const { tag, label } = arg0

  if (!tag && !label) {
    return null
  }

  return (
    <div className="flex items-center gap-x-3">
      {tag ? <Tag>{tag}</Tag> : null}
      {tag && label ? <span className="h-0.5 w-0.5 rounded-full bg-zinc-300 dark:bg-zinc-600" /> : null}
      {label ? <span className="text-xs text-zinc-400">{label}</span> : null}
    </div>
  )
}

type AnchorProps = { id: string; inView: boolean; children: ReactNode }

function Anchor(arg0: AnchorProps) {
  const { id, inView, children } = arg0

  return (
    <a href={`#${id}`} className="clarify-anchor group text-inherit no-underline hover:text-inherit">
      {inView ? (
        <div className="absolute mt-1 -ml-(--width) hidden w-(--width) opacity-0 transition [--width:calc(2.625rem+0.5px+50%-min(50%,calc(var(--container-lg)+(--spacing(8)))))] group-hover:opacity-100 group-focus:opacity-100 md:block lg:z-50 2xl:[--width:--spacing(10)]">
          <div className="group/anchor block h-5 w-5 rounded-lg bg-zinc-50 ring-1 ring-inset ring-zinc-300 transition hover:ring-zinc-500 dark:bg-zinc-800 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:hover:ring-zinc-600">
            <LinkIcon className="h-5 w-5 stroke-zinc-500 transition dark:stroke-zinc-400 dark:group-hover/anchor:stroke-white" />
          </div>
        </div>
      ) : null}
      {children}
    </a>
  )
}

type HeadingProps<Level extends 2 | 3> = ComponentPropsWithoutRef<`h${Level}`> & {
  id: string
  tag?: string
  label?: string
  level?: Level
  anchor?: boolean
}

export function Heading<Level extends 2 | 3>(arg0: HeadingProps<Level>) {
  const { children, className, tag, label, level, anchor = true, ...props } = arg0

  const resolvedLevel = level ?? (2 as Level)
  const Component = `h${resolvedLevel}` as 'h2' | 'h3'
  const ref = useRef<HTMLHeadingElement>(null)
  const registerHeading = useSectionStore((state) => state.registerHeading)

  const inView = useInView(ref, {
    margin: `${remToPx(-3.5)}px 0px 0px 0px`,
    amount: 'all',
  })

  useEffect(() => {
    if (resolvedLevel === 2) {
      registerHeading({
        id: props.id,
        ref,
        offsetRem: tag || label ? 8 : 6,
      })
    }
  }, [label, props.id, registerHeading, resolvedLevel, tag])

  return (
    <>
      <Eyebrow tag={tag} label={label} />
      <Component ref={ref} className={clsx('clarify-heading', tag || label ? 'mt-2 scroll-mt-32' : 'scroll-mt-24', className)} {...props}>
        {anchor ? (
          <Anchor id={props.id} inView={inView}>
            {children}
          </Anchor>
        ) : (
          children
        )}
      </Component>
    </>
  )
}
