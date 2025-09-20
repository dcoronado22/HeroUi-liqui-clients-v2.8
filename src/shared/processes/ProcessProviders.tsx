"use client";

import React from "react";
import { ProcessProvider } from "./processStore";
import { ActionProvider } from "./actionStore";

export function ProcessActionProviders({ children }: { children: React.ReactNode }) {
    return (
        <ProcessProvider>
            <ActionProvider>
                {children}
            </ActionProvider>
        </ProcessProvider>
    );
}