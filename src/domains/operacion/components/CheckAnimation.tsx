import React, {
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
    useCallback,
    useState
} from 'react';
import { motion, useAnimation, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from '@iconify/react';

type CheckAnimationProps = {
    autoPlay?: boolean;
    onComplete?: () => void;
    size?: number;
    colorClass?: string;
    title?: string;
    subtitle?: string;
    showMessage?: boolean;
    delayStart?: number;
    autoHideAfterMs?: number;
    className?: string;
    fullScreen?: boolean;
    persistBackground?: boolean;
    backgroundFadeDelayMs?: number;
    coverParent?: boolean;
    shiftToTopAfterBackground?: boolean;
    topPadding?: number;
    postShiftMessage?: string;
    shrinkScale?: number;
    children?: React.ReactNode;
    renderAfterShift?: React.ReactNode;
};

export type CheckAnimationHandle = {
    play: () => void;
    reset: () => void;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const CheckAnimation = forwardRef<CheckAnimationHandle, CheckAnimationProps>(({
    autoPlay = true,
    onComplete,
    size = 128,
    colorClass = 'success',
    title = '¡Operación completada!',
    subtitle = 'La operación se ha realizado con éxito.',
    showMessage = true,
    delayStart = 0,
    autoHideAfterMs,
    className = '',
    fullScreen = false,
    persistBackground = false,
    backgroundFadeDelayMs = 1200,
    coverParent = false,
    shiftToTopAfterBackground = true,
    topPadding = 16,
    postShiftMessage = 'Mira tu resumen y documentos',
    shrinkScale = 0.68,
    children,
    renderAfterShift
}, ref) => {
    const reduced = useReducedMotion();
    const rootControls = useAnimation();
    const checkControls = useAnimation();
    const glowControls = useAnimation();
    const messageControls = useAnimation();
    const haloControls = useAnimation();
    const backgroundControls = useAnimation();
    const contentControls = useAnimation();
    const postShiftControls = useAnimation();
    const heroControls = useAnimation();
    const hidden = useRef(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [inverted, setInverted] = useState<boolean>(fullScreen || coverParent);
    const [shifted, setShifted] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const invertTimeoutRef = useRef<number | null>(null);

    const reset = useCallback(() => {
        hidden.current = false;
        rootControls.set({ opacity: 1, scale: 1, y: 0 });
        checkControls.set({ scale: 0, opacity: 0, rotate: 0 });
        glowControls.set({ opacity: 0, scale: 0.2 });
        haloControls.set({ opacity: 0, scale: 0.4 });
        messageControls.set({ opacity: 0, y: 12 });
        backgroundControls.set({
            opacity: 0,
            clipPath: 'circle(0% at 50% 50%)'
        });
        contentControls.set({ y: 0 });
        postShiftControls.set({ opacity: 0, y: 16 });
        heroControls.set({ y: 0, opacity: 1 });
        if (invertTimeoutRef.current) {
            clearTimeout(invertTimeoutRef.current);
            invertTimeoutRef.current = null;
        }
        // setInverted(fullScreen || coverParent);
        setShifted(false);
        setShowContent(false);
    }, [
        rootControls,
        checkControls,
        glowControls,
        haloControls,
        messageControls,
        backgroundControls,
        contentControls,
        postShiftControls,
        heroControls,
        fullScreen,
        coverParent
    ]);

    const play = useCallback(async () => {
        reset();
        if (delayStart) await sleep(delayStart);
        // setInverted(fullScreen || coverParent);
        setShifted(false);
        setShowContent(false);
        postShiftControls.set({ opacity: 0, y: 16 });
        heroControls.set({ y: 0, opacity: 1 });

        if (fullScreen || coverParent) {
            backgroundControls.set({
                opacity: 0.9,
                clipPath: 'circle(0% at 50% 50%)'
            });
            backgroundControls.start({
                opacity: 1,
                clipPath: 'circle(160% at 50% 50%)',
                transition: {
                    duration: reduced ? 0.4 : 1.1,
                    ease: [0.16, 1, 0.3, 1]
                }
            });
        }

        await rootControls.start({
            scale: [0.8, 1.05, 1],
            opacity: 1,
            transition: reduced ? { duration: 0.2 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        });

        haloControls.start({
            opacity: [0.15, 0],
            scale: reduced ? 1 : [0.4, 2.4],
            transition: { duration: reduced ? 0.4 : 1.2, ease: 'easeOut' }
        });

        checkControls.start({
            scale: 1,
            opacity: 1,
            transition: reduced
                ? { duration: 0.2 }
                : { type: 'spring', stiffness: 340, damping: 18, mass: 0.6 }
        });

        glowControls.start({
            opacity: [0.0, 0.5, 0],
            scale: [0.2, 1.2],
            transition: { duration: reduced ? 0.5 : 1.1, ease: 'easeOut' }
        });

        await checkControls.start({
            rotate: [0, 2, 0],
            transition: { duration: reduced ? 0.25 : 0.6, ease: 'easeInOut' }
        });

        await checkControls.start({
            scale: [1, 1.08, 1],
            transition: { duration: reduced ? 0.25 : 0.5, ease: [0.34, 1.56, 0.64, 1] }
        });

        if (showMessage) {
            messageControls.start({
                opacity: 1,
                y: 0,
                transition: { duration: 0.45, ease: 'easeOut' }
            });
        }

        if ((fullScreen || coverParent) && !persistBackground) {
            await backgroundControls.start({
                opacity: 0,
                transition: {
                    delay: backgroundFadeDelayMs / 1000,
                    duration: 0.7,
                    ease: 'easeOut'
                }
            });

            // setInverted(false);

            if (shiftToTopAfterBackground && containerRef.current) {
                // Mostrar el contenido primero
                setShowContent(true);
                postShiftControls.start({
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: 'easeOut' }
                });

                // Pequeña pausa para que se vea el contenido
                await sleep(800);

                // Luego hacer desaparecer todo el hero (check + mensajes)
                await heroControls.start({
                    opacity: 0,
                    y: -30,
                    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                });
            }
        }

        onComplete?.();

        if (autoHideAfterMs) {
            await sleep(autoHideAfterMs);
            if (!hidden.current) {
                hidden.current = true;
                await rootControls.start({ opacity: 0, y: -8, transition: { duration: 0.4 } });
            }
        }
    }, [
        reset,
        delayStart,
        reduced,
        fullScreen,
        coverParent,
        persistBackground,
        backgroundFadeDelayMs,
        shiftToTopAfterBackground,
        topPadding,
        size,
        shrinkScale,
        showMessage,
        autoHideAfterMs,
        onComplete,
        rootControls,
        checkControls,
        glowControls,
        haloControls,
        messageControls,
        backgroundControls,
        contentControls,
        postShiftControls,
        heroControls
    ]);

    useImperativeHandle(ref, () => ({ play, reset }), [play, reset]);

    useEffect(() => {
        if (autoPlay) play();
    }, [autoPlay, play]);

    const circleSizePx = `${size}px`;
    const colorBase = `bg-${colorClass}-500`;
    const colorText = `text-${colorClass}-600`;

    const circleBgClasses = inverted ? 'bg-white' : colorBase;
    const iconColorClass = inverted ? `text-${colorClass}-500` : 'text-white';
    const titleColorClass = inverted ? 'text-white' : colorText;
    const subtitleColorClass = inverted ? 'text-white/90' : 'text-default-600';

    const containerClasses = `relative flex ${coverParent ? 'w-full h-full' : 'flex-col'} flex-col items-center justify-center ${className || ''}`;

    return (
        <div
            ref={containerRef}
            className={containerClasses}
            role="status"
            aria-live="polite"
        >
            {(fullScreen || coverParent) && (
                <motion.div
                    className={`${fullScreen ? 'fixed inset-0' : 'absolute inset-0'} ${colorBase}`}
                    style={{ zIndex: 1 }}
                    initial={false}
                    animate={backgroundControls}
                />
            )}

            <motion.div
                className="relative flex flex-col items-center justify-center w-full h-full"
                style={{ zIndex: 10 }}
            >
                {/* HERO: Check y mensajes que desaparecen */}
                <motion.div
                    className="flex flex-col items-center"
                    animate={heroControls}
                    style={{ zIndex: 20 }}
                >
                    <motion.div
                        className="relative flex items-center justify-center"
                        style={{ width: circleSizePx, height: circleSizePx }}
                        animate={rootControls}
                    >
                        <motion.div
                            className={`absolute inset-0 rounded-full ${colorBase} pointer-events-none`}
                            style={{ filter: 'blur(12px)', opacity: 0 }}
                            animate={haloControls}
                        />
                        <motion.div
                            className={`relative flex items-center justify-center rounded-full shadow-xl transition-colors duration-500 ${circleBgClasses}`}
                            style={{ width: circleSizePx, height: circleSizePx }}
                            animate={checkControls}
                        >
                            <motion.div
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{
                                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.65), rgba(255,255,255,0) 65%)',
                                    mixBlendMode: 'overlay'
                                }}
                                animate={glowControls}
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
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))'
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
                                animate={messageControls}
                                exit={{ opacity: 0, y: -6 }}
                                style={{ zIndex: 30 }}
                            >
                                <h2 className={`font-semibold text-lg md:text-xl transition-colors duration-500 ${titleColorClass}`}>
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className={`mt-1 text-sm transition-colors duration-500 ${subtitleColorClass}`}>
                                        {subtitle}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* CONTENIDO FINAL - Aparece y se queda */}
                <AnimatePresence>
                    {showContent && (postShiftMessage || children || renderAfterShift) && (
                        <motion.div
                            key="final-content"
                            className="absolute inset-0 flex flex-col items-center justify-center w-full h-full px-6"
                            style={{ zIndex: 25 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={postShiftControls}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {postShiftMessage && (
                                <motion.p
                                    className="text-sm font-medium tracking-wide text-default-600 mb-8 text-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                                >
                                    {postShiftMessage}
                                </motion.p>
                            )}
                            <motion.div
                                className="w-full max-w-6xl"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                            >
                                {renderAfterShift || children}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
});

CheckAnimation.displayName = 'CheckAnimation';