import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Cart() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: cartItems, isLoading } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });

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

  const total = cartItems?.reduce((sum, item) => sum + Number(item.product.priceUsdd) * item.quantity, 0) ?? 0;

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
            {cartItems.map((item) => (
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
                  <p className="text-sm text-primary font-semibold mt-1">{Number(item.product.priceUsdd).toFixed(2)} USDD</p>
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
                  <p className="text-xs text-muted-foreground">{(Number(item.product.priceUsdd) * item.quantity).toFixed(2)} USDD</p>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                <span className="font-semibold text-foreground">{total.toFixed(2)} USDD</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between">
                <span className="font-medium text-foreground">{t("cart.total")}</span>
                <span className="text-lg font-bold text-primary">{total.toFixed(2)} USDD</span>
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
