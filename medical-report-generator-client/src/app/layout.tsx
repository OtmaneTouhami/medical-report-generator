import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/contexts/chat-context";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/theme-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedReport AI | Medical Reports for Healthcare Professionals",
  description: "AI-powered medical report generator for healthcare professionals",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ChatProvider>{children}</ChatProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
