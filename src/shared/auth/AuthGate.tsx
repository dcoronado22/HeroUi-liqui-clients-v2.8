"use client";

import React, { useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const isAuth = useIsAuthenticated();
    const { instance } = useMsal();

    useEffect(() => {
        if (!isAuth) {
            instance.loginRedirect().catch(console.error);
        }
    }, [isAuth, instance]);

    if (!isAuth) return null;
    return <>{children}</>;
}
