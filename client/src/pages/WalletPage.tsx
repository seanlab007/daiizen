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
import { QRCodeSVG } from "qrcode.react";
import { Copy, CheckCheck, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, Gift, RotateCcw, Settings } from "lucide-react";

const DEPOSIT_ADDRESS = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function TxIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    deposit: <ArrowUpCircle className="w-5 h-5 text-green-500" />,
    payment: <ShoppingCart className="w-5 h-5 text-blue-500" />,
    refund: <RotateCcw className="w-5 h-5 text-amber-500" />,
    reward: <Gift className="w-5 h-5 text-purple-500" />,
    withdrawal: <ArrowDownCircle className="w-5 h-5 text-red-500" />,
    adjustment: <Settings className="w-5 h-5 text-gray-500" />,
  };
  return <>{icons[type] ?? <Wallet className="w-5 h-5 text-muted-foreground" />}</>;
}

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

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

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold">USDD Wallet</h1>
        </div>

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

        {/* Deposit Section */}
        <div className="flex gap-3 mb-8">
          <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <ArrowUpCircle className="w-4 h-4" /> Deposit USDD
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Deposit USDD (TRC-20)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* QR Code + Address */}
                <div className="p-4 bg-muted/50 rounded-xl border border-border/60 space-y-3">
                  {/* Network badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Deposit Address</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                      TRC-20 · TRON
                    </span>
                  </div>

                  {/* QR Code centered */}
                  <div className="flex justify-center py-2">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-border/40">
                      <QRCodeSVG
                        value={DEPOSIT_ADDRESS}
                        size={160}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  {/* Address with copy */}
                  <div className="bg-background rounded-lg border border-border/60 p-3">
                    <div className="font-mono text-xs break-all text-foreground leading-relaxed">
                      {DEPOSIT_ADDRESS}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <CopyButton text={DEPOSIT_ADDRESS} />
                    </div>
                  </div>

                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    ⚠️ Only send <strong>USDD</strong> on <strong>TRON (TRC-20)</strong> network. Sending other tokens or using other networks will result in permanent loss.
                  </p>
                </div>

                {/* Amount */}
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

                {/* TX Hash */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Transaction Hash (optional)</label>
                  <Input
                    placeholder="TRC-20 TxHash"
                    value={txHash}
                    onChange={e => setTxHash(e.target.value)}
                  />
                </div>

                {/* Screenshot */}
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
                {[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : !txHistory.data || txHistory.data.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No transactions yet</p>
                <p className="text-sm mt-1">Deposit USDD to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {txHistory.data.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <TxIcon type={tx.type} />
                      </div>
                      <div>
                        <div className="font-medium text-sm capitalize">{tx.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                          {tx.note && <span className="ml-2 text-muted-foreground/70">{tx.note}</span>}
                          {tx.txHash && <span className="ml-2 font-mono">{tx.txHash.substring(0, 10)}...</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-bold text-sm ${
                        tx.type === "deposit" || tx.type === "refund" || tx.type === "reward"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}>
                        {tx.type === "deposit" || tx.type === "refund" || tx.type === "reward" ? "+" : "-"}
                        {parseFloat(tx.amountUsdd).toFixed(2)} USDD
                      </div>
                      <Badge variant={
                        tx.status === "confirmed" || tx.status === "completed" ? "default" :
                        tx.status === "pending" ? "secondary" : "destructive"
                      } className="text-xs mt-0.5">
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
