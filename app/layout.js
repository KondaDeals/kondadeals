import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata = {
  title: 'KondaDeals - Viral Gadgets & Trending Products',
  description: 'Shop trending viral gadgets, home decor, kitchen tools at unbeatable prices. Free delivery on orders above ₹499.',
  keywords: 'viral gadgets, trending products, cheap gadgets india, kondadeals',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: 'any', type: 'image/png' },
    ],
    apple: { url: '/favicon.png' },
    shortcut: { url: '/favicon.png' },
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'KondaDeals - Viral Gadgets & Trending Products',
    description: 'Shop trending viral gadgets at unbeatable prices.',
    url: 'https://kondadeals.com',
    siteName: 'KondaDeals',
    images: [{ url: '/favicon.png', width: 640, height: 640, alt: 'KondaDeals' }],
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <meta name="theme-color" content="#e53935" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {/* Preconnect to Supabase for faster API calls */}
  <link rel="preconnect" href="https://ymnsirmzoxvnbxcmmtpw.supabase.co" />
  <link rel="dns-prefetch" href="https://ymnsirmzoxvnbxcmmtpw.supabase.co" />
  {/* Preconnect to CDN for faster image loading */}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { background: '#1a1a1a', color: '#fff', fontSize: '14px' },
            success: { iconTheme: { primary: '#e53935', secondary: '#fff' } },
          }}
        />
        {children}
      </body>
    </html>
  )
}