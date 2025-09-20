// app/not-found.tsx
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Página no encontrada</h2>
      <p>Verifica la URL e inténtalo de nuevo.</p>
    </div>
  )
}
