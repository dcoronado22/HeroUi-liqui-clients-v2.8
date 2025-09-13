import { useVinculacionFlow } from "@/src/domains/vinculacion/context/flow-context";

const flow = useVinculacionFlow();

export const resolveRFC = (search: URLSearchParams, caseId: string, flowRfc?: string | null) => {
    const fromQuery = search.get("rfc")?.trim().toUpperCase();
    const fromStorage = typeof window !== "undefined"
        ? sessionStorage.getItem(`v:${caseId}:rfc`) ?? undefined
        : undefined;
    const fromCtx = flowRfc ?? undefined;

    // PRIORIDAD: Query > Storage > Context
    // Si el RFC del query es diferente al del contexto, usar el del query
    const resolved = fromQuery || fromStorage || fromCtx;

    // Si el RFC resuelto es diferente al del contexto, limpiar el contexto
    if (resolved && fromCtx && resolved !== fromCtx) {
        console.log(`RFC mismatch detected: query/storage=${resolved}, context=${fromCtx}. Resetting context.`);
        flow.reset();
    }

    return resolved;
};