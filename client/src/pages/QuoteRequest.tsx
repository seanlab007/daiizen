import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  FileText,
  Package,
  MapPin,
  Mail,
  Phone,
  ChevronLeft,
} from "lucide-react";

interface QuoteItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPriceUsdd: string;
}

const ORG_TYPES = [
  { value: "ngo", label: "NGO / Non-Profit" },
  { value: "military", label: "Military / Defense" },
  { value: "government", label: "Government Agency" },
  { value: "medical", label: "Medical Organization" },
  { value: "other", label: "Other Institution" },
];

const URGENCY_OPTIONS = [
  { value: "standard", label: "Standard (7–14 days)", icon: FileText, color: "text-blue-600" },
  { value: "urgent", label: "Urgent (3–7 days)", icon: Zap, color: "text-amber-600" },
  { value: "critical", label: "Critical (24–72 hrs)", icon: AlertTriangle, color: "text-red-600" },
];

export default function QuoteRequest() {
  // Form state
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [orgType, setOrgType] = useState<string>("");
  const [deliveryCountry, setDeliveryCountry] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [urgency, setUrgency] = useState<"standard" | "urgent" | "critical">("standard");
  const [notes, setNotes] = useState("");

  // Items
  const [items, setItems] = useState<QuoteItem[]>([
    { productId: 0, productName: "", quantity: 1, unitPriceUsdd: "0" },
  ]);

  // Product search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  // Submit state
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  // Fetch products for search
  const { data: productsData } = trpc.products.list.useQuery(
    { page: 1, limit: 200 },
    { staleTime: 60000 }
  );

  const filteredProducts = useMemo(() => {
    if (!productsData?.items || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return productsData.items
      .filter((p: { nameEn: string; id: number; priceUsdd: string }) => p.nameEn.toLowerCase().includes(q))
      .slice(0, 8);
  }, [productsData, searchQuery]);

  const submitMutation = trpc.quotes.submit.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setSubmittedId(data.id);
    },
  });

  const totalEstimate = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + parseFloat(item.unitPriceUsdd || "0") * item.quantity,
        0
      ),
    [items]
  );

  function addItem() {
    setItems((prev) => [
      ...prev,
      { productId: 0, productName: "", quantity: 1, unitPriceUsdd: "0" },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof QuoteItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function selectProduct(
    index: number,
    product: { id: number; nameEn: string; priceUsdd: string }
  ) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: product.id,
              productName: product.nameEn,
              unitPriceUsdd: product.priceUsdd,
            }
          : item
      )
    );
    setSearchQuery("");
    setActiveItemIndex(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgType) return;
    const validItems = items.filter((i) => i.productName.trim() && i.quantity > 0);
    if (validItems.length === 0) return;
    submitMutation.mutate({
      orgName,
      contactName,
      contactEmail,
      contactPhone: contactPhone || undefined,
      orgType: orgType as "ngo" | "military" | "government" | "medical" | "other",
      deliveryCountry,
      deliveryCity: deliveryCity || undefined,
      deliveryAddress: deliveryAddress || undefined,
      items: validItems,
      urgency,
      notes: notes || undefined,
    });
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full bg-slate-800 border-slate-700 text-center">
          <CardContent className="pt-10 pb-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Quote Request Submitted</h2>
            <p className="text-slate-300 mb-2">
              Your bulk quote request <span className="font-mono text-green-400">#{submittedId}</span> has been received.
            </p>
            <p className="text-slate-400 text-sm mb-8">
              Our procurement team will review your request and respond to{" "}
              <span className="text-white">{contactEmail}</span> within{" "}
              {urgency === "critical" ? "24–72 hours" : urgency === "urgent" ? "3–7 days" : "7–14 days"}.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Back to Home
                </Button>
              </Link>
              <Link href="/emergency">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Browse Emergency Supplies
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white gap-1">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Bulk Quote Request</h1>
              <p className="text-slate-400 text-xs">For NGOs, Military & Government Procurement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Organization & Contact */}
            <div className="lg:col-span-2 space-y-6">
              {/* Organization Info */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Organization Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">Organization Name *</Label>
                      <Input
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. Médecins Sans Frontières"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">Organization Type *</Label>
                      <Select value={orgType} onValueChange={setOrgType} required>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {ORG_TYPES.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-white hover:bg-slate-700">
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Mail className="w-4 h-4 text-blue-400" />
                    Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">Contact Name *</Label>
                      <Input
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Full name"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">Email Address *</Label>
                      <Input
                        required
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="procurement@org.org"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      Phone / WhatsApp (optional)
                    </Label>
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4 text-green-400" />
                    Delivery Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">Country *</Label>
                      <Input
                        required
                        value={deliveryCountry}
                        onChange={(e) => setDeliveryCountry(e.target.value)}
                        placeholder="e.g. Ukraine, Sudan, Yemen"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">City / Region</Label>
                      <Input
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        placeholder="City or region"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">Delivery Address / Coordinates</Label>
                    <Textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Full address, nearest checkpoint, or GPS coordinates"
                      rows={2}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Package className="w-4 h-4 text-purple-400" />
                    Requested Items
                    <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-300">
                      {items.filter((i) => i.productName).length} item(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="relative border border-slate-600 rounded-lg p-3 bg-slate-700/40">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          {/* Product search */}
                          <div className="relative">
                            <div className="flex items-center gap-2">
                              <Search className="w-4 h-4 text-slate-400 shrink-0" />
                              <Input
                                value={activeItemIndex === index ? searchQuery : item.productName}
                                onChange={(e) => {
                                  setSearchQuery(e.target.value);
                                  setActiveItemIndex(index);
                                  if (!item.productName) {
                                    updateItem(index, "productName", e.target.value);
                                  }
                                }}
                                onFocus={() => {
                                  setActiveItemIndex(index);
                                  setSearchQuery(item.productName);
                                }}
                                placeholder="Search product or type name..."
                                className="bg-slate-600 border-slate-500 text-white placeholder:text-slate-400 text-sm"
                              />
                            </div>
                            {/* Dropdown */}
                            {activeItemIndex === index && filteredProducts.length > 0 && (
                              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
                                {filteredProducts.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => selectProduct(index, p)}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between gap-2"
                                  >
                                    <span className="text-white text-sm truncate">{p.nameEn}</span>
                                    <span className="text-amber-400 text-xs shrink-0">{p.priceUsdd} USDD</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Qty + price */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <Label className="text-slate-400 text-xs shrink-0">Qty</Label>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                                className="bg-slate-600 border-slate-500 text-white w-20 text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 flex-1">
                              <Label className="text-slate-400 text-xs shrink-0">Unit Price</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                value={item.unitPriceUsdd}
                                onChange={(e) => updateItem(index, "unitPriceUsdd", e.target.value)}
                                className="bg-slate-600 border-slate-500 text-white text-sm"
                              />
                              <span className="text-slate-400 text-xs shrink-0">USDD</span>
                            </div>
                            {item.unitPriceUsdd && item.quantity > 0 && (
                              <span className="text-amber-400 text-xs shrink-0 font-mono">
                                = {(parseFloat(item.unitPriceUsdd) * item.quantity).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-slate-500 hover:text-red-400 mt-1 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addItem}
                    className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 bg-transparent gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Item
                  </Button>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special requirements, certifications needed, packaging instructions, access restrictions, or any other relevant information..."
                    rows={4}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right: Summary + Urgency */}
            <div className="space-y-6">
              {/* Urgency */}
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-base">Delivery Urgency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {URGENCY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setUrgency(opt.value as "standard" | "urgent" | "critical")}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3 ${
                          urgency === opt.value
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-slate-600 hover:border-slate-500 bg-slate-700/30"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${opt.color}`} />
                        <span className={`text-sm font-medium ${urgency === opt.value ? "text-white" : "text-slate-300"}`}>
                          {opt.label}
                        </span>
                        {urgency === opt.value && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 ml-auto shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="bg-slate-800/60 border-slate-700 sticky top-24">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-base">Quote Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {items
                      .filter((i) => i.productName)
                      .map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-400 truncate max-w-[140px]">
                            {item.productName} ×{item.quantity}
                          </span>
                          <span className="text-slate-300 font-mono shrink-0">
                            {(parseFloat(item.unitPriceUsdd || "0") * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                  {items.filter((i) => i.productName).length > 0 && (
                    <>
                      <div className="border-t border-slate-600 pt-3 flex justify-between">
                        <span className="text-slate-300 font-medium">Estimated Total</span>
                        <span className="text-amber-400 font-bold font-mono">
                          {totalEstimate.toFixed(2)} USDD
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs">
                        * Final price subject to negotiation and bulk discount
                      </p>
                    </>
                  )}

                  <Button
                    type="submit"
                    disabled={submitMutation.isPending || !orgType}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold mt-2"
                  >
                    {submitMutation.isPending ? "Submitting..." : "Submit Quote Request"}
                  </Button>

                  {submitMutation.isError && (
                    <p className="text-red-400 text-xs text-center">
                      Failed to submit. Please try again.
                    </p>
                  )}

                  <div className="text-slate-500 text-xs space-y-1 pt-1">
                    <p>✓ No payment required to request a quote</p>
                    <p>✓ Dedicated procurement team response</p>
                    <p>✓ Volume discounts available</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
