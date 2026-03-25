import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, Copy, ArrowLeft, ShieldCheck, ExternalLink } from "lucide-react";

// ─── Payment Addresses ────────────────────────────────────────────────────────
const USDD_ADDRESS = import.meta.env.VITE_USDD_PAYMENT_ADDRESS || "TRX_USDD_ADDRESS_PLACEHOLDER";
const DARK_ADDRESS = import.meta.env.VITE_DARK_PAYMENT_ADDRESS || "TRX_DARK_ADDRESS_PLACEHOLDER";

type DepositMethod = "usdd" | "dark";

const METHODS: { id: DepositMethod; label: string; sublabel: string; icon: string; address: string; color: string }[] = [
  {
    id: "usdd",
    label: "USDD",
    sublabel: "Stablecoin · TRON TRC-20",
    icon: "🪙",
    address: USDD_ADDRESS,
    color: "border-emerald-400 bg-emerald-50",
  },
  {
    id: "dark",
    label: "DARK",
    sublabel: "DMB Token · TRON TRC-20",
    icon: "🌑",
    address: DARK_ADDRESS,
    color: "border-purple-400 bg-purple-50",
  },
];

export default function DepositPayment() {
  const { depositId } = useParams<{ depositId: string }>();
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();

  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>("usdd");
  const [transferNote, setTransferNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.payment.submitDepositPayment.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Submitted! We will review your transfer within 1-2 business days.");
    },
    onError: (err) => {
      toast.error("Submission failed: " + err.message);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Submitted</h2>
            <p className="text-gray-600 mb-6">
              We will review your transfer within <strong>1-2 business days</strong>.
              Your store will be activated once confirmed.
            </p>
            <Button onClick={() => navigate("/seller/dashboard")} className="w-full">
              Back to Seller Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMethod = METHODS.find((m) => m.id === selectedMethod)!;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentMethod.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Address copied!");
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      depositId: parseInt(depositId),
      paymentMethod: selectedMethod as any,
      transferNote: transferNote || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/seller/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pay Store Deposit</h1>
          <p className="text-gray-600 mt-2">Transfer your deposit using DARK or USDD, then submit for review.</p>
        </div>

        {/* ── Exclusive Payment Notice ─────────────────────────────────────── */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-6 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Daiizen exclusively accepts DMB DARK &amp; USDD payments
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              We do not accept Alipay, WeChat Pay, bank transfers, or any fiat currency.
              Both DARK and USDD run on the TRON (TRC-20) network and are issued by{" "}
              <a href="https://www.darkmatterbank.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Dark Matter Bank (DMB)
              </a>.
            </p>
          </div>
        </div>

        {/* Step 1: Select payment token */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Step 1: Choose Payment Token</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedMethod === m.id
                      ? `${m.color} border-current font-medium`
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm text-gray-900">{m.label}</div>
                    <div className="text-xs text-gray-500">{m.sublabel}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Transfer instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Transfer {currentMethod.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Network</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  TRON (TRC-20)
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full ml-1">TRC-20</span>
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Deposit Address</span>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                  <span className="text-xs font-mono text-gray-800 flex-1 break-all leading-relaxed">
                    {currentMethod.address}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-semibold">⚠️ Important</p>
              <p>• Only send <strong>{currentMethod.label}</strong> on <strong>TRON (TRC-20)</strong> network</p>
              <p>• Sending other tokens or using other networks will result in permanent loss of funds</p>
              <p>• Include your username in the transfer memo/note</p>
            </div>

            <div>
              <Label htmlFor="transferNote">Transfer Note (enter your username)</Label>
              <Input
                id="transferNote"
                placeholder="Your username"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Submit */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Step 3: Confirm Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              After completing the transfer, click the button below. We will verify the transaction on-chain and activate your store within 1-2 business days.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="w-full h-12 text-base font-semibold"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Transfer Confirmation"}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center pb-4">
          <a
            href="https://www.darkmatterbank.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
          >
            Get DARK &amp; USDD at Dark Matter Bank <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
