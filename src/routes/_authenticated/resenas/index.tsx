import { createFileRoute } from '@tanstack/react-router'
import { ReviewsTable } from '@/features/reviews/components/ReviewsTable'

export const Route = createFileRoute('/_authenticated/resenas/')({
  staticData: { breadcrumb: 'Reseñas' },
  component: ResenasPage,
})

function ResenasPage() {
  return <ReviewsTable />
}
