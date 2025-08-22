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

    const clear = React.useCallback(() => {
        if (timer.current) {
            clearInterval(timer.current);
        }
        timer.current = null;
        running.current = false;
    }, []);

    const tick = React.useCallback(async () => {
        // 🟢 Si ya está corriendo, simplemente saltamos este tick
        if (running.current) {
            console.log('Tick skipped - already running');
            return;
        }

        running.current = true;
        console.log('Polling tick started'); // Para debug

        try {
            const res = await task();
            console.log('Polling result:', res); // Para debug

            onTick?.(res);

            if (isDone(res)) {
                console.log('Polling completed - isDone returned true');
                clear();
                onDone?.(res);
                return;
            }

            ticks.current += 1;
            console.log(`Tick ${ticks.current}${maxTicks ? `/${maxTicks}` : ''}`);

            if (maxTicks && ticks.current >= maxTicks) {
                console.log('Polling stopped - max ticks reached');
                clear();
            }
        } catch (error) {
            console.error('Polling error:', error);
            clear(); // en error cortamos para no spamear
        } finally {
            // 🟢 CRUCIAL: Siempre liberar el flag running
            running.current = false;
        }
    }, [task, isDone, onTick, onDone, maxTicks, clear]);

    // Limpiar al desmontar el componente
    React.useEffect(() => {
        return clear;
    }, [clear]);

    // Control principal del polling
    React.useEffect(() => {
        if (!enabled) {
            clear();
            ticks.current = 0;
            return;
        }

        console.log('Starting polling...');

        // Primer tick inmediato
        tick();

        // Configurar intervalos
        timer.current = setInterval(tick, intervalMs);

        // Cleanup al cambiar dependencias
        return () => {
            clear();
        };
    }, [enabled, intervalMs, tick, clear]);

    // Pausa si la pestaña está oculta (opcional)
    React.useEffect(() => {
        if (!pauseWhenHidden) return;

        const onVisibilityChange = () => {
            if (document.hidden) {
                console.log('Tab hidden - pausing polling');
                if (timer.current) {
                    clearInterval(timer.current);
                    timer.current = null;
                }
            } else if (enabled && !timer.current) {
                console.log('Tab visible - resuming polling');
                ticks.current = 0;
                tick(); // tick inmediato al volver
                timer.current = setInterval(tick, intervalMs);
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    }, [enabled, intervalMs, tick, pauseWhenHidden]);

    return { stop: clear };
}