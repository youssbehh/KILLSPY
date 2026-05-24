// KILLSPY — shared tokens, primitives, and design-system reference card.
// Loaded BEFORE screens; exports everything to window so screen modules
// can reach it across their own Babel scopes.

// ─────────────────────────────────────────────────────────────
// Design tokens — Futur Urbain (default theme)
// ─────────────────────────────────────────────────────────────
const KS = {
  // surfaces
  bg:        '#1f242a',          // deepest — full-bleed page ground
  surface:   '#343a40',          // primary surface
  surfaceHi: '#3f464d',          // raised surface
  glass:     'rgba(52,58,64,0.62)', // glassmorphic card fill
  glassHi:   'rgba(63,70,77,0.78)',

  // ink
  ink:       '#ffffff',
  inkMute:   '#d3d3d3',
  inkDim:    'rgba(211,211,211,0.55)',
  inkFaint:  'rgba(211,211,211,0.25)',

  // action / state
  primary:   '#007bff',          // electric blue — CTA
  primaryGlow:'rgba(0,123,255,0.55)',
  alert:     '#ffc107',          // amber
  live:      '#39ff14',          // neon green — live state
  danger:    '#ff3b30',          // alarm red
  enemy:     '#ff6b35',          // enemy player highlight

  // structure
  hair:      'rgba(0,123,255,0.45)',   // 1px electric blue card stroke
  hairSoft:  'rgba(255,255,255,0.08)',
  divider:   'rgba(255,255,255,0.06)',

  // rank tier colors
  tier: {
    bronze:  '#cd7f32',
    silver:  '#c0c0c0',
    gold:    '#ffc107',
    diamond: '#7be0ff',
    phantom: '#ff3b30',
  },

  // type
  display:  '"Barlow Condensed", "Oswald", "Impact", sans-serif',
  ui:       '"Rajdhani", "Exo 2", system-ui, sans-serif',
  mono:     '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
};

// ─────────────────────────────────────────────────────────────
// Global styles — injects KS keyframes & font helpers once.
// ─────────────────────────────────────────────────────────────
(function () {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ks-styles')) return;
  const s = document.createElement('style');
  s.id = 'ks-styles';
  s.textContent = `
    @keyframes ks-radar-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes ks-radar-ping {
      0%   { transform: scale(0.2); opacity: 0.9; }
      80%  { opacity: 0; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    @keyframes ks-cta-glow {
      0%,100% { box-shadow: 0 0 0 0 ${KS.primaryGlow}, inset 0 0 22px rgba(255,255,255,0.18); }
      50%     { box-shadow: 0 0 32px 4px ${KS.primaryGlow}, inset 0 0 22px rgba(255,255,255,0.28); }
    }
    @keyframes ks-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0.25; } }
    @keyframes ks-shimmer {
      0%   { transform: translateX(-120%); }
      100% { transform: translateX(220%); }
    }
    @keyframes ks-stamp-in {
      0%   { transform: scale(2.2) rotate(-14deg); opacity: 0; }
      60%  { transform: scale(0.92) rotate(-7deg); opacity: 1; }
      100% { transform: scale(1) rotate(-6deg); opacity: 1; }
    }
    @keyframes ks-letter-in {
      0%   { transform: translateY(8px); opacity: 0; filter: blur(4px); }
      100% { transform: translateY(0); opacity: 1; filter: blur(0); }
    }
    .ks-display { font-family: ${KS.display}; font-weight: 800; letter-spacing: 0.04em; }
    .ks-ui      { font-family: ${KS.ui}; }
    .ks-mono    { font-family: ${KS.mono}; font-variant-numeric: tabular-nums; }
    .ks-num     { font-family: ${KS.mono}; font-variant-numeric: tabular-nums; font-weight: 700; }
  `;
  document.head.appendChild(s);
})();

// ─────────────────────────────────────────────────────────────
// Background — dossier dot grid + topographic rings + scanline
// ─────────────────────────────────────────────────────────────
function TopoBg({ children, style = {}, intensity = 1 }) {
  const a = 0.05 * intensity;
  return (
    <div style={{
      position: 'absolute', inset: 0, background: KS.bg, overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,${a}) 1px, transparent 1px)`,
        backgroundSize: '14px 14px',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle at 22% 18%, rgba(0,123,255,0.10), transparent 38%),
          radial-gradient(circle at 88% 92%, rgba(0,123,255,0.06), transparent 42%)`,
      }} />
      {/* faint topographic rings */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.05 }}>
        <defs>
          <pattern id="ks-topo" width="120" height="120" patternUnits="userSpaceOnUse">
            <circle cx="60" cy="60" r="20" fill="none" stroke="#fff" strokeWidth="0.6" />
            <circle cx="60" cy="60" r="40" fill="none" stroke="#fff" strokeWidth="0.6" />
            <circle cx="60" cy="60" r="58" fill="none" stroke="#fff" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ks-topo)" />
      </svg>
      {/* scanline */}
      <div data-ks-scanline="" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.18) 50%)',
        backgroundSize: '100% 3px', mixBlendMode: 'multiply', opacity: 0.5,
      }} />
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Chamfered container — dossier-stamped corner clip
// ─────────────────────────────────────────────────────────────
const chamfer = (n = 10, corners = 'tr-bl') => {
  // corners: 'tr-bl' (top-right + bottom-left), 'all', 'tl-br'
  const c = n + 'px';
  if (corners === 'all') {
    return `polygon(${c} 0, calc(100% - ${c}) 0, 100% ${c}, 100% calc(100% - ${c}), calc(100% - ${c}) 100%, ${c} 100%, 0 calc(100% - ${c}), 0 ${c})`;
  }
  if (corners === 'tl-br') {
    return `polygon(${c} 0, 100% 0, 100% calc(100% - ${c}), calc(100% - ${c}) 100%, 0 100%, 0 ${c})`;
  }
  return `polygon(0 0, calc(100% - ${c}) 0, 100% ${c}, 100% 100%, ${c} 100%, 0 calc(100% - ${c}))`;
};

function GlassCard({ children, style = {}, chamferSize = 10, corners = 'tr-bl', bordered = true, intensity = 'normal' }) {
  const bg = intensity === 'hi' ? KS.glassHi : KS.glass;
  return (
    <div style={{
      position: 'relative',
      clipPath: chamfer(chamferSize, corners),
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: bg,
        backdropFilter: 'blur(8px) saturate(140%)',
        WebkitBackdropFilter: 'blur(8px) saturate(140%)',
      }} />
      {bordered && (
        <div style={{
          position: 'absolute', inset: 0,
          clipPath: chamfer(chamferSize, corners),
          padding: 1,
          background: `linear-gradient(135deg, ${KS.hair}, rgba(0,123,255,0.05) 40%, ${KS.hair})`,
          WebkitMask: 'linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hex avatar — hexagonal clip + tier-colored border
// ─────────────────────────────────────────────────────────────
const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

function HexAvatar({ size = 56, tier = 'gold', src, initials = 'X', live = false }) {
  const tc = KS.tier[tier] || KS.tier.gold;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* outer tier ring */}
      <div style={{
        position: 'absolute', inset: 0, clipPath: HEX_CLIP,
        background: `linear-gradient(155deg, ${tc}, rgba(255,255,255,0.4) 35%, ${tc} 70%, rgba(0,0,0,0.5))`,
      }} />
      {/* inner cutout */}
      <div style={{
        position: 'absolute', inset: 3, clipPath: HEX_CLIP, background: KS.bg,
      }} />
      {/* photo */}
      <div style={{
        position: 'absolute', inset: 5, clipPath: HEX_CLIP,
        background: src
          ? `url(${src}) center/cover`
          : `linear-gradient(135deg, ${KS.surfaceHi}, ${KS.surface})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: KS.ink, fontFamily: KS.display, fontWeight: 800,
        fontSize: size * 0.42, letterSpacing: 0,
      }}>{!src && initials}</div>
      {/* live dot */}
      {live && (
        <div style={{
          position: 'absolute', right: -2, bottom: 4, width: 12, height: 12, borderRadius: '50%',
          background: KS.live, boxShadow: `0 0 8px ${KS.live}`, border: `2px solid ${KS.bg}`,
        }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Rank badge — stenciled hex with tier-numeral, 5 tiers
// ─────────────────────────────────────────────────────────────
const RANK_NAMES = ['RECRUIT', 'OPERATIVE', 'AGENT', 'SPECIALIST', 'PHANTOM'];
const RANK_TIERS = ['bronze', 'silver', 'gold', 'diamond', 'phantom'];
const RANK_GLYPHS = [
  // I, II, III chevrons / diamond / wing — simple stenciled marks
  'M11 5 L11 14 L9 14 L9 5 Z',
  'M8 5 L8 14 L6.5 14 L6.5 5 Z M13.5 5 L13.5 14 L12 14 L12 5 Z',
  'M5 5 L5 14 L3.5 14 L3.5 5 Z M10.75 5 L10.75 14 L9.25 14 L9.25 5 Z M16.5 5 L16.5 14 L15 14 L15 5 Z',
  'M10 3 L17 10 L10 17 L3 10 Z M10 6.5 L6.5 10 L10 13.5 L13.5 10 Z',
  'M10 2 L13 8 L19 9 L14.5 13.5 L16 19.5 L10 16.5 L4 19.5 L5.5 13.5 L1 9 L7 8 Z',
];

function RankBadge({ tier = 2, size = 28, showName = false }) {
  const t = Math.max(0, Math.min(4, tier));
  const color = KS.tier[RANK_TIERS[t]];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: size, height: size, position: 'relative',
        clipPath: HEX_CLIP, background: `linear-gradient(155deg, ${color}, rgba(0,0,0,0.5))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 1.5, clipPath: HEX_CLIP,
          background: KS.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 20 20" width={size * 0.62} height={size * 0.62} style={{ display: 'block' }}>
            <path d={RANK_GLYPHS[t]} fill={color} />
          </svg>
        </div>
      </div>
      {showName && (
        <span className="ks-display" style={{ color, fontSize: size * 0.5, letterSpacing: '0.12em' }}>
          {RANK_NAMES[t]}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KILLSPY wordmark — stenciled, with "classified" stamp option
// ─────────────────────────────────────────────────────────────
function Logo({ size = 48, stamp = false, animated = false, color = KS.ink }) {
  const letters = 'KILLSPY'.split('');
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 0,
      position: 'relative', padding: stamp ? '8px 14px' : 0,
      border: stamp ? `2px solid ${color}` : 'none',
      clipPath: stamp ? chamfer(6, 'tr-bl') : 'none',
    }}>
      {letters.map((L, i) => (
        <span key={i} className="ks-display" style={{
          fontSize: size, lineHeight: 0.92, color,
          letterSpacing: i === 3 ? '0.18em' : '0.04em', // gap between KILL · SPY
          animation: animated ? `ks-letter-in 220ms ${i * 60}ms both ease-out` : 'none',
          fontWeight: 800,
        }}>{L}</span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Buttons — primary / secondary / danger / icon
// ─────────────────────────────────────────────────────────────
function PrimaryButton({ children, sub, glow = true, full = true, size = 'lg', style = {}, onClick }) {
  const h = size === 'lg' ? 60 : 48;
  return (
    <button onClick={onClick} style={{
      position: 'relative', height: h, width: full ? '100%' : 'auto',
      padding: '0 28px', border: 'none', cursor: 'pointer',
      background: 'linear-gradient(180deg, #1e90ff 0%, #007bff 55%, #0062cc 100%)',
      color: KS.ink, borderRadius: h / 2,
      fontFamily: KS.display, fontWeight: 800, fontSize: size === 'lg' ? 22 : 18,
      letterSpacing: '0.14em', textTransform: 'uppercase', overflow: 'hidden',
      boxShadow: `0 0 0 1px rgba(255,255,255,0.16) inset, 0 6px 22px ${KS.primaryGlow}, 0 2px 0 rgba(0,0,0,0.3) inset`,
      animation: glow ? 'ks-cta-glow 2.4s ease-in-out infinite' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      ...style,
    }}>
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <span>{children}</span>
        {sub && <span className="ks-mono" style={{ fontSize: 10, opacity: 0.85, letterSpacing: '0.2em', marginTop: 3, fontWeight: 500 }}>{sub}</span>}
      </span>
      {/* shimmer sweep */}
      <span style={{
        position: 'absolute', top: 0, bottom: 0, width: '40%',
        background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.35), transparent)',
        animation: 'ks-shimmer 3.4s linear infinite', pointerEvents: 'none',
      }} />
    </button>
  );
}

function SecondaryButton({ children, sub, full = true, style = {}, onClick }) {
  return (
    <button onClick={onClick} style={{
      position: 'relative', height: 52, width: full ? '100%' : 'auto',
      padding: '0 22px', cursor: 'pointer',
      background: 'transparent', color: KS.alert,
      border: `1.5px solid ${KS.alert}`, borderRadius: 26,
      fontFamily: KS.display, fontWeight: 800, fontSize: 18,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexDirection: 'column',
      lineHeight: 1, ...style,
    }}>
      <span>{children}</span>
      {sub && <span className="ks-mono" style={{ fontSize: 9, opacity: 0.85, letterSpacing: '0.22em', fontWeight: 500, color: KS.alert }}>{sub}</span>}
    </button>
  );
}

function DangerButton({ children, full = true, style = {}, onClick }) {
  return (
    <button onClick={onClick} style={{
      height: 48, width: full ? '100%' : 'auto', padding: '0 22px',
      background: KS.danger, border: 'none', cursor: 'pointer',
      color: KS.ink, borderRadius: 24,
      fontFamily: KS.display, fontWeight: 800, fontSize: 17,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.18) inset, 0 4px 14px rgba(255,59,48,0.45)',
      ...style,
    }}>{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress bar — segmented, neon green fill on dark track
// ─────────────────────────────────────────────────────────────
function ProgressBar({ value = 0.5, segments = 24, height = 10, color = KS.live, label, sublabel }) {
  const filled = Math.round(segments * value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(label || sublabel) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: KS.mono, fontSize: 10, letterSpacing: '0.16em', color: KS.inkMute, textTransform: 'uppercase',
        }}>
          <span>{label}</span><span style={{ color: KS.ink }}>{sublabel}</span>
        </div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${segments}, 1fr)`,
        gap: 2, height, background: 'rgba(0,0,0,0.4)',
        padding: 2, borderRadius: 2, border: `1px solid ${KS.hairSoft}`,
      }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            background: i < filled
              ? `linear-gradient(180deg, ${color}, rgba(0,0,0,0.2))`
              : 'rgba(255,255,255,0.04)',
            boxShadow: i < filled ? `0 0 6px ${color}` : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Notification pill — neon dot + number
// ─────────────────────────────────────────────────────────────
function NotificationPill({ n }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: KS.surface, padding: '3px 8px 3px 6px', borderRadius: 12,
      fontFamily: KS.mono, fontSize: 11, color: KS.ink, fontWeight: 700,
      border: `1px solid ${KS.hairSoft}`,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: KS.live,
        boxShadow: `0 0 6px ${KS.live}`,
      }} />
      {n}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section label — "[ MISSION BRIEF ]" style header
// ─────────────────────────────────────────────────────────────
function SectionLabel({ children, color = KS.primary, style = {} }) {
  return (
    <div className="ks-mono" style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 10, letterSpacing: '0.32em', color,
      textTransform: 'uppercase', fontWeight: 700,
      ...style,
    }}>
      <span style={{ width: 14, height: 1, background: color }} />
      {children}
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom nav — Home / Modes / Shop / Profile
// ─────────────────────────────────────────────────────────────
const NAV_ICONS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  modes: 'M3 4h7v7H3zM14 4h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  shop: 'M4 7h16l-1.5 11a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8zM9 7V5a3 3 0 0 1 6 0v2',
  profile: 'M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-8 1.7-8 5v2h16v-2c0-3.3-4.7-5-8-5z',
};

function BottomNav({ active = 'home' }) {
  const items = [
    { id: 'home', label: 'HOME' },
    { id: 'modes', label: 'MODES' },
    { id: 'shop', label: 'SHOP', badge: 3 },
    { id: 'profile', label: 'AGENT' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      height: 92, paddingBottom: 28, paddingTop: 6,
      background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.9))',
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button key={it.id} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: on ? KS.primary : KS.inkDim, padding: '4px 0',
            position: 'relative',
          }}>
            <div style={{ position: 'relative' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={on ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d={NAV_ICONS[it.id]} fill={on ? 'currentColor' : 'none'} fillOpacity={on ? 0.18 : 0} />
              </svg>
              {it.badge && (
                <span style={{
                  position: 'absolute', top: -3, right: -8,
                  fontFamily: KS.mono, fontSize: 9, fontWeight: 700,
                  background: KS.live, color: '#000', borderRadius: 8, padding: '1px 4px',
                  boxShadow: `0 0 6px ${KS.live}`,
                }}>{it.badge}</span>
              )}
            </div>
            <span className="ks-display" style={{ fontSize: 10, letterSpacing: '0.22em' }}>{it.label}</span>
            {on && <span style={{
              position: 'absolute', bottom: 26, width: 22, height: 2,
              background: KS.primary, boxShadow: `0 0 8px ${KS.primary}`,
            }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Currency chip — small inline value w/ icon
// ─────────────────────────────────────────────────────────────
function Currency({ kind = 'coin', value }) {
  const cfg = kind === 'coin'
    ? { c: KS.alert, glyph: '◈' }
    : { c: KS.live, glyph: '✦' };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px 4px 8px',
      background: 'rgba(0,0,0,0.35)', border: `1px solid ${KS.hairSoft}`,
      clipPath: chamfer(6, 'tr-bl'),
    }}>
      <span style={{ color: cfg.c, fontSize: 14, lineHeight: 1, filter: `drop-shadow(0 0 4px ${cfg.c})` }}>{cfg.glyph}</span>
      <span className="ks-num" style={{ color: KS.ink, fontSize: 13 }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Player tag (preview chip) — name + rank + winrate
// ─────────────────────────────────────────────────────────────
function PlayerTag({ name, tier = 2, winRate, kd, avatarSrc, big = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <HexAvatar size={big ? 60 : 44} tier={RANK_TIERS[tier]} initials={name[0]} src={avatarSrc} live={big} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ks-display" style={{
            fontSize: big ? 22 : 18, color: KS.ink, letterSpacing: '0.05em',
          }}>{name}</span>
          <RankBadge tier={tier} size={big ? 22 : 18} />
        </div>
        <div className="ks-mono" style={{
          fontSize: 10, letterSpacing: '0.18em', color: KS.inkDim, textTransform: 'uppercase',
        }}>
          {winRate != null && <>WR {winRate}%</>}
          {winRate != null && kd != null && <span style={{ margin: '0 6px', color: KS.inkFaint }}>·</span>}
          {kd != null && <>K/D {kd}</>}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TOKENS REFERENCE CARD — design system at a glance
// (an artboard you can show on the canvas)
// ═════════════════════════════════════════════════════════════
function TokensCard() {
  const swatch = (name, val, dark = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        width: '100%', height: 38, background: val,
        clipPath: chamfer(4, 'tr-bl'),
        border: dark ? `1px solid ${KS.hairSoft}` : 'none',
      }} />
      <div className="ks-mono" style={{ fontSize: 9, color: KS.inkMute, letterSpacing: '0.08em' }}>{name}</div>
      <div className="ks-mono" style={{ fontSize: 9, color: KS.inkDim }}>{val}</div>
    </div>
  );

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: KS.bg, color: KS.ink, fontFamily: KS.ui,
      padding: '28px 24px', overflow: 'auto',
    }}>
      <TopoBg intensity={0.6} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Header */}
        <div>
          <SectionLabel>System / Futur Urbain</SectionLabel>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <Logo size={36} />
            <span className="ks-mono" style={{ color: KS.alert, fontSize: 10, letterSpacing: '0.24em' }}>
              · MIMIR // v1.0.26
            </span>
          </div>
          <div className="ks-mono" style={{ fontSize: 10, color: KS.inkDim, marginTop: 6, letterSpacing: '0.14em' }}>
            CLASSIFIED · INTERNAL · DESIGN SPEC
          </div>
        </div>

        {/* Colors */}
        <div>
          <SectionLabel color={KS.alert}>Palette · Base</SectionLabel>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {swatch('SURFACE', KS.surface)}
            {swatch('PRIMARY', KS.primary)}
            {swatch('ALERT', KS.alert)}
            {swatch('LIVE', KS.live)}
            {swatch('INK', KS.ink, true)}
            {swatch('INK MUTE', KS.inkMute)}
            {swatch('DANGER', KS.danger)}
            {swatch('ENEMY', KS.enemy)}
          </div>
        </div>

        {/* Type */}
        <div>
          <SectionLabel color={KS.live}>Typography</SectionLabel>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="ks-display" style={{ fontSize: 32, lineHeight: 1, color: KS.ink, letterSpacing: '0.06em' }}>
              KILLSPY / DISPLAY
              <div className="ks-mono" style={{ fontSize: 9, color: KS.inkDim, marginTop: 4, letterSpacing: '0.18em' }}>
                BARLOW CONDENSED 800 · UPPERCASE
              </div>
            </div>
            <div className="ks-ui" style={{ fontSize: 18, color: KS.ink, fontWeight: 600 }}>
              Rajdhani — UI body & interface
              <div className="ks-mono" style={{ fontSize: 9, color: KS.inkDim, marginTop: 2, letterSpacing: '0.18em' }}>
                RAJDHANI 400/500/600/700
              </div>
            </div>
            <div className="ks-mono" style={{ fontSize: 14, color: KS.live }}>
              0123.456.789 · TIMER 02:47
              <div style={{ fontSize: 9, color: KS.inkDim, marginTop: 2, letterSpacing: '0.18em' }}>
                JETBRAINS MONO · STATS / READOUTS
              </div>
            </div>
          </div>
        </div>

        {/* Ranks */}
        <div>
          <SectionLabel>Rank Tiers</SectionLabel>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, justifyItems: 'center' }}>
            {RANK_NAMES.map((n, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <RankBadge tier={i} size={36} />
                <div className="ks-display" style={{
                  fontSize: 9, color: KS.tier[RANK_TIERS[i]], letterSpacing: '0.18em',
                }}>{n}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Components */}
        <div>
          <SectionLabel color={KS.alert}>Components</SectionLabel>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PrimaryButton sub="TAP TO DEPLOY">DEPLOY</PrimaryButton>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <SecondaryButton>RANKED</SecondaryButton>
              <DangerButton>ABORT</DangerButton>
            </div>
            <GlassCard chamferSize={8} corners="all" style={{ padding: 12, height: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
                <PlayerTag name="GHOST_07" tier={3} winRate={62} kd={2.4} />
                <NotificationPill n={3} />
              </div>
            </GlassCard>
            <ProgressBar value={0.72} label="MISSION PROGRESS" sublabel="72%" />
          </div>
        </div>

        {/* Themes */}
        <div>
          <SectionLabel color={KS.live}>Secondary Themes</SectionLabel>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ThemeChip name="MYSTÈRE NOCTURNE" colors={['#000','#4a5a2d','#001f3f','#8b0000','#c0c0c0']} />
            <ThemeChip name="INFILTRATION NATURELLE" colors={['#228b22','#8b4513','#ff4500','#ffd700']} />
            <ThemeChip name="TECHNOLOGIE AVANCÉE" colors={['#000','#00ffff','#800080','#40e0d0']} />
            <ThemeChip name="ÉLÉGANCE CLASSIQUE" colors={['#001f3f','#800000','#ffd700','#cd7f32']} />
          </div>
        </div>

        {/* Spec footer */}
        <div className="ks-mono" style={{ fontSize: 9, color: KS.inkDim, letterSpacing: '0.18em', paddingTop: 6, borderTop: `1px solid ${KS.hairSoft}` }}>
          SAFE 16PX · TOUCH 48PX · NAV 64PX · CARD R12 · MODAL R20 · MOTION 150–200MS EASE-OUT
        </div>
      </div>
    </div>
  );
}

function ThemeChip({ name, colors }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', background: 'rgba(0,0,0,0.35)',
      clipPath: chamfer(6, 'tr-bl'), border: `1px solid ${KS.hairSoft}`,
    }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {colors.map((c, i) => (
          <div key={i} style={{ width: 14, height: 14, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
        ))}
      </div>
      <span className="ks-display" style={{ fontSize: 12, color: KS.ink, letterSpacing: '0.16em' }}>{name}</span>
    </div>
  );
}

// Export to window for cross-module sharing.
Object.assign(window, {
  KS, KS_RANK_NAMES: RANK_NAMES, KS_RANK_TIERS: RANK_TIERS, KS_HEX_CLIP: HEX_CLIP, KS_chamfer: chamfer,
  KSTopoBg: TopoBg, KSGlassCard: GlassCard, KSHexAvatar: HexAvatar, KSRankBadge: RankBadge,
  KSLogo: Logo, KSPrimaryButton: PrimaryButton, KSSecondaryButton: SecondaryButton, KSDangerButton: DangerButton,
  KSProgressBar: ProgressBar, KSNotificationPill: NotificationPill, KSSectionLabel: SectionLabel,
  KSBottomNav: BottomNav, KSCurrency: Currency, KSPlayerTag: PlayerTag, KSTokensCard: TokensCard,
});
