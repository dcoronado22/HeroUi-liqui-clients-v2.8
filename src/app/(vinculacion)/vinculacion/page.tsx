"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";

export default function VinculacionPage() {
    redirect("/vinculacion/nuevo");
}
