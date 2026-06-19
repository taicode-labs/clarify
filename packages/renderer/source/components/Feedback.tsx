import { Transition } from '@headlessui/react'
import clsx from 'clsx'
import { forwardRef, useState } from 'react'
import type { ComponentPropsWithoutRef, ElementRef, FormEvent } from 'react'

import { useBuiltInText } from '../i18n'

function CheckIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="10" strokeWidth="0" />
      <path
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="m6.75 10.813 2.438 2.437c1.218-4.469 4.062-6.5 4.062-6.5"
      />
    </svg>
  )
}

function FeedbackButton(props: Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'className'>) {
  return (
    <button
      type="submit"
      className="clarify-feedback-button px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-900/2.5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
      {...props}
    />
  )
}

const FeedbackForm = forwardRef<ElementRef<'form'>, ComponentPropsWithoutRef<'form'>>(function FeedbackForm(arg0, ref,) {  const { onSubmit, className, ...props } = arg0
  const t = useBuiltInText()

  return (
    <form
      {...props}
      ref={ref}
      onSubmit={onSubmit}
      className={clsx(className, 'clarify-feedback-form absolute inset-0 flex items-center justify-center gap-6 md:justify-start')}
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('feedback.prompt')}</p>
      <div className="clarify-feedback-actions group grid h-8 grid-cols-[1fr_1px_1fr] overflow-hidden rounded-full border border-zinc-900/10 dark:border-white/10">
        <FeedbackButton data-response="yes">{t('feedback.yes')}</FeedbackButton>
        <div className="bg-zinc-900/10 dark:bg-white/10" />
        <FeedbackButton data-response="no">{t('feedback.no')}</FeedbackButton>
      </div>
    </form>
  )
})

const FeedbackThanks = forwardRef<ElementRef<'div'>, ComponentPropsWithoutRef<'div'>>(function FeedbackThanks(arg0, ref,) {  const { className, ...props } = arg0
  const t = useBuiltInText()

  return (
    <div {...props} ref={ref} className={clsx(className, 'clarify-feedback-thanks absolute inset-0 flex justify-center md:justify-start')}>
      <div className="flex items-center gap-3 rounded-full bg-(--clarify-ui-accent-background) py-1 pr-3 pl-1.5 text-sm text-(--clarify-ui-accent-text) ring-1 ring-(--clarify-ui-accent-border) ring-inset">
        <CheckIcon className="h-5 w-5 flex-none fill-(--clarify-ui-accent-text) stroke-white dark:fill-(--clarify-ui-accent-background) dark:stroke-(--clarify-ui-accent-text)" />
        {t('feedback.thanks')}
      </div>
    </div>
  )
})

export function Feedback() {
  const [submitted, setSubmitted] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="clarify-feedback relative h-8">
      <Transition show={!submitted}>
        <FeedbackForm className="duration-300 data-closed:opacity-0 data-leave:pointer-events-none" onSubmit={onSubmit} />
      </Transition>
      <Transition show={submitted}>
        <FeedbackThanks className="delay-150 duration-300 data-closed:opacity-0" />
      </Transition>
    </div>
  )
}
