import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingDown, Globe, Truck, ShieldCheck, MessageSquare } from "lucide-react";
import { useState, useMemo } from "react";

const EV_PRICE_COMPARISON = [
  {
    model: "Volkswagen ID.3",
    chinaPrice: "¥120,000",
    chinaUSD: "$16,800",
    overseasPrice: "€31,300",
    overseasUSD: "$34,000",
    savings: "~$17,200",
    savingsPct: "51%",
    market: "Europe / Central Asia",
    slug: "volkswagen-id3-china-parallel-export",
  },
  {
    model: "Volkswagen ID.4",
    chinaPrice: "¥165,000",
    chinaUSD: "$22,500",
    overseasPrice: "€43,000",
    overseasUSD: "$46,800",
    savings: "~$24,300",
    savingsPct: "52%",
    market: "Europe / Middle East",
    slug: "volkswagen-id4-china-parallel-export",
  },
  {
    model: "Li Auto L9",
    chinaPrice: "¥450,000",
    chinaUSD: "$62,000",
    overseasPrice: "¥1,000,000+",
    overseasUSD: "$138,000+",
    savings: "~$76,000",
    savingsPct: "55%",
    market: "Central Asia / Russia",
    slug: "li-auto-l9-parallel-export",
  },
  {
    model: "BYD Han EV",
    chinaPrice: "¥280,000",
    chinaUSD: "$38,000",
    overseasPrice: "€68,000",
    overseasUSD: "$74,000",
    savings: "~$36,000",
    savingsPct: "49%",
    market: "Europe / Southeast Asia",
    slug: "byd-han-ev-parallel-export",
  },
  {
    model: "CATL LFP Battery 46kWh",
    chinaPrice: "¥62,000",
    chinaUSD: "$8,500",
    overseasPrice: "$22,000",
    overseasUSD: "$22,000",
    savings: "~$13,500",
    savingsPct: "61%",
    market: "Global / Industrial",
    slug: "catl-lfp-battery-pack-46kwh",
  },
];

const KEY_MARKETS = [
  { flag: "🇰🇿", name: "Kazakhstan", demand: "EVs, Consumer Electronics" },
  { flag: "🇺🇿", name: "Uzbekistan", demand: "EVs, Industrial Equipment" },
  { flag: "🇦🇪", name: "UAE / Dubai", demand: "Luxury EVs, Smart Home" },
  { flag: "🇸🇦", name: "Saudi Arabia", demand: "EVs, Energy Storage" },
  { flag: "🇩🇪", name: "Germany", demand: "VW ID Series, Robot Vacuums" },
  { flag: "🇷🇺", name: "Russia", demand: "EVs, Industrial Equipment" },
  { flag: "🇹🇭", name: "Thailand", demand: "BYD, Consumer Electronics" },
  { flag: "🇮🇩", name: "Indonesia", demand: "EVs, Power Banks, Wi-Fi" },
];

export default function ParallelExport() {
  const [activeTab, setActiveTab] = useState<"evs" | "industrial" | "consumer">("evs");

  const evProducts = trpc.products.list.useQuery(
    useMemo(() => ({ categorySlug: "electric-vehicles", limit: 8 }), [])
  );

  const industrialProducts = trpc.products.list.useQuery(
    useMemo(() => ({ categorySlug: "industrial-equipment", limit: 6 }), [])
  );

  const consumerProducts = trpc.products.list.useQuery(
    useMemo(() => ({ categorySlug: "smart-home", limit: 6 }), [])
  );

  const currentProducts =
    activeTab === "evs"
      ? evProducts.data?.items
      : activeTab === "industrial"
      ? industrialProducts.data?.items
      : consumerProducts.data?.items;

  const isLoading =
    activeTab === "evs"
      ? evProducts.isLoading
      : activeTab === "industrial"
      ? industrialProducts.isLoading
      : consumerProducts.isLoading;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-b border-blue-800/30">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-blue-600 text-white border-0 text-sm px-3 py-1">
              🌏 Parallel Export Hub
            </Badge>
            <Badge variant="outline" className="border-blue-400 text-blue-300 text-sm px-3 py-1">
              China Price Advantage
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            Buy Chinese at
            <span className="text-blue-400"> China Prices</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mb-3">
            The same products sold in Europe and Central Asia for 2–3× more — sourced directly from Chinese factories at domestic prices. Ideal for parallel importers, fleet operators, and institutional buyers.
          </p>
          <p className="text-base text-slate-400 max-w-2xl mb-8">
            平行出口 (Parallel Export) — leveraging China's supply chain cost advantage to deliver world-class products at 40–60% below overseas retail.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/quote">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                <MessageSquare className="w-5 h-5 mr-2" />
                Request Bulk Quote
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="border-blue-400 text-blue-300 hover:bg-blue-900/30 px-8">
                Browse All Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="bg-blue-900/20 border-b border-blue-800/30">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "40–61%", label: "Average Price Savings" },
            { value: "91", label: "Products Available" },
            { value: "8+", label: "Key Export Markets" },
            { value: "6", label: "Languages Supported" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-black text-blue-400 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Price Comparison Table */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold">China vs Overseas Price Comparison</h2>
          </div>
          <p className="text-slate-400 mb-6">
            Real price gaps that drive the parallel export business. All prices are approximate market rates as of 2025–2026.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-slate-300 text-left">
                  <th className="px-4 py-3 font-semibold">Model</th>
                  <th className="px-4 py-3 font-semibold text-center">China Price</th>
                  <th className="px-4 py-3 font-semibold text-center">Overseas Price</th>
                  <th className="px-4 py-3 font-semibold text-center text-green-400">You Save</th>
                  <th className="px-4 py-3 font-semibold text-center">Key Market</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {EV_PRICE_COMPARISON.map((row, i) => (
                  <tr
                    key={row.model}
                    className={`border-t border-slate-700 hover:bg-slate-800/50 transition-colors ${
                      i % 2 === 0 ? "bg-slate-900/50" : "bg-slate-900"
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-white">{row.model}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-white font-bold">{row.chinaUSD}</div>
                      <div className="text-slate-400 text-xs">{row.chinaPrice}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-slate-300 font-bold">{row.overseasUSD}</div>
                      <div className="text-slate-500 text-xs">{row.overseasPrice}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-green-400 font-black text-base">{row.savings}</div>
                      <Badge className="bg-green-900/50 text-green-400 border-green-700 text-xs mt-1">
                        -{row.savingsPct}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400 text-xs">{row.market}</td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/products/${row.slug}`}>
                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-900/30 text-xs">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            * Prices are approximate market rates. Final pricing depends on specifications, quantity, and shipping terms. Contact us for exact quotes.
          </p>
        </div>

        {/* Key Export Markets */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Key Export Markets</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {KEY_MARKETS.map((market) => (
              <Card key={market.name} className="bg-slate-800/50 border-slate-700 hover:border-blue-600 transition-colors">
                <CardContent className="p-4">
                  <div className="text-3xl mb-2">{market.flag}</div>
                  <div className="font-bold text-white mb-1">{market.name}</div>
                  <div className="text-xs text-slate-400">{market.demand}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Browse Parallel Export Products</h2>
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: "evs", label: "⚡ Electric Vehicles" },
              { key: "industrial", label: "🏭 Industrial Equipment" },
              { key: "consumer", label: "🏠 Smart Home" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentProducts?.map((product) => {
                const images: string[] = product.images ? JSON.parse(product.images as unknown as string) : [];
                const imageUrl = images[0] || product.aiGeneratedImageUrl || "";
                const price = parseFloat(product.priceUsdd);
                return (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500 transition-all hover:scale-[1.02] cursor-pointer h-full">
                      <div className="relative">
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={product.nameEn}
                            className="w-full h-40 object-cover rounded-t-xl"
                          />
                        )}
                        {price >= 10000 && (
                          <Badge className="absolute top-2 left-2 bg-blue-600 text-white border-0 text-xs">
                            B2B Inquiry
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="font-semibold text-white text-sm mb-1 line-clamp-2">{product.nameEn}</div>
                        <div className="text-blue-400 font-bold">
                          {price >= 10000
                            ? `$${price.toLocaleString()} — Contact for Quote`
                            : `$${price.toFixed(2)} USDD`}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Why Parallel Export */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Why Parallel Export Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <TrendingDown className="w-8 h-8 text-green-400" />,
                title: "Supply Chain Cost Advantage",
                desc: "China's manufacturing ecosystem produces world-class products at 40–60% below Western retail prices. The same factory that makes European-brand products sells direct at domestic prices.",
              },
              {
                icon: <Truck className="w-8 h-8 text-blue-400" />,
                title: "Efficient Logistics",
                desc: "Direct shipping from Chinese ports to Central Asia, Middle East, and Southeast Asia via Belt & Road routes. Faster and cheaper than European re-export.",
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-purple-400" />,
                title: "Verified Quality",
                desc: "All products meet international standards (CE, ISO, UN38.3). We source only from verified factories with export licenses and quality certifications.",
              },
            ].map((item) => (
              <Card key={item.title} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="mb-3">{item.icon}</div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border border-blue-700/50 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-black mb-3">Ready to Start Importing?</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Submit a bulk quote request with your product list, quantities, and delivery destination. Our team responds within 24 hours with competitive pricing and shipping terms.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/quote">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                <MessageSquare className="w-5 h-5 mr-2" />
                Submit Bulk Quote Request
              </Button>
            </Link>
            <a href="mailto:trade@daiizen.com">
              <Button size="lg" variant="outline" className="border-slate-500 text-slate-300 hover:bg-slate-800 px-8">
                Email: trade@daiizen.com
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
