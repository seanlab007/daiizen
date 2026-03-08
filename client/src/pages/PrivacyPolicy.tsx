import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: March 9, 2026</p>

      <div className="prose prose-neutral max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to Daiizen ("we," "our," or "us"). Daiizen is a global e-commerce marketplace
            that enables buyers and sellers to transact using USDD stablecoin, targeting communities
            in high-inflation countries. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our platform at daiizen.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">Account Information:</strong> When you register, we collect your name, email address, phone number, and authentication credentials (hashed passwords). If you sign in via Google, we receive your Google profile information including name, email, and profile picture.</p>
            <p><strong className="text-foreground">Transaction Data:</strong> We collect information about your purchases, sales, deposits, and withdrawals on the platform, including USDD wallet addresses and transaction hashes.</p>
            <p><strong className="text-foreground">Store & Product Data:</strong> If you operate a store on Daiizen, we collect store details, product listings, pricing, and sales analytics.</p>
            <p><strong className="text-foreground">Usage Data:</strong> We collect information about how you interact with our platform, including pages visited, products viewed, and search queries.</p>
            <p><strong className="text-foreground">Device Information:</strong> We may collect device type, browser type, IP address, and language preferences.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>To provide, operate, and improve the Daiizen marketplace</li>
            <li>To process transactions and send related notifications</li>
            <li>To verify your identity and prevent fraud</li>
            <li>To send you service updates, security alerts, and support messages</li>
            <li>To personalize your shopping experience and product recommendations</li>
            <li>To comply with legal obligations and enforce our Terms of Service</li>
            <li>To calculate and distribute referral rewards under our 3-tier referral program</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Information Sharing</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-foreground">Sellers/Buyers:</strong> Necessary order information (shipping address, contact) is shared between transaction parties.</li>
              <li><strong className="text-foreground">Service Providers:</strong> Twilio (SMS verification), Dark Matter Bank (USDD payment processing), and cloud infrastructure providers.</li>
              <li><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights and users' safety.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Google OAuth</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you sign in with Google, we receive your basic profile information (name, email, profile picture)
            from Google. We use this information solely to create and manage your Daiizen account. We do not
            request access to your Google Drive, Gmail, or other Google services. You can revoke Daiizen's
            access to your Google account at any time through your{" "}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Google Account settings
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures including encrypted connections (HTTPS/TLS),
            bcrypt password hashing, JWT session tokens, and secure cookie handling. However, no method
            of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your personal information for as long as your account is active or as needed to
            provide services. Transaction records are retained for 7 years for legal and accounting purposes.
            You may request deletion of your account and associated data by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            Depending on your location, you may have rights to access, correct, delete, or export your
            personal data. To exercise these rights, contact us at privacy@daiizen.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use session cookies to maintain your login state and preferences. These are essential for
            the platform to function. We do not use third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Daiizen is not directed to children under 13. We do not knowingly collect personal information
            from children under 13. If you believe a child has provided us with personal information,
            please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of significant changes
            by posting the new policy on this page and updating the "Last updated" date. Continued use of
            Daiizen after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <div className="mt-2 text-muted-foreground">
            <p>Email: privacy@daiizen.com</p>
            <p>Website: <a href="https://daiizen.com" className="text-primary underline">https://daiizen.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
