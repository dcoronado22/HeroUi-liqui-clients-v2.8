"use client";

import React from "react";
import { setApiErrorHandler, setUnauthorizedHandler } from "@/src/shared/lib/api/client";
import { useAuthStore } from "@liquicapital/common";
import { addToast } from "@heroui/toast";

export default function ApiHandlers({ children }: { children: React.ReactNode }) {
    const { logout } = useAuthStore();

    React.useEffect(() => {
        setApiErrorHandler((msg) => {
            addToast({ title: "Error", description: msg, color: "danger" });
        });

        setUnauthorizedHandler(() => {
            logout("/"); // o AuthService.logoutRedirect()
        });
    }, [logout]);

    return <>{children}</>;
}
