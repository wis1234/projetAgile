import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { FaChartLine, FaUsers, FaTasks, FaProjectDiagram, FaFileAlt, FaBullhorn, FaChevronLeft, FaChevronRight, FaDownload, FaUserPlus } from 'react-icons/fa';
import RecruitmentCard from '@/Components/RecruitmentCard';
import { useTranslation } from 'react-i18next';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);
Chart.defaults.font.family = 'inherit';

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   Thème clair par défaut ; le mode sombre s'applique via la classe `.dark`
   (même mécanisme que les variantes Tailwind `dark:` de votre projet).
   ════════════════════════════════════════════════════════════════════════════ */

const DASHBOARD_CSS = `
.pj-root { --sy: 0; }

/* Verre dépoli (bordure, flou, ombre) — thème clair */
.pj-glass {
  position: relative;
  border: 1px solid rgba(15,23,42,.08);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  box-shadow: 0 14px 40px -16px rgba(30,41,90,.22), inset 0 1px 0 rgba(255,255,255,.9);
  transition: border-color .35s ease, box-shadow .35s ease;
}
.pj-glass::before {
  content: ''; position: absolute; inset: 0 24px auto 24px; height: 1px; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,.4), transparent);
}
/* Fond du verre (séparé pour ne pas écraser les dégradés Tailwind du bandeau) */
.pj-surface { background: linear-gradient(145deg, rgba(255,255,255,.9), rgba(255,255,255,.6)); }
.pj-panel:hover { border-color: rgba(99,102,241,.3); }

/* Verre dépoli — thème sombre */
.dark .pj-glass {
  border-color: rgba(255,255,255,.09);
  box-shadow: 0 18px 50px -18px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.07);
}
.dark .pj-glass::before { background: linear-gradient(90deg, transparent, rgba(125,211,252,.45), transparent); }
.dark .pj-surface { background: linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.02)); }
.dark .pj-panel:hover { border-color: rgba(129,140,248,.28); }

/* Révélation au scroll */
.pj-reveal {
  opacity: 0;
  transform: translate3d(0, var(--y, 28px), 0) scale(.985);
  transition: opacity .7s cubic-bezier(.22,1,.36,1) var(--d, 0ms),
              transform .85s cubic-bezier(.22,1,.36,1) var(--d, 0ms);
  will-change: opacity, transform;
}
.pj-reveal.pj-in { opacity: 1; transform: none; will-change: auto; }

/* Tilt 3D + halo qui suit la souris */
.pj-tilt {
  position: relative;
  transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform .3s cubic-bezier(.22,1,.36,1);
  will-change: transform;
}
.pj-tilt::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0;
  background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--glow, 99,102,241), .16), transparent 70%);
  transition: opacity .3s ease;
}
.dark .pj-tilt::after {
  background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--glow, 99,102,241), .22), transparent 70%);
}
.pj-tilt:hover::after { opacity: 1; }

/* Carte statistique */
.pj-stat { transition: border-color .3s ease, box-shadow .3s ease; }
.pj-tilt:hover .pj-stat, .pj-stat:focus-visible {
  border-color: rgba(var(--glow), .5);
  box-shadow: 0 0 0 1px rgba(var(--glow), .16), 0 24px 50px -20px rgba(var(--glow), .45), inset 0 1px 0 rgba(255,255,255,.9);
}
.dark .pj-tilt:hover .pj-stat, .dark .pj-stat:focus-visible {
  border-color: rgba(var(--glow), .55);
  box-shadow: 0 0 0 1px rgba(var(--glow), .2), 0 24px 60px -20px rgba(var(--glow), .55), inset 0 1px 0 rgba(255,255,255,.1);
}
.pj-blob { background: rgba(var(--glow), .16); }
.dark .pj-blob { background: rgba(var(--glow), .28); }

/* Fond immersif */
.pj-par { position: absolute; transform: translate3d(0, calc(var(--sy, 0) * var(--k, -0.05) * 1px), 0); will-change: transform; }
.pj-orb { border-radius: 9999px; filter: blur(90px); animation: pj-float 38s ease-in-out infinite; }
.pj-ring { border-radius: 9999px; border: 1px solid rgba(59,130,246,.16); animation: pj-spin 90s linear infinite; }
.pj-square { border: 1px solid rgba(99,102,241,.18); animation: pj-spin 70s linear infinite reverse; border-radius: 22%; }
.dark .pj-ring { border-color: rgba(125,211,252,.09); }
.dark .pj-square { border-color: rgba(129,140,248,.12); }
.pj-particle { position: absolute; border-radius: 9999px; animation: pj-drift ease-in-out infinite; }
.pj-grid {
  background-image: linear-gradient(rgba(71,85,105,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(71,85,105,.08) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, #000 30%, transparent 100%);
  mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, #000 30%, transparent 100%);
}
.dark .pj-grid {
  background-image: linear-gradient(rgba(148,163,184,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.05) 1px, transparent 1px);
}

@keyframes pj-float { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(50px,-35px,0) scale(1.12); } }
@keyframes pj-drift { 0%,100% { transform: translate3d(0,0,0); opacity: .12; } 50% { transform: translate3d(14px,-46px,0); opacity: .75; } }
@keyframes pj-spin { to { transform: rotate(360deg); } }
@keyframes pj-pulse-dot { 0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,.5); } 70% { box-shadow: 0 0 0 8px rgba(59,130,246,0); } }
.pj-live { animation: pj-pulse-dot 2.4s ease-out infinite; }

/* Accessibilité : réduction des animations */
@media (prefers-reduced-motion: reduce) {
  .pj-orb, .pj-ring, .pj-square, .pj-particle, .pj-live { animation: none !important; }
  .pj-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .pj-tilt { transform: none !important; transition: none !important; }
  .pj-par { transform: none !important; }
}
`;

/* ════════════════════════════════════════════════════════════════════════════
   HOOKS
   ════════════════════════════════════════════════════════════════════════════ */

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
};

// Suit le mode sombre de l'application (classe `dark` sur <html> ou <body>) — utile aux graphiques Chart.js
const useIsDark = () => {
  const read = () =>
    typeof document !== 'undefined' &&
    (document.documentElement.classList.contains('dark') || document.body?.classList.contains('dark'));
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const update = () => setDark(read());
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return dark;
};

// Se déclenche une seule fois quand l'élément entre dans la zone visible
const useInView = (threshold = 0.12) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
};

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES D'ANIMATION
   ════════════════════════════════════════════════════════════════════════════ */

const Reveal = ({ children, delay = 0, y = 28, className = '' }) => {
  const [ref, shown] = useInView();
  return (
    <div
      ref={ref}
      className={`pj-reveal ${shown ? 'pj-in' : ''} ${className}`}
      style={{ '--d': `${delay}ms`, '--y': `${y}px` }}
    >
      {children}
    </div>
  );
};

const TiltCard = ({ children, glow = '99,102,241', max = 7, className = '' }) => {
  const ref = useRef(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onMove = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${((0.5 - py) * max).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((px - 0.5) * max).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    });
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`pj-tilt rounded-2xl ${className}`}
      style={{ '--glow': glow }}
    >
      {children}
    </div>
  );
};

const CountUp = ({ value, duration = 1400 }) => {
  const target = Number(value) || 0;
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView(0.3);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) {
      setN(target);
      return undefined;
    }
    let raf;
    let start;
    const step = (ts) => {
      if (start === undefined) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setN(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, reduced, duration]);

  return <span ref={ref} className="tabular-nums">{n.toLocaleString('fr-FR')}</span>;
};

const ChartWhenVisible = ({ children, className = '' }) => {
  const [ref, inView] = useInView(0.2);
  return <div ref={ref} className={className}>{inView ? children : null}</div>;
};

/* ════════════════════════════════════════════════════════════════════════════
   ARRIÈRE-PLAN IMMERSIF (mémoïsé : jamais re-rendu au scroll)
   Clair : « blanc foncé » légèrement bleuté — Sombre : bleu nuit / indigo
   ════════════════════════════════════════════════════════════════════════════ */

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  size: 2 + (i % 3),
  duration: `${14 + (i % 7) * 2.5}s`,
  delay: `-${(i * 1.7).toFixed(1)}s`,
  color: ['#3b82f6', '#6366f1', '#06b6d4'][i % 3],
}));

const AmbientBackground = memo(function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Fond clair */}
      <div
        className="absolute inset-0 block dark:hidden"
        style={{
          background:
            'radial-gradient(1100px 650px at 10% -5%, rgba(59,130,246,.16), transparent 60%),' +
            'radial-gradient(900px 600px at 95% 8%, rgba(99,102,241,.13), transparent 60%),' +
            'radial-gradient(800px 700px at 50% 100%, rgba(6,182,212,.09), transparent 65%),' +
            'linear-gradient(180deg, #eceff6 0%, #e6eaf3 50%, #e9edf6 100%)',
        }}
      />
      {/* Fond sombre */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            'radial-gradient(1200px 700px at 12% -5%, rgba(37,99,235,.28), transparent 60%),' +
            'radial-gradient(900px 600px at 95% 8%, rgba(99,102,241,.24), transparent 60%),' +
            'radial-gradient(800px 700px at 50% 100%, rgba(8,145,178,.16), transparent 65%),' +
            'linear-gradient(180deg, #03050f 0%, #060b1f 45%, #04061a 100%)',
        }}
      />
      <div className="pj-grid absolute inset-0" />

      <div className="pj-par" style={{ top: '2%', left: '-8%', '--k': -0.07 }}>
        <div className="pj-orb h-[26rem] w-[26rem] bg-blue-400/30 dark:bg-blue-600/25" />
      </div>
      <div className="pj-par" style={{ top: '14%', right: '-10%', '--k': -0.12 }}>
        <div className="pj-orb h-[30rem] w-[30rem] bg-indigo-300/30 dark:bg-indigo-500/20" style={{ animationDelay: '-12s' }} />
      </div>
      <div className="pj-par" style={{ top: '52%', left: '25%', '--k': -0.05 }}>
        <div className="pj-orb h-[28rem] w-[28rem] bg-cyan-300/25 dark:bg-cyan-500/10" style={{ animationDelay: '-24s' }} />
      </div>

      <div className="pj-par hidden md:block" style={{ top: '9%', right: '8%', '--k': -0.16 }}>
        <div className="pj-ring h-56 w-56" />
      </div>
      <div className="pj-par hidden md:block" style={{ top: '38%', left: '4%', '--k': -0.1 }}>
        <div className="pj-square h-32 w-32" />
      </div>

      <div className="absolute inset-0 opacity-50 dark:opacity-100">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="pj-particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 10px 2px ${p.color}55`,
              animationDuration: p.duration,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════════════════════
   COMPOSANTS UI
   ════════════════════════════════════════════════════════════════════════════ */

const Widget = ({ title, count, color, glow, link, icon: Icon }) => {
  const content = (
    <div className="pj-glass pj-surface pj-stat group relative flex h-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl p-4 sm:gap-4 sm:p-5">
      <span className={`absolute inset-x-0 top-0 h-px ${color} opacity-90`} />
      <span className="pj-blob pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-150" />
      <div
        className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${color} sm:h-12 sm:w-12`}
        style={{ boxShadow: `0 8px 22px -6px rgba(${glow}, .7), inset 0 1px 0 rgba(255,255,255,.35)` }}
      >
        <Icon className="text-base text-white sm:text-lg" />
      </div>
      <div className="relative min-w-0">
        <p className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          <CountUp value={count ?? 0} />
        </p>
        <p className="mt-1 truncate text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      </div>
      <FaChevronRight className="relative ml-auto h-3 w-3 flex-shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-cyan-300" />
    </div>
  );

  return link ? (
    <Link href={link} className="block h-full min-w-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-cyan-400/70 dark:focus-visible:ring-offset-slate-950">
      {content}
    </Link>
  ) : content;
};

const InformationTicker = ({ items }) => {
  const tickerRef = useRef(null);
  const scroll = (direction) => {
    if (!tickerRef.current) return;
    tickerRef.current.scrollBy({
      left: direction * tickerRef.current.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  return (
    <section
      aria-label="Informations importantes"
      className="pj-glass overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-600 text-white shadow-xl shadow-blue-900/20 dark:from-blue-600/25 dark:via-indigo-600/15 dark:to-cyan-500/15"
    >
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex flex-shrink-0 items-center gap-3 sm:w-48">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-100 ring-1 ring-white/20 dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-300/25 dark:shadow-[0_0_20px_-4px_rgba(34,211,238,.6)]">
            <FaChartLine className="text-lg" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100/80 dark:text-cyan-200/80">ProJA</p>
            <h2 className="text-sm font-bold text-white">À suivre</h2>
          </div>
        </div>

        <div
          ref={tickerRef}
          className="flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          tabIndex={0}
          aria-label="Faites défiler les informations"
        >
          {items.map(({ icon: Icon, label, value, title, description, href }, index) => {
            const content = (
              <>
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-cyan-100 dark:text-cyan-200">
                  <Icon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-blue-100/80">{label}</span>
                  {title ? (
                    <>
                      <span className="mt-0.5 block truncate text-sm font-bold text-white motion-safe:animate-pulse">{title}</span>
                      <span className="block truncate text-xs text-blue-100/75">{description}</span>
                    </>
                  ) : (
                    <span className="mt-0.5 block truncate text-sm font-semibold text-white">{value}</span>
                  )}
                </span>
                <FaChevronRight className="h-3 w-3 flex-shrink-0 text-blue-100/60" />
              </>
            );
            const className = "flex w-[min(82vw,24rem)] flex-shrink-0 snap-start items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80";

            return href ? (
              <Link key={`${label}-${index}`} href={href} className={className}>
                {content}
              </Link>
            ) : (
              <div key={`${label}-${index}`} className={className}>
                {content}
              </div>
            );
          })}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 sm:pl-1">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Informations précédentes"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-all duration-200 hover:bg-white/25 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <FaChevronLeft className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Informations suivantes"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-all duration-200 hover:bg-white/25 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <FaChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </section>
  );
};

// ── Accès rapide (conservé dans l'architecture ; non rendu dans le dashboard d'origine) ──

export const QuickAccess = () => {
  const { t } = useTranslation();
  return (
    <div className="pj-glass overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 dark:from-blue-600/30 dark:to-indigo-900/30">
      <div className="p-4 text-white sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-widest text-white/90 sm:mb-4 sm:text-sm">
          <FaChartLine className="text-white/80" /> {t('quick_access')}
        </h2>
        <div className="space-y-1.5 sm:space-y-2">
          {[
            { icon: <FaTasks />, label: t('new_task'), link: '/tasks/create' },
            { icon: <FaProjectDiagram />, label: t('new_project'), link: '/projects/create' },
            { icon: <FaUsers />, label: t('add_member'), link: '/users/create' },
            { icon: <FaFileAlt />, label: t('import_file'), link: '/files/upload' },
            { icon: <FaUserPlus />, label: t('recruitment_offers'), link: '/recruitment' },
          ].map((item, index) => (
            <Link
              key={index}
              href={item.link}
              className="group flex min-w-0 items-center rounded-lg bg-white/10 p-2.5 transition-all hover:bg-white/20 active:scale-[0.98] sm:p-3"
            >
              <span className="mr-3 flex-shrink-0 text-blue-200 group-hover:text-white">{item.icon}</span>
              <span className="min-w-0 truncate text-[13px] font-medium sm:text-sm">{item.label}</span>
              <FaChevronRight className="ml-auto h-3 w-3 flex-shrink-0 text-blue-200/60 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Badge statut (répartition des tâches) ───────────────────────────────────

const StatusBadge = ({ status, count }) => {
  const { t } = useTranslation();
  const statusConfig = {
    todo: { label: t('status_todo'), color: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30', dot: '#3b82f6' },
    in_progress: { label: t('status_in_progress'), color: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30', dot: '#f59e0b' },
    done: { label: t('status_done'), color: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30', dot: '#10b981' },
    en_attente: { label: t('status_pending'), color: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/30', dot: '#64748b' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/30', dot: '#64748b' };

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05]">
      <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 sm:px-3 ${config.color}`}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: config.dot, boxShadow: `0 0 8px ${config.dot}` }} />
        {config.label}
      </span>
      <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{count}</span>
    </div>
  );
};

const Avatar = ({ src, name, size = 'w-9 h-9 sm:w-10 sm:h-10', text = 'text-sm' }) => (
  src ? (
    <img src={src} alt={name} className={`${size} rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/20`} />
  ) : (
    <div className={`${size} flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 ring-1 ring-slate-200 dark:from-indigo-500/40 dark:to-cyan-500/30 dark:ring-white/15`}>
      <span className={`${text} font-medium text-slate-600 dark:text-white/80`}>{(name || '?').charAt(0).toUpperCase()}</span>
    </div>
  )
);

const SectionTitle = ({ children }) => (
  <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-white sm:text-lg">
    <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_2px_rgba(59,130,246,.45)] dark:bg-cyan-400 dark:shadow-[0_0_10px_2px_rgba(34,211,238,.7)]" />
    {children}
  </h2>
);

const viewAllClass = 'inline-flex flex-shrink-0 items-center text-xs font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-cyan-300 dark:hover:text-white sm:text-sm';

/* ════════════════════════════════════════════════════════════════════════════
   OPTIONS CHART.JS (adaptées au thème clair / sombre)
   ════════════════════════════════════════════════════════════════════════════ */

const getTheme = (dark) => (dark ? {
  tick: '#64748b',
  grid: 'rgba(148, 163, 184, 0.08)',
  legend: '#94a3b8',
  sliceBorder: 'rgba(6, 10, 28, 0.9)',
  pointBorder: '#0b1020',
  tooltip: {
    backgroundColor: 'rgba(6, 10, 28, 0.94)',
    borderColor: 'rgba(129, 140, 248, 0.45)',
    titleColor: '#e0e7ff',
    bodyColor: '#a5b4fc',
  },
  fillTop: 'rgba(99, 102, 241, 0.38)',
  fillMid: 'rgba(34, 211, 238, 0.08)',
} : {
  tick: '#64748b',
  grid: 'rgba(15, 23, 42, 0.06)',
  legend: '#475569',
  sliceBorder: '#ffffff',
  pointBorder: '#ffffff',
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    titleColor: '#0f172a',
    bodyColor: '#4f46e5',
  },
  fillTop: 'rgba(99, 102, 241, 0.28)',
  fillMid: 'rgba(34, 211, 238, 0.07)',
});

const makeTooltip = (theme) => ({
  ...theme.tooltip,
  borderWidth: 1,
  padding: 12,
  cornerRadius: 12,
  titleFont: { size: 12, weight: '600' },
  bodyFont: { size: 12 },
  boxPadding: 4,
  displayColors: false,
});

const makeLineOptions = (theme) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  animation: { duration: 1400, easing: 'easeOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...makeTooltip(theme),
      callbacks: { label: (ctx) => `Activités : ${ctx.parsed.y}` },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: theme.grid },
      ticks: { stepSize: 1, font: { size: 10 }, color: theme.tick },
    },
    x: {
      border: { display: false },
      grid: { display: false },
      ticks: { font: { size: 10 }, color: theme.tick, maxRotation: 45, minRotation: 0, autoSkip: true, maxTicksLimit: 8 },
    },
  },
});

const makePieOptions = (theme) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { animateRotate: true, animateScale: true, duration: 1400, easing: 'easeOutQuart' },
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: theme.legend, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 14, font: { size: 11 } },
    },
    tooltip: makeTooltip(theme),
  },
});

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function Dashboard({ auth, stats = {}, activityByDay = [], recentActivities = [], topUsers = [], recentProjects = [], recentFiles = [], announcements = [] }) {
  const { t } = useTranslation();
  const isAdmin = auth?.user?.roles?.includes('admin');
  const rootRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const isDark = useIsDark();
  const theme = useMemo(() => getTheme(isDark), [isDark]);

  const tasksByStatus = useMemo(
    () => stats.tasksByStatus || { todo: 0, in_progress: 0, done: 0, en_attente: 0 },
    [stats.tasksByStatus]
  );

  // Parallaxe : un seul écouteur passif, throttlé par rAF, qui écrit une variable CSS (aucun re-render)
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return undefined;
    let raf = 0;
    const onScroll = (e) => {
      const target = e.target;
      const y = target && target !== document && target.scrollTop !== undefined ? target.scrollTop : window.scrollY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => root.style.setProperty('--sy', String(y)));
    };
    // capture:true → fonctionne aussi si le layout défile dans un conteneur interne
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  const statsData = [
    {
      title: t('tasks'),
      count: stats.tasks || 0,
      color: 'bg-gradient-to-br from-indigo-500 to-blue-700',
      glow: '99,102,241',
      link: '/tasks',
      icon: FaTasks,
      show: true
    },
    {
      title: t('projects'),
      count: stats.projects || 0,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      glow: '34,211,238',
      link: '/projects',
      icon: FaProjectDiagram,
      show: true
    },
    {
      title: t('team_members'),
      count: stats.members || 0,
      color: 'bg-gradient-to-br from-violet-500 to-purple-700',
      glow: '167,139,250',
      link: '/users',
      icon: FaUsers,
      show: isAdmin
    },
    {
      title: t('files'),
      count: stats.files || 0,
      color: 'bg-gradient-to-br from-amber-500 to-orange-600',
      glow: '251,146,60',
      link: '/files',
      icon: FaFileAlt,
      show: true
    },
  ];

  const visibleWidgets = statsData.filter(widget =>
    widget.show !== false &&
    (widget.count > 0 || widget.count === 0) &&
    widget.link
  );

  const tickerItems = [
    ...announcements.map((announcement) => ({
      icon: FaBullhorn,
      label: `COMMUNIQUÉ · ${announcement.project_name}`,
      title: announcement.title,
      description: announcement.body,
      href: `/announcements?project_id=${announcement.project_id}`,
    })),
    {
      icon: FaTasks,
      label: 'Suivi des tâches',
      value: `${tasksByStatus.todo || 0} ${t('status_todo').toLowerCase()} · ${tasksByStatus.in_progress || 0} ${t('status_in_progress').toLowerCase()}`,
      href: '/tasks',
    },
    {
      icon: FaProjectDiagram,
      label: t('projects'),
      value: `${stats.projects || 0} ${t('projects').toLowerCase()} dans votre espace`,
      href: '/projects',
    },
    ...(recentActivities[0] ? [{
      icon: FaChartLine,
      label: t('recent_activity'),
      value: `${recentActivities[0].user?.name || t('unknown_user')} : ${recentActivities[0].description}`,
      href: '/activities',
    }] : []),
    ...(recentFiles[0] ? [{
      icon: FaFileAlt,
      label: t('recent_files'),
      value: recentFiles[0].name,
      href: `/files/${recentFiles[0].id}`,
    }] : []),
  ];

  const panelClass = 'pj-glass pj-surface pj-panel min-w-0 rounded-3xl p-5 sm:p-6';
  const emptyClass = 'py-4 text-center text-sm text-slate-400 dark:text-slate-500';

  // Options et données des graphiques (mémoïsées ; se mettent à jour au changement de thème)
  const lineOptions = useMemo(() => makeLineOptions(theme), [theme]);
  const pieOptions = useMemo(() => makePieOptions(theme), [theme]);

  const activityChartData = useMemo(() => ({
    labels: activityByDay.map(a => new Date(a.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: 'Activités',
        data: activityByDay.map(a => a.count),
        borderColor: (ctx) => {
          const { chart } = ctx;
          const area = chart.chartArea;
          if (!area) return '#6366f1';
          const g = chart.ctx.createLinearGradient(area.left, 0, area.right, 0);
          g.addColorStop(0, '#06b6d4');
          g.addColorStop(0.55, '#6366f1');
          g.addColorStop(1, '#8b5cf6');
          return g;
        },
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const area = chart.chartArea;
          if (!area) return 'rgba(99, 102, 241, 0.15)';
          const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
          g.addColorStop(0, theme.fillTop);
          g.addColorStop(0.6, theme.fillMid);
          g.addColorStop(1, 'rgba(34, 211, 238, 0)');
          return g;
        },
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#22d3ee',
        pointHoverBorderColor: theme.pointBorder,
        pointHoverBorderWidth: 3,
      },
    ],
  }), [activityByDay, theme]);

  const tasksByStatusData = useMemo(() => ({
    labels: ['À faire', 'En cours', 'Terminées', 'En attente'],
    datasets: [
      {
        data: [
          tasksByStatus.todo || 0,
          tasksByStatus.in_progress || 0,
          tasksByStatus.done || 0,
          tasksByStatus.en_attente || 0
        ],
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#64748b'],
        hoverBackgroundColor: ['#60a5fa', '#fbbf24', '#34d399', '#94a3b8'],
        borderColor: theme.sliceBorder,
        borderWidth: 3,
        hoverOffset: 10,
      },
    ],
  }), [tasksByStatus, theme]);

  return (
    <div
      ref={rootRef}
      className="pj-root relative isolate min-h-screen w-full overflow-hidden bg-[#e8ebf2] text-slate-700 dark:bg-[#040716] dark:text-slate-200"
    >
      <style>{DASHBOARD_CSS}</style>
      <AmbientBackground />

      <div className="relative z-10 mx-auto max-w-screen-2xl space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">

        {/* En-tête */}
        <Reveal y={20}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-cyan-300">
                <span className="pj-live h-2 w-2 rounded-full bg-blue-500 dark:bg-cyan-400" />
                ProJA · Espace de pilotage
              </p>
              <h1 className="bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-blue-100 dark:to-cyan-300 sm:text-4xl">
                {t('dashboard')}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {t('dashboard_subtitle')}
              </p>
            </div>
            <div className="pj-glass pj-surface w-full flex-shrink-0 overflow-hidden rounded-2xl sm:w-72">
              <RecruitmentCard />
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <InformationTicker items={tickerItems} />
        </Reveal>

        {/* Widgets stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {visibleWidgets.map((widget, index) => (
            <Reveal key={index} delay={index * 90} className="h-full min-w-0">
              <TiltCard glow={widget.glow} className="h-full">
                <Widget
                  title={widget.title}
                  count={widget.count}
                  color={widget.color}
                  glow={widget.glow}
                  link={widget.link}
                  icon={widget.icon}
                />
              </TiltCard>
            </Reveal>
          ))}
        </div>

        {/* Graphique d'activité et membres actifs */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Reveal className={`${panelClass} lg:col-span-2`}>
            <div className="mb-5"><SectionTitle>{t('recent_activity')}</SectionTitle></div>
            <ChartWhenVisible className="h-52 sm:h-64">
              <Line data={activityChartData} options={lineOptions} />
            </ChartWhenVisible>
          </Reveal>

          <Reveal delay={120} className={panelClass}>
            <div className="mb-5"><SectionTitle>{t('active_team_members')}</SectionTitle></div>
            <div className="space-y-2">
              {topUsers && topUsers.length > 0 ? (
                topUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="-mx-2 flex min-w-0 items-center justify-between gap-2 rounded-xl p-2 transition-colors duration-200 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05]"
                  >
                    <div className="flex min-w-0 items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <Avatar src={user.avatar} name={user.name} />
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,.7)] dark:border-[#0a1024] dark:bg-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.count} activités</p>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-sm font-semibold text-blue-600 dark:text-cyan-300">
                      #{index + 1}
                    </span>
                  </div>
                ))
              ) : (
                <p className={emptyClass}>
                  {t('no_recent_user_activity')}
                </p>
              )}
            </div>
          </Reveal>
        </div>

        {/* Répartition des tâches */}
        <Reveal className={panelClass}>
          <div className="mb-5"><SectionTitle>Répartition des tâches</SectionTitle></div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <ChartWhenVisible className="h-52 min-w-0 sm:h-64">
              <Pie data={tasksByStatusData} options={pieOptions} />
            </ChartWhenVisible>
            <div className="mt-2 min-w-0 space-y-1 sm:space-y-2 md:mt-6">
              <StatusBadge status="todo" count={tasksByStatus.todo || 0} />
              <StatusBadge status="in_progress" count={tasksByStatus.in_progress || 0} />
              <StatusBadge status="done" count={tasksByStatus.done || 0} />
              <StatusBadge status="en_attente" count={tasksByStatus.en_attente || 0} />
            </div>
          </div>
        </Reveal>

        {/* Projets récents */}
        <Reveal className={panelClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-6">
            <SectionTitle>{t('recent_projects')}</SectionTitle>
            <Link href="/projects" className={viewAllClass}>
              {t('view_all_projects')} <FaChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {recentProjects && recentProjects.length > 0 ? (
              recentProjects.map((project, index) => (
                <Reveal key={project.id} delay={(index % 3) * 90} y={22} className="h-full min-w-0">
                  <Link
                    href={`/projects/${project.id}`}
                    className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-[0_20px_40px_-20px_rgba(59,130,246,.4)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-cyan-300/35 dark:hover:bg-white/[0.07] dark:hover:shadow-[0_20px_50px_-20px_rgba(34,211,238,.45)] dark:focus-visible:ring-cyan-400/70"
                  >
                    <div className="min-w-0 flex-1 p-4">
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <h3 className="min-w-0 truncate font-medium text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-cyan-300">
                          {project.name}
                        </h3>
                        <span className="inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30">
                          {project.status}
                        </span>
                      </div>
                      <p className="mb-4 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        {project.description || 'Aucune description'}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar src={project.manager?.avatar} name={project.manager?.name} size="w-6 h-6" text="text-xs" />
                          <span className="truncate text-slate-600 dark:text-slate-300">{project.manager?.name}</span>
                        </div>
                        <span className="flex-shrink-0 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {project.task_count} {t('tasks')}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-slate-200/70 bg-slate-50/80 px-4 py-2 text-right dark:border-white/5 dark:bg-white/[0.03]">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors group-hover:text-blue-800 dark:text-cyan-300 dark:group-hover:text-white">
                        {t('view_project')} <FaChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 dark:text-slate-500">
                <p>{t('no_recent_projects')}</p>
              </div>
            )}
          </div>
        </Reveal>

        {/* Fichiers récents */}
        <Reveal className={panelClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-6">
            <SectionTitle>{t('recent_files')}</SectionTitle>
            <Link href="/files" className={viewAllClass}>
              {t('view_all_files')} <FaChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {recentFiles && recentFiles.length > 0 ? (
              recentFiles.map((file) => (
                <Link
                  key={file.id}
                  href={`/files/${file.id}`}
                  className="group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-transparent p-2.5 transition-all duration-200 hover:border-slate-200 hover:bg-white/70 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:hover:border-white/10 dark:hover:bg-white/[0.05] dark:focus-visible:ring-cyan-400/70 sm:p-3"
                >
                  <div className="flex min-w-0 flex-1 items-center space-x-3">
                    <div className="flex-shrink-0 rounded-lg bg-blue-50 p-2 ring-1 ring-blue-200/70 dark:bg-blue-500/15 dark:ring-blue-400/20">
                      <FaFileAlt className="text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-cyan-300">
                        {file.name}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {file.size} • {file.created_at}
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 rounded-full p-2 text-blue-600 transition-all hover:bg-blue-100 hover:text-blue-800 dark:text-cyan-300 dark:hover:bg-cyan-400/15 dark:hover:text-white dark:hover:shadow-[0_0_16px_-2px_rgba(34,211,238,.6)]"
                    title="Télécharger"
                  >
                    <FaDownload />
                  </a>
                </Link>
              ))
            ) : (
              <p className={emptyClass}>
                {t('no_recent_files')}
              </p>
            )}
          </div>
        </Reveal>

        {/* Activités récentes */}
        <Reveal className={panelClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-6">
            <SectionTitle>{t('recent_activities')}</SectionTitle>
            <Link href="/activities" className={viewAllClass}>
              {t('view_all_activities')} <FaChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const ActivityWrapper = activity.url ? Link : 'div';
                const wrapperProps = activity.url
                  ? { href: activity.url, className: 'group -mx-2 flex min-w-0 items-start space-x-3 rounded-lg p-2 transition-all hover:bg-slate-900/[0.04] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:hover:bg-white/[0.05] dark:focus-visible:ring-cyan-400/70' }
                  : { className: '-mx-2 flex min-w-0 items-start space-x-3 p-2' };

                return (
                  <ActivityWrapper key={activity.id} {...wrapperProps}>
                    <div className="flex-shrink-0">
                      <Avatar src={activity.user?.avatar} name={activity.user?.name} size="w-8 h-8" text="text-xs" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`break-words text-sm text-slate-700 dark:text-slate-200 ${activity.url ? 'transition-colors group-hover:text-blue-600 dark:group-hover:text-cyan-300' : ''}`}>
                        <span className="font-medium text-slate-900 dark:text-white">{activity.user?.name || t('unknown_user')}</span>
                        {' '}{activity.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {activity.created_at}
                      </p>
                    </div>
                  </ActivityWrapper>
                );
              })
            ) : (
              <p className={emptyClass}>
                {t('no_recent_activity')}
              </p>
            )}
          </div>
        </Reveal>

      </div>
    </div>
  );
}

Dashboard.layout = page => <AdminLayout children={page} />;