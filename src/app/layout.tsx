import "@/styles/globals.css";
import clsx from "clsx";
import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import ApiHandlers from "./api-handlers";
import { ClientProviders } from "./providers";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s - ${siteConfig.name}` },
  description: siteConfig.description,
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="es">
      <body className={clsx("min-h-screen text-foreground bg-background font-sans antialiased", fontSans.variable)}>
        <ClientProviders themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <ApiHandlers>
            {children}
          </ApiHandlers>
        </ClientProviders>
      </body>
    </html>
  );
}
