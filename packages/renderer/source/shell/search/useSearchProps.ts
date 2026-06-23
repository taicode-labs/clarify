import { useRef, useState } from 'react'

export function useSearchProps() {
  const buttonRef = useRef<React.ElementRef<'button'>>(null)
  const [open, setOpen] = useState(false)

  return {
    buttonProps: {
      ref: buttonRef,
      onClick() {
        setOpen(true)
      },
    },
    dialogProps: {
      open,
      setOpen,
    },
  }
}
