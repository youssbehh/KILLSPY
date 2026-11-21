export const MOTION = {
  enter:     180,
  exit:      140,
  tap:       100,
  glowPulse: 2400,
  radar:     2400,
  radarSlow: 6000,
  letterIn:  220,
  letterStagger: 60,
  stampIn:   700,
  blinkFast: 500,
  blinkNorm: 1200,
  ammoShake: 60,

  // Turn resolution (CombatFx). Everything below is timed against `combat`.
  combat:         1000, // full shot / shield / reload sequence
  reveal:         1500, // pause between two turns, must outlast `combat`
  lifeLossDelay:  360,  // a heart breaks when the tracer lands (combat × 0.36)
  reloadPipDelay: 480,  // the ammo pip snaps in as the reload ring closes
  cardFlip:       220,

  easingEnter: [0.22, 1, 0.36, 1] as const,
  easingExit:  [0.4,  0, 1,    1] as const,
} as const;
