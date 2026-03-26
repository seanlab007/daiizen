import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = "login" | "register";
interface SocialStatus {
  google: boolean;
  telegram: boolean;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#229ED9">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.026 9.546c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 14.4l-2.95-.924c-.64-.2-.653-.64.136-.948l11.527-4.445c.533-.194 1.001.13.69.165z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92v2z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

// ─── Phone OTP Panel ─────────────────────────────────────────────────────────
function PhonePanel({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone.trim()) { toast.error("Please enter your phone number"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Failed to send code"); return; }
      toast.success("Verification code sent!");
      setCodeSent(true);
      setCountdown(60);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) { toast.error("Please enter the verification code"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Verification failed"); return; }
      toast.success("Welcome to Daiizen!");
      onSuccess();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="flex gap-2">
          <Input
            id="phone"
            type="tel"
            placeholder="+1 234 567 8900"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            disabled={codeSent}
            className="flex-1"
          />
          {!codeSent && (
            <Button onClick={handleSendCode} disabled={loading || !phone.trim()} className="whitespace-nowrap">
              {loading ? "Sending..." : "Send Code"}
            </Button>
          )}
        </div>
      </div>

      {codeSent && (
        <>
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              onClick={() => { setCodeSent(false); setCode(""); setCountdown(0); }}
              disabled={countdown > 0}
              className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
            </button>
          </div>
          <Button onClick={handleVerify} disabled={loading || code.length < 4} className="w-full">
            {loading ? "Verifying..." : "Verify & Sign In"}
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Email/Password Panel ─────────────────────────────────────────────────────
function EmailPanel({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: Record<string, string> = { email, password };
      if (mode === "register" && name) body.name = name;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error || "Authentication failed"); return; }
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      onSuccess();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "register" && (
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input id="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder={mode === "register" ? "Min. 6 characters" : "Your password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button type="button" onClick={() => setMode(m => m === "login" ? "register" : "login")} className="text-primary hover:underline font-medium">
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </form>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [socialStatus, setSocialStatus] = useState<SocialStatus>({ google: false, telegram: false });
  const [telegramBotName, setTelegramBotName] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  // Fetch social provider status
  useEffect(() => {
    fetch("/api/auth/social/status")
      .then(r => r.json() as Promise<SocialStatus>)
      .then((data) => setSocialStatus(data))
      .catch(() => {});
    fetch("/api/auth/telegram/config")
      .then(r => r.json() as Promise<{ botName: string; configured: boolean }>)
      .then((data) => {
        if (data.botName) setTelegramBotName(data.botName);
      })
      .catch(() => {});
  }, []);

  const handleSuccess = () => {
    // Reload to refresh auth state
    window.location.href = "/";
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleTelegramLogin = () => {
    if (!telegramBotName) { toast.error("Telegram login not configured"); return; }
    const callbackUrl = `${window.location.origin}/api/auth/telegram/callback`;
    const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=${telegramBotName}&origin=${encodeURIComponent(window.location.origin)}&return_to=${encodeURIComponent(callbackUrl)}`;
    window.location.href = telegramAuthUrl;
  };

  const hasSocial = socialStatus.google || socialStatus.telegram;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Daiizen</h1>
          <p className="text-muted-foreground mt-1">Global Marketplace</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>Choose your preferred sign-in method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Social Buttons */}
            {hasSocial && (
              <>
                <div className="flex flex-col gap-3">
                  {socialStatus.google && (
                    <Button variant="outline" className="w-full gap-2 bg-background" onClick={handleGoogleLogin}>
                      <GoogleIcon />
                      Continue with Google
                    </Button>
                  )}
                  {socialStatus.telegram && (
                    <Button variant="outline" className="w-full gap-2 bg-background" onClick={handleTelegramLogin}>
                      <TelegramIcon />
                      Continue with Telegram
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    or continue with
                  </span>
                </div>
              </>
            )}

            {/* Phone / Email Tabs */}
            <Tabs defaultValue="phone">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone" className="gap-1.5">
                  <PhoneIcon />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-1.5">
                  <EmailIcon />
                  Email
                </TabsTrigger>
              </TabsList>
              <TabsContent value="phone" className="mt-4">
                <PhonePanel onSuccess={handleSuccess} />
              </TabsContent>
              <TabsContent value="email" className="mt-4">
                <EmailPanel onSuccess={handleSuccess} />
              </TabsContent>
            </Tabs>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center">
              By signing in, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
