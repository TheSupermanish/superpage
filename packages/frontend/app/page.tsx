"use client";

import Link from "next/link";
import { WalletConnect } from "@/components/wallet-connect";
import { useAuth } from "@/components/providers/auth-provider";
import { PublicNavbar } from "@/components/public-navbar";
import {
  Code,
  FileText,
  Globe,
  ShoppingBag,
  ArrowRight,
  Zap,
  Shield,
  Bot,
  Layers,
  CircleDollarSign,
  ExternalLink,
  Quote,
} from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      <PublicNavbar />

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-28 overflow-hidden">
        {/* Soft glow backgrounds */}
        <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-sp-pink/10 blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute top-40 right-[15%] w-48 h-48 rounded-full bg-sp-blue/10 blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-10 left-[30%] w-56 h-56 rounded-full bg-sp-gold/10 blur-3xl animate-float-slow pointer-events-none" style={{ animationDelay: "4s" }} />

        {/* Flying logo coins — smooth floating */}
        <Image src="/logo.png" alt="" width={80} height={80} className="absolute top-28 left-[3%] w-20 h-20 object-contain opacity-15 coin-float-1 pointer-events-none select-none hidden md:block" />
        <Image src="/logo.png" alt="" width={112} height={112} className="absolute top-[60%] left-[7%] w-28 h-28 object-contain opacity-10 coin-float-3 pointer-events-none select-none hidden lg:block" />
        <Image src="/logo.png" alt="" width={96} height={96} className="absolute top-24 right-[4%] w-24 h-24 object-contain opacity-15 coin-float-2 pointer-events-none select-none hidden md:block" />
        <Image src="/logo.png" alt="" width={64} height={64} className="absolute top-[55%] right-[6%] w-16 h-16 object-contain opacity-20 coin-float-4 pointer-events-none select-none hidden md:block" />
        <Image src="/logo.png" alt="" width={56} height={56} className="absolute bottom-24 right-[20%] w-14 h-14 object-contain opacity-8 coin-float-1 pointer-events-none select-none hidden lg:block" />
        <Image src="/logo.png" alt="" width={48} height={48} className="absolute bottom-36 left-[18%] w-12 h-12 object-contain opacity-8 coin-float-2 pointer-events-none select-none hidden lg:block" />

        <div className="max-w-5xl mx-auto text-center space-y-8 px-4">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
            <Zap className="h-4 w-4" />
            x402 Protocol &middot; Autonomous Payments
          </div>

          {/* Logo */}
          <div className="animate-fade-in-up animate-fade-in-up-1 flex justify-center">
            <img
              src="/logo.png"
              alt="SuperPage"
              className="h-28 md:h-36 w-auto drop-shadow-lg"
            />
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up animate-fade-in-up-2 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight">
            Commerce for Humans{" "}
            <span className="gradient-text">&amp; AI.</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up animate-fade-in-up-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Paywall your APIs, files, articles, and stores. Instant USDC payments on Base.
            No middlemen. AI-agent ready.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up animate-fade-in-up-4 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard/resources/new"
                className="shimmer-btn px-8 py-4 text-white rounded-full font-bold text-lg flex items-center gap-2"
              >
                Start Creating <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <WalletConnect />
            )}
            <Link
              href="/explore"
              className="px-8 py-4 bg-card text-foreground border border-border rounded-full font-bold text-lg hover:border-primary/30 transition-all flex items-center gap-2 glow-border"
            >
              Explore SuperPages
            </Link>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-in-up animate-fade-in-up-5 flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium">
              <Shield className="h-4 w-4 text-sp-blue" /> Secure Payments
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Zap className="h-4 w-4 text-sp-gold" /> Instant Settlement
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Bot className="h-4 w-4 text-sp-pink" /> AI-Native
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS
          ============================================ */}
      <section className="py-24 px-6" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-primary font-bold tracking-widest uppercase text-sm">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-bold">Three steps. That&apos;s it.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1: Create */}
            <div className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 glow-border relative">
              <div className="text-6xl font-bold text-border group-hover:text-primary/10 transition-colors absolute top-6 right-8">01</div>
              <div className="size-14 rounded-2xl bg-sp-blue/15 text-sp-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Create</h3>
              <p className="text-muted-foreground leading-relaxed">Paywall your APIs, files, articles, or connect your Shopify store.</p>
            </div>

            {/* Step 2: Share */}
            <div className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 glow-border relative">
              <div className="text-6xl font-bold text-border group-hover:text-primary/10 transition-colors absolute top-6 right-8">02</div>
              <div className="size-14 rounded-2xl bg-sp-pink/15 text-sp-pink flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ExternalLink className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Share</h3>
              <p className="text-muted-foreground leading-relaxed">Share your unique SuperPage link. Anyone — humans or AI agents — can pay and access.</p>
            </div>

            {/* Step 3: Earn */}
            <div className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 glow-border relative">
              <div className="text-6xl font-bold text-border group-hover:text-primary/10 transition-colors absolute top-6 right-8">03</div>
              <div className="size-14 rounded-2xl bg-sp-gold/15 text-sp-gold flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CircleDollarSign className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Earn</h3>
              <p className="text-muted-foreground leading-relaxed">Instant USDC on Base. No waiting, no fees, no middlemen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURES BENTO GRID
          ============================================ */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-primary font-bold tracking-widest uppercase text-sm">What You Can Monetize</p>
            <h2 className="text-4xl md:text-5xl font-bold">Everything has a price. Now you can set it.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* API Proxy — large card */}
            <div className="group p-8 md:p-10 rounded-3xl bg-card border border-border hover:border-sp-blue/30 transition-all duration-300 glow-border row-span-2 flex flex-col justify-between">
              <div>
                <div className="size-14 rounded-2xl bg-sp-blue/15 text-sp-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Code className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-bold mb-3">API Proxy</h3>
                <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                  Monetize any API endpoint with pay-per-call. LLMs, data feeds, services — every request pays in USDC.
                </p>
              </div>
              <div className="bg-secondary rounded-2xl p-5 font-mono text-sm overflow-x-auto">
                <div className="text-muted-foreground">
                  <span className="text-sp-blue">GET</span> /x402/resource/my-api
                </div>
                <div className="text-muted-foreground mt-1">
                  <span className="text-sp-pink">402</span> Payment Required
                </div>
                <div className="text-muted-foreground mt-1">
                  <span className="text-sp-gold">X-PAYMENT:</span> &lt;signed-usdc-tx&gt;
                </div>
                <div className="text-sp-blue mt-1">
                  <span className="text-green-500">200</span> OK &#x2713;
                </div>
              </div>
            </div>

            {/* Files & Downloads */}
            <div className="group p-8 rounded-3xl bg-card border border-border hover:border-sp-pink/30 transition-all duration-300 glow-border">
              <div className="size-14 rounded-2xl bg-sp-pink/15 text-sp-pink flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Files & Downloads</h3>
              <p className="text-muted-foreground leading-relaxed">
                PDFs, images, videos, datasets. Secure downloads with instant USDC payment. No accounts required.
              </p>
            </div>

            {/* Articles */}
            <div className="group p-8 rounded-3xl bg-card border border-border hover:border-sp-gold/30 transition-all duration-300 glow-border">
              <div className="size-14 rounded-2xl bg-sp-gold/15 text-sp-gold flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Articles & Content</h3>
              <p className="text-muted-foreground leading-relaxed">
                Blog posts, research papers, tutorials. Micropayments per read — no subscriptions needed.
              </p>
            </div>

            {/* Shopify — full width */}
            <div className="group p-8 md:p-10 rounded-3xl bg-card border border-border hover:border-sp-coral/30 transition-all duration-300 glow-border md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="flex-1">
                  <div className="size-14 rounded-2xl bg-sp-coral/15 text-sp-coral flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3">Shopify Integration</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Connect your Shopify store. Sell products with USDC payments. AI agents can browse and purchase automatically.
                  </p>
                </div>
                <div className="flex-shrink-0 bg-secondary rounded-2xl p-6 space-y-3 min-w-[280px]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Premium T-Shirt</span>
                    <span className="font-bold text-sp-blue">+29.99 USDC</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Digital Download</span>
                    <span className="font-bold text-sp-pink">+9.99 USDC</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">API Access Key</span>
                    <span className="font-bold text-sp-gold">+0.50 USDC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          BUILT FOR AI AGENTS
          ============================================ */}
      <section className="py-24 px-6 bg-secondary relative overflow-hidden" id="ai">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <p className="text-primary font-bold tracking-widest uppercase text-sm">AI-Native Protocol</p>
            <h2 className="text-4xl md:text-6xl font-bold">
              The Internet&apos;s Missing{" "}
              <span className="gradient-text">Payment Layer</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              AI agents need to access paid resources, make purchases, and interact with services.
              x402 provides a standard HTTP protocol that any agent can use.
            </p>
          </div>

          {/* Protocol badges */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: "x402", desc: "HTTP 402" },
              { label: "MCP", desc: "Model Context" },
              { label: "A2A", desc: "Agent-to-Agent" },
              { label: "ERC-8004", desc: "Trustless Agents" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="px-6 py-3 rounded-2xl bg-card border border-border text-center glow-border"
              >
                <p className="font-bold text-lg">{badge.label}</p>
                <p className="text-xs text-muted-foreground">{badge.desc}</p>
              </div>
            ))}
          </div>

          {/* Code snippet showing 402 flow */}
          <div className="max-w-2xl mx-auto bg-card rounded-3xl border border-border p-6 md:p-8 text-left overflow-x-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-sp-coral/60" />
              <div className="w-3 h-3 rounded-full bg-sp-gold/60" />
              <div className="w-3 h-3 rounded-full bg-sp-blue/60" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">payment-flow.ts</span>
            </div>
            <pre className="!bg-transparent !border-0 !p-0 text-sm leading-relaxed">
              <code className="!text-foreground">{`// AI agent pays for a resource via x402
const response = await fetch(resourceUrl);

if (response.status === 402) {
  // Get payment details from header
  const paymentInfo = response.headers
    .get("X-PAYMENT");

  // Sign USDC payment on Base
  const payment = await signPayment(paymentInfo);

  // Retry with payment header
  const result = await fetch(resourceUrl, {
    headers: { "X-PAYMENT": payment }
  });

  // 200 OK — resource unlocked ✓
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS
          ============================================ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-primary font-bold tracking-widest uppercase text-sm">Creators Love It</p>
            <h2 className="text-4xl md:text-5xl font-bold">
              Don&apos;t take our word for it
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="p-8 rounded-3xl bg-card border border-border glow-border relative flex flex-col">
              <Quote className="h-8 w-8 text-sp-pink/30 mb-4" />
              <p className="text-foreground leading-relaxed flex-1">
                &ldquo;I paywalled my GPT-4 wrapper API and made $2,400 in the first week. AI agents just pay automatically — no onboarding, no API keys. It&apos;s wild.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                <div className="size-10 rounded-full bg-sp-blue/20 text-sp-blue flex items-center justify-center font-bold text-sm shrink-0">MR</div>
                <div>
                  <p className="font-bold text-sm">Marcus R.</p>
                  <p className="text-xs text-muted-foreground">API Developer &middot; Austin, TX</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 rounded-3xl bg-card border border-border glow-border relative flex flex-col">
              <Quote className="h-8 w-8 text-sp-blue/30 mb-4" />
              <p className="text-foreground leading-relaxed flex-1">
                &ldquo;Moved my paid newsletter off Substack and onto SuperPage. My readers pay 50 cents per article in USDC. I keep 100%. No platform fees eating my margins.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                <div className="size-10 rounded-full bg-sp-pink/20 text-sp-pink flex items-center justify-center font-bold text-sm shrink-0">SK</div>
                <div>
                  <p className="font-bold text-sm">Sara K.</p>
                  <p className="text-xs text-muted-foreground">Writer &middot; Berlin, DE</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-8 rounded-3xl bg-card border border-border glow-border relative flex flex-col">
              <Quote className="h-8 w-8 text-sp-gold/30 mb-4" />
              <p className="text-foreground leading-relaxed flex-1">
                &ldquo;We sell design assets through Shopify + SuperPage. Crypto payments settled instantly. Our AI agent customers grew 10x once we added x402 support.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                <div className="size-10 rounded-full bg-sp-gold/20 text-sp-gold flex items-center justify-center font-bold text-sm shrink-0">JL</div>
                <div>
                  <p className="font-bold text-sm">James L.</p>
                  <p className="text-xs text-muted-foreground">Design Studio &middot; London, UK</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SCROLLING MARQUEE
          ============================================ */}
      <section className="py-8 overflow-hidden border-y border-border bg-secondary/50">
        <div className="marquee-track">
          {/* Doubled for seamless loop */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 shrink-0">
              {[
                "API Developers",
                "Content Creators",
                "AI Agent Builders",
                "Newsletter Writers",
                "Data Scientists",
                "SaaS Founders",
                "Shopify Sellers",
                "Indie Hackers",
                "Researchers",
                "Digital Artists",
                "Open Source Devs",
                "Course Creators",
              ].map((item) => (
                <span key={item} className="text-lg font-bold text-muted-foreground/40 whitespace-nowrap px-4">
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          TRUST / POWERED BY
          ============================================ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {[
              "Powered by Base",
              "USDC Payments",
              "HTTP 402",
              "Zero Gas Fees",
              "Instant Settlement",
              "AI-Native",
              "Open Protocol",
            ].map((badge) => (
              <div
                key={badge}
                className="px-5 py-2.5 rounded-full bg-card border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sp-blue/5 via-sp-pink/5 to-sp-gold/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold">
            Start monetizing in{" "}
            <span className="gradient-text">60 seconds</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Connect your wallet, create a resource, share the link. It really is that simple.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard/resources/new"
                className="shimmer-btn px-10 py-5 text-white rounded-full font-bold text-lg flex items-center gap-2"
              >
                Create Your First SuperPage <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <WalletConnect />
            )}
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="py-16 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 space-y-5">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="SuperPage" width={40} height={40} className="h-10 w-auto" />
                <span className="text-xl font-bold tracking-tight">SuperPage</span>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                The web&apos;s native payment protocol. Monetize APIs, files, articles, and stores with HTTP 402 on Base.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sp-blue/10 text-sp-blue text-xs font-bold">
                Built on Base
              </div>
            </div>
            <div className="space-y-5">
              <h6 className="font-bold text-foreground">Platform</h6>
              <ul className="space-y-3 text-muted-foreground font-medium">
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link href="/explore" className="hover:text-primary transition-colors">Explore</Link></li>
                <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link href="/creators" className="hover:text-primary transition-colors">Creators</Link></li>
              </ul>
            </div>
            <div className="space-y-5">
              <h6 className="font-bold text-foreground">Resources</h6>
              <ul className="space-y-3 text-muted-foreground font-medium">
                <li><Link href="/docs/getting-started" className="hover:text-primary transition-colors">Getting Started</Link></li>
                <li><Link href="/faucet" className="hover:text-primary transition-colors">Faucet</Link></li>
                <li><Link href="/docs" className="hover:text-primary transition-colors">API Reference</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">&copy; 2025 SuperPage. All rights reserved.</p>
            <p className="text-muted-foreground text-sm font-medium">HTTP 402 Payment Protocol</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
