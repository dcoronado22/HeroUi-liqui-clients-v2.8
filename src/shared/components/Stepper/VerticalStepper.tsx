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

    const itemRefs = React.useRef<(HTMLLIElement | null)[]>([]);
    const lineWidth = 1; // px
    const [connectorHeights, setConnectorHeights] = React.useState<number[]>([]);

    React.useLayoutEffect(() => {
        if (hideConnectors) return;
        const heights: number[] = [];
        for (let i = 0; i < itemRefs.current.length; i++) {
            const li = itemRefs.current[i];
            const nextLi = itemRefs.current[i + 1];
            if (!li || !nextLi) {
                heights[i] = 0;
                continue;
            }
            const bullet = li.querySelector("[data-bullet]") as HTMLElement | null;
            const nextBullet = nextLi.querySelector("[data-bullet]") as HTMLElement | null;
            if (!bullet || !nextBullet) {
                heights[i] = 0;
                continue;
            }
            const bulletRect = bullet.getBoundingClientRect();
            const nextBulletRect = nextBullet.getBoundingClientRect();
            const height = Math.max(0, nextBulletRect.top - bulletRect.bottom);
            heights[i] = height;
        }
        setConnectorHeights(heights);
    }, [visible, compact, hideConnectors, currentIdx]);

    React.useEffect(() => {
        if (hideConnectors) return;
        const handler = () => setConnectorHeights([]);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, [hideConnectors]);

    const handleClick = (id: StepId, disabled?: boolean) => {
        if (!clickable || disabled) return;
        onChange?.(id);
    };

    return (
        <LazyMotion features={domAnimation}>
            <nav
                aria-label="Progress"
                className={cn(
                    "max-w-full h-full flex flex-col py-0",
                    className,
                    compact ? "items-center px-0" : "px-3"
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
                        const accessibleLabel = compact
                            ? `${s.title}${typeof s.description === "string" ? `. ${s.description}` : ""}`
                            : undefined;
                        return (
                            <m.li
                                key={s.id}
                                className={cn("relative", compact && "flex justify-center")}
                                ref={(el) => { itemRefs.current[i] = el; }}
                            >
                                <button
                                    type="button"
                                    aria-current={status === "active" ? "step" : undefined}
                                    aria-label={accessibleLabel}
                                    disabled={disabled || !clickable}
                                    onClick={() => handleClick(s.id, disabled)}
                                    className={cn(
                                        "group flex rounded-large transition-all duration-200",
                                        // Modo compacto: solo el bullet centrado
                                        compact && "w-12 h-12 items-center justify-center px-20 gap-0 bg-transparent hover:bg-transparent",
                                        // Modo expandido
                                        !compact && "w-full items-center gap-4 py-4 px-3",
                                        disabled && "opacity-50 cursor-not-allowed",
                                        clickable && !disabled && "cursor-pointer hover:shadow-small hover:scale-[1.01] active:scale-[0.99]",
                                        status === "active" && !compact && "bg-primary/5 border border-primary/20 shadow-small"
                                    )}
                                >
                                    {/* Bullet con icono mejorado */}
                                    <m.div
                                        data-bullet
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
                                        {!hideConnectors && i < visible.length - 1 && connectorHeights[i] > 0 && (
                                            <div
                                                aria-hidden="true"
                                                className="absolute top-full left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-default-200 to-default-100 dark:from-default-300/40 dark:to-default-200/20"
                                                style={{ height: connectorHeights[i], width: lineWidth }}
                                            >
                                                <m.div
                                                    className="w-full bg-gradient-to-b from-primary to-primary-400 shadow-sm"
                                                    initial={{ height: 0 }}
                                                    animate={{ height: isDone(i) ? "100%" : 0 }}
                                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                                    style={{ width: lineWidth }}
                                                />
                                            </div>
                                        )}
                                    </m.div>

                                    {/* Texto con mejoras tipográficas */}
                                    {!compact && (
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
                                    )}
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