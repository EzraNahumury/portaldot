import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "PortalGuard — Social Recovery on Portaldot",
  description:
    "Lose your seed phrase? PortalGuard lets trusted friends recover your Portaldot account on-chain. Self-custody without permanent loss.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Toaster
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "#0a0a0f",
              border: "1px solid #27272a",
            },
          }}
        />
      </body>
    </html>
  );
}
