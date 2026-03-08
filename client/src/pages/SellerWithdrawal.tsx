import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "wouter";

export default function SellerWithdrawal() {
  const { user } = useAuth();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  // Get seller's store
  const myStore = trpc.store.myStore.useQuery(undefined, { enabled: !!user });
  const storeId = myStore.data?.id;

  const withdrawals = trpc.withdrawal.getMyWithdrawals.useQuery(
    { storeId: storeId! },
    { enabled: !!storeId }
  );

  const requestWithdrawal = trpc.withdrawal.requestWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal request submitted! Admin will process within 1-3 business days.");
      setWithdrawOpen(false);
      setAmount("");
      setWalletAddress("");
      withdrawals.refetch();
      myStore.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!storeId) return;
    if (!amount || parseFloat(amount) < 10) { toast.error("Minimum withdrawal is 10 USDD"); return; }
    if (!walletAddress || walletAddress.length < 30) { toast.error("Please enter a valid TRC-20 wallet address"); return; }
    requestWithdrawal.mutate({
      storeId,
      amountUsdd: parseFloat(amount).toFixed(6),
      walletAddress,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p>Please sign in to access seller withdrawals.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myStore.isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!myStore.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Store Found</CardTitle>
            <CardDescription>You need to open a store before requesting withdrawals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/open-store">
              <Button className="w-full">Open a Store</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const store = myStore.data;
  const pendingBalance = parseFloat(store.pendingBalanceUsdd ?? "0");
  const totalEarnings = parseFloat(store.totalEarningsUsdd ?? "0");

  const statusColor = (status: string) => {
    if (status === "paid") return "default";
    if (status === "approved") return "secondary";
    if (status === "pending") return "outline";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/seller/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Seller Dashboard</Link>
        </div>
        <h1 className="text-3xl font-bold mb-6">💸 Seller Withdrawals</h1>

        {/* Balance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-green-600">{pendingBalance.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-1">Available to Withdraw (USDD)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalEarnings.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Earnings (USDD)</div>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Button */}
        <div className="mb-8">
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button size="lg" disabled={pendingBalance < 10} className="gap-2">
                <span>💸</span> Request Withdrawal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Request USDD Withdrawal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p>Available balance: <strong>{pendingBalance.toFixed(2)} USDD</strong></p>
                  <p className="text-muted-foreground text-xs mt-1">Minimum withdrawal: 10 USDD. Processing time: 1-3 business days.</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Amount (USDD) *</label>
                  <Input
                    type="number"
                    min="10"
                    max={pendingBalance}
                    step="0.01"
                    placeholder="e.g. 100"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max: {pendingBalance.toFixed(2)} USDD</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">TRC-20 Wallet Address *</label>
                  <Input
                    placeholder="T... (TRON TRC-20 address)"
                    value={walletAddress}
                    onChange={e => setWalletAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">⚠️ Double-check your address. Incorrect addresses cannot be recovered.</p>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={requestWithdrawal.isPending || !amount || !walletAddress}
                  className="w-full"
                >
                  {requestWithdrawal.isPending ? "Submitting..." : "Submit Withdrawal Request"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {pendingBalance < 10 && (
            <p className="text-sm text-muted-foreground mt-2">Minimum withdrawal is 10 USDD. Keep selling to reach the threshold!</p>
          )}
        </div>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded" />)}
              </div>
            ) : !withdrawals.data || withdrawals.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">📋</div>
                <p>No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.data.map((req) => (
                  <div key={req.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-bold text-lg">{parseFloat(req.amountUsdd).toFixed(2)} USDD</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{req.walletAddress}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(req.createdAt).toLocaleString()}
                        {req.txHash && (
                          <span className="ml-2 text-blue-500">
                            TxHash: {req.txHash.substring(0, 16)}...
                          </span>
                        )}
                      </div>
                      {req.rejectionReason && (
                        <div className="text-xs text-red-500 mt-1">Reason: {req.rejectionReason}</div>
                      )}
                    </div>
                    <Badge variant={statusColor(req.status) as "default" | "secondary" | "outline" | "destructive"}>
                      {req.status === "paid" ? "✓ Paid" :
                       req.status === "approved" ? "Approved" :
                       req.status === "pending" ? "Pending" : "Rejected"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
