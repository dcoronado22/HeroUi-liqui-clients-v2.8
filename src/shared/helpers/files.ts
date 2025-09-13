// lib/utils/file.ts
export function getFileExt(input?: string | null): string | null {
    if (!input) return null;
  
    // 1) si ya viene con punto en el “label”, úsalo
    const tryFromName = (s: string) => {
      const base = s.split("?")[0].split("#")[0];
      const last = base.split("/").pop() ?? "";
      if (!last.includes(".")) return null;
      const ext = last.split(".").pop()!.toLowerCase();
      if (!ext) return null;
      return ext === "jpeg" ? "jpg" : ext; // normaliza
    };
  
    // intenta como URL primero
    try {
      const u = new URL(input);
      return tryFromName(u.pathname);
    } catch {
      // si no es URL, úsalo directo como nombre
      return tryFromName(input);
    }
  }
  
  export const isPreviewable = (ext?: string | null) =>
    !!ext && ["pdf", "png", "jpg", "webp", "gif", "json"].includes(ext);
  
  export const iconForExt = (ext?: string | null) => {
    if (!ext) return "solar:document-linear";
    if (["png", "jpg", "webp", "gif"].includes(ext)) return "solar:image-linear";
    if (ext === "pdf") return "solar:file-pdf-linear";
    if (ext === "json") return "solar:code-square-linear";
    return "solar:document-linear";
  };
  