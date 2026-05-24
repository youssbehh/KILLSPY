// KILLSPY — Screens, batch A: Splash, Home, Matchmaking
// Reads tokens & primitives from window (KS, KSGlassCard, etc.)

// ─────────────────────────────────────────────────────────────
// Helper — corner crosshair tick (HUD chrome)
// ─────────────────────────────────────────────────────────────
function CornerTicks({ inset = 8, color = 'rgba(255,255,255,0.18)', len = 14 }) {
  const corner = (a, b) => ({
    position: 'absolute', [a[0]]: inset, [a[1]]: inset,
    width: len, height: len,
    borderTop: a[0] === 'top' ? `1.5px solid ${color}` : 'none',
    borderBottom: a[0] === 'bottom' ? `1.5px solid ${color}` : 'none',
    borderLeft: a[1] === 'left' ? `1.5px solid ${color}` : 'none',
    borderRight: a[1] === 'right' ? `1.5px solid ${color}` : 'none',
  });
  return (
    <>
      <div style={corner(['top', 'left'])} />
      <div style={corner(['top', 'right'])} />
      <div style={corner(['bottom', 'left'])} />
      <div style={corner(['bottom', 'right'])} />
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 1 — Splash / Loading
// ═════════════════════════════════════════════════════════════
function SplashScreen() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: KS.bg }}>
      <KSTopoBg intensity={1.2} />

      {/* Subtle radar sweep behind the logo */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 520, height: 520, marginLeft: -260, marginTop: -310,
        animation: 'ks-radar-sweep 6s linear infinite',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', width: 1, height: '50%',
          background: `linear-gradient(180deg, transparent, ${KS.primaryGlow})`,
          transformOrigin: 'bottom center',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          width: 260, height: 260,
          background: `conic-gradient(from 0deg, rgba(0,123,255,0.25), transparent 60deg)`,
          transformOrigin: '0 100%', transform: 'translateX(-260px)',
        }} />
      </div>

      {/* Concentric range rings */}
      <svg viewBox="0 0 400 400" style={{ position: 'absolute', top: 180, left: '50%', marginLeft: -200, width: 400, height: 400, opacity: 0.18 }}>
        <circle cx="200" cy="200" r="60" fill="none" stroke={KS.primary} strokeWidth="1" />
        <circle cx="200" cy="200" r="100" fill="none" stroke={KS.primary} strokeWidth="1" strokeDasharray="3 4" />
        <circle cx="200" cy="200" r="150" fill="none" stroke={KS.primary} strokeWidth="0.7" />
        <line x1="200" y1="0" x2="200" y2="400" stroke={KS.primary} strokeWidth="0.5" strokeDasharray="2 4" />
        <line x1="0" y1="200" x2="400" y2="200" stroke={KS.primary} strokeWidth="0.5" strokeDasharray="2 4" />
      </svg>

      {/* Top header — mission card classified header */}
      <div style={{
        position: 'absolute', top: 70, left: 24, right: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: KS.mono, fontSize: 10, letterSpacing: '0.28em', color: KS.inkMute,
      }}>
        <span>DOSSIER · B-2747</span>
        <span style={{ color: KS.alert, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, background: KS.alert, borderRadius: '50%', animation: 'ks-blink 1.2s infinite' }} />
          CLEARANCE 4
        </span>
      </div>

      {/* Logo block, vertically centered upper-middle */}
      <div style={{
        position: 'absolute', top: '38%', left: 0, right: 0,
        transform: 'translateY(-50%)', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: KS.mono, fontSize: 10, letterSpacing: '0.4em', color: KS.primary,
          marginBottom: 14, opacity: 0.85,
        }}>// MIMIR STUDIO PRESENTS</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          <KSLogo size={84} animated />
        </div>
        <div style={{
          fontFamily: KS.mono, fontSize: 11, letterSpacing: '0.32em', color: KS.inkMute,
          marginTop: 14,
        }}>
          [ <span style={{ color: KS.alert }}>CLASSIFIED</span> · INTEL ]
        </div>
        {/* Stamp */}
        <div style={{
          display: 'inline-block', marginTop: 18,
          padding: '6px 14px', border: `2px solid ${KS.alert}`,
          clipPath: KS_chamfer(6, 'all'),
          transform: 'rotate(-6deg)',
          animation: 'ks-stamp-in 700ms 600ms both cubic-bezier(.18,.9,.3,1.1)',
        }}>
          <span className="ks-display" style={{
            fontSize: 18, color: KS.alert, letterSpacing: '0.18em',
          }}>TOP SECRET</span>
        </div>
      </div>

      {/* Loading area */}
      <div style={{
        position: 'absolute', left: 24, right: 24, bottom: 96,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: 10,
          fontFamily: KS.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          <span style={{ color: KS.inkMute }}>// LOADING MISSION ASSETS</span>
          <span style={{ color: KS.live }}>67%</span>
        </div>
        <KSProgressBar value={0.67} segments={28} height={8} />
        <div style={{
          fontFamily: KS.mono, fontSize: 10, color: KS.inkDim, marginTop: 10, letterSpacing: '0.14em',
        }}>
          <span style={{ color: KS.live }}>✓</span> SECURE CHANNEL ESTABLISHED &nbsp;·&nbsp;
          <span style={{ color: KS.live }}>✓</span> AGENT VERIFIED &nbsp;·&nbsp;
          <span style={{ color: KS.alert, animation: 'ks-blink 1s infinite' }}>›</span> DECRYPTING MAP
        </div>
      </div>

      {/* Footer build info */}
      <div style={{
        position: 'absolute', bottom: 44, left: 0, right: 0, textAlign: 'center',
        fontFamily: KS.mono, fontSize: 9, color: KS.inkDim, letterSpacing: '0.28em',
      }}>
        MIMIR STUDIO · v1.0.26 · BUILD 0524
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 2 — Home / Lobby
// ═════════════════════════════════════════════════════════════
function HomeScreen() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: KS.bg }}>
      <KSTopoBg intensity={0.7} />

      {/* Top header — avatar + currencies */}
      <div style={{
        position: 'absolute', top: 60, left: 16, right: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <KSHexAvatar size={48} tier="gold" initials="K" live />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div className="ks-display" style={{ fontSize: 16, color: KS.ink, letterSpacing: '0.06em', lineHeight: 1 }}>
              AGENT_KILO
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <KSRankBadge tier={2} size={14} />
              <span className="ks-mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: KS.tier.gold, fontWeight: 700 }}>
                AGENT · 1,847
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <KSCurrency kind="coin" value="2,480" />
          <KSCurrency kind="gem" value="124" />
          <div style={{
            position: 'relative', width: 36, height: 36, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)', border: `1px solid ${KS.hairSoft}`,
            clipPath: KS_chamfer(6, 'tr-bl'),
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={KS.ink} strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 8a6 6 0 0112 0v5l1.5 3h-15L6 13z" />
              <path d="M10 19a2 2 0 004 0" />
            </svg>
            <span style={{
              position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%',
              background: KS.live, color: '#000', fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: KS.mono, boxShadow: `0 0 6px ${KS.live}`,
            }}>2</span>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{
        position: 'absolute', top: 124, left: 0, right: 0, bottom: 92,
        padding: '0 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Season hero card */}
        <div style={{ marginTop: 4 }}>
          <KSSectionLabel>Season 02 · Operation Nightfall</KSSectionLabel>
        </div>

        {/* Quick Play — dominant CTA */}
        <div style={{ position: 'relative' }}>
          <KSGlassCard chamferSize={14} corners="tr-bl" style={{ height: 168 }}>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', padding: '16px 18px',
            }}>
              <CornerTicks color="rgba(0,123,255,0.5)" />
              {/* spy silhouette glyph */}
              <svg viewBox="0 0 100 100" style={{
                position: 'absolute', right: -4, bottom: -10, width: 168, height: 168, opacity: 0.12,
              }}>
                <circle cx="50" cy="32" r="16" fill={KS.primary} />
                <path d="M14 96 C16 70 34 60 50 60 C66 60 84 70 86 96 Z" fill={KS.primary} />
                <rect x="36" y="26" width="28" height="8" rx="4" fill="#000" />
              </svg>
              <div>
                <div className="ks-mono" style={{ fontSize: 10, color: KS.live, letterSpacing: '0.32em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, background: KS.live, borderRadius: '50%', boxShadow: `0 0 8px ${KS.live}` }} />
                  LIVE · 24,387 AGENTS DEPLOYED
                </div>
                <div className="ks-display" style={{ fontSize: 38, color: KS.ink, marginTop: 4, letterSpacing: '0.04em', lineHeight: 0.92 }}>
                  QUICK PLAY
                </div>
                <div className="ks-mono" style={{ fontSize: 10, color: KS.inkMute, marginTop: 4, letterSpacing: '0.16em' }}>
                  4V4 · CASUAL · 2–5 MIN
                </div>
              </div>
              <KSPrimaryButton sub="TAP TO DEPLOY">DEPLOY</KSPrimaryButton>
            </div>
          </KSGlassCard>
        </div>

        {/* Ranked entry — premium feel */}
        <KSGlassCard chamferSize={12} corners="tl-br" style={{ height: 92 }} intensity="hi">
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
            background: `linear-gradient(180deg, ${KS.alert}, ${KS.tier.diamond})`,
            boxShadow: `0 0 16px ${KS.alert}`,
          }} />
          <div style={{
            position: 'absolute', inset: 0, padding: '12px 14px 12px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <KSRankBadge tier={3} size={20} />
                <span className="ks-display" style={{ fontSize: 22, color: KS.ink, letterSpacing: '0.08em', lineHeight: 1 }}>
                  RANKED OPS
                </span>
              </div>
              <div className="ks-mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: KS.inkMute }}>
                <span style={{ color: KS.alert }}>SEASON 02</span> · ENDS IN 18D 04H
              </div>
              <div className="ks-mono" style={{ fontSize: 10, color: KS.tier.diamond, letterSpacing: '0.14em' }}>
                +28 RP TO NEXT TIER
              </div>
            </div>
            <div style={{
              width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: KS.surface, clipPath: KS_chamfer(6, 'tr-bl'),
              border: `1px solid ${KS.alert}`,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={KS.alert} strokeWidth="2.2" strokeLinecap="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </div>
        </KSGlassCard>

        {/* Daily missions strip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <KSSectionLabel color={KS.alert}>Daily Missions · 2/4</KSSectionLabel>
            <span className="ks-mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: KS.inkDim }}>
              RESETS 14:22:01
            </span>
          </div>
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -16px', padding: '0 16px',
          }}>
            <MissionChip title="ELIMINATE 5 TARGETS" reward="120" progress={0.6} done={false} />
            <MissionChip title="WIN 2 MATCHES" reward="80" progress={1} done={true} />
            <MissionChip title="HEADSHOT KILL" reward="50G" progress={0.33} done={false} />
            <MissionChip title="3 MATCH STREAK" reward="200" progress={0} done={false} />
          </div>
        </div>

        {/* Leaderboard teaser */}
        <KSGlassCard chamferSize={10} corners="tr-bl" style={{ height: 100 }}>
          <div style={{ position: 'absolute', inset: 0, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="ks-display" style={{ fontSize: 14, color: KS.ink, letterSpacing: '0.16em' }}>
                WEEKLY LEADERBOARD
              </span>
              <span className="ks-mono" style={{ fontSize: 10, color: KS.primary, letterSpacing: '0.18em' }}>VIEW ›</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {[
                { rank: 1, name: 'V.NOIR', score: '14.2K', color: KS.tier.gold },
                { rank: 2, name: 'SHADOW9', score: '13.8K', color: KS.tier.silver },
                { rank: 3, name: 'PROTOCOL', score: '13.1K', color: KS.tier.bronze },
              ].map((r) => (
                <div key={r.rank} style={{
                  background: 'rgba(0,0,0,0.3)', padding: '6px 8px',
                  clipPath: KS_chamfer(4, 'tr-bl'),
                  borderLeft: `2px solid ${r.color}`,
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <span className="ks-mono" style={{ fontSize: 9, color: r.color, letterSpacing: '0.18em' }}>
                    #{r.rank}
                  </span>
                  <span className="ks-display" style={{ fontSize: 12, color: KS.ink, letterSpacing: '0.06em' }}>
                    {r.name}
                  </span>
                  <span className="ks-num" style={{ fontSize: 11, color: KS.live }}>{r.score}</span>
                </div>
              ))}
            </div>
          </div>
        </KSGlassCard>
      </div>

      <KSBottomNav active="home" />
    </div>
  );
}

function MissionChip({ title, reward, progress, done }) {
  return (
    <div style={{
      flexShrink: 0, width: 158, height: 92,
      background: done ? 'rgba(57,255,20,0.08)' : 'rgba(0,0,0,0.35)',
      border: `1px solid ${done ? KS.live : KS.hairSoft}`,
      clipPath: KS_chamfer(8, 'tr-bl'),
      padding: '10px 12px', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', position: 'relative',
    }}>
      <div className="ks-display" style={{
        fontSize: 13, color: KS.ink, letterSpacing: '0.08em', lineHeight: 1.1,
      }}>{title}</div>
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5,
        }}>
          <span className="ks-mono" style={{ fontSize: 10, color: done ? KS.live : KS.alert, letterSpacing: '0.14em', fontWeight: 700 }}>
            {done ? '✓ COMPLETE' : `+${reward} XP`}
          </span>
        </div>
        <div style={{
          height: 4, background: 'rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: done ? KS.live : KS.primary,
            boxShadow: done ? `0 0 8px ${KS.live}` : `0 0 6px ${KS.primary}`,
          }} />
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCREEN 3 — Matchmaking / Radar
// ═════════════════════════════════════════════════════════════
function MatchmakingScreen() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: KS.bg }}>
      <KSTopoBg intensity={1.4} />

      {/* Top eyebrow */}
      <div style={{
        position: 'absolute', top: 64, left: 24, right: 24, textAlign: 'center',
      }}>
        <div className="ks-mono" style={{
          fontSize: 10, color: KS.alert, letterSpacing: '0.32em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ width: 6, height: 6, background: KS.alert, borderRadius: '50%', animation: 'ks-blink 1s infinite' }} />
          MATCHMAKING · ESTABLISHED 00:08
        </div>
        <div className="ks-display" style={{
          fontSize: 26, color: KS.ink, marginTop: 8, letterSpacing: '0.08em',
        }}>SEARCHING FOR TARGET</div>
        <div className="ks-mono" style={{
          fontSize: 11, color: KS.inkMute, marginTop: 4, letterSpacing: '0.2em',
        }}>SECTOR 7 · ENCRYPTED CHANNEL OPEN</div>
      </div>

      {/* Radar */}
      <div style={{
        position: 'absolute', top: 168, left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 300,
      }}>
        {/* range rings */}
        <svg viewBox="0 0 300 300" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="ks-radar-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={KS.primary} stopOpacity="0.18" />
              <stop offset="60%" stopColor={KS.primary} stopOpacity="0.05" />
              <stop offset="100%" stopColor={KS.primary} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="150" cy="150" r="140" fill="url(#ks-radar-fill)" />
          <circle cx="150" cy="150" r="140" fill="none" stroke={KS.primary} strokeOpacity="0.3" />
          <circle cx="150" cy="150" r="100" fill="none" stroke={KS.primary} strokeOpacity="0.25" strokeDasharray="3 4" />
          <circle cx="150" cy="150" r="60" fill="none" stroke={KS.primary} strokeOpacity="0.2" />
          <circle cx="150" cy="150" r="24" fill="none" stroke={KS.primary} strokeOpacity="0.4" />
          <line x1="0" y1="150" x2="300" y2="150" stroke={KS.primary} strokeOpacity="0.18" strokeWidth="0.6" />
          <line x1="150" y1="0" x2="150" y2="300" stroke={KS.primary} strokeOpacity="0.18" strokeWidth="0.6" />
          {/* pinged blips */}
          <circle cx="218" cy="100" r="3" fill={KS.alert} />
          <circle cx="92" cy="184" r="3" fill={KS.alert} />
          <circle cx="180" cy="232" r="2.5" fill={KS.alert} opacity="0.6" />
          <circle cx="58" cy="120" r="2.5" fill={KS.alert} opacity="0.6" />
        </svg>

        {/* sweep beam */}
        <div style={{
          position: 'absolute', inset: 0,
          animation: 'ks-radar-sweep 2.4s linear infinite',
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', width: 150, height: 1,
            transformOrigin: '0 50%',
            background: `linear-gradient(90deg, ${KS.live}, transparent)`,
            boxShadow: `0 0 8px ${KS.live}`,
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', width: 150, height: 150,
            transformOrigin: '0 0',
            background: `conic-gradient(from 0deg, rgba(57,255,20,0.35), rgba(57,255,20,0.05) 50deg, transparent 70deg)`,
          }} />
        </div>

        {/* center ping */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 12, height: 12, borderRadius: '50%', background: KS.live,
          boxShadow: `0 0 14px ${KS.live}`,
        }}>
          <div style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: `2px solid ${KS.live}`, animation: 'ks-radar-ping 1.6s ease-out infinite',
          }} />
        </div>

        {/* compass marks */}
        {['N', 'E', 'S', 'W'].map((d, i) => {
          const angle = i * 90;
          const r = 152;
          const x = 150 + r * Math.sin(angle * Math.PI / 180);
          const y = 150 - r * Math.cos(angle * Math.PI / 180);
          return (
            <div key={d} style={{
              position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)',
              fontFamily: KS.mono, fontSize: 9, color: KS.inkDim, letterSpacing: '0.2em',
            }}>{d}</div>
          );
        })}
      </div>

      {/* Player card preview */}
      <div style={{ position: 'absolute', top: 484, left: 16, right: 16 }}>
        <KSGlassCard chamferSize={10} corners="tr-bl" style={{ height: 88 }}>
          <div style={{
            position: 'absolute', inset: 0, padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <KSPlayerTag name="AGENT_KILO" tier={2} winRate={58} kd={1.8} big />
            <div style={{ textAlign: 'right' }}>
              <div className="ks-mono" style={{ fontSize: 9, letterSpacing: '0.22em', color: KS.inkDim }}>
                MATCHES
              </div>
              <div className="ks-num" style={{ fontSize: 22, color: KS.ink, lineHeight: 1.1 }}>
                284
              </div>
            </div>
          </div>
        </KSGlassCard>
      </div>

      {/* Hint band */}
      <div style={{
        position: 'absolute', left: 24, right: 24, bottom: 124,
        textAlign: 'center',
      }}>
        <div className="ks-mono" style={{
          fontSize: 10, color: KS.inkDim, letterSpacing: '0.2em',
        }}>
          ›&nbsp; AGENTS IN POOL: <span style={{ color: KS.live }}>1,284</span> &nbsp;·&nbsp; AVG WAIT: <span style={{ color: KS.ink }}>00:14</span>
        </div>
      </div>

      {/* Abort */}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 52 }}>
        <KSDangerButton>ABORT MISSION</KSDangerButton>
      </div>
    </div>
  );
}

Object.assign(window, { SplashScreen, HomeScreen, MatchmakingScreen, KSCornerTicks: CornerTicks });
