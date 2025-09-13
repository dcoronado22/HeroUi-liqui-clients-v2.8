"use client";

import * as React from "react";

type UsePollingParams<T> = {
    enabled: boolean;
    intervalMs?: number;          // default 8s
    task: () => Promise<T>;       // llamada al API por tick
    isDone: (r: T) => boolean;    // condición de finalización
    onTick?: (r: T) => void;      // opcional: para side-effects por tick
    onDone?: (r: T) => void;      // opcional: al terminar
    maxTicks?: number;            // opcional: failsafe
    pauseWhenHidden?: boolean;    // default true
};

export function usePolling<T>({
    enabled,
    intervalMs = 10000,
    task,
    isDone,
    onTick,
    onDone,
    maxTicks,
    pauseWhenHidden = true,
}: UsePollingParams<T>) {
    const ticks = React.useRef(0);
    const timer = React.useRef<NodeJS.Timeout | null>(null);
    const running = React.useRef(false);
    const lastRun = React.useRef<number>(0);

    const clear = React.useCallback(() => {
        if (timer.current) {
            console.log('[usePolling] clearing interval');
            clearInterval(timer.current);
        } else {
            console.log('[usePolling] clear called (no active timer)');
        }
        timer.current = null;
        running.current = false;
    }, []);

    const tick = React.useCallback(async () => {
        const now = Date.now();
        if (!enabled) {
            console.log('[usePolling] tick aborted (enabled=false)');
            return;
        }
        // Guard anti-rafaga: evita ticks más rápidos que el intervalo configurado.
        if (lastRun.current && now - lastRun.current < intervalMs - 50) {
            console.log('[usePolling] tick skipped (min interval guard)', {
                elapsed: now - lastRun.current,
                intervalMs
            });
            return;
        }
        if (running.current) {
            console.log('[usePolling] tick skipped (previous still running)');
            return;
        }
        // >>> FIX: marcar el tick como "en curso" antes de ejecutar la tarea
        running.current = true;
        lastRun.current = now;
        const tickNumber = ticks.current + 1;
        console.log(`[usePolling] ▶ tick ${tickNumber} starting...`);
        try {
            const res = await task();
            console.log(`[usePolling] ✓ tick ${tickNumber} result`, res);
            onTick?.(res);
            const done = isDone(res);
            console.log(`[usePolling] isDone(${tickNumber}) => ${done}`);
            if (done) {
                console.log('[usePolling] ✅ completed (isDone=true)');
                clear();
                onDone?.(res);
                return;
            }
            ticks.current += 1;
            if (maxTicks && ticks.current >= maxTicks) {
                console.warn('[usePolling] ⛔ maxTicks reached -> stopping');
                clear();
            }
        } catch (error) {
            console.error('[usePolling] ✖ error in tick', error);
            clear();
        } finally {
            running.current = false; // ← se libera aquí, evitando reentradas simultáneas
            console.log(`[usePolling] ▶ tick ${tickNumber} finished`);
        }
    }, [enabled, task, isDone, onTick, onDone, maxTicks, clear, intervalMs]);

    // Limpiar al desmontar el componente
    React.useEffect(() => {
        return clear;
    }, [clear]);

    // Control principal del polling
    React.useEffect(() => {
        console.log('[usePolling] effect(enabled) ->', { enabled, intervalMs, maxTicks });
        if (!enabled) {
            if (ticks.current !== 0) console.log('[usePolling] disabling & resetting ticks');
            clear();
            ticks.current = 0;
            return;
        }
        console.log('[usePolling] starting (immediate tick + interval)');
        tick();
        timer.current = setInterval(tick, intervalMs);
        return () => {
            console.log('[usePolling] cleanup (dependency change/unmount)');
            clear();
        };
    }, [enabled, intervalMs, tick, clear]);

    // Pausa si la pestaña está oculta (opcional)
    React.useEffect(() => {
        if (!pauseWhenHidden) return;
        const onVisibilityChange = () => {
            if (document.hidden) {
                console.log('[usePolling] document hidden -> pausing');
                if (timer.current) {
                    clearInterval(timer.current);
                    timer.current = null;
                }
            } else if (enabled && !timer.current) {
                console.log('[usePolling] document visible -> resuming');
                ticks.current = 0;
                tick();
                timer.current = setInterval(tick, intervalMs);
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    }, [enabled, intervalMs, tick, pauseWhenHidden]);

    return { stop: clear };
}