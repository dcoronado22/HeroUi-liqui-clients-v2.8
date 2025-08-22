"use client";

import * as React from "react";
import { Card, CardBody } from "@heroui/react";

type Props = { title: string; note?: string };

export default function StepPlaceholder({ title, note }: Props) {
    return (
        <Card shadow="none" className="border border-dashed border-divider">
            <CardBody>
                <h2 className="text-lg font-semibold">{title}</h2>
                {note && <p className="text-small text-default-500 mt-1">{note}</p>}
                <div className="mt-4 text-default-600 text-small">
                    {/* TODO: reemplaza por tu UI real de este paso */}
                    Contenido del paso en construcción.
                </div>
            </CardBody>
        </Card>
    );
}
