import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, ExternalLink, Wallet, QrCode, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// ─── Payment Config ────────────────────────────────────────────────────────────
// USDD: configure VITE_USDD_PAYMENT_ADDRESS in project secrets
const USDD_ADDRESS = import.meta.env.VITE_USDD_PAYMENT_ADDRESS || "TRX_USDD_ADDRESS_PLACEHOLDER";
const USDD_NETWORK = "TRON (TRC-20)";

// Alipay / WeChat QR: configure VITE_ALIPAY_QR_URL / VITE_WECHAT_QR_URL in project secrets
const ALIPAY_QR = import.meta.env.VITE_ALIPAY_QR_URL || "";
const WECHAT_QR = import.meta.env.VITE_WECHAT_QR_URL || "";
const LIANLIAN_QR = import.meta.env.VITE_LIANLIAN_QR_URL || "";

type PayMethod = "usdd" | "alipay" | "wechat" | "lianlian";

const METHODS: { id: PayMethod; label: string; sublabel: string; icon: string; color: string }[] = [
  { id: "usdd",     label: "USDD",         sublabel: "Stablecoin · TRON TRC-20",  icon: "🪙", color: "border-emerald-300 bg-emerald-50" },
  { id: "alipay",   label: "Alipay",        sublabel: "支付宝",                    icon: "🔵", color: "border-blue-300 bg-blue-50" },
  { id: "wechat",   label: "WeChat Pay",    sublabel: "微信支付",                  icon: "🟢", color: "border-green-300 bg-green-50" },
  { id: "lianlian", label: "LianLian Pay",  sublabel: "连连支付",                  icon: "🟠", color: "border-orange-300 bg-orange-50" },
];

export default function Payment() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const params = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const orderId = parseInt(params.orderId);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const [method, setMethod] = useState<PayMethod>("usdd");

  const { data: order } = trpc.orders.byId.useQuery(
    { id: orderId },
    { enabled: isAuthenticated && !isNaN(orderId) }
  );

  const confirmMutation = trpc.orders.confirmPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment confirmed! Your order is being processed.");
      setLocation(`/orders/${orderId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCopy = (text: string, type: "address" | "amount") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-20 container text-center">
        <p className="text-muted-foreground mb-4">Please sign in to view payment details.</p>
        <Button onClick={() => (window.location.href = getLoginUrl())}>{t("nav.login")}</Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen py-8 container max-w-lg space-y-4">
        <div className="h-16 bg-muted rounded-xl animate-pulse" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const amountUsdd = Number(order.totalUsdd).toFixed(6);
  const selectedMethod = METHODS.find((m) => m.id === method)!;

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="container max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/orders/${orderId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-serif font-semibold text-foreground">{t("payment.title")}</h1>
            <p className="text-xs text-muted-foreground">Order #{order.orderNumber}</p>
          </div>
        </div>

        {order.status !== "pending_payment" ? (
          /* Already paid */
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-foreground font-semibold text-lg">This order has already been paid</p>
            <p className="text-sm text-muted-foreground">Status: <span className="capitalize font-medium text-foreground">{order.status}</span></p>
            <Button asChild variant="outline">
              <Link href={`/orders/${orderId}`}>View Order Details</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Amount Card */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{t("payment.amount")}</p>
              <p className="text-5xl font-bold text-primary tracking-tight">{Number(order.totalUsdd).toFixed(2)}</p>
              <p className="text-base text-muted-foreground mt-1">USDD <span className="text-xs">(≈ USD)</span></p>
            </div>

            {/* Payment Method Selector */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                Choose Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                      method === m.id
                        ? `${m.color} border-current font-medium`
                        : "border-border/50 bg-background hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">{m.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{m.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            {method === "usdd" && (
              <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  {t("payment.instructions")}
                </h2>

                {/* Network */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("payment.network")}</p>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-lg">
                    <span className="text-sm font-medium text-foreground">{USDD_NETWORK}</span>
                    <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">TRC-20</span>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("payment.address")}</p>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 rounded-lg">
                    <span className="text-xs font-mono text-foreground flex-1 break-all leading-relaxed">{USDD_ADDRESS}</span>
                    <button
                      onClick={() => handleCopy(USDD_ADDRESS, "address")}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === "address" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Exact Amount */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("payment.exact_amount")}</p>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-sm font-bold text-amber-800 flex-1">{amountUsdd} USDD</span>
                    <button
                      onClick={() => handleCopy(amountUsdd, "amount")}
                      className="shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
                    >
                      {copied === "amount" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-accent/30 rounded-xl text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">⚠️ Important</p>
                  <p>• Send <strong>exactly</strong> the amount shown — no more, no less</p>
                  <p>• Use <strong>TRON (TRC-20)</strong> network only — other networks will result in loss of funds</p>
                  <p>• Get USDD at{" "}
                    <a href="https://www.darkmatterbank.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Dark Matter Bank
                    </a>
                  </p>
                </div>
              </div>
            )}

            {(method === "alipay" || method === "wechat" || method === "lianlian") && (
              <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-muted-foreground" />
                  {selectedMethod.label} — Scan to Pay
                </h2>

                {/* QR Code display */}
                {(method === "alipay" ? ALIPAY_QR : method === "wechat" ? WECHAT_QR : LIANLIAN_QR) ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={method === "alipay" ? ALIPAY_QR : method === "wechat" ? WECHAT_QR : LIANLIAN_QR}
                      alt={`${selectedMethod.label} QR Code`}
                      className="w-48 h-48 rounded-xl border border-border/60 object-contain bg-white p-2"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Scan with {selectedMethod.label} app to pay <strong>{Number(order.totalUsdd).toFixed(2)} USDD</strong>
                    </p>
                  </div>
                ) : (
                  /* Placeholder when QR not yet configured */
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-48 h-48 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-muted/20">
                      <QrCode className="w-10 h-10 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground text-center px-4">
                        QR code will appear here once configured by the merchant
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                      Please contact us via the chat widget or email to complete payment via {selectedMethod.label}.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 space-y-1">
                  <p className="font-semibold">Payment Notes</p>
                  <p>• Include order number <strong>#{order.orderNumber}</strong> in the payment remarks</p>
                  <p>• Screenshot your payment receipt for records</p>
                  <p>• Orders are processed within 24 hours of payment confirmation</p>
                </div>
              </div>
            )}

            {/* Confirm Payment */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Confirm Your Payment</h2>
              <p className="text-xs text-muted-foreground">
                {method === "usdd"
                  ? "After sending USDD, enter your transaction hash (optional but recommended):"
                  : "After completing payment, click the button below to notify us:"}
              </p>
              {method === "usdd" && (
                <Input
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="Transaction hash (e.g. abc123def456...)"
                  className="text-sm font-mono"
                />
              )}
              <Button
                className="w-full gap-2"
                onClick={() => confirmMutation.mutate({ orderId, txHash: txHash || undefined })}
                disabled={confirmMutation.isPending}
              >
                <CheckCircle className="w-4 h-4" />
                {confirmMutation.isPending ? "Processing..." : t("payment.confirm_btn")}
              </Button>
            </div>

            {/* Dark Matter Bank link */}
            <div className="text-center pb-4">
              <a
                href="https://www.darkmatterbank.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
              >
                Don't have USDD? Get it at Dark Matter Bank <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
