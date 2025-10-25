 
import "~/app/globals.css";
import type { Metadata } from "next";
import { ThemeProviderClient } from "~/components/providers/theme-provider-client";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";
import { Providers } from "~/app/providers";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { Toaster } from "sonner";

const appUrl =
  process.env.NEXT_PUBLIC_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  "http://localhost:3000";

export const metadata: Metadata = {
  title: PROJECT_TITLE,
  description: PROJECT_DESCRIPTION,
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1e3a8a" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen overflow-y-auto text-white">
        <ThemeProviderClient>
          <Providers>
            <div className="min-h-screen">
              {children}
            </div>
          </Providers>
          <Toaster richColors position="top-center" />
        </ThemeProviderClient>
      </body>
    </html>
  );
}
