import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, ShieldAlert, Truck, Package, Phone, Mail, Building2, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const BULK_TIERS = [
  { qty: "5+", pct: "5%", label: "5 or more items" },
  { qty: "10+", pct: "10%", label: "10 or more items" },
  { qty: "20+", pct: "15%", label: "20 or more items" },
];

function getLocalizedName(product: Record<string, unknown>, language: string): string {
  const key = `name${language.charAt(0).toUpperCase() + language.slice(1)}`;
  return (product[key] as string) || (product["nameEn"] as string) || "";
}

export default function Emergency() {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: result, isLoading } = trpc.products.list.useQuery({
    categorySlug: "emergency-supplies",
    limit: 50,
    page: 1,
  });
  const products = result?.items ?? [];

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => { toast.success("Added to cart!"); utils.cart.count.invalidate(); },
    onError: () => toast.error("Failed to add to cart"),
  });

  const handleAddToCart = (productId: number) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-red-950 via-red-900 to-orange-900 text-white py-16 md:py-24">
        <div className="container max-w-5xl">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-300" />
            <span className="text-xs font-semibold tracking-widest text-red-300 uppercase">Crisis Zone Essentials · 战区急需物资</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-tight">
            Emergency Supplies<br />
            <span className="text-red-300">for Conflict Zones</span>
          </h1>
          <p className="text-red-100/80 text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
            Daiizen partners with supply chains to provide critical emergency supplies — antibiotics,
            first aid kits, water purification, communication devices, and survival tools — to NGOs,
            relief organizations, and individuals in crisis zones worldwide.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-500 text-white border-0 gap-2">
              <a href="#products">
                Browse All Supplies <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-red-400 text-red-200 hover:bg-red-800/40 gap-2">
              <a href="#bulk-order">
                NGO / Bulk Orders
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Key Commitments */}
      <section className="py-12 bg-muted/30 border-b border-border/50">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Truck,
                title: "Priority Shipping",
                desc: "Emergency orders receive priority processing. We work with freight partners experienced in delivering to conflict-affected regions.",
              },
              {
                icon: Package,
                title: "Discreet Packaging",
                desc: "All emergency supplies are shipped in neutral, unmarked packaging to minimize risk during transit through sensitive areas.",
              },
              {
                icon: ShieldAlert,
                title: "Verified Suppliers",
                desc: "Every emergency product is sourced from verified manufacturers with quality certifications. Medical supplies meet international standards.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bulk Discount Tiers */}
      <section className="py-10 bg-orange-50 border-b border-orange-200">
        <div className="container max-w-5xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">Bulk Purchase Discounts</span>
              </div>
              <p className="text-xs text-orange-700">For NGOs, relief organizations, and bulk buyers</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {BULK_TIERS.map(({ qty, pct, label }) => (
                <div key={qty} className="flex items-center gap-2 bg-white border border-orange-300 rounded-xl px-4 py-3 shadow-sm">
                  <span className="text-lg font-bold text-orange-600">{pct} OFF</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Buy {qty}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section id="products" className="py-16">
        <div className="container max-w-5xl">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-6">
            All Emergency Supplies
            <span className="ml-2 text-sm font-normal text-muted-foreground">({products.length} items)</span>
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.id} className="group rounded-xl border border-border/60 bg-card overflow-hidden hover:border-red-400/50 hover:shadow-md transition-all relative flex flex-col">
                  {/* Emergency badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">🚨 EMERGENCY</span>
                  </div>
                  <Link href={`/products/${product.slug}`} className="block">
                    <div className="aspect-square bg-muted/40 overflow-hidden">
                      {product.images && (product.images as string[]).length > 0 ? (
                        <img
                          src={(product.images as string[])[0]}
                          alt={getLocalizedName(product as Record<string, unknown>, language)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🚨</div>
                      )}
                    </div>
                  </Link>
                  <div className="p-3 flex flex-col flex-1">
                    <Link href={`/products/${product.slug}`}>
                      <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-1.5 hover:text-primary transition-colors">
                        {getLocalizedName(product as Record<string, unknown>, language)}
                      </p>
                    </Link>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-sm font-semibold text-primary">
                        {Number(product.priceUsdd).toFixed(2)} USDD
                      </span>
                      <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full font-medium">
                        Bulk ↓
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-xs w-full"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addToCartMutation.isPending || product.stock === 0}
                    >
                      {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* NGO / Bulk Order Contact */}
      <section id="bulk-order" className="py-16 bg-muted/30 border-t border-border/50">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold tracking-wider text-primary uppercase">For Organizations</span>
              </div>
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-4">
                NGO & Institutional Bulk Orders
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                We work directly with NGOs, humanitarian organizations, government agencies, and
                medical relief teams to fulfill large-scale emergency supply orders. Custom pricing,
                dedicated logistics coordination, and documentation support are available for
                institutional buyers.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Package, text: "Minimum order: 20 units per SKU for institutional pricing" },
                  { icon: Truck, text: "Freight forwarding to conflict zones and restricted areas" },
                  { icon: ShieldAlert, text: "Certificate of origin and customs documentation provided" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground">Contact Our Emergency Team</h3>
              <p className="text-sm text-muted-foreground">
                For bulk orders, custom sourcing requests, or logistics coordination, reach out directly:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">emergency@daiizen.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp / Signal</p>
                    <p className="text-sm font-medium text-foreground">+86 138 0000 0000</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Response time: within 24 hours. For urgent requests, please indicate "URGENT" in your message subject.
              </p>
              <Button asChild className="w-full gap-2">
                <Link href="/products?category=emergency-supplies">
                  Browse Full Catalog <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
