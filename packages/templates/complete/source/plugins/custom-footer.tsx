import { useSlot } from 'virtual:clarify/slot'

export default function CustomFooter() {
  const { DefaultComponent, locale } = useSlot()
  
  return (
    <div className="py-8 border-t">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            {locale === 'zh-CN' ? '这是自定义页脚，来自插件！' : 'This is a custom footer from a plugin!'}
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
