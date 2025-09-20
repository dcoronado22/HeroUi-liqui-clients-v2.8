"use client";

import * as React from "react";
import type { ThemeProviderProps } from "next-themes";
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@heroui/react";
import { MsalProvider } from "@azure/msal-react";
import { AuthService } from "@liquicapital/common";
import { useRouter } from "next/navigation";
import { ProcessActionProviders } from "../shared/processes/ProcessProviders";

export function ClientProviders({
  children,
  themeProps,
}: {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}) {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    AuthService.initialize()
      .catch(console.error)
      .finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, []);

  if (!ready) return null; // puedes renderizar un splash/spinner si prefieres

  return (
    <MsalProvider instance={AuthService.msalInstance as any}>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>
          <ToastProvider placement="top-center" />
          <ProcessActionProviders>
            {children}
          </ProcessActionProviders>
        </NextThemesProvider>
      </HeroUIProvider>
    </MsalProvider>
  );
}
