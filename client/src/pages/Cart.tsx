import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";

// Helper: compute best bulk discount for a product+qty
function getBestDiscount(
  discountMap: Record<number, Array<{ minQty: number; discountPct: string }>>,
  productId: number,
  qty: number
): number {
  const tiers = discountMap[productId] ?? [];
  const applicable = tiers.filter((t) => qty >= t.minQty);
  if (!applicable.length) return 0;
  return Math.max(...applicable.map((t) => parseFloat(t.discountPct)));
}

export default function Cart() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: cartItems, isLoading } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });

  // Fetch bulk discounts for all products in cart
  const productIds = cartItems?.map((i) => i.product.id) ?? [];
  const categoryIds = cartItems?.map((i) => (i.product as { categoryId?: number | null }).categoryId ?? null) ?? [];

  // Build a map of productId -> discount tiers by querying each product's discounts
  // We use a single query per unique product (parallelized via enabled flag)
  const discountQueries = (cartItems ?? []).map((item, idx) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    trpc.bulkDiscounts.forProduct.useQuery(
      { productId: item.product.id, categoryId: categoryIds[idx] ?? null },
      { enabled: isAuthenticated && !!cartItems }
    )
  );

  // Build discount map: productId -> tiers
  const discountMap: Record<number, Array<{ minQty: number; discountPct: string }>> = {};
  (cartItems ?? []).forEach((item, idx) => {
    discountMap[item.product.id] = discountQueries[idx]?.data ?? [];
  });

  const updateMutation = trpc.cart.update.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });
  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => { utils.cart.list.invalidate(); utils.cart.count.invalidate(); },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-8">
        <div className="container max-w-2xl text-center py-20">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground mb-4">Please sign in to view your cart</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>{t("nav.login")}</Button>
        </div>
      </div>
    );
  }

  // Compute totals with discounts
  const lineItems = (cartItems ?? []).map((item) => {
    const discountPct = getBestDiscount(discountMap, item.product.id, item.quantity);
    const unitPrice = Number(item.product.priceUsdd);
    const discountedUnit = unitPrice * (1 - discountPct / 100);
    const lineTotal = discountedUnit * item.quantity;
    const originalTotal = unitPrice * item.quantity;
    const savings = originalTotal - lineTotal;
    return { item, discountPct, discountedUnit, lineTotal, originalTotal, savings };
  });

  const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0);
  const totalSavings = lineItems.reduce((s, l) => s + l.savings, 0);
  const originalTotal = lineItems.reduce((s, l) => s + l.originalTotal, 0);

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl">
        <h1 className="text-2xl font-serif font-semibold text-foreground mb-6">{t("cart.title")}</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : !cartItems || cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground mb-4">{t("cart.empty")}</p>
            <Button asChild variant="outline"><Link href="/products">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {lineItems.map(({ item, discountPct, discountedUnit, lineTotal, originalTotal: origLine, savings }) => (
              <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-border/60 bg-card">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted/40 shrink-0">
                  {(item.product.images as string[])?.[0] ? (
                    <img src={(item.product.images as string[])[0]} alt={item.product.nameEn} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`}>
                    <p className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">{item.product.nameEn}</p>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {discountPct > 0 ? (
                      <>
                        <span className="text-sm text-red-600 font-semibold">{discountedUnit.toFixed(2)} USDD</span>
                        <span className="text-xs text-muted-foreground line-through">{Number(item.product.priceUsdd).toFixed(2)}</span>
                        <span className="flex items-center gap-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                          <Tag className="w-2.5 h-2.5" />-{discountPct}%
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-primary font-semibold">{Number(item.product.priceUsdd).toFixed(2)} USDD</span>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="text-[10px] text-emerald-600 mt-0.5">You save {savings.toFixed(2)} USDD on this item</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => removeMutation.mutate({ cartItemId: item.id })} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 border border-border rounded-lg">
                    <button onClick={() => updateMutation.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })} className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors rounded-l-lg">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateMutation.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })} className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors rounded-r-lg">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className={`text-xs font-medium ${discountPct > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                    {lineTotal.toFixed(2)} USDD
                  </p>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
              {totalSavings > 0 && (
                <div className="flex justify-between text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Bulk Discount Savings
                  </span>
                  <span className="text-emerald-700 font-bold">-{totalSavings.toFixed(2)} USDD</span>
                </div>
              )}
              {totalSavings > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Price</span>
                  <span className="text-muted-foreground line-through">{originalTotal.toFixed(2)} USDD</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                <span className="font-semibold text-foreground">{subtotal.toFixed(2)} USDD</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between">
                <span className="font-medium text-foreground">{t("cart.total")}</span>
                <span className="text-lg font-bold text-primary">{subtotal.toFixed(2)} USDD</span>
              </div>
              <Button className="w-full gap-2" onClick={() => setLocation("/checkout")}>
                {t("cart.checkout")} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
