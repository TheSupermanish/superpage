"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PublicNavbar } from "@/components/public-navbar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navSections = [
    {
      title: "Getting Started",
      items: [
        { href: "/docs/getting-started", label: "Quick Start", icon: "rocket_launch" },
        { href: "/docs/sdk", label: "SDK Reference", icon: "code" },
      ],
    },
    {
      title: "Developer Guides",
      items: [
        { href: "/docs/examples", label: "Code Examples", icon: "integration_instructions" },
        { href: "/docs/api", label: "REST API", icon: "api" },
        { href: "/docs/shopify", label: "Shopify Integration", icon: "store" },
      ],
    },
    {
      title: "AI & Agents",
      items: [
        { href: "/docs/ai-agents", label: "AI Agent Payments", icon: "smart_toy" },
        { href: "/docs/mcp", label: "MCP Server", icon: "settings" },
        { href: "/docs/skills", label: "Skills Reference", icon: "psychology" },
        { href: "/docs/openclaw", label: "OpenClaw Setup", icon: "extension" },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <PublicNavbar />
      <div className="max-w-7xl mx-auto w-full flex pt-32 px-4 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-32 bottom-0 lg:bottom-auto left-0 lg:left-auto z-40 flex-shrink-0 flex flex-col w-72 lg:h-[calc(100vh-8rem)] bg-background p-6 overflow-y-auto no-scrollbar transition-transform duration-300`}>
        <div className="flex flex-col gap-8">
          <nav className="flex flex-col gap-8">
            {navSections.map((section, idx) => (
              <div key={idx}>
                <h3 className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">
                  {section.title}
                </h3>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                        isActive(item.href)
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] leading-none">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-auto pt-8">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <p className="text-xs font-bold text-primary mb-2 uppercase">Need more help?</p>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Check our GitHub or join our Discord community.
            </p>
            <Link href="/dashboard">
              <button className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
                Go to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border p-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-background border border-border text-foreground hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        </div>
        <div className="w-full px-4 md:px-8 py-8">{children}</div>
      </main>
      </div>
    </div>
  );
}
