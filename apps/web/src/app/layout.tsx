import type { Metadata, Viewport } from "next";
import "./globals.css";
import "material-symbols/rounded.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "개미청소",
    template: "%s | 개미청소",
  },
  description: "개미청소 건물관리 앱",
  applicationName: "개미청소",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "개미청소",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E9CF2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Pretendard Variable — self-host 권장이지만 우선 CDN으로 시작 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Material Symbols Rounded (variable font) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..700,0..1,-25..200&display=swap"
        />
      </head>
      <body className="bg-white text-[#0B1B2B] antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
