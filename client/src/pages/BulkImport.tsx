import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload, Download, CheckCircle, XCircle, AlertCircle,
  ArrowLeft, FileSpreadsheet, Zap, ChevronRight
} from "lucide-react";

type ImportStep = "upload" | "preview" | "importing" | "done";

export default function BulkImport() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();

  const [step, setStep] = useState<ImportStep>("upload");
  const [fileBase64, setFileBase64] = useState("");
  const [filename, setFilename] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isDropship, setIsDropship] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: template } = trpc.bulkImport.getTemplate.useQuery();

  const previewMutation = trpc.bulkImport.previewImport.useMutation({
    onSuccess: (data) => {
      setPreviewData(data);
      setStep("preview");
    },
    onError: (err) => toast.error("解析失败: " + err.message),
  });

  const executeMutation = trpc.bulkImport.executeImport.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      setStep("done");
    },
    onError: (err) => toast.error("导入失败: " + err.message),
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }
  if (!user) { window.location.href = getLoginUrl(); return null; }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件过大，最大支持 10MB");
      return;
    }
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      setFileBase64(base64);
      previewMutation.mutate({ fileBase64: base64, filename: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadTemplate = () => {
    if (!template) return;
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${template.base64}`;
    link.download = template.filename;
    link.click();
  };

  const handleExecuteImport = () => {
    if (!previewData) return;
    setStep("importing");
    executeMutation.mutate({
      fileBase64,
      mapping: previewData.mapping,
      isDropshipAvailable: isDropship,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/seller/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> 返回卖家后台
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">批量导入商品</h1>
          <p className="text-gray-600 mt-2">上传 Excel/CSV 文件，AI 自动识别字段，一键批量添加供应链商品</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["upload", "preview", "importing", "done"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? "bg-primary text-white" :
                ["upload", "preview", "importing", "done"].indexOf(step) > i ? "bg-green-500 text-white" :
                "bg-gray-200 text-gray-500"
              }`}>
                {["upload", "preview", "importing", "done"].indexOf(step) > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < 3 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            </div>
          ))}
          <div className="ml-2 text-sm text-gray-500">
            {step === "upload" && "上传文件"}
            {step === "preview" && "预览确认"}
            {step === "importing" && "导入中..."}
            {step === "done" && "完成"}
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-500" />
                  下载模板
                </CardTitle>
                <CardDescription>先下载标准模板，按格式填写商品信息</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={handleDownloadTemplate} disabled={!template}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  下载 Excel 模板
                </Button>
                <div className="mt-3 text-xs text-gray-500">
                  模板字段：商品名称、描述、批发价(USDD)、库存、分类、标签、图片URL、最小起订量、发货天数
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-green-500" />
                  上传文件
                </CardTitle>
                <CardDescription>支持 .xlsx / .xls / .csv 格式，最大 10MB</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                >
                  {previewMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
                      <span className="text-sm text-gray-500">AI 正在解析文件...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-700">点击选择文件</span>
                      <span className="text-xs text-gray-400 mt-1">或拖拽文件到此处</span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={previewMutation.isPending}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && previewData && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  AI 字段映射结果
                </CardTitle>
                <CardDescription>
                  共检测到 <strong>{previewData.totalRows}</strong> 行数据，AI 已自动识别字段映射
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(previewData.mapping).map(([template, user]: [string, any]) => (
                    <div key={template} className="flex items-center gap-2 text-sm">
                      <Badge variant={user ? "default" : "secondary"} className="text-xs">
                        {template}
                      </Badge>
                      <span className="text-gray-400">→</span>
                      <span className={user ? "text-gray-700" : "text-gray-400 italic"}>
                        {user ?? "未匹配"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>数据预览（前5行）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {previewData.preview.map((row: any) => (
                    <div key={row.rowIndex} className={`p-3 rounded-lg border ${row.errors.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">第 {row.rowIndex} 行</span>
                        {row.errors.length > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="w-3 h-3 mr-1" /> {row.errors.length} 个错误
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" /> 正常
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm font-medium">{row.data.name || "(无名称)"}</div>
                      <div className="text-xs text-gray-500">批发价: {row.data.basePriceUsdd} USDD | 库存: {row.data.stock}</div>
                      {row.errors.length > 0 && (
                        <div className="mt-1 text-xs text-red-600">{row.errors.join("; ")}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDropship}
                    onChange={(e) => setIsDropship(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium text-sm">允许网红代发</div>
                    <div className="text-xs text-gray-500">勾选后，网红可选择这些商品在其店铺销售，由您直接发货</div>
                  </div>
                </label>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                重新上传
              </Button>
              <Button onClick={handleExecuteImport} className="flex-1">
                确认导入 {previewData.totalRows} 件商品
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === "importing" && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">正在批量导入...</h3>
              <p className="text-gray-500 text-sm">请勿关闭页面，正在处理您的商品数据</p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Done */}
        {step === "done" && importResult && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center mb-6">
                {importResult.errorCount === 0 ? (
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                ) : (
                  <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
                )}
                <h3 className="text-xl font-bold">导入完成</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{importResult.totalRows}</div>
                  <div className="text-xs text-gray-500 mt-1">总行数</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                  <div className="text-xs text-gray-500 mt-1">成功导入</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <div className="text-2xl font-bold text-red-600">{importResult.errorCount}</div>
                  <div className="text-xs text-gray-500 mt-1">失败行数</div>
                </div>
              </div>

              {importResult.errorRows.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-2 text-red-600">失败明细：</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errorRows.map((row: any) => (
                      <div key={row.rowIndex} className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded">
                        第 {row.rowIndex} 行: {row.errors.join("; ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setStep("upload"); setPreviewData(null); setImportResult(null); setFileBase64(""); }} className="flex-1">
                  继续导入
                </Button>
                <Button onClick={() => navigate("/seller/dashboard")} className="flex-1">
                  返回卖家后台
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
