"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UnifiedWalletConnect } from "@/components/unified-wallet-connect";
import { SignedIn, SignedOut, useSuiAuth } from "@/contexts/sui-auth-context";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img
            src="/images/aionet-logo.png"
            alt="AIONET"
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="#features"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#testimonials"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Testimonials
          </Link>
          <Link
            href="#faq"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <SignedOut>
            <UnifiedWalletConnect />
          </SignedOut>
          <SignedIn>
            <Link href="/profile">
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-full px-6"
              >
                Go to Dashboard
              </Button>
            </Link>
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 p-4">
          <nav className="flex flex-col space-y-4 py-4">
            <Link
              href="#features"
              className="text-white/80 hover:text-white px-4 py-2 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-white/80 hover:text-white px-4 py-2 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#testimonials"
              className="text-white/80 hover:text-white px-4 py-2 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonials
            </Link>
            <Link
              href="#faq"
              className="text-white/80 hover:text-white px-4 py-2 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="#pricing"
              className="text-white/80 hover:text-white px-4 py-2 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <div className="flex flex-col space-y-3 pt-4 border-t border-white/10">
              <SignedOut>
                <UnifiedWalletConnect />
              </SignedOut>
              <SignedIn>
                <Link href="/profile">
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-full w-full"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

