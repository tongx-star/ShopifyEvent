import { Inter } from 'next/font/google'
import '@shopify/polaris/build/esm/styles.css'
import './globals.css'
import { PolarisProvider } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Google Ads转化追踪大师',
  description: '精准追踪，优化广告ROI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <PolarisProvider>
          <div className="app-container">
            {children}
          </div>
        </PolarisProvider>
      </body>
    </html>
  )
} 