"use client";

import { useParams } from "next/navigation";

export default function OperacionLotePage() {
    const { rfc, id, idLote } = useParams<{ rfc: string; id: string; idLote: string }>();

    return (
        <div>
            <h1>Operación con Lote</h1>
            <p><strong>RFC:</strong> {rfc}</p>
            <p><strong>ID:</strong> {id}</p>
            <p><strong>ID Lote:</strong> {idLote}</p>
        </div>
    );
}