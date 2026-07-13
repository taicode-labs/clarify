import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import clsx from 'clsx'
import { Maximize2, X } from 'lucide-react'
import { type ComponentPropsWithoutRef, type ReactNode, useState } from 'react'

export type FigureProps = {
  src: string
  alt: string
  caption?: ReactNode
  zoom?: boolean
  imageProps?: Omit<ComponentPropsWithoutRef<'img'>, 'alt' | 'src'>
} & Omit<ComponentPropsWithoutRef<'figure'>, 'children'>

export function Figure(arg0: FigureProps) {
  const { src, alt, caption, zoom = false, imageProps, className, ...props } = arg0
  const [open, setOpen] = useState(false)
  const image = (
    <img
      {...imageProps}
      src={src}
      alt={alt}
      className={clsx('block h-auto max-w-full object-contain', imageProps?.className)}
    />
  )

  return (
    <figure className={clsx('clarify-figure not-prose mx-auto my-8 w-fit max-w-full', className)} {...props}>
      <div className="group relative w-fit max-w-full overflow-hidden rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-ui-subtle-background)">
        {zoom ? (
          <button
            type="button"
            className="block max-w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--clarify-theme-tokens-colors-primary)"
            aria-label={`Enlarge image: ${alt}`}
            onClick={() => setOpen(true)}
          >
            {image}
            <span className="absolute right-3 bottom-3 grid size-8 place-items-center rounded-md border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-background)/90 text-(--clarify-ui-text-soft) opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-within:opacity-100">
              <Maximize2 className="size-4" aria-hidden="true" />
            </span>
          </button>
        ) : image}
      </div>
      {caption ? <figcaption className="mt-2 text-center text-xs/5 text-(--clarify-ui-text-faint)">{caption}</figcaption> : null}
      {zoom ? (
        <Dialog open={open} onClose={setOpen} className="relative z-50">
          <DialogBackdrop className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
            <DialogPanel className="relative max-h-full max-w-full overflow-auto rounded-(--clarify-theme-tokens-radius-lg) bg-(--clarify-theme-tokens-colors-background) p-2 shadow-2xl">
              <img src={src} alt={alt} className="max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-5rem)] object-contain" />
              <button
                type="button"
                className="absolute top-4 right-4 grid size-9 place-items-center rounded-md border border-white/20 bg-black/65 text-white transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Close image preview"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </DialogPanel>
          </div>
        </Dialog>
      ) : null}
    </figure>
  )
}
