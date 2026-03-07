import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Plus, Trash2, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Account() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ fullName: "", phone: "", country: "", state: "", city: "", addressLine1: "", addressLine2: "", postalCode: "" });

  const { data: addresses, refetch } = trpc.addresses.list.useQuery(undefined, { enabled: isAuthenticated });
  const createMutation = trpc.addresses.create.useMutation({ onSuccess: () => { refetch(); setShowNewAddress(false); toast.success("Address saved"); } });
  const deleteMutation = trpc.addresses.delete.useMutation({ onSuccess: () => refetch() });
  const setDefaultMutation = trpc.addresses.setDefault.useMutation({ onSuccess: () => refetch() });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-8 container text-center py-20">
        <Button onClick={() => (window.location.href = getLoginUrl())}>{t("nav.login")}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-2xl">
        <h1 className="text-2xl font-serif font-semibold text-foreground mb-6">{t("account.title")}</h1>

        {/* Profile */}
        <div className="rounded-xl border border-border/60 bg-card p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <User className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">{user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.role === "admin" && (
                <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Admin</span>
              )}
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {t("account.addresses")}
            </h2>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowNewAddress(!showNewAddress)}>
              <Plus className="w-3 h-3" /> {t("account.add_address")}
            </Button>
          </div>

          {showNewAddress && (
            <div className="p-4 rounded-xl border border-border/60 bg-card mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">{t("address.name")}</Label><Input value={newAddr.fullName} onChange={e => setNewAddr({...newAddr, fullName: e.target.value})} className="h-8 text-sm mt-1" /></div>
                <div><Label className="text-xs">{t("address.phone")}</Label><Input value={newAddr.phone} onChange={e => setNewAddr({...newAddr, phone: e.target.value})} className="h-8 text-sm mt-1" /></div>
              </div>
              <div><Label className="text-xs">{t("address.country")}</Label><Input value={newAddr.country} onChange={e => setNewAddr({...newAddr, country: e.target.value})} className="h-8 text-sm mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">{t("address.city")}</Label><Input value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} className="h-8 text-sm mt-1" /></div>
                <div><Label className="text-xs">{t("address.state")}</Label><Input value={newAddr.state} onChange={e => setNewAddr({...newAddr, state: e.target.value})} className="h-8 text-sm mt-1" /></div>
              </div>
              <div><Label className="text-xs">{t("address.line1")}</Label><Input value={newAddr.addressLine1} onChange={e => setNewAddr({...newAddr, addressLine1: e.target.value})} className="h-8 text-sm mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">{t("address.line2")}</Label><Input value={newAddr.addressLine2} onChange={e => setNewAddr({...newAddr, addressLine2: e.target.value})} className="h-8 text-sm mt-1" /></div>
                <div><Label className="text-xs">{t("address.postal")}</Label><Input value={newAddr.postalCode} onChange={e => setNewAddr({...newAddr, postalCode: e.target.value})} className="h-8 text-sm mt-1" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => createMutation.mutate({ ...newAddr, isDefault: !addresses?.length })} disabled={createMutation.isPending}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setShowNewAddress(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {addresses?.map(addr => (
              <div key={addr.id} className={`p-4 rounded-xl border bg-card ${addr.isDefault ? "border-primary/40 bg-accent/10" : "border-border/60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {addr.isDefault && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full mb-2 inline-block">Default</span>}
                    <p className="text-sm font-medium text-foreground">{addr.fullName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
                    <p className="text-xs text-muted-foreground">{addr.city}{addr.state ? `, ${addr.state}` : ""}, {addr.country} {addr.postalCode}</p>
                    {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!addr.isDefault && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDefaultMutation.mutate({ id: addr.id })}>Set Default</Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate({ id: addr.id })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!addresses || addresses.length === 0) && !showNewAddress && (
              <p className="text-sm text-muted-foreground text-center py-8">No addresses yet. Add one above.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
