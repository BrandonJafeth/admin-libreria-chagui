import { createFileRoute, notFound } from '@tanstack/react-router'
import { UsersTable } from '@/features/users/components/UsersTable'

export const Route = createFileRoute('/_authenticated/usuarios/')({
  beforeLoad: async ({ context }) => {
    if (context.userRole !== 'admin') throw notFound()
  },
  component: UsuariosPage,
  staticData: { breadcrumb: 'Usuarios' },
})

function UsuariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona las cuentas con acceso al sistema.</p>
      </div>
      <UsersTable />
    </div>
  )
}
