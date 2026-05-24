// KILLSPY — Screens, batch B: HUD, End-of-match (win + lose), Profile, Leaderboard

// ═════════════════════════════════════════════════════════════
// SCREEN 4 — In-Game HUD (turn-based · 3 cards · 5s resolution)
// 2 players, 3 lives each. Every 5s, players lock one of three
// actions (FIRE / RELOAD / SHIELD) and they resolve simultaneously.
// ═════════════════════════════════════════════════════════════

// ── Action card icons (stenciled, monochrome) ─────────────────
const KSActionIcons = {
  fire: (
    <svg viewBox="0 0 36 40" width="100%" height="100%" style={{ overflow: 'visible' }}>
      {/* bullet body */}
      <path d="M18 2 L26 12 L26 32 L10 32 L10 12 Z" fill="currentColor" />
      <rect x="13" y="32" width="10" height="4" fill="currentColor" />
      <rect x="14" y="36" width="8" height="2" fill="currentColor" opacity="0.6" />
      {/* highlight glint */}
      <path d="M15 8 L17 6 L17 18 L15 20 Z" fill="rgba(255,255,255,0.35)" />
    </svg>
  ),
  reload: (
    <svg viewBox="0 0 36 40" width="100%" height="100%">
      {/* circular arrow */}
      <path d="M18 6 A12 12 0 1 1 6 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      <path d="M18 2 L18 10 L24 6 Z" fill="currentColor" />
      {/* mini bullets stacked center */}
      <rect x="14" y="18" width="3" height="10" fill="currentColor" />
      <rect x="19" y="18" width="3" height="10" fill="currentColor" />
      <path d="M14 18 L15.5 15 L17 18 Z" fill="currentColor" />
      <path d="M19 18 L20.5 15 L22 18 Z" fill="currentColor" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 36 40" width="100%" height="100%">
      <path d="M18 3 L31 8 V20 C31 28.5 18 36 18 36 C18 36 5 28.5 5 20 V8 Z"
            fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {/* center cutout chevron */}
      <path d="M12 16 L18 22 L24 16 L18 28 Z" fill="rgba(0,0,0,0.6)" />
    </svg>
  ),
};

const KSActionMeta = {
  fire:   { label: 'FIRE',   sub: 'COST 1 AMMO' },
  reload: { label: 'RELOAD', sub: '+1 AMMO' },
  shield: { label: 'SHIELD', sub: 'BLOCK FIRE' },
};

// ── Action card — 96×128 chamfered amber tile ─────────────────
function KSActionCard({ kind, selected, onClick, faceDown, opp, disabled }) {
  const w = 96, h = 128;
  const cardClip = KS_chamfer(10, 'tr-bl');
  const meta = kind && KSActionMeta[kind];

  // colors
  const baseFill = opp
    ? 'linear-gradient(165deg, #c89205 0%, #8a6404 60%, #5a4202 100%)'
    : 'linear-gradient(165deg, #ffd84a 0%, #ffc107 55%, #c79504 100%)';
  const sel = selected;
  const dim = disabled && !selected;

  return (
    <button
      onClick={onClick}
      disabled={disabled || opp}
      style={{
        all: 'unset', width: w, height: h, position: 'relative', flexShrink: 0,
        cursor: disabled || opp ? 'default' : 'pointer',
        filter: dim ? 'grayscale(0.8) brightness(0.55)' : 'none',
      }}
    >
      {/* outer selection glow */}
      {sel && (
        <div style={{
          position: 'absolute', inset: -6, clipPath: KS_chamfer(14, 'tr-bl'),
          background: `linear-gradient(135deg, ${KS.primary}, ${KS.tier.diamond})`,
          filter: `drop-shadow(0 0 12px ${KS.primary})`,
          animation: 'ks-cta-glow 1.6s ease-in-out infinite',
        }} />
      )}
      {/* card body */}
      <div style={{
        position: 'absolute', inset: 0, clipPath: cardClip,
        background: baseFill,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -3px 0 rgba(0,0,0,0.25)',
      }}>
        {/* corner ticks on card */}
        <div style={{
          position: 'absolute', top: 4, left: 4, width: 8, height: 8,
          borderTop: '1.5px solid rgba(0,0,0,0.4)', borderLeft: '1.5px solid rgba(0,0,0,0.4)',
        }} />
        <div style={{
          position: 'absolute', bottom: 4, right: 4, width: 8, height: 8,
          borderBottom: '1.5px solid rgba(0,0,0,0.4)', borderRight: '1.5px solid rgba(0,0,0,0.4)',
        }} />

        {faceDown ? (
          // CLASSIFIED face-down treatment for opponent
          <>
            <div style={{
              position: 'absolute', inset: 8,
              backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.25) 0, rgba(0,0,0,0.25) 2px, transparent 2px, transparent 8px)`,
            }} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="ks-display" style={{
                fontSize: 44, color: 'rgba(0,0,0,0.6)', letterSpacing: '0.02em', textShadow: '0 1px 0 rgba(255,255,255,0.18)',
              }}>?</span>
            </div>
            <div style={{
              position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center',
              fontFamily: KS.mono, fontSize: 8, fontWeight: 700, color: 'rgba(0,0,0,0.55)', letterSpacing: '0.32em',
            }}>CLASSIFIED</div>
          </>
        ) : (
          <>
            {/* glyph */}
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              width: 44, height: 50, color: '#1a1a1a',
            }}>
              {KSActionIcons[kind]}
            </div>
            {/* label */}
            <div style={{
              position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center',
            }}>
              <div className="ks-display" style={{
                fontSize: 16, color: '#0a0a0a', letterSpacing: '0.14em', lineHeight: 1,
              }}>{meta.label}</div>
              <div className="ks-mono" style={{
                fontSize: 8, color: 'rgba(0,0,0,0.6)', letterSpacing: '0.16em', marginTop: 3, fontWeight: 700,
              }}>{meta.sub}</div>
            </div>
            {/* selected stamp */}
            {sel && (
              <div style={{
                position: 'absolute', top: -8, right: -6,
                padding: '2px 6px', background: KS.primary, color: '#fff',
                fontFamily: KS.mono, fontSize: 9, fontWeight: 800, letterSpacing: '0.16em',
                clipPath: KS_chamfer(3, 'tr-bl'),
                boxShadow: `0 0 10px ${KS.primary}`,
              }}>LOCKED</div>
            )}
            {disabled && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.35)', clipPath: cardClip,
              }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={KS.danger} strokeWidth="2.5">
                  <circle cx="16" cy="16" r="12" />
                  <line x1="8" y1="8" x2="24" y2="24" />
                </svg>
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
}

// ── Hex life pip ──────────────────────────────────────────────
function KSLives({ count, max = 3, color = KS.danger }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {Array.from({ length: max }).map((_, i) => {
        const alive = i < count;
        return (
          <div key={i} style={{
            width: 22, height: 22, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 0, clipPath: KS_HEX_CLIP,
              background: alive ? color : 'rgba(255,255,255,0.06)',
              boxShadow: alive ? `0 0 8px ${color}55` : 'none',
            }} />
            <div style={{
              position: 'absolute', inset: 2, clipPath: KS_HEX_CLIP,
              background: alive ? `linear-gradient(160deg, #ff6b6b, ${color})` : 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {alive ? (
                <svg width="11" height="10" viewBox="0 0 12 11" fill="#fff">
                  <path d="M6 10 C1 6.5 1.5 1.5 6 4 C10.5 1.5 11 6.5 6 10 Z" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 12 12" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" fill="none">
                  <line x1="2" y1="2" x2="10" y2="10" />
                  <line x1="10" y1="2" x2="2" y2="10" />
                </svg>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Ammo pip track ───────────────────────────────────────────
function KSAmmo({ count, max = 6, color = KS.alert }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span className="ks-mono" style={{ fontSize: 9, color: KS.inkDim, letterSpacing: '0.22em' }}>AMMO</span>
      <div style={{
        display: 'flex', gap: 3, padding: '4px 6px',
        background: 'rgba(0,0,0,0.4)', border: `1px solid ${KS.hairSoft}`,
        clipPath: KS_chamfer(4, 'tr-bl'),
      }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            width: 3, height: 14,
            background: i < count ? color : 'rgba(255,255,255,0.08)',
            boxShadow: i < count ? `0 0 4px ${color}` : 'none',
          }} />
        ))}
        <span className="ks-num" style={{
          marginLeft: 4, fontSize: 11, color: KS.ink, lineHeight: 1, alignSelf: 'center',
        }}>{count}/{max}</span>
      </div>
    </div>
  );
}

// ── Status chip (e.g. ⊘ EMPTY, ⚠ ARMED, ⌛ THINKING) ─────────
function KSStatus({ kind }) {
  const cfg = {
    empty:    { color: KS.danger, icon: '⊘', label: 'NO AMMO' },
    armed:    { color: KS.alert,  icon: '◉', label: 'ARMED' },
    thinking: { color: KS.inkDim, icon: '⌛', label: 'THINKING' },
    locked:   { color: KS.live,   icon: '✓', label: 'LOCKED' },
  }[kind] || { color: KS.inkDim, icon: '·', label: '—' };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 8px',
      background: 'rgba(0,0,0,0.45)', border: `1px solid ${cfg.color}`,
      clipPath: KS_chamfer(4, 'tr-bl'),
    }}>
      <span style={{ color: cfg.color, fontSize: 12, lineHeight: 1, filter: `drop-shadow(0 0 4px ${cfg.color})` }}>
        {cfg.icon}
      </span>
      <span className="ks-mono" style={{
        fontSize: 9, color: cfg.color, letterSpacing: '0.22em', fontWeight: 700,
      }}>{cfg.label}</span>
    </div>
  );
}

// ── Center countdown — hex ring + big mono number ─────────────
function KSCountdown({ value, max = 5 }) {
  const size = 132;
  const r = 60;
  const c = 2 * Math.PI * r;
  const offset = c - (value / max) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* outer ring background */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={value <= 2 ? KS.danger : value <= 3 ? KS.alert : KS.live}
          strokeWidth="3"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="square"
          style={{
            transition: 'stroke-dashoffset 800ms linear, stroke 300ms',
            filter: `drop-shadow(0 0 8px ${value <= 2 ? KS.danger : value <= 3 ? KS.alert : KS.live})`,
          }}
        />
      </svg>
      {/* tick marks around ring */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 - 90) * Math.PI / 180;
          const x1 = size / 2 + Math.cos(a) * (r + 8);
          const y1 = size / 2 + Math.sin(a) * (r + 8);
          const x2 = size / 2 + Math.cos(a) * (r + (i % 3 === 0 ? 14 : 11));
          const y2 = size / 2 + Math.sin(a) * (r + (i % 3 === 0 ? 14 : 11));
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(255,255,255,0.22)" strokeWidth={i % 3 === 0 ? 1.5 : 0.8} />;
        })}
      </svg>
      {/* inner hex */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 84, height: 84, clipPath: KS_HEX_CLIP,
        background: `linear-gradient(155deg, ${KS.surfaceHi}, ${KS.surface} 60%, #1a1f24)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6)',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 76, height: 76, clipPath: KS_HEX_CLIP,
        border: `1px solid ${value <= 2 ? KS.danger : KS.hair}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="ks-num" style={{
          fontSize: 46, color: KS.ink, lineHeight: 0.9,
          textShadow: `0 0 12px ${value <= 2 ? KS.danger : KS.primary}`,
          animation: value <= 2 ? 'ks-blink 0.5s infinite' : 'none',
        }}>{value}</span>
        <span className="ks-mono" style={{
          fontSize: 8, color: KS.inkDim, letterSpacing: '0.32em', marginTop: 2,
        }}>SEC</span>
      </div>
    </div>
  );
}

function HUDScreen() {
  // Demo state — first card pre-selected to show locked-in treatment.
  const [selected, setSelected] = React.useState('fire');
  const myAmmo = 4, oppAmmo = 0;
  const myLives = 2, oppLives = 3;
  const countdown = 3;
  const round = 7;

  // FIRE disabled when out of ammo.
  const canFire = myAmmo > 0;

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 0%, #232b33 0%, #181d23 50%, #0d1014 100%)',
    }}>
      <KSTopoBg intensity={0.45} style={{ background: 'transparent' }} />

      {/* TOP EYEBROW — round + LIVE indicator */}
      <div style={{
        position: 'absolute', top: 60, left: 16, right: 16, zIndex: 3,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div className="ks-mono" style={{
          fontSize: 10, color: KS.primary, letterSpacing: '0.32em',
        }}>// LIVE OPS · ROUND {String(round).padStart(2, '0')}</div>
        <div className="ks-mono" style={{
          fontSize: 9, color: KS.live, letterSpacing: '0.22em',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{
            width: 6, height: 6, background: KS.live, borderRadius: '50%',
            boxShadow: `0 0 6px ${KS.live}`, animation: 'ks-blink 1s infinite',
          }} />
          REC · 02:47
        </div>
      </div>

      {/* ──────────── OPPONENT ZONE ──────────── */}
      <div style={{
        position: 'absolute', top: 96, left: 0, right: 0, padding: '0 16px', zIndex: 2,
      }}>
        {/* opponent header strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
        }}>
          <KSHexAvatar size={36} tier="silver" initials="S" />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span className="ks-display" style={{
              fontSize: 14, color: KS.ink, letterSpacing: '0.08em', lineHeight: 1,
            }}>SHADOW_09</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <KSRankBadge tier={3} size={11} />
              <span className="ks-mono" style={{
                fontSize: 9, color: KS.enemy, letterSpacing: '0.2em', fontWeight: 700,
              }}>OPPONENT</span>
            </div>
          </div>
          <KSStatus kind="thinking" />
        </div>

        {/* opponent's face-down cards */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <KSActionCard faceDown opp />
          <KSActionCard faceDown opp />
          <KSActionCard faceDown opp />
        </div>

        {/* opponent's info row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 12,
        }}>
          <KSAmmo count={oppAmmo} max={6} color={KS.enemy} />
          <KSLives count={oppLives} />
          <KSStatus kind={oppAmmo === 0 ? 'empty' : 'armed'} />
        </div>
      </div>

      {/* ──────────── CENTER COUNTDOWN ──────────── */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <div className="ks-mono" style={{
          fontSize: 9, color: KS.inkDim, letterSpacing: '0.36em',
        }}>RESOLVING IN</div>
        <KSCountdown value={countdown} />
        <div className="ks-mono" style={{
          fontSize: 9, color: KS.alert, letterSpacing: '0.3em',
          animation: countdown <= 2 ? 'ks-blink 0.5s infinite' : 'none',
        }}>LOCK YOUR ACTION</div>
      </div>

      {/* ──────────── SELF ZONE ──────────── */}
      <div style={{
        position: 'absolute', bottom: 64, left: 0, right: 0, padding: '0 16px', zIndex: 2,
      }}>
        {/* self info row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <KSStatus kind={selected ? 'locked' : (canFire ? 'armed' : 'empty')} />
          <KSLives count={myLives} />
          <KSAmmo count={myAmmo} max={6} color={KS.primary} />
        </div>

        {/* self cards — face-up, tappable */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <KSActionCard
            kind="fire"
            selected={selected === 'fire'}
            onClick={() => canFire && setSelected('fire')}
            disabled={!canFire}
          />
          <KSActionCard
            kind="reload"
            selected={selected === 'reload'}
            onClick={() => setSelected('reload')}
          />
          <KSActionCard
            kind="shield"
            selected={selected === 'shield'}
            onClick={() => setSelected('shield')}
          />
        </div>

        {/* self header strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
        }}>
          <KSHexAvatar size={32} tier="gold" initials="K" live />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span className="ks-display" style={{
              fontSize: 13, color: KS.ink, letterSpacing: '0.08em', lineHeight: 1,
            }}>AGENT_KILO</span>
            <span className="ks-mono" style={{
              fontSize: 9, color: KS.primary, letterSpacing: '0.2em', marginTop: 3, fontWeight: 700,
            }}>YOU</span>
          </div>
          <button style={{
            all: 'unset', cursor: 'pointer',
            width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)', border: `1px solid ${KS.hairSoft}`,
            clipPath: KS_chamfer(5, 'tr-bl'),
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={KS.inkMute} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3 H14 V11 H8 L4 14 V11 H2 Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


// ═════════════════════════════════════════════════════════════
// SCREEN 5 — End of Match (variant: 'win' or 'lose')
// ═════════════════════════════════════════════════════════════
function EndMatchScreen({ variant = 'win' }) {
  const isWin = variant === 'win';
  const accent = isWin ? KS.alert : KS.danger;
  const stampText = isWin ? 'MISSION COMPLETE' : 'MISSION FAILED';
  const sub = isWin ? 'TARGET ELIMINATED · OBJECTIVE SECURED' : 'AGENT KIA · INTEL COMPROMISED';
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      background: isWin
        ? 'radial-gradient(ellipse at 50% 30%, #4a3a14 0%, #1f1a0a 50%, #0d0a05 100%)'
        : 'radial-gradient(ellipse at 50% 30%, #2a1414 0%, #1a0a0a 50%, #050202 100%)',
    }}>
      <KSTopoBg intensity={isWin ? 0.4 : 0.3} style={{ background: 'transparent' }} />

      {/* Confetti/spark layer for win */}
      {isWin && (
        <svg viewBox="0 0 400 600" preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.85 }}>
          {Array.from({ length: 50 }).map((_, i) => {
            const x = (i * 137.5) % 400;
            const y = (i * 71) % 600;
            const r = (i % 3) + 1;
            return <circle key={i} cx={x} cy={y} r={r} fill={i % 4 === 0 ? KS.alert : (i % 4 === 1 ? KS.live : '#fff')} opacity={0.4 + ((i * 7) % 10) / 20} />;
          })}
        </svg>
      )}

      {/* Glowing burst behind stamp */}
      <div style={{
        position: 'absolute', top: 92, left: '50%', transform: 'translateX(-50%)',
        width: 360, height: 360,
        background: `radial-gradient(circle, ${accent}55, transparent 60%)`,
        filter: 'blur(20px)',
      }} />
      {/* Burst lines */}
      <svg viewBox="0 0 360 360" style={{
        position: 'absolute', top: 92, left: '50%', marginLeft: -180, width: 360, height: 360, opacity: 0.4,
      }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * 360) / 16;
          const rad = (a * Math.PI) / 180;
          const x1 = 180 + Math.cos(rad) * 80;
          const y1 = 180 + Math.sin(rad) * 80;
          const x2 = 180 + Math.cos(rad) * 170;
          const y2 = 180 + Math.sin(rad) * 170;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="1.5" />;
        })}
      </svg>

      {/* Eyebrow */}
      <div style={{
        position: 'absolute', top: 76, left: 0, right: 0, textAlign: 'center',
      }}>
        <div className="ks-mono" style={{ fontSize: 10, color: accent, letterSpacing: '0.32em' }}>
          // DEBRIEF · {isWin ? 'OP NIGHTFALL' : 'OP NIGHTFALL · REDACTED'}
        </div>
      </div>

      {/* MISSION COMPLETE / FAILED stamp */}
      <div style={{
        position: 'absolute', top: 124, left: '50%', transform: 'translateX(-50%)', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block', padding: '10px 18px',
          border: `3px solid ${accent}`, clipPath: KS_chamfer(8, 'all'),
          transform: 'rotate(-5deg)',
          boxShadow: `0 0 30px ${accent}55, inset 0 0 16px ${accent}33`,
        }}>
          <div className="ks-display" style={{
            fontSize: 30, color: accent, letterSpacing: '0.1em', lineHeight: 0.95,
          }}>{stampText}</div>
        </div>
        <div className="ks-mono" style={{
          fontSize: 10, color: KS.inkMute, letterSpacing: '0.22em', marginTop: 16, textTransform: 'uppercase',
        }}>{sub}</div>
      </div>

      {/* Big result + XP */}
      <div style={{
        position: 'absolute', top: 280, left: 16, right: 16,
      }}>
        <KSGlassCard chamferSize={12} corners="tr-bl" style={{ height: 132 }} intensity="hi">
          <div style={{ position: 'absolute', inset: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="ks-display" style={{ fontSize: 16, color: KS.ink, letterSpacing: '0.18em' }}>
                XP EARNED
              </span>
              <span className="ks-num" style={{
                fontSize: 32, color: isWin ? KS.live : KS.inkMute,
                textShadow: isWin ? `0 0 16px ${KS.live}` : 'none', lineHeight: 1,
              }}>
                +{isWin ? '1,840' : '420'}
              </span>
            </div>
            <div>
              <div className="ks-mono" style={{
                fontSize: 10, color: KS.inkDim, letterSpacing: '0.18em', marginBottom: 4,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>RANK PROGRESS · AGENT III</span>
                <span style={{ color: isWin ? KS.live : KS.danger }}>{isWin ? '+28 RP' : '−15 RP'}</span>
              </div>
              <KSProgressBar value={isWin ? 0.74 : 0.46} segments={26} height={8} color={isWin ? KS.live : KS.alert} />
            </div>
          </div>
        </KSGlassCard>
      </div>

      {/* Performance stats */}
      <div style={{
        position: 'absolute', top: 432, left: 16, right: 16,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
      }}>
        <StatPod label="KILLS" value={isWin ? '8' : '3'} accent={KS.primary} />
        <StatPod label="DEATHS" value={isWin ? '2' : '7'} accent={KS.enemy} />
        <StatPod label="ACCURACY" value={isWin ? '64%' : '28%'} accent={KS.alert} />
        <StatPod label="MVP" value={isWin ? '★★★' : '★☆☆'} accent={KS.live} />
      </div>

      {/* CTAs */}
      <div style={{
        position: 'absolute', bottom: 56, left: 16, right: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <KSPrimaryButton glow={isWin} sub={isWin ? 'NEXT MISSION' : 'TRY AGAIN'}>
          {isWin ? 'CONTINUE' : 'REMATCH'}
        </KSPrimaryButton>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <KSSecondaryButton>REPLAY</KSSecondaryButton>
          <button style={{
            height: 52, background: 'transparent', color: KS.inkMute,
            border: `1.5px solid ${KS.hairSoft}`, borderRadius: 26, cursor: 'pointer',
            fontFamily: KS.display, fontSize: 18, letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>HOME</button>
        </div>
      </div>
    </div>
  );
}

function StatPod({ label, value, accent }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)', clipPath: KS_chamfer(6, 'tr-bl'),
      padding: '10px 8px', textAlign: 'center', borderTop: `2px solid ${accent}`,
    }}>
      <div className="ks-mono" style={{ fontSize: 9, color: KS.inkDim, letterSpacing: '0.22em' }}>{label}</div>
      <div className="ks-num" style={{ fontSize: 20, color: KS.ink, marginTop: 2, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 6 — Profile & Customization
// ═════════════════════════════════════════════════════════════
function ProfileScreen() {
  const skins = [
    { name: 'TUXEDO', rarity: 'common', unlocked: true, eq: true },
    { name: 'NIGHT OP', rarity: 'rare', unlocked: true, eq: false },
    { name: 'PROTOCOL', rarity: 'epic', unlocked: true, eq: false },
    { name: 'PHANTOM', rarity: 'legendary', unlocked: false, eq: false },
    { name: 'CIPHER', rarity: 'epic', unlocked: false, eq: false },
    { name: 'GHOST', rarity: 'legendary', unlocked: false, eq: false },
  ];
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: KS.bg }}>
      <KSTopoBg intensity={0.6} />

      {/* Eyebrow + actions */}
      <div style={{
        position: 'absolute', top: 64, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2,
      }}>
        <div>
          <div className="ks-mono" style={{ fontSize: 10, color: KS.primary, letterSpacing: '0.32em' }}>
            // AGENT FILE
          </div>
          <div className="ks-display" style={{ fontSize: 22, color: KS.ink, letterSpacing: '0.1em', marginTop: 2 }}>
            DOSSIER
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['⚙', '↗'].map((g, i) => (
            <div key={i} style={{
              width: 36, height: 36, background: 'rgba(0,0,0,0.4)',
              clipPath: KS_chamfer(6, 'tr-bl'), border: `1px solid ${KS.hairSoft}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: KS.inkMute, fontSize: 16,
            }}>{g}</div>
          ))}
        </div>
      </div>

      {/* Avatar showcase */}
      <div style={{
        position: 'absolute', top: 132, left: 16, right: 16,
      }}>
        <KSGlassCard chamferSize={14} corners="tr-bl" style={{ height: 188 }} intensity="hi">
          <div style={{ position: 'absolute', inset: 0 }}>
            {/* spotlight */}
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 200, height: '100%',
              background: `radial-gradient(ellipse at 50% 30%, ${KS.primaryGlow}, transparent 60%)`,
            }} />
            {/* avatar placeholder — large hex */}
            <div style={{
              position: 'absolute', top: 26, left: '50%', transform: 'translateX(-50%)',
            }}>
              <KSHexAvatar size={108} tier="gold" initials="K" />
            </div>
            {/* name + handle */}
            <div style={{
              position: 'absolute', bottom: 14, left: 16, right: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            }}>
              <div>
                <div className="ks-display" style={{ fontSize: 22, color: KS.ink, letterSpacing: '0.06em', lineHeight: 1 }}>
                  AGENT_KILO
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <KSRankBadge tier={2} size={16} />
                  <span className="ks-mono" style={{ fontSize: 10, color: KS.tier.gold, letterSpacing: '0.18em' }}>
                    AGENT · 1,847 RP
                  </span>
                </div>
              </div>
              <span className="ks-mono" style={{ fontSize: 10, color: KS.inkDim, letterSpacing: '0.2em' }}>
                LVL 47
              </span>
            </div>
            <CornerTicks color={KS.hair} />
          </div>
        </KSGlassCard>
      </div>

      {/* Stats strip */}
      <div style={{
        position: 'absolute', top: 332, left: 16, right: 16,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
      }}>
        <StatPod label="K/D" value="2.4" accent={KS.primary} />
        <StatPod label="WIN %" value="62" accent={KS.live} />
        <StatPod label="MATCH" value="284" accent={KS.alert} />
        <StatPod label="STREAK" value="7" accent={KS.tier.diamond} />
      </div>

      {/* Rank sparkline */}
      <div style={{
        position: 'absolute', top: 402, left: 16, right: 16,
      }}>
        <KSGlassCard chamferSize={10} corners="tr-bl" style={{ height: 64 }}>
          <div style={{ position: 'absolute', inset: 0, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div className="ks-mono" style={{ fontSize: 9, color: KS.inkDim, letterSpacing: '0.22em' }}>30 DAYS</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="ks-num" style={{ fontSize: 18, color: KS.ink }}>+312</span>
                <span className="ks-mono" style={{ fontSize: 9, color: KS.live, letterSpacing: '0.18em' }}>RP ↑</span>
              </div>
            </div>
            <svg viewBox="0 0 200 36" preserveAspectRatio="none" style={{ flex: 1, height: 36 }}>
              <defs>
                <linearGradient id="ks-spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={KS.live} stopOpacity="0.4" />
                  <stop offset="1" stopColor={KS.live} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 28 L20 24 L40 26 L60 18 L80 22 L100 14 L120 16 L140 8 L160 12 L180 6 L200 4 L200 36 L0 36 Z" fill="url(#ks-spark)" />
              <path d="M0 28 L20 24 L40 26 L60 18 L80 22 L100 14 L120 16 L140 8 L160 12 L180 6 L200 4" fill="none" stroke={KS.live} strokeWidth="1.5" />
            </svg>
          </div>
        </KSGlassCard>
      </div>

      {/* Skins grid */}
      <div style={{
        position: 'absolute', top: 484, left: 16, right: 16, bottom: 108,
      }}>
        <KSSectionLabel color={KS.alert}>Loadout · Skins · 3/12</KSSectionLabel>
        <div style={{
          marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          overflow: 'auto', maxHeight: 240,
        }}>
          {skins.map((s, i) => <SkinCard key={i} {...s} />)}
        </div>
      </div>

      <KSBottomNav active="profile" />
    </div>
  );
}

const RARITY_COLOR = {
  common: KS.inkMute,
  rare: KS.primary,
  epic: '#a040ff',
  legendary: KS.alert,
};

function SkinCard({ name, rarity, unlocked, eq }) {
  const c = RARITY_COLOR[rarity];
  return (
    <div style={{
      position: 'relative', height: 96,
      background: unlocked ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.55)',
      clipPath: KS_chamfer(6, 'tr-bl'),
      border: `1px solid ${eq ? KS.live : (unlocked ? c : KS.hairSoft)}`,
      padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      opacity: unlocked ? 1 : 0.65,
    }}>
      {/* placeholder avatar */}
      <div style={{
        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        width: 38, height: 42, clipPath: KS_HEX_CLIP,
        background: unlocked ? `linear-gradient(135deg, ${c}, ${KS.surface})` : KS.surface,
        filter: unlocked ? 'none' : 'grayscale(1) brightness(0.6)',
      }} />
      {!unlocked && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          fontSize: 20, color: KS.inkMute,
        }}>
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none" stroke={KS.inkMute} strokeWidth="1.6">
            <rect x="4" y="10" width="12" height="10" rx="1.5" />
            <path d="M7 10V7a3 3 0 016 0v3" />
          </svg>
        </div>
      )}
      <div style={{ marginTop: 'auto', textAlign: 'center' }}>
        <div className="ks-display" style={{ fontSize: 10, color: KS.ink, letterSpacing: '0.16em' }}>{name}</div>
        <div className="ks-mono" style={{
          fontSize: 8, color: c, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2,
        }}>{rarity}</div>
      </div>
      {eq && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          padding: '1px 5px', background: KS.live, color: '#000',
          fontFamily: KS.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
        }}>EQ</div>
      )}
    </div>
  );
}

// Use CornerTicks defined in screens-a (already on window)
const CornerTicks = window.KSCornerTicks;

// ═════════════════════════════════════════════════════════════
// SCREEN 7 — Leaderboard
// ═════════════════════════════════════════════════════════════
function LeaderboardScreen() {
  const top3 = [
    { rank: 2, name: 'SHADOW_09', score: '13,842', tier: 'silver', tierIdx: 4 },
    { rank: 1, name: 'V.NOIR',   score: '14,210', tier: 'gold',   tierIdx: 4 },
    { rank: 3, name: 'PROTOCOL', score: '13,118', tier: 'bronze', tierIdx: 3 },
  ];
  const list = [
    { rank: 4,  name: 'CIPHER_K',   score: '12,902', delta: '+2', tierIdx: 3 },
    { rank: 5,  name: 'NULL_BYTE',  score: '12,710', delta: '−1', tierIdx: 3 },
    { rank: 6,  name: 'ARGENT',     score: '12,480', delta: '+4', tierIdx: 3 },
    { rank: 7,  name: 'GHOST_07',   score: '12,212', delta: '0',  tierIdx: 3 },
    { rank: 8,  name: 'NIGHTHAWK',  score: '11,994', delta: '−2', tierIdx: 2 },
    { rank: 9,  name: 'MIST_24',    score: '11,650', delta: '+1', tierIdx: 2 },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: KS.bg }}>
      <KSTopoBg intensity={0.7} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 64, left: 16, right: 16, zIndex: 2 }}>
        <div className="ks-mono" style={{ fontSize: 10, color: KS.primary, letterSpacing: '0.32em' }}>
          // INTEL · WEEK 12
        </div>
        <div className="ks-display" style={{ fontSize: 30, color: KS.ink, letterSpacing: '0.08em', marginTop: 2 }}>
          LEADERBOARD
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
          {[{ k: 'GLOBAL', on: true }, { k: 'FRIENDS', on: false }, { k: 'WEEKLY', on: false }].map((t) => (
            <div key={t.k} style={{
              padding: '6px 12px',
              background: t.on ? KS.primary : 'rgba(0,0,0,0.35)',
              clipPath: KS_chamfer(4, 'tr-bl'),
              border: `1px solid ${t.on ? KS.primary : KS.hairSoft}`,
              fontFamily: KS.display, fontSize: 12, color: t.on ? '#000' : KS.inkMute,
              letterSpacing: '0.16em', fontWeight: 800,
              boxShadow: t.on ? `0 0 12px ${KS.primaryGlow}` : 'none',
            }}>{t.k}</div>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div style={{
        position: 'absolute', top: 178, left: 16, right: 16, height: 200,
      }}>
        <div style={{
          position: 'relative', height: '100%',
          display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', alignItems: 'flex-end', gap: 6,
        }}>
          {top3.map((p) => <PodiumCol key={p.rank} {...p} />)}
        </div>
      </div>

      {/* List */}
      <div style={{
        position: 'absolute', top: 396, left: 16, right: 16, bottom: 152,
        overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {list.map((r) => <LeaderRow key={r.rank} {...r} />)}
      </div>

      {/* Pinned own rank */}
      <div style={{
        position: 'absolute', bottom: 100, left: 16, right: 16,
      }}>
        <div className="ks-mono" style={{
          fontSize: 9, color: KS.inkDim, letterSpacing: '0.22em', marginBottom: 4,
        }}>// YOUR POSITION</div>
        <LeaderRow rank={147} name="AGENT_KILO" score="8,420" delta="+12" tierIdx={2} self />
      </div>

      <KSBottomNav active="profile" />
    </div>
  );
}

function PodiumCol({ rank, name, score, tier, tierIdx }) {
  const h = rank === 1 ? '100%' : rank === 2 ? '78%' : '64%';
  const color = KS.tier[tier];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
      {/* avatar */}
      <KSHexAvatar size={rank === 1 ? 56 : 44} tier={tier} initials={name[0]} live={rank === 1} />
      <div className="ks-display" style={{
        fontSize: rank === 1 ? 14 : 12, color: KS.ink, marginTop: 6, letterSpacing: '0.08em',
      }}>{name}</div>
      <div className="ks-num" style={{
        fontSize: 14, color, marginTop: 2,
        textShadow: rank === 1 ? `0 0 10px ${color}` : 'none',
      }}>{score}</div>
      {/* pedestal */}
      <div style={{
        marginTop: 8, width: '100%', height: h,
        background: `linear-gradient(180deg, ${color}55, ${color}10)`,
        clipPath: KS_chamfer(8, 'tr-bl'),
        border: `1px solid ${color}`,
        position: 'relative',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
      }}>
        <span className="ks-display" style={{
          fontSize: rank === 1 ? 40 : 30, color,
          textShadow: `0 0 12px ${color}`, letterSpacing: '0.06em', lineHeight: 1,
        }}>#{rank}</span>
        {rank === 1 && (
          <svg width="20" height="14" viewBox="0 0 20 14" style={{ position: 'absolute', top: -12, left: '50%', marginLeft: -10 }}>
            <path d="M1 13 L1 4 L6 8 L10 1 L14 8 L19 4 L19 13 Z" fill={color} />
          </svg>
        )}
      </div>
    </div>
  );
}

function LeaderRow({ rank, name, score, delta, tierIdx, self }) {
  const deltaColor = delta && delta.startsWith('+') ? KS.live : delta && delta.startsWith('−') ? KS.danger : KS.inkDim;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px',
      background: self ? `rgba(0,123,255,0.18)` : 'rgba(0,0,0,0.35)',
      clipPath: KS_chamfer(6, 'tr-bl'),
      border: self ? `1px solid ${KS.primary}` : `1px solid ${KS.hairSoft}`,
    }}>
      <div className="ks-num" style={{
        width: 36, color: self ? KS.primary : KS.inkMute,
        fontSize: 14, letterSpacing: '0.04em',
      }}>#{rank}</div>
      <KSHexAvatar size={28} tier={KS_RANK_TIERS[tierIdx]} initials={name[0]} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span className="ks-display" style={{
          fontSize: 13, color: KS.ink, letterSpacing: '0.08em', lineHeight: 1,
        }}>{name}</span>
        <span className="ks-mono" style={{ fontSize: 9, color: KS.inkDim, letterSpacing: '0.18em' }}>
          {KS_RANK_NAMES[tierIdx]}
        </span>
      </div>
      <span className="ks-num" style={{ color: KS.ink, fontSize: 13 }}>{score}</span>
      <span className="ks-mono" style={{
        color: deltaColor, fontSize: 10, fontWeight: 700, minWidth: 26, textAlign: 'right',
      }}>{delta}</span>
    </div>
  );
}

Object.assign(window, { HUDScreen, EndMatchScreen, ProfileScreen, LeaderboardScreen, ShopScreen });

// ═════════════════════════════════════════════════════════════
// SCREEN 8 — Shop / Daily Drop (Black Market)
// Daily-rotating storefront w/ rarity tiers & dual currency.
// ═════════════════════════════════════════════════════════════

// Shared placeholder graphic for shop items — abstracted spy silhouette,
// weapon, or emote glyph. Rendered in the rarity color so each card reads
// distinct without art.
const KSItemPlaceholders = {
  agent: (color) => (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="ks-shop-agent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.95"/>
          <stop offset="1" stopColor={color} stopOpacity="0.4"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="30" r="15" fill="url(#ks-shop-agent)" />
      <path d="M16 96 C18 66 34 56 50 56 C66 56 82 66 84 96 Z" fill="url(#ks-shop-agent)" />
      <rect x="36" y="25" width="28" height="7" rx="3.5" fill="rgba(0,0,0,0.85)" />
      <rect x="42" y="46" width="16" height="3" fill={color} opacity="0.6" />
    </svg>
  ),
  weapon: (color) => (
    <svg viewBox="0 0 100 60" width="100%" height="100%" style={{ overflow: 'visible' }}>
      {/* stylized pistol silhouette */}
      <path d="M10 22 L60 22 L70 18 L88 18 L88 28 L70 28 L66 36 L50 36 L50 46 L40 46 L36 38 L20 38 L20 32 L10 32 Z" fill={color} opacity="0.95" />
      <circle cx="34" cy="33" r="3" fill={color === '#000' ? '#fff' : '#000'} opacity="0.4" />
      <rect x="74" y="22" width="6" height="2" fill="rgba(0,0,0,0.4)" />
    </svg>
  ),
  emote: (color) => (
    <svg viewBox="0 0 80 80" width="100%" height="100%">
      <circle cx="40" cy="40" r="28" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="32" cy="34" r="3" fill={color} />
      <circle cx="48" cy="34" r="3" fill={color} />
      <path d="M28 48 Q40 56 52 48" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  bundle: (color) => (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {/* stacked dossier folders */}
      <rect x="14" y="34" width="60" height="50" fill={color} opacity="0.5" />
      <rect x="20" y="40" width="60" height="50" fill={color} opacity="0.75" />
      <rect x="26" y="46" width="60" height="50" fill={color} />
      <rect x="26" y="46" width="20" height="6" fill="rgba(0,0,0,0.5)" />
      <text x="56" y="80" textAnchor="middle" fontFamily={KS.display} fontWeight="800"
        fontSize="22" fill="rgba(0,0,0,0.55)" letterSpacing="0.06em">×3</text>
    </svg>
  ),
  crate: (color) => (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <path d="M50 8 L88 24 L88 70 L50 90 L12 70 L12 24 Z" fill={color} opacity="0.7" stroke={color} strokeWidth="2" />
      <path d="M50 8 L88 24 L50 40 L12 24 Z" fill={color} />
      <path d="M50 40 L50 90" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
      <rect x="42" y="48" width="16" height="12" fill="rgba(0,0,0,0.5)" />
      <circle cx="50" cy="54" r="3" fill={color} />
    </svg>
  ),
};

// Shop item card — rarity ring, placeholder graphic, name, price/sale.
function KSShopCard({
  kind, name, rarity, currency = 'coin', price, oldPrice, salePct, owned, soldOut, featured,
}) {
  const c = RARITY_COLOR[rarity];
  const Graphic = KSItemPlaceholders[kind] || KSItemPlaceholders.agent;
  const curGlyph = currency === 'coin' ? '◈' : '✦';
  const curColor = currency === 'coin' ? KS.alert : KS.live;

  return (
    <div style={{
      position: 'relative', height: featured ? 168 : 200,
      background: 'rgba(0,0,0,0.5)',
      clipPath: KS_chamfer(10, 'tr-bl'),
      border: `1px solid ${c}`,
      overflow: 'hidden',
      display: 'flex', flexDirection: featured ? 'row' : 'column',
    }}>
      {/* rarity glow bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 25%, ${c}22, transparent 65%)`,
      }} />
      {/* rarity stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c,
        boxShadow: `0 0 12px ${c}`,
      }} />

      {/* Sale stamp */}
      {salePct && (
        <div style={{
          position: 'absolute', top: 8, right: -4,
          padding: '3px 10px 3px 8px',
          background: KS.live, color: '#000',
          fontFamily: KS.mono, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
          boxShadow: `0 0 10px ${KS.live}`, zIndex: 2,
        }}>−{salePct}%</div>
      )}

      {/* Featured stamp */}
      {featured && !salePct && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          padding: '3px 8px',
          background: KS.alert, color: '#000',
          fontFamily: KS.mono, fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
          clipPath: KS_chamfer(3, 'tr-bl'), zIndex: 2,
        }}>★ FEATURED</div>
      )}

      {/* Owned overlay */}
      {(owned || soldOut) && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          background: 'rgba(8,12,16,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(2px)',
        }}>
          <div className="ks-display" style={{
            fontSize: 22, color: owned ? KS.live : KS.danger,
            letterSpacing: '0.18em', padding: '4px 14px',
            border: `2px solid ${owned ? KS.live : KS.danger}`,
            clipPath: KS_chamfer(4, 'all'),
            transform: 'rotate(-8deg)',
            textShadow: `0 0 12px ${owned ? KS.live : KS.danger}66`,
          }}>{owned ? '✓ OWNED' : 'SOLD OUT'}</div>
        </div>
      )}

      {/* Graphic */}
      <div style={{
        position: 'relative', zIndex: 1,
        flex: featured ? '0 0 44%' : '1 1 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: featured ? '14px 8px 14px 14px' : '18px 14px 4px',
      }}>
        <div style={{ width: featured ? '100%' : 86, height: featured ? '100%' : 86 }}>
          <Graphic color={c} />
        </div>
      </div>

      {/* Info */}
      <div style={{
        position: 'relative', zIndex: 1, flex: 1,
        padding: featured ? '14px 14px 14px 0' : '0 12px 12px',
        display: 'flex', flexDirection: 'column', justifyContent: featured ? 'space-between' : 'flex-end', gap: 6,
      }}>
        <div>
          <div className="ks-mono" style={{
            fontSize: 9, color: c, letterSpacing: '0.24em', fontWeight: 700, textTransform: 'uppercase',
          }}>{rarity}</div>
          <div className="ks-display" style={{
            fontSize: featured ? 22 : 14, color: KS.ink, letterSpacing: '0.06em', lineHeight: 1.05,
            marginTop: 2,
          }}>{name}</div>
          {featured && (
            <div className="ks-mono" style={{
              fontSize: 9, color: KS.inkDim, letterSpacing: '0.14em', marginTop: 6, lineHeight: 1.4,
            }}>LEGENDARY SKIN · INCLUDES MASK + WEAPON SKIN + SIGNATURE EMOTE</div>
          )}
        </div>

        {/* Price */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 6,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {oldPrice && (
              <span className="ks-mono" style={{
                fontSize: 9, color: KS.inkDim, textDecoration: 'line-through', letterSpacing: '0.1em',
              }}>{oldPrice}</span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                color: curColor, fontSize: 14, lineHeight: 1,
                filter: `drop-shadow(0 0 4px ${curColor})`,
              }}>{curGlyph}</span>
              <span className="ks-num" style={{
                fontSize: featured ? 18 : 14, color: KS.ink, fontWeight: 700, lineHeight: 1,
              }}>{price}</span>
            </div>
          </div>
          <button style={{
            all: 'unset', cursor: 'pointer',
            padding: featured ? '8px 14px' : '5px 10px',
            background: c, color: '#0a0a0a',
            fontFamily: KS.display, fontSize: featured ? 13 : 11, fontWeight: 800,
            letterSpacing: '0.16em',
            clipPath: KS_chamfer(4, 'tr-bl'),
            boxShadow: `0 0 10px ${c}88`,
          }}>BUY ›</button>
        </div>
      </div>
    </div>
  );
}

function ShopScreen() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: KS.bg }}>
      <KSTopoBg intensity={0.55} />

      {/* HEADER */}
      <div style={{ position: 'absolute', top: 60, left: 16, right: 16, zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="ks-mono" style={{ fontSize: 10, color: KS.primary, letterSpacing: '0.32em' }}>
              // MARCHÉ NOIR
            </div>
            <div className="ks-display" style={{
              fontSize: 28, color: KS.ink, letterSpacing: '0.08em', marginTop: 2, lineHeight: 1,
            }}>BLACK MARKET</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
            <KSCurrency kind="coin" value="2,480" />
            <KSCurrency kind="gem" value="124" />
          </div>
        </div>

        {/* Daily-reset banner */}
        <div style={{
          marginTop: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 12px',
          background: 'rgba(0,0,0,0.45)',
          clipPath: KS_chamfer(6, 'tr-bl'),
          border: `1px solid ${KS.hairSoft}`,
          borderLeft: `2px solid ${KS.alert}`,
        }}>
          <div className="ks-mono" style={{
            fontSize: 10, color: KS.inkMute, letterSpacing: '0.22em',
          }}>
            <span style={{ color: KS.alert }}>DAILY DROP</span> · ROTATES IN
          </div>
          <div className="ks-num" style={{
            fontSize: 14, color: KS.live, letterSpacing: '0.06em',
            textShadow: `0 0 6px ${KS.live}55`,
          }}>14:22:01</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        position: 'absolute', top: 178, left: 16, right: 16, zIndex: 2,
        display: 'flex', gap: 4,
      }}>
        {[
          { k: 'FEATURED', on: true },
          { k: 'SKINS', on: false },
          { k: 'WEAPONS', on: false },
          { k: 'BUNDLES', on: false },
        ].map((t) => (
          <div key={t.k} style={{
            padding: '6px 10px',
            background: t.on ? KS.primary : 'rgba(0,0,0,0.35)',
            clipPath: KS_chamfer(4, 'tr-bl'),
            border: `1px solid ${t.on ? KS.primary : KS.hairSoft}`,
            fontFamily: KS.display, fontSize: 11, color: t.on ? '#000' : KS.inkMute,
            letterSpacing: '0.16em', fontWeight: 800,
            boxShadow: t.on ? `0 0 10px ${KS.primaryGlow}` : 'none',
          }}>{t.k}</div>
        ))}
      </div>

      {/* SCROLL BODY */}
      <div style={{
        position: 'absolute', top: 220, left: 16, right: 16, bottom: 104,
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Featured deal */}
        <KSShopCard
          featured
          kind="agent"
          name="GOLDEN PHANTOM"
          rarity="legendary"
          currency="gem"
          price="120"
          oldPrice="180 ✦"
          salePct={33}
        />

        {/* Section header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 }}>
          <KSSectionLabel color={KS.alert}>Today's Lineup · 6 items</KSSectionLabel>
          <span className="ks-mono" style={{ fontSize: 9, color: KS.inkDim, letterSpacing: '0.18em' }}>
            VIEW ALL ›
          </span>
        </div>

        {/* 2-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <KSShopCard kind="agent"  name="NIGHT OP"        rarity="rare"      currency="coin" price="850" />
          <KSShopCard kind="weapon" name="MK7 SUPPRESSOR"  rarity="epic"      currency="coin" price="1,400" salePct={20} oldPrice="1,750" />
          <KSShopCard kind="crate"  name="CIPHER CRATE"    rarity="epic"      currency="gem"  price="45" />
          <KSShopCard kind="agent"  name="PROTOCOL MK II"  rarity="rare"      currency="coin" price="900" owned />
          <KSShopCard kind="emote"  name="DEAD DROP"       rarity="common"    currency="coin" price="200" />
          <KSShopCard kind="bundle" name="AGENT STARTER"   rarity="legendary" currency="gem"  price="240" soldOut />
        </div>

        {/* Footer mono note */}
        <div className="ks-mono" style={{
          textAlign: 'center', padding: '14px 0 4px',
          fontSize: 9, color: KS.inkDim, letterSpacing: '0.24em',
        }}>
          // ALL TRANSACTIONS LOGGED · MIMIR LEDGER
        </div>
      </div>

      <KSBottomNav active="shop" />
    </div>
  );
}

