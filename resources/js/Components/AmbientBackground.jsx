import React, { memo } from 'react';

/**
 * Arrière-plan immersif ProJA (réplique exacte du Dashboard).
 * Clair : ambiance aérée bleutée / lilas avec grille subtile et particules douces.
 * Sombre : nuit profonde bleu/indigo avec orbes luminescents et lueurs cyans.
 */

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  size: 2 + (i % 3),
  duration: `${14 + (i % 7) * 2.5}s`,
  delay: `-${(i * 1.7).toFixed(1)}s`,
  color: ['#3b82f6', '#6366f1', '#06b6d4'][i % 3],
}));

function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
    >
      {/* Fond clair : dégradés radiaux doux et base bleutée */}
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

      {/* Fond sombre : dégradés radiaux nocturnes et base indigo profond */}
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

      {/* Grille géométrique subtile */}
      <div className="pj-grid absolute inset-0" />

      {/* Orbes et lueurs atmosphériques flottantes */}
      <div className="pj-par" style={{ top: '2%', left: '-8%' }}>
        <div className="pj-orb h-[26rem] w-[26rem] bg-blue-400/30 dark:bg-blue-600/25" />
      </div>
      <div className="pj-par" style={{ top: '14%', right: '-10%' }}>
        <div
          className="pj-orb h-[30rem] w-[30rem] bg-indigo-300/30 dark:bg-indigo-500/20"
          style={{ animationDelay: '-12s' }}
        />
      </div>
      <div className="pj-par" style={{ top: '52%', left: '25%' }}>
        <div
          className="pj-orb h-[28rem] w-[28rem] bg-cyan-300/25 dark:bg-cyan-500/10"
          style={{ animationDelay: '-24s' }}
        />
      </div>

      {/* Anneaux et formes géométriques flottantes */}
      <div className="pj-par hidden md:block" style={{ top: '9%', right: '8%' }}>
        <div className="pj-ring h-56 w-56" />
      </div>
      <div className="pj-par hidden md:block" style={{ top: '38%', left: '4%' }}>
        <div className="pj-square h-32 w-32" />
      </div>

      {/* Particules flottantes */}
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
}

export default memo(AmbientBackground);
