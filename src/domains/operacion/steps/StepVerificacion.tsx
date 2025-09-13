import React from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, Chip, Progress, addToast } from '@heroui/react';
import { OperacionService, VerificacionOperacionStatus } from '../services/operacion.service';
import { Icon } from '@iconify/react';

interface StepVerificacionProps {
    onNext?: () => void;
    onPrevious?: () => void;
    idLote: string;
    rfc: string;
    detalle?: any;
    enabled?: boolean;
    bindStepActions?: (a: {
        nextDisabled?: boolean;
        prevDisabled?: boolean;
        next?: () => void;
        prev?: () => void;
    }) => void;
    onAdvance?: () => Promise<void> | void; // nuevo: para re-hidratar detalle
}

const INTERVAL_MS = 10000;
const MAX_TICKS = 10;
const PAUSE_WHEN_HIDDEN = true;
const SUCCESS_DELAY_MS = 2000; // NUEVO: delay antes de avanzar/hidratar

const StepVerificacion: React.FC<StepVerificacionProps> = ({
    onNext,
    onPrevious,
    idLote,
    rfc,
    detalle,
    enabled = true,
    bindStepActions,
    onAdvance, // nuevo
}) => {
    const operationResultsRef = React.useRef<Record<string, VerificacionOperacionStatus>>({});
    const opsStateRef = React.useRef<Record<string, {
        ticks: number;
        done: boolean;
    }>>({});
    const globalTicksRef = React.useRef(0);
    const runningRef = React.useRef(false);
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const [finalizado, setFinalizado] = React.useState(false);
    const [pollingActivo, setPollingActivo] = React.useState(true);
    const [backendState, setBackendState] = React.useState<number | null>(null);
    const [lastReasonDesc, setLastReasonDesc] = React.useState<string | null>(null);
    const [allSucceeded, setAllSucceeded] = React.useState(false);
    const [anyError, setAnyError] = React.useState(false);
    const [operacionesStatus, setOperacionesStatus] = React.useState<VerificacionOperacionStatus[]>([]);
    const [displayProgress, setDisplayProgress] = React.useState(0);
    const [backendSucceeded, setBackendSucceeded] = React.useState(false);
    const backendHydrateDoneRef = React.useRef(false); // evita múltiples hidrataciones
    const successToastShownRef = React.useRef(false); // NUEVO: evitar toast duplicado
    const successTimeoutRef = React.useRef<NodeJS.Timeout | null>(null); // NUEVO: limpiar timeout

    const operationIds = React.useMemo<string[]>(() => {
        const arr = Array.isArray(detalle?.operaciones)
            ? detalle.operaciones.map((o: any) => o?.id).filter(Boolean)
            : [];
        return arr;
    }, [detalle]);

    const operacionesMeta = React.useMemo(() => {
        const map: Record<string, { rfc: string; nombreDeudor: string }> = {};
        if (Array.isArray(detalle?.operaciones)) {
            detalle.operaciones.forEach((op: any) => {
                const grupo = Array.isArray(op.gruposRfc) ? op.gruposRfc[0] : null;
                const rfc = op.rfcTo || '—';
                const nombreDeudor =
                    grupo?.nombreDeudor ||
                    grupo?.nombre ||
                    op.nombreDeudor ||
                    op.deudorNombre ||
                    '—';
                if (op?.id) {
                    map[op.id] = { rfc, nombreDeudor };
                }
            });
        }
        return map;
    }, [detalle]);

    const deudorNombre = React.useMemo(
        () =>
            detalle?.deudor?.nombre ||
            detalle?.deudor?.razonSocial ||
            detalle?.deudorNombre ||
            detalle?.nombreDeudor ||
            '—',
        [detalle]
    );

    const totalOps = operationIds.length;
    const completadas = operacionesStatus.filter(o => o.Succeeded === true).length;
    const conErrores = operacionesStatus.filter(o =>
        o.ServiciosEstados?.some(s => s.Succeeded === false)
    ).length;
    const progressPct = totalOps ? Math.round((completadas / totalOps) * 100) : 0;

    const evaluarOperacionDone = React.useCallback((
        op: VerificacionOperacionStatus,
        backendAdvances: boolean
    ) => {
        const succ = op.Succeeded === true;
        const errorServicio = op.ServiciosEstados?.some(s => s.Succeeded === false) || false;
        return {
            succ,
            errorServicio,
            done: succ || errorServicio || backendAdvances
        };
    }, []);

    const recomputarAggregados = React.useCallback((
        backendAdvances: boolean
    ) => {
        const opsArray = Object.values(operationResultsRef.current);
        if (opsArray.length === 0) {
            setAllSucceeded(false);
            setAnyError(false);
            setOperacionesStatus([]);
            return;
        }
        let allOk = true;
        let hasError = false;
        opsArray.forEach(op => {
            const succ = op.Succeeded === true;
            const err = op.ServiciosEstados?.some(s => s.Succeeded === false) || false;
            if (!succ) allOk = false;
            if (err) hasError = true;
        });
        setAllSucceeded(allOk);
        setAnyError(hasError);
        setOperacionesStatus(opsArray);
    }, []);

    const finalizarSiCorresponde = React.useCallback((
        backendAdvances: boolean
    ) => {
        const opsArray = Object.values(operationResultsRef.current);
        if (opsArray.length === 0) return;

        // Eliminamos: todasDone, anyErr y backendAdvances como detonantes de finalización.
        // Reglas nuevas:
        // - Finalizar temprano solo si todas OK (allOk)
        // - O al alcanzar MAX_TICKS
        const reachedMax = globalTicksRef.current >= MAX_TICKS;
        const allOk = opsArray.length > 0 && opsArray.every(o => o.Succeeded === true);

        const shouldFinish = allOk || reachedMax;

        if (shouldFinish && !finalizado) {
            setFinalizado(true);
            setPollingActivo(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            // NUEVO: retrasar avance y mostrar toast solo si todas OK
            if (allOk && onNext) {
                if (!successToastShownRef.current) {
                    successToastShownRef.current = true;
                    addToast({
                        title: "Completado",
                        description: `Todas las verificaciones han sido exitosas`,
                        color: "success",
                    });
                }
                successTimeoutRef.current = setTimeout(() => {
                    onNext?.();
                }, SUCCESS_DELAY_MS);
            }
        }
    }, [finalizado, onNext]);

    const tickAll = React.useCallback(async () => {
        if (!enabled || finalizado || !pollingActivo) return;
        if (runningRef.current) return;
        runningRef.current = true;
        try {
            const res = await OperacionService.tickVerificacionCotizaciones({ rfc, idLote });
            const ops = res.responseData?.Operaciones || [];
            const state = res.responseData?.State ?? null;
            const reasonDesc = res.responseData?.ReasonCode?.Description || null;
            setBackendSucceeded(res.responseData?.Succeeded === true);

            setBackendState(state);
            setLastReasonDesc(reasonDesc);

            const backendAdvances = state != null && state !== 2;

            if (Object.keys(opsStateRef.current).length === 0) {
                operationIds.forEach(id => {
                    opsStateRef.current[id] = { ticks: 0, done: false };
                });
            }

            ops.forEach(op => {
                const opId = op.IdOperacion;
                operationResultsRef.current[opId] = op;
                if (!opsStateRef.current[opId]) {
                    opsStateRef.current[opId] = { ticks: 0, done: false };
                }
                const evalRes = evaluarOperacionDone(op, backendAdvances);
                if (evalRes.done) {
                    opsStateRef.current[opId].done = true;
                } else {
                    opsStateRef.current[opId].ticks += 1;
                    if (opsStateRef.current[opId].ticks >= MAX_TICKS) {
                        opsStateRef.current[opId].done = true;
                    }
                }
            });

            globalTicksRef.current += 1;

            recomputarAggregados(backendAdvances);
            finalizarSiCorresponde(backendAdvances);
        } catch (e) {
            console.error('[StepVerificacion] ✖ error tickAll', e);
            setFinalizado(true);
            setPollingActivo(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        } finally {
            runningRef.current = false;
        }
    }, [enabled, finalizado, pollingActivo, rfc, idLote, evaluarOperacionDone, recomputarAggregados, finalizarSiCorresponde, operationIds]);

    React.useEffect(() => {
        const canPoll = enabled && !finalizado && !!idLote && !!rfc && operationIds.length > 0;
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (!canPoll) {
            return;
        }
        operationResultsRef.current = {};
        opsStateRef.current = {};
        globalTicksRef.current = 0;
        setPollingActivo(true);

        tickAll();
        intervalRef.current = setInterval(tickAll, INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, finalizado, idLote, rfc, operationIds, tickAll]);

    React.useEffect(() => {
        if (!PAUSE_WHEN_HIDDEN) return;
        const handler = () => {
            if (document.hidden) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            } else {
                if (!finalizado && pollingActivo && !intervalRef.current) {
                    tickAll();
                    intervalRef.current = setInterval(tickAll, INTERVAL_MS);
                }
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [pollingActivo, finalizado, tickAll]);

    React.useEffect(() => {
        bindStepActions?.({
            prevDisabled: true,
            nextDisabled: !allSucceeded,
            next: allSucceeded ? onNext : undefined
        });
    }, [bindStepActions, allSucceeded, onNext]);

    const handleReactivar = React.useCallback(() => {
        if (pollingActivo) return;
        setFinalizado(false);
        setPollingActivo(true);
        backendHydrateDoneRef.current = false; // permitir nueva hidratación
        setBackendSucceeded(false); // reset estado backend
        operationResultsRef.current = {};
        opsStateRef.current = {};
        globalTicksRef.current = 0;
        tickAll();
        intervalRef.current = setInterval(tickAll, INTERVAL_MS);
    }, [pollingActivo, tickAll]);

    const statusColor: 'success' | 'danger' | 'primary' | 'default' =
        allSucceeded ? 'success' : anyError ? 'danger' : pollingActivo ? 'primary' : 'default';

    React.useEffect(() => {
        if (backendSucceeded) {
            setDisplayProgress(100);
        }
    }, [backendSucceeded]);

    React.useEffect(() => {
        if (backendSucceeded) {
            if (displayProgress !== 100) setDisplayProgress(100);
            return;
        }
        let cancelled = false;
        let target: number;
        if (finalizado || !pollingActivo) {
            target = 100;
        } else {
            const mapped = Math.min(70, (progressPct / 100) * 70);
            target = Math.max(mapped, Math.min(70, displayProgress + 1.2));
        }

        if (target === displayProgress) return;

        const speed = finalizado ? 25 : 12;
        const interval = setInterval(() => {
            if (cancelled) return;
            setDisplayProgress(prev => {
                if (prev >= target) {
                    clearInterval(interval);
                    return prev;
                }
                const step = finalizado ? 5 : 1.5;
                const next = prev + step;
                return next > target ? target : next;
            });
        }, speed);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [progressPct, finalizado, pollingActivo, displayProgress, backendSucceeded]);

    React.useEffect(() => {
        if (backendSucceeded && pollingActivo && !finalizado) {
            setFinalizado(true);
            setPollingActivo(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
    }, [backendSucceeded, pollingActivo, finalizado]);

    React.useEffect(() => {
        if (backendSucceeded && !backendHydrateDoneRef.current) {
            backendHydrateDoneRef.current = true;
            if (!successToastShownRef.current) {
                successToastShownRef.current = true;
                addToast({
                    title: "Completado",
                    description: `Todas las verificaciones han sido exitosas`,
                    color: "success",
                });
            }
            successTimeoutRef.current = setTimeout(() => {
                Promise.resolve(onAdvance?.()).catch(err =>
                    console.error('[StepVerificacion] error hidratando tras backendSucceeded', err)
                );
            }, SUCCESS_DELAY_MS);
        }
    }, [backendSucceeded, onAdvance]);

    React.useEffect(() => {
        // Limpieza de timeout al desmontar
        return () => {
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
                successTimeoutRef.current = null;
            }
        };
    }, []);

    return (
        <>
            <Card shadow='none'>
                <CardHeader className="pb-2 pt-6 px-6 flex flex-col gap-4">
                    <div className="w-full flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Verificación de cotizaciones
                                </h2>
                                <Icon icon="line-md:alert-circle" fontSize={25} className='text-primary' />
                            </div>
                            <p className="text-default-500 text-sm leading-relaxed max-w-2xl">
                                {pollingActivo
                                    ? 'Verificando continuamente el estado de las operaciones…'
                                    : finalizado
                                        ? 'La verificación ha finalizado.'
                                        : 'La verificación está detenida.'}{' '}
                                {(!pollingActivo || finalizado) && (
                                    <span>Puedes relanzarla manualmente.</span>
                                )}
                            </p>
                        </div>

                        <div className="flex items-start gap-2">
                            {!pollingActivo && (
                                <Button
                                    size="md"
                                    variant="solid"
                                    color='primary'
                                    onPress={handleReactivar}
                                    className="shadow-sm"
                                >
                                    Relanzar verificación
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardBody className="px-6 py-6 space-y-6">
                    <div className="flex items-center">
                        {totalOps > 0 && (
                            <div className="flex flex-col gap-2 w-full">
                                <Progress
                                    size="sm"
                                    isIndeterminate={pollingActivo && !backendSucceeded && !finalizado}
                                    value={backendSucceeded ? 100 : displayProgress}
                                    maxValue={100}
                                    color={
                                        backendSucceeded
                                            ? 'success'
                                            : statusColor === 'danger'
                                                ? 'danger'
                                                : statusColor === 'success'
                                                    ? 'success'
                                                    : 'primary'
                                    }
                                    className="w-full"
                                    aria-label="Progreso verificación"
                                />
                                <div className="flex justify-between text-[11px] text-default-500 font-medium">
                                    <span>
                                        {backendSucceeded
                                            ? 'Resultado exitoso'
                                            : finalizado || !pollingActivo
                                                ? 'Proceso finalizado'
                                                : 'Verificando…'}
                                    </span>
                                    <span>
                                        {completadas}/{totalOps} ok
                                        {conErrores > 0 && ` · ${conErrores} con error`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-md border border-default-200 bg-content2/60 px-4 py-3 text-xs flex flex-wrap gap-x-6 gap-y-2">
                        <div>
                            <span className="font-medium text-default-600">Total:</span>{' '}
                            <span className="text-default-500">{totalOps}</span>
                        </div>
                        <div>
                            <span className="font-medium text-success">Completadas:</span>{' '}
                            <span className="text-default-500">{completadas}</span>
                        </div>
                        <div>
                            <span className="font-medium text-danger">Errores:</span>{' '}
                            <span className="text-default-500">{conErrores}</span>
                        </div>
                        <div>
                            <span className="font-medium text-primary">Pendientes:</span>{' '}
                            <span className="text-default-500">
                                {totalOps - completadas - conErrores >= 0
                                    ? totalOps - completadas - conErrores
                                    : 0}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {operacionesStatus.length === 0 && (
                            <div className="text-default-500 text-sm py-10 text-center border border-dashed rounded-md bg-content2/40">
                                No hay información de operaciones aún.
                                {pollingActivo && ' Verificando…'}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                            {operacionesStatus.map(op => {
                                const ok = op.Succeeded === true;
                                const error = !ok && op.ServiciosEstados?.some(s => s.Succeeded === false);
                                const estado = ok ? 'Completada' : error ? 'Error' : 'Pendiente';
                                const chipColor = ok ? 'success' : error ? 'danger' : 'primary';
                                const meta = operacionesMeta[op.IdOperacion] || { rfc: '—', nombreDeudor: '—' };

                                return (
                                    <div
                                        key={op.IdOperacion}
                                        className={`group border rounded-md p-4 space-y-3 bg-content1/70 backdrop-blur-sm relative overflow-hidden transition-colors
                                            ${ok ? 'border-success/30' : error ? 'border-danger/40' : 'border-default-200'}
                                        `}
                                    >
                                        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium tracking-tight">{meta.rfc} - {meta.nombreDeudor}
                                                </div>
                                                <div className="text-[11px] uppercase font-semibold tracking-wider text-default-400">
                                                    {estado}
                                                </div>
                                            </div>
                                            <Chip color={chipColor} variant="flat" size="sm">
                                                {estado}
                                            </Chip>
                                        </div>

                                        {!ok && !error && (
                                            <div className="flex items-center gap-2 text-xs text-primary">
                                                <Spinner size="sm" className="!w-3 !h-3" />
                                                <span>Procesando…</span>
                                            </div>
                                        )}

                                        {op.ServiciosEstados && op.ServiciosEstados.length > 0 && (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {op.ServiciosEstados.map((s, idx) => {
                                                    const servicioError = s.Succeeded === false;
                                                    return (
                                                        <li
                                                            key={idx}
                                                            className={`text-[11px] leading-snug ${servicioError
                                                                ? 'text-danger font-medium'
                                                                : 'text-default-600'
                                                                }`}
                                                        >
                                                            {s.Messages}
                                                            {s.NombreServicio && (
                                                                <span className="text-default-400">
                                                                    {' '}({s.NombreServicio})
                                                                </span>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardBody>
            </Card>
        </>
    );
};

export default StepVerificacion;