"use client";

import * as React from "react";
import { Button } from "@heroui/react";
import { cn } from "@heroui/react";

type Props = {
    onPrev?: () => void;
    onNext?: () => void;
    disablePrev?: boolean;
    disableNext?: boolean;
    loadingNext?: boolean;
    className?: string;
};

export default function StepActions({
    onPrev,
    onNext,
    disablePrev,
    disableNext,
    loadingNext,
    className,
}: Props) {
    return (
        <div
            className={cn(
                // barra “persistente”
                "w-full",
                "px-3 sm:px-4 py-3",
                className,
            )}
        >
            <div className="mx-auto flex  items-center justify-between gap-2">
                <Button
                    variant="flat"
                    isDisabled={disablePrev}
                    onPress={onPrev}
                >
                    Anterior
                </Button>

                <Button
                    color="primary"
                    isDisabled={disableNext}
                    isLoading={loadingNext} // <-- agrega esta línea para mostrar loading
                    onPress={onNext}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
