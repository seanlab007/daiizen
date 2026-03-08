import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, Plus, Wallet, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type PaymentMethod = "usdd_balance" | "manual_transfer";

export default function Checkout() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("usdd_balance");
  const [newAddr, setNewAddr] = useState({ fullName: "", phone: "", country: "", state: "", city: "", addressLine1: "", addressLine2: "", postalCode: "" });

  const { data: cartItems } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: addresses, refetch: refetchAddresses } = trpc.addresses.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: wallet } = trpc.wallet.getMyWallet.useQuery(undefined, { enabled: isAuthenticated });

  const createAddressMutation = trpc.addresses.create.useMutation({
    onSuccess: (addr) => { refetchAddresses(); setSelectedAddressId(addr.id); setShowNewAddress(false); toast.success("Address saved"); },
  });

  // Manual transfer: create order then go to payment page
  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (order) => setLocation(`/payment/${order.id}`),
    onError: (e) => toast.error(e.message),
  });

  // USDD balance payment: pay immediately
  const payWithBalanceMutation = trpc.wallet.payWithBalance.useMutation({
    onSuccess: (result) => {
      toast.success(`Payment successful! Order #${result.order.orderNumber} confirmed. New balance: ${result.newBalance.toFixed(2)} USDD`);
      setLocation(`/orders/${result.order.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-8 container text-center py-20">
        <Button onClick={() => (window.location.href = getLoginUrl())}>{t("nav.login")}</Button>
      </div>
    );
  }

  const total = cartItems?.reduce((sum, item) => sum + Number(item.product.priceUsdd) * item.quantity, 0) ?? 0;
  const walletBalance = wallet ? parseFloat(wallet.balanceUsdd) : 0;
  const hasEnoughBalance = walletBalance >= total;

  const handlePlaceOrder = () => {
    if (!selectedAddressId) { toast.error("Please select a delivery address"); return; }
    if (paymentMethod === "usdd_balance") {
      if (!hasEnoughBalance) {
        toast.error(`Insufficient balance. You have ${walletBalance.toFixed(2)} USDD but need ${total.toFixed(2)} USDD.`);
        return;
      }
      payWithBalanceMutation.mutate({ addressId: selectedAddressId, notes });
    } else {
      createOrderMutation.mutate({ addressId: selectedAddressId, notes });
    }
  };

  const isPending = createOrderMutation.isPending || payWithBalanceMutation.isPending;

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild><Link href="/cart"><ArrowLeft className="w-4 h-4" /></Link></Button>
          <h1 className="text-2xl font-serif font-semibold text-foreground">{t("checkout.title")}</h1>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Left: Address + Payment Method */}
          <div className="md:col-span-3 space-y-6">
            {/* Address Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t("checkout.address")}</h2>

              {addresses?.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedAddressId === addr.id ? "border-primary bg-accent/20" : "border-border/60 hover:border-primary/40"}`}
                >
                  <p className="text-sm font-medium text-foreground">{addr.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{addr.city}{addr.state ? `, ${addr.state}` : ""}, {addr.country} {addr.postalCode}</p>
                  {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
                </div>
              ))}

              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowNewAddress(!showNewAddress)}>
                <Plus className="w-3.5 h-3.5" /> {t("checkout.new_address")}
              </Button>

              {showNewAddress && (
                <div className="p-4 rounded-xl border border-border/60 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">{t("address.name")}</Label><Input value={newAddr.fullName} onChange={e => setNewAddr({...newAddr, fullName: e.target.value})} className="h-8 text-sm mt-1" /></div>
                    <div><Label className="text-xs">{t("address.phone")}</Label><Input value={newAddr.phone} onChange={e => setNewAddr({...newAddr, phone: e.target.value})} className="h-8 text-sm mt-1" /></div>
                  </div>
                  <div><Label className="text-xs">{t("address.country")}</Label><Input value={newAddr.country} onChange={e => setNewAddr({...newAddr, country: e.target.value})} className="h-8 text-sm mt-1" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">{t("address.city")}</Label><Input value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} className="h-8 text-sm mt-1" /></div>
                    <div><Label className="text-xs">{t("address.state")}</Label><Input value={newAddr.state} onChange={e => setNewAddr({...newAddr, state: e.target.value})} className="h-8 text-sm mt-1" /></div>
                  </div>
                  <div><Label className="text-xs">{t("address.line1")}</Label><Input value={newAddr.addressLine1} onChange={e => setNewAddr({...newAddr, addressLine1: e.target.value})} className="h-8 text-sm mt-1" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">{t("address.line2")}</Label><Input value={newAddr.addressLine2} onChange={e => setNewAddr({...newAddr, addressLine2: e.target.value})} className="h-8 text-sm mt-1" /></div>
                    <div><Label className="text-xs">{t("address.postal")}</Label><Input value={newAddr.postalCode} onChange={e => setNewAddr({...newAddr, postalCode: e.target.value})} className="h-8 text-sm mt-1" /></div>
                  </div>
                  <Button size="sm" onClick={() => createAddressMutation.mutate({ ...newAddr, isDefault: !addresses?.length })} disabled={createAddressMutation.isPending}>
                    Save Address
                  </Button>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">{t("checkout.notes")}</Label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Payment Method</h2>

              {/* USDD Balance Option */}
              <div
                onClick={() => setPaymentMethod("usdd_balance")}
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === "usdd_balance" ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentMethod === "usdd_balance" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">USDD Wallet Balance</p>
                      <p className="text-xs text-muted-foreground">Instant payment, no waiting</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${hasEnoughBalance ? "text-green-600" : "text-red-500"}`}>
                      {walletBalance.toFixed(2)} USDD
                    </p>
                    {paymentMethod === "usdd_balance" && (
                      hasEnoughBalance
                        ? <p className="text-xs text-green-600 flex items-center gap-1 justify-end"><CheckCircle className="w-3 h-3" /> Sufficient</p>
                        : <p className="text-xs text-red-500 flex items-center gap-1 justify-end"><AlertCircle className="w-3 h-3" /> Insufficient</p>
                    )}
                  </div>
                </div>
                {paymentMethod === "usdd_balance" && !hasEnoughBalance && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-700">
                      You need {(total - walletBalance).toFixed(2)} more USDD.{" "}
                      <Link href="/wallet" className="font-medium underline">Top up your wallet →</Link>
                    </p>
                  </div>
                )}
              </div>

              {/* Manual Transfer Option */}
              <div
                onClick={() => setPaymentMethod("manual_transfer")}
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === "manual_transfer" ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentMethod === "manual_transfer" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Manual TRC-20 Transfer</p>
                    <p className="text-xs text-muted-foreground">Send USDD directly, submit TX hash for confirmation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="md:col-span-2">
            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3 sticky top-24">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t("checkout.summary")}</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cartItems?.map(item => (
                  <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                    <span className="truncate mr-2">{item.product.nameEn} ×{item.quantity}</span>
                    <span className="shrink-0">{(Number(item.product.priceUsdd) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between">
                <span className="font-medium text-sm text-foreground">{t("cart.total")}</span>
                <span className="font-bold text-primary">{total.toFixed(2)} USDD</span>
              </div>

              {paymentMethod === "usdd_balance" && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Wallet balance</span>
                    <span className="font-medium">{walletBalance.toFixed(2)} USDD</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>After payment</span>
                    <span className="font-medium">{Math.max(0, walletBalance - total).toFixed(2)} USDD</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={isPending || !selectedAddressId || (paymentMethod === "usdd_balance" && !hasEnoughBalance)}
              >
                {isPending
                  ? "Processing..."
                  : paymentMethod === "usdd_balance"
                    ? `Pay ${total.toFixed(2)} USDD Now`
                    : t("checkout.place_order")}
              </Button>

              {paymentMethod === "usdd_balance" && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Funds deducted instantly from your USDD wallet
                </p>
              )}
              {paymentMethod === "manual_transfer" && (
                <p className="text-[10px] text-muted-foreground text-center">
                  You'll be directed to submit your TRC-20 TX hash
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
