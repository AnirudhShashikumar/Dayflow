import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Dayflow HRMS", template: "%s · Dayflow" }, description: "Every workday, perfectly aligned." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning><body><ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>{children}<Toaster richColors position="top-right" /></ThemeProvider></body></html>;
}
