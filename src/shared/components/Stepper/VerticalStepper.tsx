"use client";

import * as React from "react";
import { Badge, Chip, cn, Progress, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import type { StepperPropsBase, StepId } from "@/src/shared/types/stepper";
import { useResolvedSteps } from "@/src/shared/hooks/useResolvedSteps";
import SupportCard from "./SupportCard";

type Props<TCtx = any> = StepperPropsBase<TCtx> & {
    className?: string;
    compact?: boolean;
    hideConnectors?: boolean;
    markActiveAsCompleteIds?: StepId[]; // NUEVO
};

export default function VerticalStepper<TCtx = any>({
    steps,
    ctx,
    currentId,
    onChange,
    clickable = true,
    className,
    compact = true,
    hideConnectors = false,
    markActiveAsCompleteIds = [], // NUEVO
}: Props<TCtx>) {
    const { steps: visible, findIndex } = useResolvedSteps(steps, ctx);
    const currentIdx = Math.max(0, findIndex(currentId));
    const isActive = (i: number) => i === currentIdx;
    const isDone = (i: number) => i < currentIdx;

    const handleClick = (id: StepId, disabled?: boolean) => {
        if (!clickable || disabled) return;
        onChange?.(id);
    };

    return (
        <LazyMotion features={domAnimation}>
            {/* <p className="text-sm text-default-500  px-3 mb-1 mt-2">
                Follow the steps to configure your account. This allows you to set up your business address.
            </p> */}
            <nav
                aria-label="Progress"
                className={cn(
                    "max-w-full h-full flex flex-col py-0 px-3",
                    className,
                    compact && "-px-10"
                )}
            >
                <ol className="relative flex flex-col flex-1 justify-between min-h-0 py-1">
                    {visible.map((s, i) => {
                        const disabled = s.disabled ? s.disabled(ctx as TCtx) : false;
                        let status: "inactive" | "active" | "complete" =
                            isActive(i) ? "active" : isDone(i) ? "complete" : "inactive";
                        if (status === "active" && markActiveAsCompleteIds.includes(s.id)) {
                            status = "complete"; // NUEVO
                        }

                        return (
                            <m.li key={s.id} className="relative">
                                {/* Conector vertical mejorado */}
                                {!hideConnectors && i < visible.length - 1 && (
                                    <div
                                        aria-hidden="true"
                                        className="pointer-events-none absolute left-[31px] top-[63px] w-[1px] bg-gradient-to-b from-default-200 to-default-100 dark:from-default-300/40 dark:to-default-200/20"
                                        style={{ height: "calc(100%)" }}
                                    >
                                        <m.div
                                            className="w-full bg-gradient-to-b from-primary to-primary-400 shadow-sm"
                                            initial={{ height: 0 }}
                                            animate={{ height: isDone(i) ? "100%" : 0 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                        />
                                    </div>
                                )}

                                {/* Botón del step con mejoras estéticas */}
                                <button
                                    type="button"
                                    aria-current={status === "active" ? "step" : undefined}
                                    disabled={disabled || !clickable}
                                    onClick={() => handleClick(s.id, disabled)}
                                    className={cn(
                                        "group flex w-full items-center gap-4 rounded-large transition-all duration-200",
                                        compact ? "py-3 px-2" : "py-4 px-3",
                                        disabled && "opacity-50 cursor-not-allowed",
                                        clickable && !disabled && "cursor-pointer hover:bg-content2/40 hover:shadow-small hover:scale-[1.01] active:scale-[0.99]",
                                        status === "active" && !compact && "bg-primary/5 border border-primary/20 shadow-small"
                                    )}
                                >
                                    {/* Bullet con icono mejorado */}
                                    <m.div
                                        className={cn(
                                            "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 shadow-small",
                                            "transition-all duration-300 ease-out"
                                        )}
                                        initial={false}
                                        animate={status}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        variants={{
                                            inactive: {
                                                backgroundColor: "hsl(var(--heroui-content1))",
                                                borderColor: "hsl(var(--heroui-default-200))",
                                                color: "hsl(var(--heroui-default-400))",
                                                scale: 1,
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                            },
                                            active: {
                                                backgroundColor: "hsl(var(--heroui-content1))",
                                                borderColor: "hsl(var(--heroui-primary))",
                                                color: "hsl(var(--heroui-primary))",
                                                scale: 1.05,
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1), 0 0 0 3px color-mix(in oklab, hsl(var(--heroui-primary)) 12%, transparent)",
                                            },
                                            complete: {
                                                backgroundColor: "hsl(var(--heroui-primary))",
                                                borderColor: "hsl(var(--heroui-primary))",
                                                color: "hsl(var(--heroui-primary-foreground))",
                                                scale: 1,
                                                boxShadow: "0 4px 14px color-mix(in oklab, hsl(var(--heroui-primary)) 25%, transparent)",
                                            },
                                        }}
                                    >
                                        {status === "complete" ? (
                                            <Badge
                                                isOneChar
                                                color="success"
                                                content={<Icon icon="mdi:check-bold" color="white" />}
                                                placement="bottom-right"
                                                className="translate-x-4 translate-y-4"
                                            >
                                                <Icon
                                                    icon={s.icon || "solar:dotpoints-bold"}
                                                    width={20}
                                                    height={20}
                                                    className="transition-all duration-200 group-hover:scale-110 group-active:scale-95"
                                                />
                                            </Badge>
                                        ) : (
                                            <Icon
                                                icon={s.icon || "solar:dotpoints-bold"}
                                                width={20}
                                                height={20}
                                                className="transition-all duration-200 group-hover:scale-110 group-active:scale-95"
                                            />
                                        )}
                                    </m.div>

                                    {/* Texto con mejoras tipográficas */}
                                    <div className="min-w-0 flex-1 self-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <m.span
                                                className={cn(
                                                    "truncate font-semibold tracking-tight transition-colors duration-200",
                                                    status === "inactive" && "text-default-500",
                                                    status === "active" && !compact && "text-primary font-bold",
                                                    status === "complete" && "text-default-700 dark:text-default-300"
                                                )}
                                                title={s.title}
                                                initial={false}
                                                animate={{
                                                    scale: status === "active" && !compact ? 1.02 : 1,
                                                }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {s.title}
                                            </m.span>

                                            {disabled && (
                                                <Tooltip content="Completa los pasos previos" placement="right" delay={300}>
                                                    <Icon
                                                        className="text-default-300 hover:text-default-400 transition-colors"
                                                        icon="solar:lock-linear"
                                                        width={14}
                                                    />
                                                </Tooltip>
                                            )}
                                        </div>
                                        {s.description && (
                                            <p
                                                className={cn(
                                                    "truncate text-small text-left transition-colors duration-200 leading-relaxed",
                                                    compact ? "mt-0.5" : "mt-1",
                                                    status === "inactive" && "text-default-400",
                                                    status === "active" && !compact && "text-default-600 font-medium",
                                                    status === "complete" && "text-default-500"
                                                )}
                                                title={typeof s.description === "string" ? s.description : undefined}
                                            >
                                                {s.description}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            </m.li>
                        );
                    })}
                </ol>
                {!compact && (<SupportCard className="mt-2" />)}

            </nav>
        </LazyMotion>
    );
}