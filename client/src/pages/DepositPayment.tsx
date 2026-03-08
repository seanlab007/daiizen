import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, Upload, Copy, ArrowLeft, Smartphone, CreditCard, Banknote } from "lucide-react";

const PAYMENT_ICONS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  alipay: { label: "支付宝", color: "bg-blue-500", icon: <Smartphone className="w-5 h-5" /> },
  wechat: { label: "微信支付", color: "bg-green-500", icon: <Smartphone className="w-5 h-5" /> },
  unionpay: { label: "银联转账", color: "bg-red-500", icon: <CreditCard className="w-5 h-5" /> },
  usdd: { label: "USDD (TRC-20)", color: "bg-purple-500", icon: <Banknote className="w-5 h-5" /> },
};

export default function DepositPayment() {
  const { depositId } = useParams<{ depositId: string }>();
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();

  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [amountCny, setAmountCny] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: paymentMethods, isLoading: methodsLoading } = trpc.payment.getPaymentMethods.useQuery();

  const submitMutation = trpc.payment.submitDepositPayment.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("提交成功: 我们将在1-2个工作日内审核您的转账凭证");
    },
    onError: (err) => {
      toast.error("提交失败: " + err.message);
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">转账凭证已提交</h2>
            <p className="text-gray-600 mb-6">
              我们将在 <strong>1-2 个工作日</strong>内审核您的转账凭证。
              审核通过后，您的店铺将自动激活。
            </p>
            <Button onClick={() => navigate("/seller/dashboard")} className="w-full">
              返回卖家后台
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedConfig = paymentMethods?.find((m: any) => m.method === selectedMethod);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("文件过大: 截图不能超过5MB");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("上传失败");
      const { url } = await res.json();
      setScreenshotUrl(url);
      toast.success("上传成功: 转账截图已上传");
    } catch {
      toast.error("上传失败: 请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedMethod) {
      toast.error("请选择支付方式");
      return;
    }
    if (selectedMethod !== "usdd" && !screenshotUrl) {
      toast.error("请上传转账截图");
      return;
    }
    submitMutation.mutate({
      depositId: parseInt(depositId),
      paymentMethod: selectedMethod as any,
      paymentAmountCny: amountCny ? parseFloat(amountCny) : undefined,
      transferScreenshotUrl: screenshotUrl || undefined,
      transferNote: transferNote || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/seller/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> 返回
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">缴纳开店保证金</h1>
          <p className="text-gray-600 mt-2">选择支付方式，完成转账后上传凭证，等待审核激活店铺</p>
        </div>

        {/* Step 1: Select payment method */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">第一步：选择支付方式</CardTitle>
          </CardHeader>
          <CardContent>
            {methodsLoading ? (
              <div className="text-center py-4 text-gray-500">加载中...</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods?.map((method: any) => {
                  const config = PAYMENT_ICONS[method.method] ?? { label: method.method, color: "bg-gray-500", icon: null };
                  return (
                    <button
                      key={method.method}
                      onClick={() => setSelectedMethod(method.method)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        selectedMethod === method.method
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white`}>
                        {config.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">{config.label}</div>
                        <div className="text-xs text-gray-500">{method.accountName}</div>
                      </div>
                    </button>
                  );
                })}
                {/* USDD option always available */}
                <button
                  onClick={() => setSelectedMethod("usdd")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedMethod === "usdd"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">USDD (TRC-20)</div>
                    <div className="text-xs text-gray-500">加密货币转账</div>
                  </div>
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Payment details */}
        {selectedMethod && selectedConfig && selectedMethod !== "usdd" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">第二步：扫码转账</CardTitle>
              <CardDescription>
                请向以下账户转账保证金，转账完成后上传截图
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">收款账户</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{selectedConfig.accountName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedConfig.accountNumber);
                        toast.success("已复制");
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {selectedConfig.accountNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">账号/手机号</span>
                    <span className="font-mono font-semibold">{selectedConfig.accountNumber}</span>
                  </div>
                )}
                {selectedConfig.qrCodeUrl && (
                  <div className="text-center pt-2">
                    <img
                      src={selectedConfig.qrCodeUrl}
                      alt="收款二维码"
                      className="w-48 h-48 mx-auto rounded-lg border"
                    />
                    <p className="text-xs text-gray-500 mt-2">扫描二维码付款</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="amountCny">实际转账金额（人民币）</Label>
                <Input
                  id="amountCny"
                  type="number"
                  placeholder="请输入实际转账金额"
                  value={amountCny}
                  onChange={(e) => setAmountCny(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="transferNote">备注信息（选填）</Label>
                <Input
                  id="transferNote"
                  placeholder="如：开店保证金 + 您的用户名"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Upload screenshot */}
        {selectedMethod && selectedMethod !== "usdd" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">第三步：上传转账截图</CardTitle>
            </CardHeader>
            <CardContent>
              {screenshotUrl ? (
                <div className="space-y-3">
                  <img src={screenshotUrl} alt="转账截图" className="max-h-64 rounded-lg border mx-auto block" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScreenshotUrl("")}
                    className="w-full"
                  >
                    重新上传
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">点击上传转账截图</span>
                  <span className="text-xs text-gray-400 mt-1">支持 JPG/PNG，最大 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}
            </CardContent>
          </Card>
        )}

        {selectedMethod === "usdd" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">USDD 转账说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-800">
                <p className="font-semibold mb-2">请通过 TRC-20 网络转账 USDD 至平台地址</p>
                <p className="text-xs">转账完成后，请在备注中填写您的用户名，我们将在核实后激活您的店铺</p>
              </div>
              <div>
                <Label htmlFor="transferNote">转账备注（请填写用户名）</Label>
                <Input
                  id="transferNote"
                  placeholder="您的用户名"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {selectedMethod && (
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || uploading}
            className="w-full h-12 text-base font-semibold"
          >
            {submitMutation.isPending ? "提交中..." : "提交转账凭证"}
          </Button>
        )}
      </div>
    </div>
  );
}
