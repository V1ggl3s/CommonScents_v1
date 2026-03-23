"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CommonScentsNavLogo } from "@/components/logo";
import { useUser, getUserInitials } from "@/lib/auth";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading, signOut } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = getUserInitials(user);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/10 bg-ivory/95 backdrop-blur-sm px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-6">
        <Link href="/" className="flex-shrink-0">
          <CommonScentsNavLogo />
        </Link>

        <nav className="ml-auto flex items-center gap-5">
          <Link
            href="/search"
            className="text-xs font-medium uppercase tracking-[0.15em] text-text-secondary transition-colors hover:text-gold"
          >
            Search
          </Link>

          {/* Auth icon */}
          {!loading && (
            <div className="relative" ref={dropdownRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-charcoal text-gold transition-all hover:ring-2 hover:ring-gold/30"
                    style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.6rem", letterSpacing: "0.05em", fontWeight: 600 }}
                    aria-label="Account menu"
                  >
                    {initials}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-gold/15 bg-ivory shadow-xl shadow-black/10">
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-gold/5"
                        style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#3a3530" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21c0-3.3 3.6-6 8-6s8 2.7 8 6" />
                        </svg>
                        My Profile
                      </Link>
                      <div className="h-px bg-gold/10" />
                      <button
                        onClick={() => { signOut(); setDropdownOpen(false); }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-gold/5"
                        style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#3a3530" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                          <polyline points="16,17 21,12 16,7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={`/auth?redirect=${encodeURIComponent(pathname)}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/25 text-text-secondary transition-all hover:border-gold/50 hover:text-gold"
                  aria-label="Sign in"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-3.3 3.6-6 8-6s8 2.7 8 6" />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
