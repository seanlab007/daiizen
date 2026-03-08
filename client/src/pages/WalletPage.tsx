import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function WalletPage() {
  const { user, loading } = useAuth();
  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotMime, setScreenshotMime] = useState("image/jpeg");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const wallet = trpc.wallet.getMyWallet.useQuery(undefined, { enabled: !!user });
  const txHistory = trpc.wallet.getMyTransactions.useQuery({ limit: 20, offset: 0 }, { enabled: !!user });
  const uploadScreenshot = trpc.wallet.uploadDepositScreenshot.useMutation();
  const submitDeposit = trpc.wallet.submitDeposit.useMutation({
    onSuccess: () => {
      toast.success("Deposit request submitted! Admin will confirm within 24 hours.");
      setDepositOpen(false);
      setAmount("");
      setTxHash("");
      setScreenshotBase64(null);
      txHistory.refetch();
      wallet.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large (max 5MB)"); return; }
    setScreenshotMime(file.type);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotBase64((ev.target?.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  };

  const handleSubmitDeposit = async () => {
    if (!amount || parseFloat(amount) < 1) { toast.error("Minimum deposit is 1 USDD"); return; }
    setUploading(true);
    try {
      let screenshotUrl: string | undefined;
      if (screenshotBase64) {
        const result = await uploadScreenshot.mutateAsync({ base64: screenshotBase64, mimeType: screenshotMime });
        screenshotUrl = result.url;
      }
      await submitDeposit.mutateAsync({
        amountUsdd: parseFloat(amount).toFixed(6),
        depositScreenshotUrl: screenshotUrl,
        txHash: txHash || undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>USDD Wallet</CardTitle>
            <CardDescription>Sign in to access your USDD wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}><Button className="w-full">Sign In</Button></a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balance = parseFloat(wallet.data?.balanceUsdd ?? "0");
  const totalDeposited = parseFloat(wallet.data?.totalDepositedUsdd ?? "0");
  const totalSpent = parseFloat(wallet.data?.totalSpentUsdd ?? "0");

  const DEPOSIT_ADDRESS = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">💰 USDD Wallet</h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-primary">{balance.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-1">Available Balance (USDD)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalDeposited.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Deposited (USDD)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalSpent.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Spent (USDD)</div>
            </CardContent>
          </Card>
        </div>

        {/* Deposit Button */}
        <div className="flex gap-3 mb-8">
          <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <span>⬆️</span> Deposit USDD
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Deposit USDD (TRC-20)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Send USDD (TRC-20) to:</p>
                  <div className="font-mono text-sm break-all bg-background p-2 rounded border">
                    {DEPOSIT_ADDRESS}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">⚠️ Only send USDD on TRON (TRC-20) network. Other tokens will be lost.</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Amount (USDD) *</label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 100"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Transaction Hash (optional)</label>
                  <Input
                    placeholder="TRC-20 TxHash"
                    value={txHash}
                    onChange={e => setTxHash(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Transfer Screenshot (optional)</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
                    {screenshotBase64 ? "✓ Screenshot Selected" : "Upload Screenshot"}
                  </Button>
                </div>
                <Button
                  onClick={handleSubmitDeposit}
                  disabled={uploading || submitDeposit.isPending || !amount}
                  className="w-full"
                >
                  {uploading || submitDeposit.isPending ? "Submitting..." : "Submit Deposit Request"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Admin will confirm your deposit within 24 hours. Your balance will be updated after confirmation.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {txHistory.isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : !txHistory.data || txHistory.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">📋</div>
                <p>No transactions yet</p>
                <p className="text-sm">Deposit USDD to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {txHistory.data.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">
                        {tx.type === "deposit" ? "⬆️" :
                         tx.type === "payment" ? "🛒" :
                         tx.type === "refund" ? "↩️" :
                         tx.type === "reward" ? "🎁" :
                         tx.type === "withdrawal" ? "⬇️" : "⚙️"}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{tx.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                          {tx.txHash && <span className="ml-2 font-mono">{tx.txHash.substring(0, 12)}...</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${parseFloat(tx.amountUsdd) > 0 ? "text-green-600" : "text-red-600"}`}>
                        {parseFloat(tx.amountUsdd) > 0 ? "+" : ""}{parseFloat(tx.amountUsdd).toFixed(2)} USDD
                      </div>
                      <Badge variant={
                        tx.status === "confirmed" || tx.status === "completed" ? "default" :
                        tx.status === "pending" ? "secondary" : "destructive"
                      } className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
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
