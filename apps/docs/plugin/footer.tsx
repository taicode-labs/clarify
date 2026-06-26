import { useSlot } from 'virtual:clarify/slot'

export default function DocsFooter() {
  const { DefaultComponent } = useSlot()
  return <DefaultComponent />
}
