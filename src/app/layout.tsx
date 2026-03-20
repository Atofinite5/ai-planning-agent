import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Planning Agent | Multi-Agent Report Generator",
  description: "Generate structured execution plans using a multi-agent AI system. Powered by Groq and Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
