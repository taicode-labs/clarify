import { useClarifySlot, useConfig } from 'virtual:clarify-slot'

export default function CustomFooter() {
  const config = useConfig()
  const { DefaultComponent, locale } = useClarifySlot()
  
  return (
    <div className="py-8 border-t">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            {locale === 'zh-CN' ? '这是自定义页脚，来自插件！' : 'This is a custom footer from a plugin!'}
          </p>
          <p className="mt-2">
            {config.title}
          </p>
        </div>
        
        {/* 也可以选择性地渲染默认页脚 */}
        <div className="mt-4">
          <DefaultComponent />
        </div>
      </div>
    </div>
  )
}
