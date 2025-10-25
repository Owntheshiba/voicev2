 
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
      <head />
      <body className="min-h-screen overflow-y-auto bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 text-white">
        <ThemeProviderClient>
          <Providers>
            <SidebarProvider>
              <SidebarInset>
                <div className="flex flex-1 flex-col gap-4 lg:px-4 lg:py-10 min-h-full">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </Providers>
          <Toaster richColors position="top-center" />
        </ThemeProviderClient>
      </body>
    </html>
  );
}
