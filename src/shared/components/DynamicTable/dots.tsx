"use client";
import React from "react";
import { Tooltip } from "@heroui/react";
import { stateToUI } from "@/models/vinculacionEstado";

// Reutilizamos tu fmtPct
export const fmtPct = (n: number) => `${Math.round(n)} %`;

// Versión con “tone” para colorear: primary / success / danger
export const Dots = ({ pct, tone = "primary" }: { pct: number; tone?: "primary" | "success" | "danger" }) => {
    const filled = Math.round((pct / 100) * 5);
    const isFull = pct === 100;

    const filledClass =
        tone === "danger"
            ? "bg-danger"
            : isFull
                ? "bg-success"
                : "bg-primary";

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <span
                        key={i}
                        className={[
                            "inline-block h-3 w-3 rounded-full",
                            i < filled
                                ? filledClass
                                : "bg-default-300/40 dark:bg-default-500/40",
                        ].join(" ")}
                    />
                ))}
            </div>
            <span className="text-sm text-foreground/70">{fmtPct(pct)}</span>
        </div>
    );
};

export function EstadoDots({ estado }: { estado: string | number }) {
    const ui = stateToUI(estado);
    return (
        <Tooltip content={`${ui.label} · ${fmtPct(ui.pct)}`}>
            <div className="inline-flex">
                <Dots pct={ui.pct} tone={ui.tone} />
            </div>
        </Tooltip>
    );
}

