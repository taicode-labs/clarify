import { useClarifySlot, useConfig } from 'virtual:clarify-slot'

export default function CustomBanner() {
  const config = useConfig()
  const { locale, DefaultComponent } = useClarifySlot()
  
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm">
        {locale === 'zh-CN' 
          ? `🎉 欢迎使用 ${config.title}！这是自定义横幅。` 
          : `🎉 Welcome to ${config.title}! This is a custom banner.`}
      </div>
    </div>
  )
}
