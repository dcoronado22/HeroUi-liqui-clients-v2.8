import React, {
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
    useCallback,
    useState
} from "react";
import { motion, useAnimation, AnimatePresence, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";

type CheckAnimationProps = {
    autoPlay?: boolean;
    onComplete?: () => void;
    size?: number;
    colorClass?: string;
    title?: string;
    subtitle?: string;
    showMessage?: boolean;
    delayStart?: number;

    /** Tiempo TOTAL tras el cual se hace fade-out (incluye animación base + hold) */
    autoHideAfterMs?: number;

    /** Tiempo que se mantiene visible el hero (check + mensaje) después de la animación base */
    holdVisibleMs?: number;

    className?: string;
    fullScreen?: boolean;

    /** Mantiene el fondo coloreado visible (por defecto TRUE si coverParent o fullScreen) */
    keepBackgroundVisible?: boolean;

    /** Mantiene el hero visible hasta el fade final */
    keepHeroVisible?: boolean;

    /** Si NO quieres que el fondo permanezca, puedes forzar a FALSE */
    persistBackground?: boolean; // compatibilidad

    backgroundFadeDelayMs?: number; // compatibilidad
    coverParent?: boolean;
    shiftToTopAfterBackground?: boolean; // compatibilidad (quedará desactivado si keepHeroVisible)
    topPadding?: number; // compat
    postShiftMessage?: string;
    shrinkScale?: number;
    children?: React.ReactNode;
    renderAfterShift?: React.ReactNode;
};

export type CheckAnimationHandle = {
    play: () => void;
    reset: () => void;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const CheckAnimation = forwardRef<CheckAnimationHandle, CheckAnimationProps>(
    (
        {
            autoPlay = true,
            onComplete,
            size = 128,
            colorClass = "success",
            title = "¡Operación completada!",
            subtitle = "La operación se ha realizado con éxito.",
            showMessage = true,
            delayStart = 0,
            autoHideAfterMs,
            holdVisibleMs,

            className = "",
            fullScreen = false,
            coverParent = false,

            // Nuevos comportamientos
            keepHeroVisible = true,
            keepBackgroundVisible,
            // Props legacy (quedan soportadas pero se ignoran si keepHeroVisible === true)
            persistBackground = false,
            backgroundFadeDelayMs = 1200,
            shiftToTopAfterBackground = true,

            topPadding = 16,
            postShiftMessage = "Mira tu resumen y documentos",
            shrinkScale = 0.68,
            children,
            renderAfterShift
        },
        ref
    ) => {
        const reduced = useReducedMotion();

        const rootControls = useAnimation();
        const checkControls = useAnimation();
        const glowControls = useAnimation();
        const messageControls = useAnimation();
        const haloControls = useAnimation();
        const backgroundControls = useAnimation();
        const postShiftControls = useAnimation();
        const heroControls = useAnimation();

        const hidden = useRef(false);
        const containerRef = useRef<HTMLDivElement | null>(null);

        // Si coverParent/fullScreen y no se especifica, por defecto mantenemos el fondo visible
        const keepBg = keepBackgroundVisible ?? (coverParent || fullScreen);

        const [showContent, setShowContent] = useState(false);

        const reset = useCallback(() => {
            hidden.current = false;
            rootControls.set({ opacity: 1, scale: 1, y: 0 });
            checkControls.set({ scale: 0, opacity: 0, rotate: 0 });
            glowControls.set({ opacity: 0, scale: 0.2 });
            haloControls.set({ opacity: 0, scale: 0.4 });
            messageControls.set({ opacity: 0, y: 12 });
            backgroundControls.set({ opacity: 0, clipPath: "circle(0% at 50% 50%)" });
            postShiftControls.set({ opacity: 0, y: 16 });
            heroControls.set({ y: 0, opacity: 1 });
            setShowContent(false);
        }, [
            rootControls,
            checkControls,
            glowControls,
            haloControls,
            messageControls,
            backgroundControls,
            postShiftControls,
            heroControls
        ]);

        const play = useCallback(async () => {
            reset();
            if (delayStart) await sleep(delayStart);

            // No bloquees el check con el fondo: anímalo en paralelo (sin await)
            if (fullScreen || coverParent) {
                backgroundControls.set({
                    opacity: 0.9,
                    clipPath: "circle(0% at 50% 50%)",
                });
                backgroundControls.start({
                    opacity: 1,
                    clipPath: "circle(160% at 50% 50%)",
                    transition: {
                        duration: reduced ? 0.9 : 2.9, // ⬅️ más lento que antes (antes 1.6 aprox)
                        ease: [0.16, 1, 0.3, 1],
                    },
                });
            }

            // Lanza hero + check prácticamente juntos
            await Promise.all([
                rootControls.start({
                    scale: [0.9, 1.05, 1],
                    opacity: 1,
                    transition: reduced
                        ? { duration: 0.2 }
                        : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
                }),
                (async () => {
                    // pequeño solape para que se sienta natural
                    await sleep(120);
                    await checkControls.start({
                        scale: 1,
                        opacity: 1,
                        transition: reduced
                            ? { duration: 0.35 }
                            : {
                                type: "spring",
                                stiffness: 220, // ⬅️ más bajo = animación más lenta/suave
                                damping: 24,    // ⬅️ más alto = se frena más despacio
                                mass: 0.9,      // ⬅️ da más "peso"
                            },
                    });
                })(),
                haloControls.start({
                    opacity: [0.2, 0],
                    scale: reduced ? 1 : [0.5, 2.2],
                    transition: { duration: reduced ? 0.3 : 0.9, ease: "easeOut" }
                }),
                glowControls.start({
                    opacity: [0.0, 0.5, 0],
                    scale: [0.2, 1.2],
                    transition: { duration: reduced ? 0.4 : 0.9, ease: "easeOut" }
                })
            ]);

            // Detalle de rebote/rotación del check (corto)
            await checkControls.start({
                rotate: [0, 2, 0],
                transition: { duration: reduced ? 0.2 : 0.4, ease: "easeInOut" }
            });
            await checkControls.start({
                scale: [1, 1.06, 1],
                transition: { duration: reduced ? 0.2 : 0.4, ease: [0.34, 1.56, 0.64, 1] }
            });

            if (showMessage) {
                messageControls.start({
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.35, ease: "easeOut" }
                });
            }

            // (opcional) Si no quieres que el fondo se desvanezca solo, deja esto tal cual.
            // Si lo desvanece más tarde, hazlo con otro `backgroundControls.start(...)` SIN await.

            if (autoHideAfterMs) {
                await sleep(autoHideAfterMs);
                if (!hidden.current) {
                    hidden.current = true;
                    await rootControls.start({ opacity: 0, y: -8, transition: { duration: 0.4 } });
                }
            }

            onComplete?.();
        }, [
            reset, delayStart, reduced, fullScreen, coverParent,
            showMessage, autoHideAfterMs, onComplete,
            rootControls, checkControls, glowControls, haloControls,
            messageControls, backgroundControls
        ]);

        useImperativeHandle(ref, () => ({ play, reset }), [play, reset]);

        useEffect(() => {
            if (autoPlay) play();
        }, [autoPlay, play]);

        const circleSizePx = `${size}px`;
        const colorBase = `bg-${colorClass}-500`;
        const colorText = `text-${colorClass}-600`;

        const iconColorClass = "text-success";
        const titleColorClass = "text-white";
        const subtitleColorClass = "text-white";

        const containerClasses = coverParent
            ? "absolute inset-0 w-full h-full flex flex-col items-center justify-center " + (className || "")
            : `relative flex flex-col min-w-[100dvw] min-h-[100dvh] items-center justify-center ${className || ""}`;

        return (
            <div ref={containerRef} className={containerClasses} role="status" aria-live="polite">
                {(coverParent || fullScreen) && (
                    <motion.div
                        className={`${fullScreen ? "fixed inset-0" : "absolute inset-0"} ${colorBase}`}
                        style={{ zIndex: 1 }}
                        initial={false}
                        animate={backgroundControls}
                    />
                )}

                <motion.div
                    className="relative flex flex-col items-center justify-center w-full h-full"
                    style={{ zIndex: 10 }}
                >
                    {/* HERO */}
                    <motion.div className="flex flex-col items-center" animate={heroControls} style={{ zIndex: 20 }}>
                        <motion.div
                            className="relative flex items-center justify-center"
                            style={{ width: circleSizePx, height: circleSizePx }}
                            animate={rootControls}
                        >
                            <motion.div
                                className={`absolute inset-0 rounded-full ${colorBase} pointer-events-none`}
                                style={{ filter: "blur(12px)", opacity: 0 }}
                                animate={haloControls}
                            />
                            <motion.div
                                className={`relative flex items-center justify-center rounded-full shadow-xl transition-colors duration-500 bg-white`}
                                style={{ width: circleSizePx, height: circleSizePx }}
                                animate={checkControls}
                            >
                                <motion.div
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{
                                        background:
                                            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.65), rgba(255,255,255,0) 65%)",
                                        mixBlendMode: "overlay"
                                    }}
                                />
                                <motion.div
                                    className="relative flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: reduced ? 0 : 0.15, duration: 0.3 }}
                                >
                                    <Icon
                                        icon="lucide:check"
                                        className={`transition-colors duration-500 ${iconColorClass}`}
                                        style={{
                                            width: size * 0.55,
                                            height: size * 0.55,
                                            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))"
                                        }}
                                    />
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        <AnimatePresence>
                            {showMessage && (
                                <motion.div
                                    className="mt-6 text-center select-none"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    style={{ zIndex: 30 }}
                                >
                                    <h2 className={`font-semibold text-lg md:text-xl transition-colors duration-500 ${titleColorClass}`}>
                                        {title}
                                    </h2>
                                    {subtitle && (
                                        <p className={`mt-1 text-sm transition-colors duration-500 ${subtitleColorClass}`}>{subtitle}</p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* (Modo legacy de shift) */}
                    <AnimatePresence>
                        {showContent && (postShiftMessage || children || renderAfterShift) && (
                            <motion.div
                                key="final-content"
                                className="absolute inset-0 flex flex-col items-center justify-center w-full h-full px-6"
                                style={{ zIndex: 25 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {postShiftMessage && (
                                    <motion.p
                                        className="text-sm font-medium tracking-wide text-default-600 mb-8 text-center"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                                    >
                                        {postShiftMessage}
                                    </motion.p>
                                )}
                                <motion.div
                                    className="w-full max-w-6xl"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                                >
                                    {renderAfterShift || children}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        );
    }
);

CheckAnimation.displayName = "CheckAnimation";