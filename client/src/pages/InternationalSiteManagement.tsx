import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTRPC } from "../hooks/useTrpc";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useTranslation } from "../hooks/useTranslation";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Site {
  id: number;
  name: string;
  code: string;
  currency: string;
  currencySymbol?: string;
  domain?: string;
  isSourceEnabled: number;
  isTargetEnabled: number;
  status: string;
  sortOrder: number;
}

interface PriceRule {
  id: number;
  name: string;
  description?: string;
  ruleType: "EXCHANGE_RATE" | "PERCENTAGE" | "FIXED_AMOUNT";
  adjustmentValue: string;
  isDefault: number;
  isActive: number;
}

interface ExchangeRate {
  id: number;
  baseCurrency: string;
  targetCurrency: string;
  rate: string;
  source?: string;
  fetchedAt: string;
}

interface InternationalLink {
  id: number;
  sourceSiteId: number;
  targetSiteId: number;
  sourceProductId: number;
  targetProductId?: number;
  priceMode: "FOLLOW" | "OVERRIDE";
  priceRuleId?: number;
  overridePrice?: string;
  syncProductInfo: number;
  syncPrice: number;
  syncStatus: "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "SKIPPED";
  lastSyncedAt?: string;
  lastError?: string;
  sourceSite?: Site;
  targetSite?: Site;
  sourceProduct?: any;
  priceRule?: PriceRule;
}

interface Stats {
  totalLinks: number;
  activeLinks: number;
  syncedToday: number;
  failedLinks: number;
  byTargetSite: Array<{ siteId: number; siteName: string; count: number }>;
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function InternationalSiteManagement() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const trpc = useTRPC();
  const { user } = useAuth();
  
  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate({ to: "/" });
    }
  }, [user, navigate]);
  
  const [activeTab, setActiveTab] = useState("links");
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("International Site Management")}</h1>
          <p className="text-muted-foreground">
            {t("Manage cross-border product listings and pricing synchronization")}
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="links">{t("International Links")}</TabsTrigger>
          <TabsTrigger value="sites">{t("Sites")}</TabsTrigger>
          <TabsTrigger value="rules">{t("Price Rules")}</TabsTrigger>
          <TabsTrigger value="rates">{t("Exchange Rates")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="links" className="space-y-4">
          <InternationalLinksTab />
        </TabsContent>
        
        <TabsContent value="sites" className="space-y-4">
          <SitesTab />
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-4">
          <PriceRulesTab />
        </TabsContent>
        
        <TabsContent value="rates" className="space-y-4">
          <ExchangeRatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── International Links Tab ──────────────────────────────────────────────────

function InternationalLinksTab() {
  const trpc = useTRPC();
  const { t } = useTranslation();
  
  const { data: links, refetch: refetchLinks } = trpc.international.links.list.useQuery({});
  const { data: sites } = trpc.international.sites.list.useQuery({});
  const { data: priceRules } = trpc.international.priceRules.list.useQuery({});
  const { data: stats } = trpc.international.stats.get.useQuery({});
  
  const syncAllMutation = trpc.international.links.syncAll.useMutation({
    onSuccess: () => refetchLinks(),
  });
  
  const [filterSourceSite, setFilterSourceSite] = useState<string>("all");
  const [filterTargetSite, setFilterTargetSite] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const filteredLinks = (links || []).filter((link) => {
    if (filterSourceSite !== "all" && link.sourceSiteId.toString() !== filterSourceSite) return false;
    if (filterTargetSite !== "all" && link.targetSiteId.toString() !== filterTargetSite) return false;
    return true;
  });
  
  const handleSyncAll = () => {
    syncAllMutation.mutate({});
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge variant="default" className="bg-green-500">{t("Synced")}</Badge>;
      case "PENDING":
        return <Badge variant="secondary">{t("Pending")}</Badge>;
      case "FAILED":
        return <Badge variant="destructive">{t("Failed")}</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline">{t("Syncing...")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPriceModeBadge = (mode: string) => {
    switch (mode) {
      case "FOLLOW":
        return <Badge variant="outline">{t("Follow")}</Badge>;
      case "OVERRIDE":
        return <Badge variant="secondary">{t("Override")}</Badge>;
      default:
        return <Badge variant="outline">{mode}</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("Total Links")}</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalLinks || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("Active Links")}</CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats?.activeLinks || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("Synced Today")}</CardDescription>
            <CardTitle className="text-3xl text-blue-500">{stats?.syncedToday || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("Failed")}</CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats?.failedLinks || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-4">
        <Select value={filterSourceSite} onValueChange={setFilterSourceSite}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("Source Site")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Source Sites")}</SelectItem>
            {(sites || []).map((site) => (
              <SelectItem key={site.id} value={site.id.toString()}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterTargetSite} onValueChange={setFilterTargetSite}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("Target Site")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Target Sites")}</SelectItem>
            {(sites || []).map((site) => (
              <SelectItem key={site.id} value={site.id.toString()}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex-1" />
        
        <Button onClick={handleSyncAll} disabled={syncAllMutation.isPending}>
          {syncAllMutation.isPending ? t("Syncing...") : t("Sync All Prices")}
        </Button>
        
        <CreateLinkDialog
          sites={sites || []}
          priceRules={priceRules || []}
          onSuccess={() => {
            setShowCreateDialog(false);
            refetchLinks();
          }}
        />
      </div>
      
      {/* Links Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Source")}</TableHead>
                <TableHead>{t("Target")}</TableHead>
                <TableHead>{t("Source Price")}</TableHead>
                <TableHead>{t("Target Price")}</TableHead>
                <TableHead>{t("Price Mode")}</TableHead>
                <TableHead>{t("Price Rule")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Last Synced")}</TableHead>
                <TableHead>{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {t("No international links found")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="font-medium">{link.sourceSite?.name || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {link.sourceProduct?.nameEn?.slice(0, 30) || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{link.targetSite?.name || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {link.targetSite?.currency}
                      </div>
                    </TableCell>
                    <TableCell>
                      {link.sourceProduct?.priceUsdd || "-"}
                    </TableCell>
                    <TableCell>
                      {link.priceMode === "OVERRIDE" ? (
                        <span className="font-medium">{link.overridePrice}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getPriceModeBadge(link.priceMode)}</TableCell>
                    <TableCell>
                      {link.priceRule?.name || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(link.syncStatus)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {link.lastSyncedAt
                        ? new Date(link.lastSyncedAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <SyncLinkButton linkId={link.id} onSuccess={refetchLinks} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sync Link Button ─────────────────────────────────────────────────────────

function SyncLinkButton({ linkId, onSuccess }: { linkId: number; onSuccess: () => void }) {
  const trpc = useTRPC();
  const { t } = useTranslation();
  
  const mutation = trpc.international.links.syncPrice.useMutation({
    onSuccess,
  });
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => mutation.mutate({ id: linkId })}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? "..." : t("Sync")}
    </Button>
  );
}

// ─── Create Link Dialog ────────────────────────────────────────────────────────

function CreateLinkDialog({
  sites,
  priceRules,
  onSuccess,
}: {
  sites: Site[];
  priceRules: PriceRule[];
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const { t } = useTranslation();
  
  const [open, setOpen] = useState(false);
  const [sourceSiteId, setSourceSiteId] = useState<string>("");
  const [targetSiteId, setTargetSiteId] = useState<string>("");
  const [priceMode, setPriceMode] = useState<"FOLLOW" | "OVERRIDE">("FOLLOW");
  const [priceRuleId, setPriceRuleId] = useState<string>("");
  const [overridePrice, setOverridePrice] = useState("");
  
  const mutation = trpc.international.links.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      onSuccess();
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceSiteId || !targetSiteId) return;
    
    mutation.mutate({
      sourceSiteId: parseInt(sourceSiteId),
      targetSiteId: parseInt(targetSiteId),
      sourceProductId: 1, // TODO: Add product selector
      priceMode,
      priceRuleId: priceRuleId ? parseInt(priceRuleId) : undefined,
      overridePrice: priceMode === "OVERRIDE" ? overridePrice : undefined,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("Create Link")}</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("Create International Link")}</DialogTitle>
            <DialogDescription>
              {t("Create a link between source and target sites for price synchronization")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("Source Site")}</Label>
              <Select value={sourceSiteId} onValueChange={setSourceSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select source site")} />
                </SelectTrigger>
                <SelectContent>
                  {sites.filter(s => s.isSourceEnabled).map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name} ({site.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t("Target Site")}</Label>
              <Select value={targetSiteId} onValueChange={setTargetSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select target site")} />
                </SelectTrigger>
                <SelectContent>
                  {sites.filter(s => s.isTargetEnabled).map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name} ({site.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t("Price Mode")}</Label>
              <Select value={priceMode} onValueChange={(v) => setPriceMode(v as "FOLLOW" | "OVERRIDE")}>
                <SelectContent>
                  <SelectItem value="FOLLOW">{t("Follow Source")}</SelectItem>
                  <SelectItem value="OVERRIDE">{t("Override")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {priceMode === "FOLLOW"
                  ? t("Price will be calculated based on exchange rate and price rule")
                  : t("Price will be set manually and not affected by source changes")}
              </p>
            </div>
            
            {priceMode === "FOLLOW" && (
              <div className="space-y-2">
                <Label>{t("Price Rule")}</Label>
                <Select value={priceRuleId} onValueChange={setPriceRuleId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select price rule")} />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRules.filter(r => r.isActive).map((rule) => (
                      <SelectItem key={rule.id} value={rule.id.toString()}>
                        {rule.name} ({rule.ruleType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {priceMode === "OVERRIDE" && (
              <div className="space-y-2">
                <Label>{t("Override Price")}</Label>
                <Input
                  type="text"
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t("Creating...") : t("Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sites Tab ────────────────────────────────────────────────────────────────

function SitesTab() {
  const trpc = useTRPC();
  const { t } = useTranslation();
  
  const { data: sites, refetch } = trpc.international.sites.list.useQuery({});
  
  const refreshMutation = trpc.international.exchangeRates.refresh.useMutation({
    onSuccess: () => refetch(),
  });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("Sales Sites")}</h2>
        <CreateSiteDialog onSuccess={refetch} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(sites || []).map((site) => (
          <Card key={site.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{site.name}</span>
                <Badge variant={site.status === "ACTIVE" ? "default" : "secondary"}>
                  {site.status}
                </Badge>
              </CardTitle>
              <CardDescription>{site.code} - {site.currency}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("Can be source")}</span>
                  <span>{site.isSourceEnabled ? t("Yes") : t("No")}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("Can be target")}</span>
                  <span>{site.isTargetEnabled ? t("Yes") : t("No")}</span>
                </div>
                {site.domain && (
                  <div className="flex justify-between">
                    <span>{t("Domain")}</span>
                    <span className="text-muted-foreground">{site.domain}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Create Site Dialog ───────────────────────────────────────────────────────

function CreateSiteDialog({ onSuccess }: { onSuccess: () => void }) {
  const trpc = useTRPC();
  const { t } = useTranslation();
  
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [domain, setDomain] = useState("");
  
  const mutation = trpc.international.sites.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      onSuccess();
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name,
      code,
      currency,
      currencySymbol,
      domain,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("Add Site")}</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("Add Sales Site")}</DialogTitle>
            <DialogDescription>
              {t("Configure a new sales site for international listings")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Amazon US" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="US" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="USD" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency Symbol</Label>
                <Input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} placeholder="$" />
              </div>
              <div className="space-y-2">
                <Label>Domain</Label>
                <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="amazon.com" />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t("Creating...") : t("Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Price Rules Tab ──────────────────────────────────────────────────────────

function PriceRulesTab() {
  const trpc = useTRPC();
  const { t } = useTranslation();
  
  const { data: priceRules, refetch } = trpc.international.priceRules.list.useQuery({});
  
  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case "EXCHANGE_RATE":
        return t("Exchange Rate Only");
      case "PERCENTAGE":
        return t("Percentage Adjustment");
      case "FIXED_AMOUNT":
        return t("Fixed Amount Adjustment");
      default:
        return type;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("Price Rules")}</h2>
        <CreatePriceRuleDialog onSuccess={refetch} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(priceRules || []).map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{rule.name}</span>
                {rule.isDefault === 1 && <Badge>{t("Default")}</Badge>}
              </CardTitle>
              <CardDescription>{getRuleTypeLabel(rule.ruleType)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("Adjustment")}</span>
                  <span className="font-medium">
                    {rule.ruleType === "PERCENTAGE"
                      ? `${rule.adjustmentValue}%`
                      : rule.ruleType === "FIXED_AMOUNT"
                      ? `+${rule.adjustmentValue}`
                      : t("None")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("Status")}</span>
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? t("Active") : t("Inactive")}
                  </Badge>
                </div>
                {rule.description && (
                  <p className="text-muted-foreground mt-2">{rule.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Create Price Rule Dialog ─────────────────────────────────────────────────

function CreatePriceRuleDialog({ onSuccess }: { onSuccess: () => void }) {
  const trpc = useTRPC();
  const { t } = useTranslation();
  
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ruleType, setRuleType] = useState<"EXCHANGE_RATE" | "PERCENTAGE" | "FIXED_AMOUNT">("EXCHANGE_RATE");
  const [adjustmentValue, setAdjustmentValue] = useState("0");
  const [isDefault, setIsDefault] = useState(false);
  
  const mutation = trpc.international.priceRules.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      onSuccess();
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name,
      description,
      ruleType,
      adjustmentValue,
      isDefault,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t("Add Rule")}</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("Create Price Rule")}</DialogTitle>
            <DialogDescription>
              {t("Define how prices are calculated for target sites")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Standard markup" />
            </div>
            
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select value={ruleType} onValueChange={(v) => setRuleType(v as any)}>
                <SelectContent>
                  <SelectItem value="EXCHANGE_RATE">{t("Exchange Rate Only")}</SelectItem>
                  <SelectItem value="PERCENTAGE">{t("Percentage Adjustment")}</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">{t("Fixed Amount Adjustment")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {ruleType !== "EXCHANGE_RATE" && (
              <div className="space-y-2">
                <Label>
                  {ruleType === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder={ruleType === "PERCENTAGE" ? "5" : "0.50"}
                />
                <p className="text-xs text-muted-foreground">
                  {ruleType === "PERCENTAGE"
                    ? "Enter positive value for markup, negative for discount"
                    : "Additional amount to add on top of converted price"}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="..." />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <Label htmlFor="isDefault">{t("Set as default rule")}</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t("Creating...") : t("Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Exchange Rates Tab ───────────────────────────────────────────────────────

function ExchangeRatesTab() {
  const trpc = useTRPC();
  const { t } = useTranslation();
  
  const { data: rates, refetch } = trpc.international.exchangeRates.list.useQuery({});
  
  const refreshMutation = trpc.international.exchangeRates.refresh.useMutation({
    onSuccess: () => refetch(),
  });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("Exchange Rates")}</h2>
        <Button
          variant="outline"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          {refreshMutation.isPending ? t("Refreshing...") : t("Refresh Rates")}
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Base Currency")}</TableHead>
                <TableHead>{t("Target Currency")}</TableHead>
                <TableHead>{t("Rate")}</TableHead>
                <TableHead>{t("Source")}</TableHead>
                <TableHead>{t("Last Updated")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rates || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t("No exchange rates configured")}
                  </TableCell>
                </TableRow>
              ) : (
                (rates || []).map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.baseCurrency}</TableCell>
                    <TableCell>{rate.targetCurrency}</TableCell>
                    <TableCell className="font-mono">{parseFloat(rate.rate).toFixed(6)}</TableCell>
                    <TableCell>{rate.source || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(rate.fetchedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
