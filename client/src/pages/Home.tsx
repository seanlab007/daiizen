import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Zap, Globe, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const CATEGORY_ICONS: Record<string, string> = {
  "daily-essentials": "🧴",
  "kitchen": "🍳",
  "stationery": "✏️",
  "clothing": "👕",
  "electronics": "🔌",
  "toys": "🧸",
  "beauty": "💄",
  "sports": "⚽",
  "emergency-supplies": "🚨",
};

export default function Home() {
  const { t, language } = useLanguage();

  const { isAuthenticated } = useAuth();
  const { data: featuredProducts = [] } = trpc.products.featured.useQuery({ limit: 8 });
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: emergencyProducts = [] } = trpc.products.list.useQuery(
    { categorySlug: "emergency-supplies", limit: 4, page: 1 },
    { select: (d) => d.items }
  );
  const utils = trpc.useUtils();
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => { toast.success("Added to cart!"); utils.cart.count.invalidate(); },
    onError: () => toast.error("Failed to add to cart"),
  });
  const handleAddToCart = (productId: number) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  type LocalizedItem = { nameEn: string; nameEs?: string | null; nameTr?: string | null; namePt?: string | null; nameAr?: string | null; nameRu?: string | null };

  const getLocalizedName = (item: LocalizedItem) => {
    const key = `name${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof LocalizedItem;
    return (item[key] as string) || item.nameEn;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-background to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent rounded-full text-xs font-medium text-accent-foreground mb-6">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Powered by USDD Stablecoin
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold text-foreground leading-tight mb-6 whitespace-pre-line">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/products">
                  {t("hero.cta")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="https://www.darkmatterbank.com" target="_blank" rel="noopener noreferrer">
                  {t("hero.learn")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-12 border-y border-border/50 bg-muted/20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, label: "Stable Prices", sub: "USDD protected" },
              { icon: Globe, label: "Ships Worldwide", sub: "190+ countries" },
              { icon: Zap, label: "Fast Delivery", sub: "7-21 days" },
              { icon: Package, label: "Quality Goods", sub: "Verified products" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl font-serif font-semibold text-foreground">Browse Categories</h2>
              <Link href="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
  {/* categories will render here once data loads */}
            {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:bg-accent/30 transition-all text-center"
                >
                  <span className="text-2xl">{CATEGORY_ICONS[cat.slug] || "📦"}</span>
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                    {getLocalizedName(cat)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-muted/20">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-foreground">{t("products.title")}</h2>
              <p className="text-sm text-muted-foreground mt-1">Curated everyday essentials</p>
            </div>
            <Link href="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
  {/* products will render here once data loads */}
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="group rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="aspect-square bg-muted/40 overflow-hidden">
                      {product.images && (product.images as string[]).length > 0 ? (
                        <img
                          src={(product.images as string[])[0]}
                          alt={getLocalizedName(product)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : product.aiGeneratedImageUrl ? (
                        <img
                          src={product.aiGeneratedImageUrl}
                          alt={getLocalizedName(product)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-1.5">
                        {getLocalizedName(product)}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary">
                          {Number(product.priceUsdd).toFixed(2)} USDD
                        </span>
                        {product.stock > 0 ? (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            {t("products.in_stock")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                            {t("products.out_stock")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Products coming soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Emergency Supplies Section */}
      {emergencyProducts.length > 0 && (
        <section className="py-16">
          <div className="container">
            {/* Banner Header */}
            <div className="rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-red-950 via-red-900 to-orange-900 border border-red-800/50">
              <div className="px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🚨</span>
                    <span className="text-xs font-semibold tracking-widest text-red-300 uppercase">战区急需 · Crisis Zone Essentials</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
                    Emergency Supplies
                  </h2>
                  <p className="text-red-200/80 text-sm max-w-md">
                    Critical supplies for conflict zones, disaster relief, and emergency preparedness.
                    Bulk discounts available — buy 5+ items for up to 15% off.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Button asChild className="bg-red-600 hover:bg-red-500 text-white border-0 gap-2">
                    <Link href="/products?category=emergency-supplies">
                      Shop All Emergency Supplies
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {emergencyProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="group rounded-xl border border-red-200/30 bg-card overflow-hidden hover:border-red-400/50 hover:shadow-md transition-all relative">
                    {/* Emergency badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">🚨 EMERGENCY</span>
                    </div>
                    <div className="aspect-square bg-muted/40 overflow-hidden">
                      {product.images && (product.images as string[]).length > 0 ? (
                        <img
                          src={(product.images as string[])[0]}
                          alt={getLocalizedName(product)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🚨</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-1.5">
                        {getLocalizedName(product)}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary">
                          {Number(product.priceUsdd).toFixed(2)} USDD
                        </span>
                        <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full font-medium">
                          Bulk Discount
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Bulk Discount Tiers Info */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {[
                { qty: "5+", pct: "5%", label: "Buy 5 or more" },
                { qty: "10+", pct: "10%", label: "Buy 10 or more" },
                { qty: "20+", pct: "15%", label: "Buy 20 or more" },
              ].map(({ qty, pct, label }) => (
                <div key={qty} className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                  <span className="text-sm font-bold text-orange-700">{pct} OFF</span>
                  <span className="text-xs text-orange-600">{label} items</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Parallel Export Banner */}
      <section className="py-16 bg-slate-950 text-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/60 border border-blue-700/50 rounded-full text-xs font-medium text-blue-300 mb-4">
                🌏 平行出口 · Parallel Export
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                Buy at <span className="text-blue-400">China Prices</span>,
                <br />Sell at <span className="text-green-400">Overseas Prices</span>
              </h2>
              <p className="text-slate-300 mb-6 max-w-lg">
                The same VW ID.3 costs ¥120,000 in China but €31,300 in Germany — a <strong className="text-white">51% price gap</strong>.
                Source EVs, industrial equipment, and consumer goods directly from Chinese factories at domestic prices.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { label: "VW ID.3", saving: "-51%" },
                  { label: "Li Auto L9", saving: "-55%" },
                  { label: "BYD Han EV", saving: "-49%" },
                  { label: "CATL Battery", saving: "-61%" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <span className="text-sm font-bold text-green-400">{item.saving}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/parallel-export">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                    🌏 View Parallel Export Hub
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/quote">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-6">
                    📋 Request Bulk Quote
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-3 shrink-0">
              {[
                { flag: "🇰🇿", name: "Kazakhstan", note: "Top EV importer" },
                { flag: "🇦🇪", name: "UAE / Dubai", note: "Luxury EV demand" },
                { flag: "🇩🇪", name: "Germany", note: "VW ID parallel import" },
                { flag: "🇸🇦", name: "Saudi Arabia", note: "Energy storage" },
              ].map((m) => (
                <div key={m.name} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{m.flag}</div>
                  <div className="text-sm font-bold text-white">{m.name}</div>
                  <div className="text-xs text-slate-400">{m.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* USDD Banner */}
      <section className="py-16">
        <div className="container">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/20 to-background border border-primary/20 p-8 md:p-12">
            <div className="max-w-xl">
              <div className="text-3xl mb-4">💎</div>
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
                Why Pay with USDD?
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                USDD is a decentralized stablecoin pegged to the US dollar, issued by Dark Matter Bank.
                Unlike local currencies in high-inflation countries, USDD maintains stable purchasing power —
                so the price you see today is the price you pay.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Stable Value", desc: "Pegged 1:1 to USD" },
                  { label: "Fast Settlement", desc: "Blockchain-powered" },
                  { label: "Global Access", desc: "No bank required" },
                ].map(({ label, desc }) => (
                  <div key={label} className="bg-background/60 rounded-lg p-3 border border-border/50">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
              <Button asChild variant="outline">
                <a href="https://www.darkmatterbank.com" target="_blank" rel="noopener noreferrer" className="gap-2">
                  Get USDD at Dark Matter Bank
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-muted/20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">D</span>
                </div>
                <span className="font-serif font-semibold text-foreground">Daiizen</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Quality everyday goods for the world, priced in stable currency.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Shop</p>
              <div className="space-y-2">
                <Link href="/products" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">All Products</Link>
                <Link href="/products?featured=true" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Featured</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Account</p>
              <div className="space-y-2">
                <Link href="/account" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">My Account</Link>
                <Link href="/orders" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">My Orders</Link>
                <Link href="/cart" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Cart</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Ecosystem</p>
              <div className="space-y-2">
                <a href="https://www.darkmatterbank.com" target="_blank" rel="noopener noreferrer" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Dark Matter Bank</a>
                <a href="https://www.darkmatterbank.com" target="_blank" rel="noopener noreferrer" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Get USDD</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">© 2026 Daiizen. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Powered by <span className="text-primary">USDD</span> · Dark Matter Bank</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
