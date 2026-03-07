import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// Dark Matter Bank USDD payment address (placeholder — configure via admin)
const USDD_PAYMENT_ADDRESS = "TRX_USDD_ADDRESS_PLACEHOLDER";
const USDD_NETWORK = "TRON (TRC-20)";

export default function Payment() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const params = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const orderId = parseInt(params.orderId);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: order } = trpc.orders.byId.useQuery({ id: orderId }, { enabled: isAuthenticated && !isNaN(orderId) });

  const confirmMutation = trpc.orders.confirmPayment.useMutation({
    onSuccess: () => { toast.success("Payment confirmed! Your order is being processed."); setLocation(`/orders/${orderId}`); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-8 container text-center py-20">
        <Button onClick={() => (window.location.href = getLoginUrl())}>{t("nav.login")}</Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen py-8 container max-w-lg">
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild><Link href={`/orders/${orderId}`}><ArrowLeft className="w-4 h-4" /></Link></Button>
          <h1 className="text-xl font-serif font-semibold text-foreground">{t("payment.title")}</h1>
        </div>

        {order.status !== "pending_payment" ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
            <p className="text-foreground font-medium">This order has already been paid</p>
            <Button asChild variant="outline" className="mt-4"><Link href={`/orders/${orderId}`}>View Order</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Amount */}
            <div className="rounded-xl border border-border/60 bg-card p-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("payment.amount")}</p>
              <p className="text-4xl font-bold text-primary">{Number(order.totalUsdd).toFixed(6)}</p>
              <p className="text-lg text-muted-foreground">USDD</p>
              <p className="text-xs text-muted-foreground mt-2">Order #{order.orderNumber}</p>
            </div>

            {/* Payment Instructions */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">{t("payment.instructions")}</h2>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("payment.network")}</p>
                <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-lg">
                  <span className="text-sm font-medium text-foreground">{USDD_NETWORK}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("payment.address")}</p>
                <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-lg">
                  <span className="text-xs font-mono text-foreground flex-1 break-all">{USDD_PAYMENT_ADDRESS}</span>
                  <button onClick={() => handleCopy(USDD_PAYMENT_ADDRESS)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("payment.exact_amount")}</p>
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-sm font-bold text-amber-800">{Number(order.totalUsdd).toFixed(6)} USDD</span>
                  <button onClick={() => handleCopy(Number(order.totalUsdd).toFixed(6))} className="shrink-0 text-amber-600 hover:text-amber-800 transition-colors ml-auto">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-accent/30 rounded-lg text-xs text-accent-foreground">
                <p className="font-medium mb-1">⚠️ Important</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Send EXACTLY the amount shown above</li>
                  <li>• Use TRON (TRC-20) network only</li>
                  <li>• Get USDD at <a href="https://www.darkmatterbank.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Dark Matter Bank</a></li>
                </ul>
              </div>
            </div>

            {/* Confirm Payment */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">{t("payment.confirm")}</h2>
              <p className="text-xs text-muted-foreground">After sending, enter your transaction hash to confirm:</p>
              <Input
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Transaction hash (optional)"
                className="text-sm font-mono"
              />
              <Button
                className="w-full gap-2"
                onClick={() => confirmMutation.mutate({ orderId, txHash: txHash || undefined })}
                disabled={confirmMutation.isPending}
              >
                <CheckCircle className="w-4 h-4" />
                {t("payment.confirm_btn")}
              </Button>
            </div>

            <div className="text-center">
              <a href="https://www.darkmatterbank.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center justify-center gap-1">
                Don't have USDD? Get it at Dark Matter Bank <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
