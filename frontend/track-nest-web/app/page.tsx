"use client";

import {
  motion,
  useInView,
  useScroll,
  useTransform,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Shield,
  Users,
  Zap,
  Lock,
  Moon,
  ArrowRight,
  Play,
  Menu,
  X,
  AlertTriangle,
  Search,
  CheckCircle,
  Star,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ── Animation variants ─────────────────────────────────────────────────── */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE, delay },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay },
  }),
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE, delay },
  }),
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE, delay },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease: EASE, delay },
  }),
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

/* ── Reusable animated section wrapper ──────────────────────────────────── */

function AnimatedSection({
  children,
  className = "",
  variants = stagger,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Phone mockup ───────────────────────────────────────────────────────── */

function PhoneMockup() {
  return (
    <div className="relative w-[260px] h-[520px] mx-auto">
      {/* Phone shell */}
      <div className="absolute inset-0 rounded-[42px] bg-[#1a2e2e] shadow-2xl border-4 border-[#2a4444] overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a2e2e] rounded-b-2xl z-10" />
        {/* Screen content */}
        <div className="absolute inset-0 bg-[#0f1f1f] flex flex-col pt-8">
          {/* App header */}
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-white text-sm font-semibold">TrackNest</span>
            <Bell className="w-4 h-4 text-[#74becb]" />
          </div>
          {/* Map area */}
          <div className="relative mx-3 rounded-2xl bg-[#162828] h-48 overflow-hidden">
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="#74becb"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            {/* Roads */}
            <svg className="absolute inset-0 w-full h-full">
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="#2a4444"
                strokeWidth="6"
              />
              <line
                x1="35%"
                y1="0"
                x2="35%"
                y2="100%"
                stroke="#2a4444"
                strokeWidth="4"
              />
              <line
                x1="70%"
                y1="0"
                x2="70%"
                y2="100%"
                stroke="#2a4444"
                strokeWidth="3"
              />
            </svg>
            {/* Location pin */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full"
            >
              <div className="w-8 h-8 rounded-full bg-[#74becb] flex items-center justify-center shadow-lg shadow-[#74becb]/40">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="w-2 h-2 bg-[#74becb] rounded-full mx-auto -mt-1 opacity-60" />
            </motion.div>
            {/* Pulse ring */}
            <motion.div
              animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-[#74becb]"
            />
            {/* Active badge */}
            <div className="absolute top-3 right-3 bg-[#74becb]/20 border border-[#74becb]/40 rounded-full px-2 py-0.5 flex items-center gap-1">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 rounded-full bg-[#74becb]"
              />
              <span className="text-[#74becb] text-[10px] font-medium">
                Live
              </span>
            </div>
          </div>
          {/* Family member cards */}
          <div className="px-4 mt-3 space-y-2">
            {[
              { name: "Sarah", dist: "0.3 km", color: "#74becb", safe: true },
              { name: "Mike", dist: "1.2 km", color: "#5aa8b5", safe: true },
            ].map((m) => (
              <motion.div
                key={m.name}
                whileHover={{ x: 2 }}
                className="flex items-center gap-3 bg-[#1a3030] rounded-xl px-3 py-2"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: m.color }}
                >
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium">{m.name}</p>
                  <p className="text-gray-400 text-[10px]">{m.dist} away</p>
                </div>
                <CheckCircle className="w-4 h-4 text-[#74becb]" />
              </motion.div>
            ))}
          </div>
          {/* SOS button */}
          <div className="px-4 mt-3">
            <div className="bg-red-600/20 border border-red-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-xs font-semibold">
                SOS Emergency
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Floating notification card */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute -right-12 top-16 bg-white rounded-2xl shadow-2xl px-3 py-2.5 w-36"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          </div>
          <span className="text-[10px] font-semibold text-gray-800">
            All Safe
          </span>
        </div>
        <p className="text-[9px] text-gray-500">Family check-in complete</p>
      </motion.div>
      {/* Floating SOS card */}
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{
          repeat: Infinity,
          duration: 2.5,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute -left-12 bottom-28 bg-white rounded-2xl shadow-2xl px-3 py-2.5 w-32"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-3 h-3 text-red-500" />
          </div>
          <span className="text-[9px] font-semibold text-gray-800">Alert</span>
        </div>
        <p className="text-[9px] text-gray-500">SOS in 2 taps</p>
      </motion.div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = ["Features", "Safety", "Platform", "About"];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1a3a3a] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#74becb]" />
            </div>
            <span className="text-[#1a3a3a] font-bold text-lg tracking-tight">
              TrackNest
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <motion.a
                key={link}
                href={`#${link.toLowerCase()}`}
                whileHover={{ color: "#74becb" }}
                className="cursor-pointer text-gray-600 text-sm font-medium transition-colors hover:text-[#1a3a3a]"
              >
                {link}
              </motion.a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-gray-700 text-sm font-medium hover:text-[#1a3a3a] transition-colors"
            >
              {isAuthenticated ? "Dashboard" : "Login"}
            </Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="bg-[#1a3a3a] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#243f3f] transition-colors"
              >
                Get Started
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden cursor-pointer p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 space-y-4">
                {navLinks.map((link) => (
                  <a
                    key={link}
                    href={`#${link.toLowerCase()}`}
                    className="block cursor-pointer text-gray-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link}
                  </a>
                ))}
                <Link
                  href="/login"
                  className="block w-full text-center bg-[#1a3a3a] text-white py-3 rounded-full font-semibold"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center pt-16 overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            style={{ y: heroY }}
            className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-[#e0f2f5]/60 via-[#a8d8e0]/30 to-transparent"
          />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-gradient-to-tr from-[#f0f8f9]/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left: copy */}
          <div>
            {/* Badge */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              custom={0.1}
              className="inline-flex items-center gap-2 bg-[#e0f2f5] border border-[#93cdd9]/40 rounded-full px-4 py-1.5 mb-8"
            >
              <Lock className="w-3.5 h-3.5 text-[#4a8a96]" />
              <span className="text-[#3a6b76] text-xs font-semibold tracking-widest uppercase">
                Real-time safety platform
              </span>
            </motion.div>

            {/* Heading */}
            <div className="overflow-hidden mb-6">
              {["Protect Your", "Circle", "In Real Time"].map((line, i) => (
                <motion.div
                  key={line}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.2 + i * 0.12}
                >
                  <h1 className="text-5xl lg:text-6xl font-extrabold text-[#1a2e2e] leading-tight tracking-tight">
                    {line}
                  </h1>
                </motion.div>
              ))}
            </div>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.55}
              className="text-gray-500 text-lg leading-relaxed mb-10 max-w-lg"
            >
              TrackNest connects families, responders, and communities with live
              location sharing, emergency requests, crime and missing-person
              reporting, and safety guidelines in one place.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.7}
              className="flex flex-wrap gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-[#1a3a3a] text-white font-semibold px-7 py-3.5 rounded-full shadow-lg shadow-[#1a3a3a]/25 hover:bg-[#243f3f] transition-colors"
                >
                  Open the Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex cursor-pointer items-center gap-2 border border-gray-300 text-gray-700 font-semibold px-7 py-3.5 rounded-full hover:border-[#74becb] hover:text-[#3a6b76] transition-colors"
              >
                <Play className="w-4 h-4" />
                See How It Works
              </motion.button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.85}
              className="flex items-center gap-3 mt-10"
            >
              <div className="flex -space-x-2">
                {["#74becb", "#5aa8b5", "#4a8a96", "#3a6b76"].map(
                  (color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: color }}
                    >
                      {["S", "M", "A", "J"][i]}
                    </div>
                  ),
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  Built for web and mobile
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right: phone mockup */}
          <motion.div
            variants={slideRight}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="hidden lg:flex justify-center"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </section>

      {/* ── Platform Section ───────────────────────────────────────────── */}
      <section id="platform" className="py-24 bg-[#f7fbfc]">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <motion.p
                variants={cardItem}
                className="text-[#4a8a96] text-sm font-semibold tracking-widest uppercase mb-4"
              >
                Web and Mobile
              </motion.p>
              <motion.h2
                variants={cardItem}
                className="text-4xl font-extrabold text-[#1a2e2e] mb-5"
              >
                One platform, two experiences
              </motion.h2>
              <motion.p
                variants={cardItem}
                className="text-gray-500 text-lg leading-relaxed mb-8"
              >
                The web app delivers dashboards for reports, missing persons,
                and emergency requests. The mobile app focuses on live tracking,
                alerts, and quick actions with gRPC-Web performance.
              </motion.p>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  "Crime and missing-person reports with publish and review workflows",
                  "Emergency request lifecycle with responder updates",
                  "Guidelines library for prevention and community readiness",
                ].map((text) => (
                  <motion.div
                    key={text}
                    variants={cardItem}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-[#74becb] mt-0.5" />
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {text}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            <motion.div
              variants={scaleIn}
              className="bg-white rounded-3xl shadow-xl border border-[#e2f0f2] p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-[#1a2e2e] font-bold">TrackNest Web</p>
                <span className="text-xs font-semibold text-[#4a8a96] bg-[#e0f2f5] px-2 py-1 rounded-full">
                  Dashboard
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Crime Reports", value: "Live" },
                  { label: "Missing Persons", value: "Verified" },
                  { label: "Emergency Requests", value: "Active" },
                  { label: "Guidelines", value: "Updated" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#eef6f7] p-4"
                  >
                    <p className="text-xs text-gray-500 mb-2">{item.label}</p>
                    <p className="text-[#1a2e2e] font-bold text-lg">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────────────────── */}
      <section id="features" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <motion.p
              variants={cardItem}
              className="text-[#74becb] text-sm font-semibold tracking-widest uppercase mb-3"
            >
              Built for real-world response
            </motion.p>
            <motion.h2
              variants={cardItem}
              className="text-4xl font-extrabold text-[#1a2e2e] mb-4"
            >
              A complete safety workflow
            </motion.h2>
            <motion.p
              variants={cardItem}
              className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed"
            >
              Web dashboards for oversight, a mobile app for on-the-go updates,
              and a unified backend for alerts, reports, and response.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                iconBg: "bg-indigo-100",
                iconColor: "text-indigo-600",
                title: "Live Location Streams",
                desc: "Real-time location sharing across web and mobile, backed by gRPC and WebSocket updates.",
              },
              {
                icon: Zap,
                iconBg: "bg-red-100",
                iconColor: "text-red-600",
                title: "Emergency Requests",
                desc: "Trigger SOS workflows with responders, incident status tracking, and notification fan-out.",
              },
              {
                icon: Users,
                iconBg: "bg-teal-100",
                iconColor: "text-teal-600",
                title: "Family Circles",
                desc: "Manage private circles, join with OTP, and keep everyone in sync across devices.",
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={cardItem}
                whileHover={{
                  y: -6,
                  boxShadow: "0 20px 40px -12px rgba(0,0,0,0.12)",
                }}
                className="cursor-pointer bg-white border border-gray-100 rounded-2xl p-8 shadow-sm transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-[#1a2e2e] text-lg font-bold mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── Safety Reimagined Section ─────────────────────────────────────── */}
      <section id="safety" className="py-28 bg-[#1a3a3a] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <AnimatedSection
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } },
              }}
            >
              <motion.p
                variants={cardItem}
                className="text-[#74becb] text-sm font-semibold tracking-widest uppercase mb-4"
              >
                Community powered
              </motion.p>
              <motion.h2
                variants={cardItem}
                className="text-4xl font-extrabold text-white mb-6 leading-tight"
              >
                Safety
                <br />
                With Real Data
              </motion.h2>
              <motion.p
                variants={cardItem}
                className="text-[#93cdd9] text-lg leading-relaxed mb-10"
              >
                TrackNest combines crime reports, missing-person workflows, and
                neighborhood alerts to help you act with context, not guesswork.
              </motion.p>
              <motion.div variants={stagger} className="space-y-5">
                {[
                  {
                    icon: AlertTriangle,
                    title: "Crime Reports and Heatmaps",
                    desc: "View public reports, filter by severity, and check nearby risk zones.",
                  },
                  {
                    icon: Search,
                    title: "Missing Person Response",
                    desc: "Submit reports, manage workflows, and publish verified updates.",
                  },
                ].map((item) => (
                  <motion.div
                    key={item.title}
                    variants={cardItem}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#74becb]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-5 h-5 text-[#74becb]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">
                        {item.title}
                      </p>
                      <p className="text-[#93cdd9] text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatedSection>

            {/* Right: feature cards */}
            <AnimatedSection
              className="space-y-4"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.15 } },
              }}
            >
              {/* Neighbourhood Safety */}
              <motion.div
                variants={cardItem}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-red-300 text-xs font-semibold uppercase tracking-wider">
                    Incident Signal
                  </span>
                </div>
                <p className="text-white font-bold mb-3">Neighborhood Safety</p>
                {/* Mini map grid */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const highlighted = [9, 10, 17, 18, 25].includes(i);
                    const alert = [11, 19].includes(i);
                    return (
                      <motion.div
                        key={i}
                        animate={alert ? { opacity: [1, 0.4, 1] } : {}}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          delay: i * 0.05,
                        }}
                        className={`h-5 rounded-sm ${
                          alert
                            ? "bg-red-400/70"
                            : highlighted
                              ? "bg-[#74becb]/60"
                              : "bg-white/10"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-[#93cdd9] text-xs">
                  Surface reports and alerts around your current location.
                </p>
              </motion.div>

              {/* Smart Night Watch */}
              <motion.div
                variants={cardItem}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer bg-[#74becb] rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">
                      Responder Console
                    </p>
                    <p className="text-white/70 text-xs">
                      Web dashboard for emergency ops, requests, and updates.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Community Trust Index */}
              <motion.div
                variants={cardItem}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-[#74becb]/20 border-2 border-[#74becb]/40 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-[#74becb]" />
                </div>
                <div>
                  <p className="text-white font-bold mb-0.5">
                    Safety Guidelines Library
                  </p>
                  <p className="text-[#93cdd9] text-xs">
                    Publish and browse verified guidance for prevention and
                    response.
                  </p>
                </div>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#f0f8f9]">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "Realtime", label: "Location Streams" },
              { value: "Multi-App", label: "Web + Mobile" },
              { value: "Live", label: "Incident Workflows" },
              { value: "Verified", label: "Guidelines" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={cardItem}>
                <p className="text-3xl font-extrabold text-[#1a3a3a] mb-1">
                  {stat.value}
                </p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="py-32 bg-[#122828]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.p
              variants={cardItem}
              className="text-[#74becb] text-sm font-semibold tracking-widest uppercase mb-6"
            >
              Start today
            </motion.p>
            <motion.h2
              variants={cardItem}
              className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6"
            >
              Your safety network
              <br />
              is ready when you are.
            </motion.h2>
            <motion.p
              variants={cardItem}
              className="text-[#93cdd9] text-lg mb-10 leading-relaxed"
            >
              Launch the web dashboard or the mobile app and stay connected with
              the people who matter most.
            </motion.p>
            <motion.div variants={cardItem}>
              <motion.div
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 40px rgba(116,190,203,0.3)",
                }}
                whileTap={{ scale: 0.97 }}
                className="inline-block cursor-pointer"
              >
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 border-2 border-[#74becb] text-[#74becb] hover:bg-[#74becb] hover:text-[#122828] font-bold px-10 py-4 rounded-full transition-colors text-lg"
                >
                  Go to Login
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#0f2020] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#1a3a3a] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#74becb]" />
                </div>
                <span className="text-white font-bold text-lg">TrackNest</span>
              </div>
              <p className="text-[#5a7a7a] text-sm leading-relaxed">
                Safety tooling for real-time response across web dashboards and
                mobile devices.
              </p>
            </div>
            {/* Links */}
            {[
              {
                title: "Product",
                links: [
                  "Live Tracking",
                  "Instant SOS",
                  "Family Circles",
                  "Safe Zones",
                ],
              },
              {
                title: "Resources",
                links: ["Help Center", "Support", "Privacy Policy", "Contact"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Partners"],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-white font-semibold mb-4">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="cursor-pointer text-[#5a7a7a] text-sm hover:text-[#74becb] transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1a3a3a] pt-8 text-center">
            <p className="text-[#3a5a5a] text-sm">
              © 2026 TrackNest Sanctuary. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
