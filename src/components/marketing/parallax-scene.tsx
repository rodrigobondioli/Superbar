"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";

type Base  = { id: string; left: string; top: string; speedY: number; speedX: number; rot: number; z: number; centerX?: boolean; float: string; delay: string };
type Img   = Base & { type: "image"; src: string; w: number; h: number; imgRot?: number };
type Badge = Base & { type: "badge"; text: string; bg: string; fg: string };
type Item  = Img | Badge;

const ITEMS: Item[] = [
  { id: "badge-orange", type: "badge",
    text: "Diminuímos o CMV", bg: "#FF3500", fg: "#000000",
    left: "50%", top: "30%", speedY: 90, speedX: -35, rot: -12, z: 3, centerX: true,
    float: "float-badge-a", delay: "0s" },

  { id: "badge-yellow", type: "badge",
    text: "Aumentamos a Margem", bg: "#FF6F00", fg: "#111113",
    left: "50%", top: "54%", speedY: 110, speedX: 28, rot: 8, z: 2, centerX: true,
    float: "float-badge-b", delay: "0.6s" },

  { id: "ice", type: "image", src: "/img-lp/cubo-gelo.png",
    w: 190, h: 190,
    left: "10%", top: "20%", speedY: 230, speedX: -55, rot: 32, z: 4,
    float: "float-img-a", delay: "0.2s" },

  { id: "lemon", type: "image", src: "/img-lp/limao.png",
    w: 270, h: 270, imgRot: 20,
    left: "64%", top: "4%", speedY: 290, speedX: 60, rot: -24, z: 3,
    float: "float-img-b", delay: "1s" },

  { id: "mascot", type: "image", src: "/img-lp/logo-superbar.svg",
    w: 155, h: 155,
    left: "46%", top: "70%", speedY: 360, speedX: -30, rot: 16, z: 5,
    float: "float-img-c", delay: "0.4s" },
];

export function ParallaxScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const outerRefs  = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let rafId: number;

    const tick = () => {
      const rect   = section.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const mid    = window.innerHeight / 2;
      const d      = Math.max(-0.55, Math.min(0.55, (center - mid) / window.innerHeight));

      outerRefs.current.forEach((el, i) => {
        if (!el) return;
        const item = ITEMS[i];
        const ty = d * item.speedY;
        const tx = d * item.speedX;
        const r  = d * item.rot;

        el.style.transform = item.centerX
          ? `translateX(calc(-50% + ${tx}px)) translateY(${ty}px) rotate(${r}deg)`
          : `translateX(${tx}px) translateY(${ty}px) rotate(${r}deg)`;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ height: "100vh", background: "#111113" }}
    >
      <style>{`
        /* ── Float keyframes ──────────────────────────────── */
        @keyframes float-img-a {
          0%   { transform: translateY(0px) rotate(-4deg) scale(1); }
          40%  { transform: translateY(-28px) rotate(5deg) scale(1.04); }
          70%  { transform: translateY(14px) rotate(-2deg) scale(0.97); }
          100% { transform: translateY(0px) rotate(-4deg) scale(1); }
        }
        @keyframes float-img-b {
          0%   { transform: translateY(0px) rotate(6deg) scale(1); }
          35%  { transform: translateY(-32px) rotate(-8deg) scale(1.05); }
          65%  { transform: translateY(18px) rotate(3deg) scale(0.96); }
          100% { transform: translateY(0px) rotate(6deg) scale(1); }
        }
        @keyframes float-img-c {
          0%   { transform: translateY(0px) rotate(0deg) scale(1); }
          45%  { transform: translateY(-22px) rotate(10deg) scale(1.06); }
          75%  { transform: translateY(12px) rotate(-5deg) scale(0.97); }
          100% { transform: translateY(0px) rotate(0deg) scale(1); }
        }
        @keyframes float-badge-a {
          0%   { transform: translateY(0px) rotate(-1.5deg); }
          50%  { transform: translateY(-14px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(-1.5deg); }
        }
        @keyframes float-badge-b {
          0%   { transform: translateY(0px) rotate(1deg); }
          50%  { transform: translateY(-18px) rotate(-2.5deg); }
          100% { transform: translateY(0px) rotate(1deg); }
        }

        /* ── Badge styles ─────────────────────────────────── */
        .parallax-badge {
          display: inline-block;
          border-radius: 100px;
          font-family: var(--font-display);
          font-weight: 800;
          white-space: nowrap;
          padding: 10px 22px;
          font-size: 1rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        }
        @media (min-width: 768px) {
          .parallax-badge { padding: 12px 28px; font-size: 1.2rem; }
        }
        @media (min-width: 1024px) {
          .parallax-badge { padding: 14px 32px; font-size: 1.4rem; }
        }
      `}</style>

      {ITEMS.map((item, i) => (
        /* Outer: JS parallax scroll */
        <div
          key={item.id}
          ref={(el) => { outerRefs.current[i] = el; }}
          style={{ position: "absolute", left: item.left, top: item.top, zIndex: item.z, willChange: "transform" }}
        >
          {/* Inner: CSS float animation */}
          <div style={{
            animation: `${item.float} ${item.type === "image" ? (i === 2 ? "3.8s" : i === 3 ? "5.2s" : "4.1s") : (i === 0 ? "3.4s" : "4.6s")} ease-in-out ${item.delay} infinite`,
            willChange: "transform",
          }}>
            {item.type === "badge" ? (
              <span
                className="parallax-badge"
                style={{ background: (item as Badge).bg, color: (item as Badge).fg }}
              >
                {(item as Badge).text}
              </span>
            ) : (
              <Image
                src={(item as Img).src}
                alt={item.id}
                width={(item as Img).w}
                height={(item as Img).h}
                style={{
                  transform: (item as Img).imgRot ? `rotate(${(item as Img).imgRot}deg)` : undefined,
                  filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.45))",
                }}
              />
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
