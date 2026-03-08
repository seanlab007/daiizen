import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { ArrowLeft, Package, Star } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewDialog({
  item,
  orderId,
  onReviewed,
}: {
  item: { id: number; productName: string; productImage?: string | null };
  orderId: number;
  onReviewed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = trpc.reviews.submit.useMutation({
    onSuccess: () => {
      toast.success("Review submitted! Thank you.");
      setOpen(false);
      onReviewed();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="shrink-0 gap-1.5">
          <Star className="w-3.5 h-3.5" /> Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{item.productName}</p>
          <div>
            <label className="text-sm font-medium mb-2 block">Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Comment (optional)</label>
            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
          <Button
            className="w-full"
            disabled={submitReview.isPending || rating === 0}
            onClick={() =>
              submitReview.mutate({
                orderId,
                orderItemId: item.id,
                rating,
                comment: comment || undefined,
              })
            }
          >
            {submitReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OrderDetail() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const params = useParams<{ id: string }>();
  const orderId = parseInt(params.id);
  const utils = trpc.useUtils();

  const { data: order, isLoading } = trpc.orders.byId.useQuery(
    { id: orderId },
    { enabled: isAuthenticated && !isNaN(orderId) }
  );

  // Get already-reviewed item IDs for this order
  const { data: myReviews, refetch: refetchReviews } = trpc.reviews.getMyReviews.useQuery(
    undefined,
    { enabled: isAuthenticated && order?.status === "completed" }
  );
  const reviewedItemIds = new Set((myReviews ?? []).map((r) => r.orderItemId));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-8 container text-center py-20">
        <Button onClick={() => (window.location.href = getLoginUrl())}>{t("nav.login")}</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 container max-w-2xl">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse w-48" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen py-8 container text-center py-20">
        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Order not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  const addr = order.shippingAddress as Record<string, string>;
  const isCompleted = order.status === "completed";

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orders"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <h1 className="text-xl font-serif font-semibold text-foreground">Order #{order.orderNumber}</h1>
        </div>

        {/* Status */}
        <div className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium mb-6 ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground border-border"}`}>
          {t(`orders.status.${order.status}`)}
        </div>

        {/* Order Items */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden mb-4">
          <div className="p-4 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground">{t("orders.items")}</h2>
          </div>
          <div className="divide-y divide-border/50">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/40 shrink-0">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">×{item.quantity} @ {Number(item.unitPriceUsdd).toFixed(2)} USDD</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-sm font-semibold text-primary">{Number(item.subtotalUsdd).toFixed(2)} USDD</p>
                  {isCompleted && (
                    reviewedItemIds.has(item.id) ? (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" /> Reviewed
                      </span>
                    ) : (
                      <ReviewDialog
                        item={item}
                        orderId={order.id}
                        onReviewed={() => {
                          refetchReviews();
                          utils.reviews.getReviewableItems.invalidate();
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border/50 flex justify-between">
            <span className="font-medium text-foreground">{t("cart.total")}</span>
            <span className="font-bold text-primary">{Number(order.totalUsdd).toFixed(2)} USDD</span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="rounded-xl border border-border/60 bg-card p-4 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">{t("checkout.address")}</h2>
          <p className="text-sm text-foreground">{addr.fullName}</p>
          <p className="text-xs text-muted-foreground">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
          <p className="text-xs text-muted-foreground">{addr.city}{addr.state ? `, ${addr.state}` : ""}, {addr.country} {addr.postalCode}</p>
          {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
        </div>

        {/* Payment */}
        {order.status === "pending_payment" && (
          <Button asChild className="w-full">
            <Link href={`/payment/${order.id}`}>Complete Payment</Link>
          </Button>
        )}
        {order.paymentTxHash && (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground">TX Hash: <span className="font-mono text-foreground break-all">{order.paymentTxHash}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
