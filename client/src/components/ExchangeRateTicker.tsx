import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { TrendingUp } from "lucide-react";

const CURRENCY_FLAGS: Record<string, string> = {
  ARS: "🇦🇷", TRY: "🇹🇷", VES: "🇻🇪", BRL: "🇧🇷",
  ZAR: "🇿🇦", NGN: "🇳🇬", EGP: "🇪🇬", PKR: "🇵🇰",
};

const FALLBACK_RATES = [
  { targetCurrency: "ARS", rate: "1200" },
  { targetCurrency: "TRY", rate: "32" },
  { targetCurrency: "VES", rate: "36" },
  { targetCurrency: "BRL", rate: "5.1" },
  { targetCurrency: "ZAR", rate: "18.5" },
  { targetCurrency: "NGN", rate: "1600" },
];

export default function ExchangeRateTicker() {
  const { t } = useLanguage();
  const { data: liveRates } = trpc.exchangeRates.list.useQuery();
  const rates = (liveRates && liveRates.length > 0 ? liveRates : FALLBACK_RATES) as { targetCurrency: string; rate: string }[];

  if (!rates || rates.length === 0) {
    // Show static placeholder when no rates available
    return (
      <div className="bg-muted/40 border-b border-border/30 py-1.5 overflow-hidden">
        <div className="container">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span className="font-medium">1 USDD</span>
            <span className="text-border">|</span>
            <span>🇦🇷 ARS ~1,200</span>
            <span className="text-border hidden sm:inline">|</span>
            <span className="hidden sm:inline">🇹🇷 TRY ~32</span>
            <span className="text-border hidden md:inline">|</span>
            <span className="hidden md:inline">🇻🇪 VES ~36</span>
            <span className="text-border hidden lg:inline">|</span>
            <span className="hidden lg:inline">🇧🇷 BRL ~5.1</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 border-b border-border/30 py-1.5 overflow-hidden">
      <div className="container">
        <div className="flex items-center gap-3 text-xs text-muted-foreground overflow-x-auto scrollbar-none">
          <TrendingUp className="w-3 h-3 shrink-0 text-primary" />
          <span className="font-medium text-foreground shrink-0">{t("rates.usdd")}</span>
          <span className="text-border shrink-0">|</span>
          {rates.map((rate: { targetCurrency: string; rate: string }, i: number) => (
            <span key={rate.targetCurrency} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <span className="text-border">|</span>}
              <span>{CURRENCY_FLAGS[rate.targetCurrency] || ""} {rate.targetCurrency}</span>
              <span className="font-medium text-foreground">
                {Number(rate.rate).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
