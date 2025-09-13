'use client';
import React from 'react';
import { Card, CardBody } from '@heroui/react';
// import { usePolling } from '@/src/shared/hooks/usePolling';  // ← eliminado
import { OperacionService } from '../services/operacion.service';
import { DocumentPollingStatus, Client } from '../components/DocumentPollingStatus';
import { getFileExt } from '@/src/shared/helpers/files';

interface StepFirmaSoportesProps {
    onNext?: () => void;
    onPrevious?: () => void;
    idLote: string;
    rfc: string;
    operacionId?: string; // ← ahora opcional
    id?: string;          // ← alias (id "de toda la vida")
    enabled?: boolean;
    detalle?: any; // nuevo: ya lo provee la page
    bindStepActions?: (a: {
        nextDisabled?: boolean;
        prevDisabled?: boolean;
        next?: () => void;
        prev?: () => void;
    }) => void; // ← NUEVO
}

const StepFirmaSoportes: React.FC<StepFirmaSoportesProps> = ({
    onNext,
    onPrevious,
    idLote,
    rfc,
    operacionId,
    id,
    enabled = true,
    detalle,
    bindStepActions
}) => {
    const [reasonCode, setReasonCode] = React.useState<number | null>(null);
    const [reasonDesc, setReasonDesc] = React.useState<string | null>(null);
    const [documentosValid, setDocumentosValid] = React.useState(false);
    const [status, setStatus] = React.useState<number | null>(null);
    const [succeeded, setSucceeded] = React.useState<boolean | null>(null);
    const [finalizado, setFinalizado] = React.useState(false);
    const [rawDocs, setRawDocs] = React.useState<any[] | null>(null);
    const [clients, setClients] = React.useState<Client[]>([]);

    // NUEVO: pool de resultados por operación
    const operationResultsRef = React.useRef<Record<string, any>>({});
    // NUEVO: estado interno por operación
    const opsStateRef = React.useRef<Record<string, {
        ticks: number;
        lastRun: number;
        running: boolean;
        done: boolean;
        timer: NodeJS.Timeout | null;
    }>>({});

    const intervalMs = 10000;
    const pauseWhenHidden = true;
    const maxTicks = 150;

    const operationIdEffective = React.useMemo(
        () => operacionId || id,
        [operacionId, id]
    );

    // NUEVO: lista de operationIds (multi-cliente)
    const operationIds = React.useMemo(() => {
        const fromDetalle = Array.isArray(detalle?.operaciones)
            ? detalle.operaciones.map((o: any) => o?.id).filter(Boolean)
            : [];
        if (fromDetalle.length > 0) return fromDetalle;
        return operationIdEffective ? [operationIdEffective] : [];
    }, [detalle, operationIdEffective]);

    // NUEVO: mapa de metadatos por operación (rfcTo + nombre)
    const detalleOperacionesMap = React.useMemo(() => {
        const map: Record<string, { rfcTo?: string; nombre?: string }> = {};
        (detalle?.operaciones || []).forEach((o: any) => {
            if (!o?.id) return;
            map[o.id] = {
                rfcTo: o.rfcTo || o.RfcTo || o.RFC_TO || undefined,
                nombre: o.nombreDeudor || o.NombreDeudor || o.razonSocialDeudor || o.RazonSocialDeudor || o.nombre || o.razonSocial || undefined
            };
        });
        return map;
    }, [detalle]);

    // Fallback RFC destino
    const fallbackRfcTo = React.useMemo(() => {
        const ops = detalle?.operaciones || [];
        if (!Array.isArray(ops) || ops.length === 0) return null;
        let target = operationIdEffective
            ? ops.find((o: any) => o?.id === operationIdEffective)
            : null;
        if (!target) {
            target = ops.find((o: any) => o?.rfcTo || o?.RfcTo) || ops[0];
        }
        return target?.rfcTo || target?.RfcTo || null;
    }, [detalle, operationIdEffective]);

    React.useEffect(() => {
        console.log('[StepFirmaSoportes] mount ->',
            { idLote, rfc, operacionId, id, enabled, finalizado, operationIds });
        if (operacionId && id && operacionId !== id) {
            console.warn('[StepFirmaSoportes] ⚠ operacionId y id difieren', { operacionId, id });
        }
        if (!operationIds.length) {
            console.warn('[StepFirmaSoportes] ❌ Sin operationIds -> no se iniciará polling');
        }
    }, [idLote, rfc, operacionId, id, enabled, finalizado, operationIds]);

    React.useEffect(() => {
        bindStepActions?.({
            prevDisabled: true,
            nextDisabled: true
        });
    }, [bindStepActions]);

    const isDone = React.useCallback((res: any) => {
        const backendState = res?.state;
        const docsOk = res?.responseData?.DocumentosIsValid === true;
        const ok = res?.responseData?.Succeeded === true;
        const decision = (docsOk || ok) || (typeof backendState === 'number' && backendState !== 3);
        console.log('[StepFirmaSoportes][isDone eval]', {
            backendState, docsOk, succeededFlag: ok, decision
        });
        return decision;
    }, []);

    // Procesa un tick y actualiza agregados
    const processTickResult = React.useCallback((opId: string, res: any) => {
        const rc = res?.responseData?.ReasonCode?.Value ?? null;
        const desc = res?.responseData?.ReasonCode?.Description ?? null;
        setReasonCode(rc);
        setReasonDesc(desc);
        setDocumentosValid(res?.responseData?.DocumentosIsValid === true);
        setSucceeded(res?.responseData?.Succeeded === true);
        setStatus(res?.status ?? null);

        // Guardar resultado bruto por operación
        operationResultsRef.current[opId] = res;

        // REEMPLAZADO: ahora preservamos opId en cada documento
        const aggregatedDocs: any[] = [];
        Object.entries(operationResultsRef.current).forEach(([innerOpId, r]: any) => {
            const documentos = r?.responseData?.Documentos;
            if (Array.isArray(documentos)) {
                documentos.forEach((d: any) => {
                    aggregatedDocs.push({ ...d, __opId: innerOpId });
                });
            }
        });

        const grouped: Record<string, Client> = {};
        aggregatedDocs.forEach((d: any, idx: number) => {
            const docOpId: string = d.__opId;

            // Resultado bruto de ESA operación (no el último tick global)
            const opRes = operationResultsRef.current[docOpId];
            const opMeta = detalleOperacionesMap[docOpId] || {};

            // RFC por documento / operación
            let rfcDeudor =
                d?.RfcDeudor ||
                d?.rfcDeudor ||
                d?.rfc ||
                opMeta.rfcTo ||
                opRes?.responseData?.RfcTo ||
                opRes?.responseData?.RFC_TO ||
                null;

            if (!rfcDeudor) rfcDeudor = `OP-${docOpId}`;

            // Nombre por documento / operación
            const nombreDeudorDoc =
                d?.NombreDeudor ||
                d?.RazonSocialDeudor ||
                d?.razonSocial ||
                null;

            const nombreOp =
                opMeta.nombre ||
                opRes?.responseData?.NombreDeudor ||
                opRes?.responseData?.RazonSocialDeudor ||
                opRes?.responseData?.Nombre ||
                null;

            const displayNombre =
                nombreDeudorDoc ||
                nombreOp ||
                '—';

            // NUEVO: clave única por operación + RFC para evitar colisiones en React
            const clientKey = `${rfcDeudor}__${docOpId}`;

            if (!grouped[clientKey]) {
                grouped[clientKey] = {
                    clientKey,
                    rfc: rfcDeudor,          // RFC mostrado
                    razonSocial: displayNombre,
                    nombreDeudor: displayNombre,
                    documents: []
                };
            }

            // --- ACTUALIZADO: detección de firma más estricta y aislada por operación ---
            const estadoFirmaRaw =
                (d?.EstadoFirma || d?.estadoFirma || '')
                    .toString()
                    .trim()
                    .toUpperCase();

            const signedAtRaw: string | undefined = d?.SignedAt;
            const hasValidSignedAt =
                !!signedAtRaw &&
                !/^0001-01-01/i.test(signedAtRaw) &&
                !/1970-01-01/i.test(signedAtRaw); // por si hubiera otro placeholder

            const fileSignedPath: string | undefined = d?.FileSigned || d?.fileSigned;
            const path: string | undefined = d?.Path || d?.path;

            const isAbsoluteFileSigned = !!fileSignedPath && /^https?:\/\//i.test(fileSignedPath);
            const pathLower = (path || '').toLowerCase();
            const fileSignedLower = (fileSignedPath || '').toLowerCase();

            const pathIndicatesSigned = pathLower.includes('_firmado');
            const fileSignedIndicatesSigned = fileSignedLower.includes('_firmado');

            const stateFlagSigned = d?.State === 1;

            // REGLAS:
            // 1. State === 1
            // 2. EstadoFirma === 'FIRMADO'
            // 3. SignedAt válido (no placeholder)
            // 4. Path con _firmado
            // 5. FileSigned absoluto (https) y con _firmado
            const isSigned =
                stateFlagSigned ||
                estadoFirmaRaw === 'FIRMADO' ||
                hasValidSignedAt ||
                pathIndicatesSigned ||
                (isAbsoluteFileSigned && fileSignedIndicatesSigned);

            const statusFirma = isSigned ? '1' : '0';

            if (process.env.NODE_ENV !== 'production') {
                console.log('[processTickResult][doc-status]', {
                    opId: docOpId,
                    docId: d?.Id,
                    state: d?.State,
                    estadoFirmaRaw,
                    signedAtRaw,
                    hasValidSignedAt,
                    path,
                    fileSignedPath,
                    pathIndicatesSigned,
                    fileSignedIndicatesSigned,
                    isAbsoluteFileSigned,
                    computedStatus: statusFirma
                });
            }
            // --- FIN ACTUALIZADO ---

            const fileSigned: string | undefined = fileSignedPath;
            const ext =
                getFileExt(path) ||
                getFileExt(fileSigned) ||
                getFileExt(d?.FileName) ||
                null;

            const docTypeRaw = (d?.Tipo || d?.tipo || '').toString().toUpperCase();
            const type = docTypeRaw === 'PAGARE' ? 'pagare' : 'contrato';

            grouped[clientKey].documents.push({
                id: d?.Id || d?.id || `${docOpId}-${idx}`,
                name: d?.Nombre || d?.nombre || d?.FileName || `Documento ${idx + 1}`,
                type,
                status: statusFirma, // ← actualizado
                date: new Date(d?.Fecha || d?.fecha || d?.SignedAt || Date.now()),
                size: d?.Tamano || d?.size || '—',
                ext,
                path,
                fileSigned,
                url: fileSigned || path || null,
                raw: d
            });
        });

        setRawDocs(aggregatedDocs);
        setClients(Object.values(grouped));
    }, [detalleOperacionesMap, fallbackRfcTo]);

    const finalizarSiCorresponde = React.useCallback(() => {
        const allDone = operationIds.every((idOp: string | number) => opsStateRef.current[idOp]?.done);
        if (allDone && !finalizado) {
            console.log('[StepFirmaSoportes] ✅ Todas las operaciones completadas');
            setFinalizado(true);
            onNext && onNext();
        }
    }, [operationIds, finalizado, onNext]);

    const tickOperacion = React.useCallback(async (opId: string) => {
        const state = opsStateRef.current[opId];
        if (!state || state.done) return;
        const now = Date.now();
        if (state.running) {
            console.log('[poll-multi] skip (running)', opId);
            return;
        }
        if (state.lastRun && now - state.lastRun < intervalMs - 50) {
            return;
        }
        state.running = true;
        state.lastRun = now;
        const tickNumber = state.ticks + 1;
        console.log(`[poll-multi] ▶ op=${opId} tick=${tickNumber}`);
        try {
            const res = await OperacionService.tickFirmaSoportes({
                idLote,
                rfc,
                operacionId: opId
            });
            processTickResult(opId, res);
            const done = isDone(res);
            if (done) {
                console.log(`[poll-multi] ✅ done op=${opId}`);
                state.done = true;
                if (state.timer) {
                    clearInterval(state.timer);
                    state.timer = null;
                }
                finalizarSiCorresponde();
            } else {
                state.ticks += 1;
                if (state.ticks >= maxTicks) {
                    console.warn(`[poll-multi] ⛔ maxTicks alcanzado op=${opId}`);
                    state.done = true;
                    if (state.timer) {
                        clearInterval(state.timer);
                        state.timer = null;
                    }
                    finalizarSiCorresponde();
                }
            }
        } catch (e) {
            console.error('[poll-multi] ✖ error op=', opId, e);
            state.done = true;
            if (state.timer) {
                clearInterval(state.timer);
                state.timer = null;
            }
            finalizarSiCorresponde();
        } finally {
            state.running = false;
        }
    }, [idLote, rfc, processTickResult, isDone, finalizarSiCorresponde]);

    // Inicia / reinicia polling multi-operación
    React.useEffect(() => {
        const pollingEnabled = enabled && !!idLote && !!rfc && operationIds.length > 0 && !finalizado;
        console.log('[poll-multi] effect ->', { pollingEnabled, operationIds, finalizado });
        // Limpieza previa
        Object.values(opsStateRef.current).forEach(s => {
            if (s.timer) clearInterval(s.timer);
        });
        if (!pollingEnabled) {
            opsStateRef.current = {};
            return;
        }
        // Inicializa estado para cada operación
        const map: typeof opsStateRef.current = {};
        operationIds.forEach((opId: string | number) => {
            map[opId] = {
                ticks: 0,
                lastRun: 0,
                running: false,
                done: false,
                timer: null
            };
        });
        opsStateRef.current = map;

        // Arranca timers
        operationIds.forEach((opId: string) => {
            // tick inmediato
            tickOperacion(opId);
            const t = setInterval(() => tickOperacion(opId), intervalMs);
            opsStateRef.current[opId].timer = t;
        });

        return () => {
            Object.values(opsStateRef.current).forEach(s => {
                if (s.timer) clearInterval(s.timer);
            });
        };
    }, [enabled, idLote, rfc, operationIds, finalizado, tickOperacion]);

    // Pausa / resume por visibility
    React.useEffect(() => {
        if (!pauseWhenHidden) return;
        const handler = () => {
            const hidden = document.hidden;
            if (hidden) {
                console.log('[poll-multi] document hidden -> pause');
                Object.values(opsStateRef.current).forEach(s => {
                    if (s.timer) {
                        clearInterval(s.timer);
                        s.timer = null;
                    }
                });
            } else {
                console.log('[poll-multi] document visible -> resume');
                Object.entries(opsStateRef.current).forEach(([opId, s]) => {
                    if (!s.done && !s.timer) {
                        tickOperacion(opId);
                        s.timer = setInterval(() => tickOperacion(opId), intervalMs);
                    }
                });
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [tickOperacion]);

    const pollingActivo = enabled && !finalizado && operationIds.length > 0;

    return (
        <Card shadow='none'>
            <CardBody className="px-6 py-6 space-y-8">
                <DocumentPollingStatus
                    clients={clients}
                    loading={pollingActivo}
                    reasonCode={reasonCode}
                    reasonDesc={reasonDesc}
                />
            </CardBody>
        </Card>
    );
};

export default StepFirmaSoportes;