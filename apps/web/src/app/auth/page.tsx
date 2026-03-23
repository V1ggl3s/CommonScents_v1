"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth";
import { CommonScentsNavLogo } from "@/components/logo";
import Link from "next/link";

const BG_IMAGES = [
  "/backgrounds/spices.jpg",
  "/backgrounds/orchids.jpg",
  "/backgrounds/lavender.jpeg",
  "/backgrounds/neroli.jpg",
  "/backgrounds/amber.jpg",
];

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const { user, loading: authLoading } = useUser();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Background image rotation
  const [bgIdx, setBgIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setBgIdx((i) => (i + 1) % BG_IMAGES.length), 7000);
    return () => clearInterval(interval);
  }, []);

  // If already signed in, redirect
  useEffect(() => {
    if (!authLoading && user) router.replace(redirect);
  }, [user, authLoading, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (signUpErr) throw signUpErr;
        setSuccess("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
        router.replace(redirect);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-charcoal">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-warm-charcoal overflow-hidden px-4">
      {/* Background rotating images */}
      <AnimatePresence mode="wait">
        <motion.img
          key={bgIdx}
          src={BG_IMAGES[bgIdx]}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.12 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
          style={{ filter: "saturate(0.3) brightness(0.5)" }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-warm-charcoal/60 pointer-events-none" />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(12,9,7,0.75) 100%)" }}
      />

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-2xl border border-gold/15 bg-warm-charcoal/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-lg sm:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/">
              <CommonScentsNavLogo />
            </Link>
          </div>

          {/* Gold rule */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-8" />

          {/* Mode toggle */}
          <div className="relative flex mb-8 rounded-lg border border-gold/15 overflow-hidden">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
              className="relative z-10 flex-1 py-2.5 text-center transition-colors"
              style={{
                fontFamily: "'Tenor Sans', sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: mode === "signin" ? "#1a1612" : "rgba(245,240,232,0.5)",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
              className="relative z-10 flex-1 py-2.5 text-center transition-colors"
              style={{
                fontFamily: "'Tenor Sans', sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: mode === "signup" ? "#1a1612" : "rgba(245,240,232,0.5)",
              }}
            >
              Sign Up
            </button>
            {/* Sliding gold background */}
            <motion.div
              layout
              className="absolute top-0 bottom-0 w-1/2 rounded-lg bg-gold"
              animate={{ x: mode === "signin" ? "0%" : "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label
                    className="block mb-1.5 text-ivory/50 uppercase"
                    style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.58rem", letterSpacing: "0.2em" }}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-gold/20 bg-warm-charcoal/60 px-4 py-3 text-ivory backdrop-blur-sm transition-all placeholder:text-ivory/25 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label
                className="block mb-1.5 text-ivory/50 uppercase"
                style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.58rem", letterSpacing: "0.2em" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gold/20 bg-warm-charcoal/60 px-4 py-3 text-ivory backdrop-blur-sm transition-all placeholder:text-ivory/25 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem" }}
              />
            </div>

            <div>
              <label
                className="block mb-1.5 text-ivory/50 uppercase"
                style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.58rem", letterSpacing: "0.2em" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gold/20 bg-warm-charcoal/60 px-4 py-3 text-ivory backdrop-blur-sm transition-all placeholder:text-ivory/25 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem" }}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}

            {success && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-emerald-400"
              >
                {success}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gold py-3.5 font-medium text-warm-charcoal transition-all hover:brightness-110 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
              style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              {submitting
                ? "..."
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {/* Bottom gold rule */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent mt-8" />

          <p className="mt-5 text-center text-ivory/30" style={{ fontFamily: "'Tenor Sans', sans-serif", fontSize: "0.55rem", letterSpacing: "0.15em" }}>
            {mode === "signin" ? "Don\u2019t have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-gold/70 hover:text-gold transition-colors underline underline-offset-2"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-warm-charcoal">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
