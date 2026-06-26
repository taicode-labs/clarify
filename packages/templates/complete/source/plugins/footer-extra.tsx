import { useSlot } from 'virtual:clarify/slot'

export default function FooterExtra() {
  const { locale, plugin } = useSlot()
  
  return (
    <div className="py-2 text-center text-xs text-gray-500 dark:text-gray-400">
      {locale === 'zh-CN' 
        ? `来自插件 "${plugin}" 的额外内容` 
        : `Extra content from plugin "${plugin}"`}
    </div>
  )
}
