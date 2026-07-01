import clsx from 'clsx'
import { Link2 } from 'lucide-react'
import { Children, createElement, isValidElement, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from 'react'

import { lucideIconRegistry, resolveLucideIconName } from '../utils/lucide'

const stepTitleTags = {
  p: 'p',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
} as const

type StepTitleSize = keyof typeof stepTitleTags

type StepContentProps = {
  title: string
  icon?: string | ReactNode
  stepNumber?: number
  id?: string
  noAnchor?: boolean
  titleSize?: StepTitleSize
  children?: ReactNode
  className?: string
  isLast?: boolean
} & Omit<ComponentPropsWithoutRef<'section'>, 'children' | 'className'>

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function resolveIcon(icon: string | ReactNode | undefined) {
  if (!icon) return null
  if (typeof icon !== 'string') return icon

  const iconName = resolveLucideIconName(icon)
  if (!iconName) return null

  const Icon = lucideIconRegistry[iconName]
  return Icon ? <Icon className="size-4" aria-hidden="true" /> : null
}

export function Step(arg0: StepContentProps) {
  const {
    title,
    icon,
    stepNumber,
    id,
    noAnchor = false,
    titleSize = 'h3',
    children,
    className,
    isLast = false,
    ...props
  } = arg0

  const contentId = id ?? slugify(title)
  const tag = stepTitleTags[titleSize]
  const IconElement = resolveIcon(icon)
  const hasNumber = typeof stepNumber === 'number'

  return (
    <section id={contentId} className={clsx('clarify-steps-step relative flex items-start gap-3.5 pb-6 last:pb-0', className)} {...props}>
      <div className="relative flex flex-col items-center pt-[3px]">
        <div className="clarify-steps-step-indicator flex h-7 w-7 flex-none items-center justify-center rounded-full bg-zinc-800 text-[13px] font-semibold text-zinc-100 shadow-sm ring-1 ring-inset ring-white/10 [&_svg]:size-3.5 [&_svg]:text-zinc-100">
          {IconElement ?? (hasNumber ? stepNumber : <span>•</span>)}
        </div>
        {!isLast && <div className="absolute top-[31px] bottom-[-24px] left-1/2 w-px -translate-x-1/2 bg-zinc-800" />}
      </div>
      <div className="min-w-0 flex-1">
        {createElement(
          tag,
          {
            className: '!m-0 !mt-0 !mb-1.5 break-words text-[15px] font-semibold !leading-7 text-(--clarify-theme-tokens-colors-foreground)',
          },
          <>
            {title}
            {!noAnchor ? (
              <a
                href={`#${contentId}`}
                className="ml-2 inline-flex opacity-0 transition hover:opacity-100 text-(--clarify-theme-tokens-colors-muted) hover:text-(--clarify-theme-tokens-colors-foreground)"
                aria-label="Link to step"
              >
                <Link2 className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </>,
        )}
        <div className="clarify-steps-step-content text-[14px] leading-6 text-(--clarify-theme-tokens-colors-muted)">
          {children}
        </div>
      </div>
    </section>
  )
}

type StepsProps = {
  children?: ReactNode
  titleSize?: StepTitleSize
  className?: string
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>

export function Steps(arg0: StepsProps) {
  const { children, titleSize = 'h3', className, ...props } = arg0
  const items = Children.toArray(children).filter((item): item is ReactElement<StepContentProps> =>
    isValidElement(item) && typeof (item as ReactElement<StepContentProps>).props.title === 'string'
  )

  return (
    <div className={clsx('clarify-steps my-8', className)} {...props}>
      {items.map((child, index) => (
        <Step
          {...child.props}
          stepNumber={child.props.stepNumber ?? index + 1}
          titleSize={child.props.titleSize ?? titleSize}
          isLast={index === items.length - 1}
          key={child.key ?? child.props.title ?? index}
        >
          {child.props.children}
        </Step>
      ))}
    </div>
  )
}
