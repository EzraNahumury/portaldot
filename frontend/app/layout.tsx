import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "PortalGuard — Social recovery on Portaldot",
  description:
    "Designate trusted friends as guardians. If you ever lose access, they can collectively restore your Portaldot account on chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col relative">
        <Header />
        <main className="relative flex-1 flex flex-col">{children}</main>
        <Toaster
          theme="dark"
          richColors
          closeButton
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#14110f",
              border: "1px solid #2c2724",
              color: "#f5f5f4",
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
