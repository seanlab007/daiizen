import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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

      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">Last updated: March 9, 2026</p>

      <div className="space-y-6 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using Daiizen ("Platform," "we," "us," or "our") at daiizen.com, you agree
            to be bound by these Terms of Service. If you do not agree to these terms, please do not use
            our platform. Daiizen is a global e-commerce marketplace enabling transactions using USDD
            stablecoin, operated by the Daiizen team.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Eligibility</h2>
          <p className="text-muted-foreground leading-relaxed">
            You must be at least 18 years old to use Daiizen. By using the platform, you represent that
            you are of legal age in your jurisdiction and have the legal capacity to enter into binding
            agreements. The platform is not available to users in jurisdictions where cryptocurrency
            transactions are prohibited by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Account Registration</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>You may register using email/password, phone number (SMS OTP), or Google OAuth. You are responsible for:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and current information</li>
              <li>Notifying us immediately of any unauthorized account access</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Marketplace Rules</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">For Buyers:</strong> You agree to pay for items you purchase and provide accurate shipping information. All prices are displayed in USDD stablecoin. Exchange rates to local currencies are indicative only.</p>
            <p><strong className="text-foreground">For Sellers:</strong> You must pay the required security deposit to open a store. You agree to accurately represent your products, fulfill orders promptly, and comply with all applicable laws. Daiizen charges a platform commission (default 5%) on each sale.</p>
            <p><strong className="text-foreground">Prohibited Items:</strong> You may not list or sell illegal goods, counterfeit products, weapons, controlled substances, or any items that violate applicable laws.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Referral Program</h2>
          <p className="text-muted-foreground leading-relaxed">
            Daiizen operates a 3-tier referral system. Referral rewards are: Level 1 (direct referral) = 5%,
            Level 2 = 2%, Level 3 = 1% of the referred user's first purchase value. The program is capped
            at 3 levels to comply with applicable regulations. Rewards are credited as platform credits
            redeemable for purchases or cash-out. We reserve the right to modify or terminate the referral
            program at any time with notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. USDD Payments</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>All transactions on Daiizen are conducted in USDD stablecoin on the TRON (TRC-20) network.
            By using our payment system, you acknowledge:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Cryptocurrency transactions are irreversible once confirmed on the blockchain</li>
              <li>You are responsible for sending the correct amount to the correct wallet address</li>
              <li>USDD is pegged to USD but may experience minor fluctuations</li>
              <li>Daiizen is not responsible for losses due to blockchain network issues or user error</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Fees and Commissions</h2>
          <p className="text-muted-foreground leading-relaxed">
            Daiizen charges sellers a platform commission on each completed sale (default 5%, configurable
            by admin). Seller security deposits are refundable upon account closure, subject to outstanding
            obligations. Withdrawal fees may apply for USDD payouts. All fees are disclosed before
            transactions are completed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Daiizen platform, including its design, logos, and software, is owned by Daiizen and
            protected by intellectual property laws. Sellers retain ownership of their product content
            but grant Daiizen a license to display it on the platform. You may not copy, modify, or
            distribute our platform without written permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Dispute Resolution</h2>
          <p className="text-muted-foreground leading-relaxed">
            For disputes between buyers and sellers, Daiizen provides a mediation service. We will
            review evidence from both parties and make a determination within 14 business days. For
            disputes with Daiizen directly, you agree to first attempt resolution through our support
            team before pursuing legal action.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, Daiizen shall not be liable for indirect, incidental,
            special, or consequential damages arising from your use of the platform. Our total liability
            shall not exceed the amount you paid to Daiizen in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these Terms, engage in
            fraudulent activity, or harm other users. You may close your account at any time by contacting
            support. Upon termination, outstanding obligations (pending orders, deposits) will be resolved
            according to our policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms are governed by applicable international commercial law. For users in specific
            jurisdictions, local consumer protection laws may provide additional rights that these Terms
            do not limit.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">13. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these Terms from time to time. We will notify you of material changes via
            email or platform notification. Continued use of Daiizen after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">14. Contact</h2>
          <div className="text-muted-foreground">
            <p>For questions about these Terms, contact us at:</p>
            <p className="mt-2">Email: legal@daiizen.com</p>
            <p>Website: <a href="https://daiizen.com" className="text-primary underline">https://daiizen.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
