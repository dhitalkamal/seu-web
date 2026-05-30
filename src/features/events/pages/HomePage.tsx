import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, useMotionValue, animate } from "framer-motion";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { usePublicEvents } from "@/features/events/hooks/useEvents";
import EventTile from "@/features/events/components/EventTile";

// * animated counter

type CountUpProps = { target: number; suffix?: string };

/** animates a number from 0 to target when the element scrolls into view */
function CountUp({ target, suffix = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(mv, target, { duration: 2, ease: "easeOut" });
    const unsub = mv.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      ctrl.stop();
      unsub();
    };
  }, [inView, target, mv]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

// animation variants

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const fadeUpScale = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// static content

const FEATURES = [
  {
    icon: "videocam",
    title: "Hybrid Events",
    desc: "Seamlessly blend in-person and virtual attendees in one unified experience.",
  },
  {
    icon: "qr_code_scanner",
    title: "QR Check-in",
    desc: "Instant offline-capable scanning for fast, reliable attendee verification.",
  },
  {
    icon: "map",
    title: "Interactive Maps",
    desc: "Venue discovery with geocoded locations and interactive map views.",
  },
  {
    icon: "account_balance_wallet",
    title: "Wallet Passes",
    desc: "Apple Wallet and Google Pay passes for effortless, ticket-free entry.",
  },
  {
    icon: "analytics",
    title: "Real-time Analytics",
    desc: "Live dashboards tracking registrations, check-ins, and revenue as it happens.",
  },
  {
    icon: "shield_person",
    title: "Role-based Access",
    desc: "Granular permissions for organizers, staff, and volunteers across your team.",
  },
];

const STEPS_ATTENDEE = [
  {
    n: "01",
    title: "Discover",
    desc: "Browse curated events by category, location, or interest.",
    icon: "search",
  },
  {
    n: "02",
    title: "Register",
    desc: "One-click sign up with instant ticket delivery to your wallet.",
    icon: "how_to_reg",
  },
  {
    n: "03",
    title: "Experience",
    desc: "Check in with QR, navigate venues, and connect with others.",
    icon: "celebration",
  },
];

const STEPS_ORGANIZER = [
  {
    n: "01",
    title: "Create",
    desc: "Set up your event in minutes with our intuitive builder.",
    icon: "edit_calendar",
  },
  {
    n: "02",
    title: "Manage",
    desc: "Track registrations, assign roles, and monitor in real time.",
    icon: "dashboard",
  },
  {
    n: "03",
    title: "Grow",
    desc: "Analyze performance, collect feedback, and scale your reach.",
    icon: "trending_up",
  },
];

// page component

/** public landing page - parallax hero, scroll-driven animations, marketing sections */
export default function HomePage() {
  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);

  // parallax transforms driven by scroll position
  const { scrollY } = useScroll();
  const orbY = useTransform(scrollY, [0, 700], [0, 120]);
  const contentY = useTransform(scrollY, [0, 500], [0, -80]);
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const { data, isLoading } = usePublicEvents({
    search: search || undefined,
    is_free: freeOnly || undefined,
  });

  const events = data?.results ?? [];
  const totalEvents = data?.count ?? 0;
  const totalRegistrations = events.reduce((sum, e) => sum + e.registered_count, 0);
  const freeCount = events.filter((e) => e.is_free).length;

  return (
    <PublicLayout>
      {/* * hero - full viewport with animated gradient orbs and parallax */}
      <section
        className="relative overflow-hidden flex items-center justify-center"
        style={{
          minHeight: "100vh",
          marginTop: -96,
          background: "linear-gradient(180deg, #0a1128 0%, #050a26 50%, #0d1b3e 100%)",
        }}
      >
        {/* dot grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* animated gradient orbs - parallax layer */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ y: orbY }}>
          {/* coral orb - top right */}
          <motion.div
            className="absolute"
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -30, 15, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            style={{
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(232,49,81,0.25), transparent 60%)",
              top: "5%",
              right: "-8%",
              filter: "blur(80px)",
            }}
          />
          {/* gold orb - bottom left */}
          <motion.div
            className="absolute"
            animate={{
              x: [0, -35, 25, 0],
              y: [0, 25, -15, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            style={{
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(219,161,61,0.2), transparent 60%)",
              bottom: "0%",
              left: "-5%",
              filter: "blur(80px)",
            }}
          />
          {/* blue orb - center */}
          <motion.div
            className="absolute"
            animate={{
              x: [0, 20, -20, 0],
              y: [0, -20, 20, 0],
            }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            style={{
              width: 450,
              height: 450,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(100,130,255,0.12), transparent 60%)",
              top: "35%",
              left: "25%",
              filter: "blur(60px)",
            }}
          />
        </motion.div>

        {/* hero content - parallax text layer */}
        <motion.div
          className="relative z-10 text-center px-6"
          style={{ y: contentY, opacity: contentOpacity, maxWidth: 820 }}
        >
          {/* eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase" as const,
                color: "var(--tertiary)",
              }}
            >
              Sansaar · The Event Universe
            </span>
          </motion.div>

          {/* headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white mb-6"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: "clamp(40px, 7vw, 78px)",
              lineHeight: 1,
              letterSpacing: "-0.045em",
            }}
          >
            Your next great
            <br />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                color: "var(--tertiary)",
              }}
            >
              experience starts here.
            </span>
          </motion.h1>

          {/* subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mx-auto mb-10"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.75)",
              maxWidth: "48ch",
            }}
          >
            Discover, create, and manage events that bring people together. From intimate workshops
            to flagship conferences.
          </motion.p>

          {/* cta buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <Link
              to="/events"
              className="inline-flex items-center gap-2 font-semibold no-underline transition-all hover:scale-[1.04]"
              style={{
                padding: "16px 32px",
                borderRadius: 14,
                background: "white",
                color: "var(--primary)",
                fontSize: 15,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Explore events
              <span className="ms" style={{ fontSize: 18 }}>
                arrow_forward
              </span>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 font-semibold text-white no-underline transition-all hover:scale-[1.04]"
              style={{
                padding: "16px 30px",
                borderRadius: 14,
                background: "var(--secondary)",
                fontSize: 15,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Start organizing
            </Link>
          </motion.div>
        </motion.div>

        {/* scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-10"
          style={{ transform: "translateX(-50%)" }}
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <span className="ms text-white" style={{ fontSize: 28, opacity: 0.45 }}>
            keyboard_arrow_down
          </span>
        </motion.div>
      </section>

      {/* * stats bar - count-up numbers on scroll */}
      {!isLoading && (
        <section
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--outline)",
            padding: "52px 32px",
          }}
        >
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-10"
            style={{ maxWidth: 960, margin: "0 auto" }}
          >
            {[
              { label: "Events listed", value: totalEvents },
              { label: "Total registrations", value: totalRegistrations },
              { label: "Free events", value: freeCount },
              { label: "Cities reached", value: 12 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 38,
                    letterSpacing: "-0.04em",
                    color: "var(--primary)",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  <CountUp target={value} />
                </p>
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase" as const,
                    color: "var(--on-mut)",
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* * how it works - dual track for attendees and organizers */}
      <section style={{ padding: "100px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase" as const,
                color: "var(--secondary)",
              }}
            >
              How it works
            </span>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-3"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: "clamp(28px, 4vw, 44px)",
              letterSpacing: "-0.04em",
              color: "var(--on-bg)",
              lineHeight: 1.1,
            }}
          >
            Simple for everyone
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
          {/* attendees track */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            <motion.h3
              variants={fadeUp}
              className="mb-10"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 20,
                letterSpacing: "-0.02em",
                color: "var(--on-bg)",
                paddingBottom: 12,
                borderBottom: "2px solid var(--secondary)",
                display: "inline-block",
              }}
            >
              For Attendees
            </motion.h3>
            <div className="flex flex-col gap-10">
              {STEPS_ATTENDEE.map((s) => (
                <motion.div key={s.n} variants={fadeUp} className="flex gap-5">
                  <div
                    className="flex-shrink-0 grid place-items-center"
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "var(--low)",
                    }}
                  >
                    <span className="ms" style={{ fontSize: 24, color: "var(--secondary)" }}>
                      {s.icon}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          color: "var(--on-mut)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {s.n}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 600,
                          fontSize: 18,
                          letterSpacing: "-0.02em",
                          color: "var(--on-bg)",
                        }}
                      >
                        {s.title}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 14.5,
                        color: "var(--on-var)",
                        lineHeight: 1.6,
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* organizers track */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            <motion.h3
              variants={fadeUp}
              className="mb-10"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 20,
                letterSpacing: "-0.02em",
                color: "var(--on-bg)",
                paddingBottom: 12,
                borderBottom: "2px solid var(--primary)",
                display: "inline-block",
              }}
            >
              For Organizers
            </motion.h3>
            <div className="flex flex-col gap-10">
              {STEPS_ORGANIZER.map((s) => (
                <motion.div key={s.n} variants={fadeUp} className="flex gap-5">
                  <div
                    className="flex-shrink-0 grid place-items-center"
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "var(--primary)",
                    }}
                  >
                    <span className="ms" style={{ fontSize: 24, color: "white" }}>
                      {s.icon}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          color: "var(--on-mut)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {s.n}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 600,
                          fontSize: 18,
                          letterSpacing: "-0.02em",
                          color: "var(--on-bg)",
                        }}
                      >
                        {s.title}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 14.5,
                        color: "var(--on-var)",
                        lineHeight: 1.6,
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* * features showcase */}
      <section style={{ background: "var(--surface)", padding: "100px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase" as const,
                  color: "var(--secondary)",
                }}
              >
                Platform features
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="mt-3"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: "clamp(28px, 4vw, 44px)",
                letterSpacing: "-0.04em",
                color: "var(--on-bg)",
                lineHeight: 1.1,
              }}
            >
              Everything you need to run
              <br />
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  color: "var(--tertiary)",
                }}
              >
                unforgettable events.
              </span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUpScale}
                whileHover={{
                  y: -8,
                  boxShadow: "0 24px 56px rgba(18,29,63,0.1)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--outline)",
                  borderRadius: 20,
                  padding: "34px 28px",
                  cursor: "default",
                }}
              >
                <div
                  className="grid place-items-center mb-5"
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 15,
                    background: "var(--primary)",
                  }}
                >
                  <span className="ms" style={{ fontSize: 24, color: "white" }}>
                    {f.icon}
                  </span>
                </div>
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: 18,
                    letterSpacing: "-0.02em",
                    color: "var(--on-bg)",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--on-var)", lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* * live events feed */}
      <section style={{ padding: "100px 32px", maxWidth: 1280, margin: "0 auto" }}>
        <motion.div
          className="flex items-start justify-between gap-6 mb-10 flex-wrap"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <span
              className="flex items-center gap-3 mb-3"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase" as const,
                color: "var(--secondary)",
              }}
            >
              <span className="w-12 h-px bg-[var(--secondary)]" />
              Happening soon
            </span>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: "clamp(28px, 4vw, 40px)",
                letterSpacing: "-0.04em",
                color: "var(--on-bg)",
                lineHeight: 1.05,
              }}
            >
              Find your next experience
            </h2>
          </motion.div>

          {/* filters */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center gap-2"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--outline)",
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              <span className="ms text-[var(--on-mut)]" style={{ fontSize: 16 }}>
                search
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontFamily: "Manrope, sans-serif",
                  fontSize: 13,
                  color: "var(--on-bg)",
                  width: 180,
                }}
              />
            </div>
            <label
              className="flex items-center gap-2 cursor-pointer select-none"
              style={{
                background: freeOnly ? "var(--primary)" : "var(--surface)",
                border: "1px solid var(--outline)",
                borderRadius: 10,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: freeOnly ? "white" : "var(--on-var)",
                fontFamily: "Manrope, sans-serif",
                transition: "all 200ms",
              }}
            >
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
                className="hidden"
              />
              Free only
            </label>
          </motion.div>
        </motion.div>

        {/* results count */}
        {!isLoading && (
          <p
            className="mb-6"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: "var(--on-mut)",
            }}
          >
            {totalEvents} events found
          </p>
        )}

        {/* events grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 300,
                  borderRadius: 18,
                  background: "var(--surface)",
                }}
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div
            className="text-center py-20"
            style={{
              background: "var(--surface)",
              borderRadius: 18,
              border: "1px solid var(--outline)",
            }}
          >
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: 20,
                color: "var(--on-mut)",
              }}
            >
              No events found.
            </p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
          >
            {events.map((event) => (
              <motion.div key={event.id} variants={fadeUp}>
                <EventTile event={event} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* browse all link */}
        {events.length > 0 && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link
              to="/events"
              className="inline-flex items-center gap-2 font-semibold no-underline transition-all hover:gap-3"
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                border: "1px solid var(--outline-strong)",
                color: "var(--on-bg)",
                fontSize: 14,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Browse all events
              <span className="ms" style={{ fontSize: 18 }}>
                arrow_forward
              </span>
            </Link>
          </motion.div>
        )}
      </section>

      {/* * cta banner - final conversion push */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #050a26, #121d3f)",
          padding: "100px 32px",
        }}
      >
        {/* subtle glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,49,81,0.1), transparent 70%)",
          }}
        />

        <motion.div
          className="relative text-center"
          style={{ maxWidth: 700, margin: "0 auto" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: "clamp(28px, 4vw, 44px)",
              letterSpacing: "-0.04em",
              color: "white",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Ready to create something
            <br />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                color: "var(--tertiary)",
              }}
            >
              unforgettable?
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.65)",
              maxWidth: "44ch",
              margin: "0 auto 40px",
            }}
          >
            Join thousands of organizers and attendees on the platform built for events that matter.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 font-semibold no-underline transition-all hover:scale-[1.04]"
              style={{
                padding: "16px 32px",
                borderRadius: 14,
                background: "var(--secondary)",
                color: "white",
                fontSize: 15,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Get started free
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 font-semibold text-white no-underline transition-all hover:scale-[1.04]"
              style={{
                padding: "16px 30px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.2)",
                fontSize: 15,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Explore events
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </PublicLayout>
  );
}
