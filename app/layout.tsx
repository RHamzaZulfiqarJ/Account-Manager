import "./globals.css"
import CursorTracker from "@/components/CursorTracker"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 overflow-x-hidden">
        <CursorTracker />
        {children}
      </body>
    </html>
  )
}
