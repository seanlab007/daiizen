import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, TrendingUp, ShoppingCart, Eye, Package,
  DollarSign, BarChart3, Star
} from "lucide-react";

export default function SellerAnalytics() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();

  const { data: analytics, isLoading } = trpc.payment.getMyStoreAnalytics.useQuery(undefined, {
    enabled: !!user,
  });

  if (loading || isLoading) {
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

  const totals = analytics?.totals ?? { views: 0, cartAdds: 0, orders: 0, gmvUsdd: 0 };
  const products = analytics?.products ?? [];

  const conversionRate = totals.views > 0
    ? ((totals.orders / totals.views) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/seller/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> 返回卖家后台
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">销售数据看板</h1>
          <p className="text-gray-600 mt-2">实时追踪商品浏览、加购、成交数据，优化您的选品策略</p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-5 h-5 opacity-80" />
                <span className="text-xs opacity-70">浏览量</span>
              </div>
              <div className="text-3xl font-bold">{totals.views.toLocaleString()}</div>
              <div className="text-xs opacity-70 mt-1">商品页面访问次数</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-5 h-5 opacity-80" />
                <span className="text-xs opacity-70">加购次数</span>
              </div>
              <div className="text-3xl font-bold">{totals.cartAdds.toLocaleString()}</div>
              <div className="text-xs opacity-70 mt-1">加入购物车次数</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 opacity-80" />
                <span className="text-xs opacity-70">成交订单</span>
              </div>
              <div className="text-3xl font-bold">{totals.orders.toLocaleString()}</div>
              <div className="text-xs opacity-70 mt-1">转化率 {conversionRate}%</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 opacity-80" />
                <span className="text-xs opacity-70">总 GMV</span>
              </div>
              <div className="text-3xl font-bold">{Number(totals.gmvUsdd).toFixed(2)}</div>
              <div className="text-xs opacity-70 mt-1">USDD 成交总额</div>
            </CardContent>
          </Card>
        </div>

        {/* Conversion funnel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              转化漏斗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "浏览", value: totals.views, color: "bg-blue-500", pct: 100 },
                {
                  label: "加购",
                  value: totals.cartAdds,
                  color: "bg-orange-500",
                  pct: totals.views > 0 ? (totals.cartAdds / totals.views) * 100 : 0
                },
                {
                  label: "成交",
                  value: totals.orders,
                  color: "bg-green-500",
                  pct: totals.views > 0 ? (totals.orders / totals.views) * 100 : 0
                },
              ].map((stage) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <div className="w-12 text-sm font-medium text-gray-600">{stage.label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full flex items-center pl-3 transition-all`}
                      style={{ width: `${Math.max(stage.pct, 2)}%` }}
                    >
                      <span className="text-white text-xs font-semibold">{stage.value.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-14 text-right text-sm text-gray-500">{stage.pct.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              商品销售排行
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无商品数据</p>
                <p className="text-sm mt-1">添加商品后，数据将在这里显示</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product: any, index: number) => {
                  const convRate = Number(product.views) > 0
                    ? ((Number(product.orders) / Number(product.views)) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <div key={product.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-yellow-400 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        index === 2 ? "bg-orange-400 text-white" :
                        "bg-gray-200 text-gray-600"
                      }`}>
                        {index < 3 ? <Star className="w-4 h-4" /> : index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{product.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {product.priceUsdd} USDD
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-sm font-bold text-blue-600">{Number(product.views).toLocaleString()}</div>
                          <div className="text-xs text-gray-400">浏览</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-orange-600">{Number(product.cartAdds).toLocaleString()}</div>
                          <div className="text-xs text-gray-400">加购</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-green-600">{Number(product.orders).toLocaleString()}</div>
                          <div className="text-xs text-gray-400">成交</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-purple-600">{Number(product.gmvUsdd).toFixed(2)}</div>
                          <div className="text-xs text-gray-400">GMV</div>
                        </div>
                      </div>

                      <Badge variant={Number(convRate) >= 5 ? "default" : "secondary"} className="text-xs">
                        {convRate}% 转化
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
