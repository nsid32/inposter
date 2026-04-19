import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InPoster",
  description: "AI-powered LinkedIn post composer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const theme = (cookieStore.get("theme")?.value || "dark") as "dark" | "light";
  return (
    <html lang="en" className={theme === "dark" ? "dark" : ""}>
      <body className={inter.className}>
        <ThemeProvider initialTheme={theme}>
          <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950">
            <Sidebar />
            <main className="flex-1 md:pl-60 min-h-screen">
              <div className="h-full p-6 md:p-8">
                {children}
              </div>
            </main>
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
