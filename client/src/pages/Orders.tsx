import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Package, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function Orders() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { data: orders, isLoading } = trpc.orders.list.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-8 container text-center py-20">
        <Button onClick={() => (window.location.href = getLoginUrl())}>{t("nav.login")}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl">
        <h1 className="text-2xl font-serif font-semibold text-foreground mb-6">{t("orders.title")}</h1>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground mb-4">{t("orders.empty")}</p>
            <Button asChild variant="outline"><Link href="/products">Start Shopping</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">#{order.orderNumber}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                        {t(`orders.status.${order.status}`)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-primary">{Number(order.totalUsdd).toFixed(2)} USDD</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
