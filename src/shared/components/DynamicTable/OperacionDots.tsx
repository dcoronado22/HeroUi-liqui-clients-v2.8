"use client";
import React from "react";
import { Tooltip } from "@heroui/react";
import { operacionStateToUI } from "@/models/operacionEstado";
import { Dots, fmtPct } from "@/components/DynamicTable/dots"; // los que ya tienes

export default function OperacionDots({ estado }: { estado: number | string }) {
    const ui = operacionStateToUI(estado);
    return (
        <Tooltip content={`${ui.label} · ${fmtPct(ui.pct)}`}>
            <div className="inline-flex"><Dots pct={ui.pct} tone={ui.tone === "success" ? "success" : "primary"} /></div>
        </Tooltip>
    );
}