import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export const metadata = {
  title: "Cookie Policy | Skyblock Calculator",
  description: "Learn about how we use cookies on Skyblock Calculator",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <Link href="/" className="inline-block mb-4">
            <Button variant="outline" size="sm">
              ← Back to Calculator
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">Cookie Policy</h1>
          <p className="text-muted-foreground mt-2">
            Last updated: December 29, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 pb-24">
        <div className="prose prose-invert max-w-none space-y-8">
          {/* What Are Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
            <p className="text-muted-foreground">
              Cookies are small text files that are placed on your device when
              you visit a website. They help us provide you with a better
              experience by remembering your preferences and understanding how
              you use our site.
            </p>
          </section>

          {/* How We Use Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>Essential Cookies:</strong> These cookies are necessary
                for the website to function properly. They help us remember your
                calculator selections, item lists, and settings so you have a
                seamless experience.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> We use Google Analytics to
                understand how visitors use our site. This helps us improve the
                calculator's features and performance.
              </li>
              <li>
                <strong>Preference Cookies:</strong> These cookies remember your
                preferences, such as your display mode and forge settings, so
                you don't have to set them again on your next visit.
              </li>
            </ul>
          </section>

          {/* Cookie Consent */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Cookie Consent</h2>
            <p className="text-muted-foreground">
              When you first visit Skyblock Calculator, we display a cookie
              consent banner. You can:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3">
              <li>
                <strong>Accept:</strong> Accept all cookies, including analytics
                cookies. This helps us improve the site.
              </li>
              <li>
                <strong>Decline:</strong> Decline analytics cookies. Essential
                cookies will still be used to maintain your settings.
              </li>
            </ul>
          </section>

          {/* Your Data */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Data</h2>
            <p className="text-muted-foreground">
              We take your privacy seriously. All your calculator data (items,
              quantities, and settings) is stored locally in your browser using
              localStorage. We do not send your personal recipe data to our
              servers. Only anonymous usage analytics are collected through
              Google Analytics.
            </p>
          </section>

          {/* Managing Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Managing Your Cookies
            </h2>
            <p className="text-muted-foreground mb-4">
              You can manage cookies in several ways:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                Clear your browser's cookies at any time through your browser
                settings.
              </li>
              <li>
                Disable cookies entirely (note: some features may not work
                properly).
              </li>
              <li>
                Use private/incognito mode if you don't want cookies to be
                saved.
              </li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Third-Party Services
            </h2>
            <p className="text-muted-foreground mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>Google Analytics:</strong> Helps us track anonymous
                usage statistics. See{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google's Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Google Tag Manager:</strong> Manages our analytics
                tracking. See{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google's Privacy Policy
                </a>
                .
              </li>
            </ul>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Changes to This Policy
            </h2>
            <p className="text-muted-foreground">
              We may update this cookie policy from time to time. We will notify
              you of any significant changes by updating the date at the top of
              this page.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about our use of cookies, please visit
              our{" "}
              <a
                href="https://github.com/Hexeption/sbcalc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
