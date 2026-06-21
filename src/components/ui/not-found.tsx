export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <img
        src="https://res.cloudinary.com/daqragn9m/image/upload/v1782064971/404-not-found_w8eyb3.png"
        alt="Página no encontrada"
        className="w-full max-w-sm object-contain"
        draggable={false}
      />
      <div className="text-center">
        <p className="font-heading text-lg font-semibold text-foreground">
          Página no encontrada
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          No tienes acceso a esta sección o la ruta no existe.
        </p>
      </div>
    </div>
  )
}
