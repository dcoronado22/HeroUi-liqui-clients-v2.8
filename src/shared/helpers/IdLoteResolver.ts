import { useVinculacionFlow } from "@/src/domains/vinculacion/context/flow-context";

const flow = useVinculacionFlow();

export const resolveIdLote = (search: URLSearchParams, caseId: string, flowIdLote?: string | null) => {
    const fromQuery = search.get("idLote")?.trim().toUpperCase();
    const fromStorage = typeof window !== "undefined"
        ? sessionStorage.getItem(`v:${caseId}:idLote`) ?? undefined
        : undefined;
    const fromCtx = flowIdLote ?? undefined;

    // PRIORIDAD: Query > Storage > Context
    // Si el IdLote del query es diferente al del contexto, usar el del query
    const resolved = fromQuery || fromStorage || fromCtx;

    // Si el IdLote resuelto es diferente al del contexto, limpiar el contexto
    if (resolved && fromCtx && resolved !== fromCtx) {
        console.log(`IdLote mismatch detected: query/storage=${resolved}, context=${fromCtx}. Resetting context.`);
        flow.reset();
    }

    return resolved;
};