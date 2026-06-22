import { useState } from 'react'
import { Star, Check, Trash2, MessageSquare, Loader2, Package } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useReviews } from '../hooks/useReviews'
import { useApproveReview, useDeleteReview } from '../hooks/useReviewMutations'
import type { ReviewWithProduct, ReviewFilter } from '../api/reviews.api'
import { sileo } from 'sileo'
import { cn } from '@/lib/utils'

// ─── Star Rating display ──────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-3.5 w-3.5', i < rating ? 'text-amber-400' : 'text-border')}
          fill={i < rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}

// ─── Review Row ───────────────────────────────────────────────────────────────

function ReviewRow({
  review,
  onDelete,
  isApproving,
  isDeleting,
  onApprove,
}: {
  review: ReviewWithProduct
  onDelete: () => void
  onApprove: () => void
  isApproving: boolean
  isDeleting: boolean
}) {
  const busy = isApproving || isDeleting

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-1.5 min-w-0">
          <Package className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          <span className="text-sm font-medium truncate max-w-35">
            {review.products?.nombre ?? <span className="text-muted-foreground italic">Eliminado</span>}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <span className="text-sm font-medium">{review.author_name}</span>
      </TableCell>

      <TableCell>
        <StarRating rating={review.rating} />
      </TableCell>

      <TableCell className="max-w-55">
        {review.comment ? (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
            {review.comment}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground/50 italic">Sin comentario</span>
        )}
      </TableCell>

      <TableCell className="whitespace-nowrap">
        <span className="text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString('es-CR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </TableCell>

      <TableCell>
        <Badge variant={review.approved ? 'success' : 'warning'} className="text-[10px] px-1.5 py-0">
          {review.approved ? 'Aprobada' : 'Pendiente'}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-1">
          {!review.approved && (
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              onClick={onApprove}
              title="Aprobar reseña"
              className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            disabled={busy}
            onClick={onDelete}
            title="Eliminar reseña"
            className="text-destructive hover:text-destructive"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReviewsTable() {
  const [filter, setFilter] = useState<ReviewFilter>('pending')
  const [pendingDelete, setPendingDelete] = useState<ReviewWithProduct | null>(null)

  const { data: reviews, isLoading, error } = useReviews(filter)
  const approveMutation = useApproveReview()
  const deleteMutation = useDeleteReview()

  const pendingCount = reviews?.filter((r) => !r.approved).length ?? 0

  async function handleApprove(review: ReviewWithProduct) {
    try {
      await approveMutation.mutateAsync(review.id)
      sileo.success({ title: 'Reseña aprobada', description: `De ${review.author_name}` })
    } catch (err) {
      sileo.error({ title: 'Error al aprobar', description: (err as Error).message })
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      sileo.success({ title: 'Reseña eliminada' })
      setPendingDelete(null)
    } catch {
      // error shown in ConfirmDialog description via deleteMutation.isError
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
            <MessageSquare className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h1 className="font-heading text-[17px] font-bold text-foreground tracking-[-0.3px] leading-tight">
              Reseñas
            </h1>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">
              Modera las reseñas enviadas por clientes
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
          <button
            onClick={() => setFilter('pending')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filter === 'pending'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Pendientes
            {pendingCount > 0 && filter !== 'pending' && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filter === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Todas
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="text-sm text-destructive">Error: {error.message}</p>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="card-solid rounded-xl overflow-hidden">
          <Skeleton className="h-10 rounded-none" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-none border-t border-border" />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !error && reviews?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm font-medium">
            {filter === 'pending' ? 'Sin reseñas pendientes' : 'Sin reseñas aún'}
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            {filter === 'pending'
              ? 'Todas las reseñas han sido moderadas.'
              : 'Los clientes aún no han enviado reseñas.'}
          </p>
        </div>
      )}

      {/* ── Table ── */}
      {!isLoading && reviews && reviews.length > 0 && (
        <div className="card-solid rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Producto</TableHead>
                  <TableHead className="w-32">Autor</TableHead>
                  <TableHead className="w-28">Calificación</TableHead>
                  <TableHead>Comentario</TableHead>
                  <TableHead className="w-28">Fecha</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    onApprove={() => handleApprove(review)}
                    onDelete={() => setPendingDelete(review)}
                    isApproving={approveMutation.isPending && approveMutation.variables === review.id}
                    isDeleting={deleteMutation.isPending && deleteMutation.variables === review.id}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => {
          if (!o) {
            setPendingDelete(null)
            deleteMutation.reset()
          }
        }}
        title={`¿Eliminar reseña de "${pendingDelete?.author_name}"?`}
        description={
          deleteMutation.isError
            ? `Error: ${deleteMutation.error?.message}`
            : 'Esta acción no se puede deshacer.'
        }
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
