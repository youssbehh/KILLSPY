// KILLSPY — host app: DesignCanvas layout + Tweaks panel.
// Wraps each screen in an iOS frame. Reads primitives from window globals.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "animations": true,
  "scanlines": true
}/*EDITMODE-END*/;

// Inject a runtime override style so tweaks affect every artboard.
function ApplyTweakRuntime({ tweak }) {
  React.useEffect(() => {
    let s = document.getElementById('ks-runtime-tweaks');
    if (!s) { s = document.createElement('style'); s.id = 'ks-runtime-tweaks'; document.head.appendChild(s); }
    const lines = [];
    if (!tweak.animations) {
      lines.push(`*, *::before, *::after { animation-play-state: paused !important; }`);
    }
    if (!tweak.scanlines) {
      // hide the multiply-scanline overlay inside TopoBg without touching component
      lines.push(`[data-ks-scanline] { display: none !important; }`);
    }
    s.textContent = lines.join('\n');
  }, [tweak.animations, tweak.scanlines]);
  return null;
}

function Frame({ children }) {
  // 402 × 874 — iPhone 16 Pro-ish — wrap in dark iOS device frame.
  return (
    <IOSDevice dark width={402} height={874}>
      {children}
    </IOSDevice>
  );
}

function KillspyApp() {
  const [tweak, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <ApplyTweakRuntime tweak={tweak} />
      <DesignCanvas>
        {/* ── System overview ────────────────────────────────────────────── */}
        <DCSection
          id="system"
          title="KILLSPY · Visual System"
          subtitle="Futur Urbain · base theme · MIMIR STUDIO · v1.0.26"
        >
          <DCArtboard id="tokens" label="01 · Design tokens" width={402} height={874}>
            <KSTokensCard />
          </DCArtboard>
          <DCArtboard id="splash" label="02 · Splash / loading" width={402} height={874}>
            <Frame><SplashScreen /></Frame>
          </DCArtboard>
          <DCPostIt top={-60} right={20} rotate={3} width={260}>
            Stencil <b>KILLSPY</b> wordmark animates letter-by-letter like a classified stamp landing on the dossier. Radar sweep loops behind it; loading bar feels like “mission progress”.
          </DCPostIt>
        </DCSection>

        {/* ── Lobby ──────────────────────────────────────────────────────── */}
        <DCSection
          id="lobby"
          title="Lobby · post-login flow"
          subtitle="Home → matchmaking · two CTAs at distinct visual weights"
        >
          <DCArtboard id="home" label="03 · Home" width={402} height={874}>
            <Frame><HomeScreen /></Frame>
          </DCArtboard>
          <DCArtboard id="matchmaking" label="04 · Matchmaking" width={402} height={874}>
            <Frame><MatchmakingScreen /></Frame>
          </DCArtboard>
          <DCPostIt top={-80} right={-20} rotate={-2} width={250}>
            Quick Play = pulsing blue hero CTA. Ranked Ops = premium amber-stripe card with diamond gradient — distinct enough to feel like a separate tier of commitment.
          </DCPostIt>
        </DCSection>

        {/* ── In-Match ──────────────────────────────────────────────────── */}
        <DCSection
          id="match"
          title="In-Match · live combat"
          subtitle="Asymmetric HUD · thumb-reach actions · own = blue · enemy = amber/red"
        >
          <DCArtboard id="hud" label="05 · In-game HUD" width={402} height={874}>
            <Frame><HUDScreen /></Frame>
          </DCArtboard>
          <DCArtboard id="end-win" label="06 · End match · WIN" width={402} height={874}>
            <Frame><EndMatchScreen variant="win" /></Frame>
          </DCArtboard>
          <DCArtboard id="end-lose" label="06 · End match · LOSE" width={402} height={874}>
            <Frame><EndMatchScreen variant="lose" /></Frame>
          </DCArtboard>
          <DCPostIt top={-60} right={20} rotate={2} width={250}>
            HUD avoids form-style symmetry — score pods chamfered top-right, shield bottom-left, fire bottom-right. Hex action pads keep thumb hit-zones organic.
          </DCPostIt>
        </DCSection>

        {/* ── Progression ───────────────────────────────────────────────── */}
        <DCSection
          id="progression"
          title="Progression · agent identity"
          subtitle="Dossier, customization, leaderboard, shop"
        >
          <DCArtboard id="profile" label="07 · Profile" width={402} height={874}>
            <Frame><ProfileScreen /></Frame>
          </DCArtboard>
          <DCArtboard id="leaderboard" label="08 · Leaderboard" width={402} height={874}>
            <Frame><LeaderboardScreen /></Frame>
          </DCArtboard>
          <DCArtboard id="shop" label="09 · Shop · Daily Drop" width={402} height={874}>
            <Frame><ShopScreen /></Frame>
          </DCArtboard>
          <DCPostIt top={-60} right={20} rotate={-3} width={250}>
            5-tier rank ladder: Recruit · Operative · Agent · Specialist · Phantom. Hex avatars carry tier color around the player at every scale.
          </DCPostIt>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="KILLSPY · Tweaks">
        <TweakSection label="Motion & visuals" />
        <TweakToggle
          label="Animations"
          value={tweak.animations}
          onChange={(v) => setTweak('animations', v)}
        />
        <TweakToggle
          label="CRT scanlines"
          value={tweak.scanlines}
          onChange={(v) => setTweak('scanlines', v)}
        />
      </TweaksPanel>
    </>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<KillspyApp />);
