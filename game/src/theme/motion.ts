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

  easingEnter: [0.22, 1, 0.36, 1] as const,
  easingExit:  [0.4,  0, 1,    1] as const,
} as const;
