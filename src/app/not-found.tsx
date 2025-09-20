export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p>Página no encontrada.</p>
    </div>
  );
}
