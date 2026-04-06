import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata = {
  title: 'KondaDeals - Viral Gadgets & Trending Products',
  description: 'Shop trending viral gadgets, home decor, kitchen tools at unbeatable prices. Free delivery on orders above ₹499.',
  keywords: 'viral gadgets, trending products, cheap gadgets india, kondadeals',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#e53935', secondary: '#fff' },
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}