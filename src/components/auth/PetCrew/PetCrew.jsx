import { useEffect, useRef, useCallback, useState } from 'react';
import { Spring } from './useSpring';
import { usePetMood } from './usePetMood';
import { COLORS, SHAPES } from './petCrewConfig';

// Generate the poodle body path based on bend and kink values
function getPoodlePath(bend, kink) {
  const dx = bend;
  const kx = kink * 20;

  if (kink > 0.01) {
    return `M 100 380 L ${100 + dx * 0.3 - kx} 260 L ${100 + dx * 0.6 + kx} 150 L ${100 + dx} 40 L ${253 + dx} 40 L ${253 + dx * 0.6 + kx} 150 L ${253 + dx * 0.3 - kx} 260 L 253 380 Z`;
  }
  return `M 100 380 Q ${100 + dx * 0.5} 210 ${100 + dx} 40 L ${253 + dx} 40 Q ${253 + dx * 0.5} 210 253 380 Z`;
}

// Initial poodle path (no bend, no kink)
const INITIAL_POODLE_PATH = getPoodlePath(0, 0);

export default function PetCrew({ focusedField, passwordVisible, status, className = '' }) {
  const { mood, lookAtHint } = usePetMood({ focusedField, passwordVisible, status });

  // Store mood in a ref so the rAF loop always sees the latest value
  const moodRef = useRef(mood);
  const lookAtRef = useRef(lookAtHint);
  useEffect(() => { moodRef.current = mood; }, [mood]);
  useEffect(() => { lookAtRef.current = lookAtHint; }, [lookAtHint]);

  // Force re-render for expression changes (mood-driven JSX)
  const [displayMood, setDisplayMood] = useState('idle');
  useEffect(() => { setDisplayMood(mood); }, [mood]);

  // DOM refs for direct SVG manipulation
  const poodleBodyRef = useRef(null);
  const poodleHeadRef = useRef(null);
  const poodleTopknotRef = useRef(null);
  const poodleFaceRef = useRef(null);
  const catGroupRef = useRef(null);
  const catFaceRef = useRef(null);
  const catEarsRef = useRef(null);
  const bunnyGroupRef = useRef(null);
  const bunnyEarsRef = useRef(null);
  const bunnyFaceRef = useRef(null);
  const duckGroupRef = useRef(null);
  const duckBeakRef = useRef(null);
  const duckFaceRef = useRef(null);
  const bubblesRef = useRef(null);

  // Springs - created once
  const springs = useRef(null);
  if (springs.current === null) {
    springs.current = {
      lookX: new Spring(0, { stiffness: 300, damping: 20 }),
      lookY: new Spring(0, { stiffness: 300, damping: 20 }),
      poodleBend: new Spring(0, { stiffness: 120, damping: 14 }),
      poodleKink: new Spring(0, { stiffness: 200, damping: 10 }),
      poodleTopknotLag: new Spring(0, { stiffness: 80, damping: 10 }),
      poodleHop: new Spring(0, { stiffness: 250, damping: 18 }),
      catSquash: new Spring(1, { stiffness: 150, damping: 12 }),
      catHop: new Spring(0, { stiffness: 250, damping: 18 }),
      bunnyLean: new Spring(0, { stiffness: 140, damping: 14 }),
      bunnyEarFold: new Spring(0, { stiffness: 120, damping: 14 }),
      bunnyHop: new Spring(0, { stiffness: 250, damping: 18 }),
      duckLean: new Spring(0, { stiffness: 130, damping: 14 }),
      duckSquint: new Spring(0, { stiffness: 180, damping: 15 }),
      duckHop: new Spring(0, { stiffness: 250, damping: 18 }),
      introVal: new Spring(0, { stiffness: 60, damping: 10 }),
    };
  }

  // Mutable state for the animation loop
  const anim = useRef({
    mouseX: 0,
    mouseY: 0,
    lastTime: 0,
    rafId: 0,
    running: false,
    successTriggered: false,
  });

  // Track mouse globally
  useEffect(() => {
    const onMove = (e) => {
      anim.current.mouseX = ((e.clientX / window.innerWidth) * 2 - 1) * 30;
      anim.current.mouseY = ((e.clientY / window.innerHeight) * 2 - 1) * 20;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // The core animation frame - uses refs only, no stale closures
  const tick = useCallback((time) => {
    const a = anim.current;
    const s = springs.current;
    const m = moodRef.current;

    const dt = Math.min((time - a.lastTime) / 1000, 0.064);
    a.lastTime = time;

    // --- Set spring targets based on current mood ---
    // Reset defaults
    s.poodleKink.setTarget(0);
    s.catSquash.setTarget(1);
    s.bunnyEarFold.setTarget(0);
    s.duckSquint.setTarget(0);

    if (m === 'idle') {
      s.lookX.setTarget(a.mouseX);
      s.lookY.setTarget(a.mouseY);
      s.poodleBend.setTarget(a.mouseX * 0.2);
      s.bunnyLean.setTarget(a.mouseX * 0.1);
      s.duckLean.setTarget(a.mouseX * 0.13);
    } else if (m === 'typing') {
      const hint = lookAtRef.current;
      s.lookX.setTarget(hint.x);
      s.lookY.setTarget(hint.y);
      s.poodleBend.setTarget(hint.x * 0.25);
      s.bunnyLean.setTarget(4);
      s.duckLean.setTarget(5);
    } else if (m === 'shy') {
      s.lookX.setTarget(-40);
      s.lookY.setTarget(15);
      s.poodleBend.setTarget(-15);
      s.bunnyLean.setTarget(-3);
      s.bunnyEarFold.setTarget(1);
      s.duckLean.setTarget(-5);
      s.duckSquint.setTarget(1);
    } else if (m === 'error') {
      s.lookX.setTarget(0);
      s.lookY.setTarget(25);
      s.poodleBend.setTarget(0);
      s.poodleKink.setTarget(1);
      s.catSquash.setTarget(0.82);
      s.bunnyLean.setTarget(0);
      s.duckLean.setTarget(0);
    } else if (m === 'submitting') {
      s.lookX.setTarget(15);
      s.lookY.setTarget(20);
      s.poodleBend.setTarget(5);
      s.bunnyLean.setTarget(2);
      s.duckLean.setTarget(3);
    } else if (m === 'success') {
      s.lookX.setTarget(0);
      s.lookY.setTarget(-20);
      s.poodleBend.setTarget(0);
      s.bunnyLean.setTarget(0);
      s.duckLean.setTarget(0);
      if (!a.successTriggered) {
        a.successTriggered = true;
        s.catHop.velocity = -280;
        setTimeout(() => { s.bunnyHop.velocity = -280; s.bunnyHop.settled = false; }, 80);
        setTimeout(() => { s.poodleHop.velocity = -280; s.poodleHop.settled = false; }, 160);
        setTimeout(() => { s.duckHop.velocity = -280; s.duckHop.settled = false; }, 240);
      }
    }
    if (m !== 'success') a.successTriggered = false;

    // --- Step all springs ---
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let allSettled = true;

    if (prefersReduced) {
      Object.values(s).forEach(sp => { sp.value = sp.target; sp.velocity = 0; sp.settled = true; });
    } else {
      Object.values(s).forEach(sp => {
        if (!sp.update(dt)) allSettled = false;
      });
    }
    // Secondary spring
    s.poodleTopknotLag.setTarget(s.poodleBend.value);
    if (!prefersReduced && !s.poodleTopknotLag.update(dt)) allSettled = false;

    // --- Apply transforms to DOM ---
    const intro = s.introVal.value;
    const lx = s.lookX.value;
    const ly = s.lookY.value;

    // Poodle body path
    if (poodleBodyRef.current) {
      poodleBodyRef.current.setAttribute('d', getPoodlePath(s.poodleBend.value, s.poodleKink.value));
    }
    // Poodle head group (ears + topknot + face follow bend)
    if (poodleHeadRef.current) {
      const hx = s.poodleBend.value;
      const hy = s.poodleHop.value;
      poodleHeadRef.current.setAttribute('transform', `translate(${hx}, ${hy})`);
    }
    // Topknot lags behind the bend
    if (poodleTopknotRef.current) {
      const lag = s.poodleBend.value - s.poodleTopknotLag.value;
      poodleTopknotRef.current.setAttribute('transform', `translate(${-lag * 1.5}, 0)`);
    }
    // Poodle face slides with lookAt
    if (poodleFaceRef.current) {
      const fx = lx * 0.08 + s.poodleBend.value;
      const fy = ly * 0.06 + s.poodleHop.value;
      poodleFaceRef.current.setAttribute('transform', `translate(${fx}, ${fy})`);
    }

    // Cat group
    if (catGroupRef.current) {
      const hop = s.catHop.value;
      const sq = s.catSquash.value;
      // Scale from the bottom (y=380)
      catGroupRef.current.setAttribute('transform',
        `translate(0, ${hop}) translate(127.5, 380) scale(1, ${sq}) translate(-127.5, -380)`
      );
    }
    if (catFaceRef.current) {
      catFaceRef.current.setAttribute('transform', `translate(${lx * 0.12}, ${ly * 0.1})`);
    }
    if (catEarsRef.current) {
      catEarsRef.current.setAttribute('transform', `rotate(${lx * 0.25}, 127, 240)`);
    }

    // Bunny group
    if (bunnyGroupRef.current) {
      const lean = s.bunnyLean.value;
      const hop = s.bunnyHop.value;
      bunnyGroupRef.current.setAttribute('transform', `translate(0, ${hop}) rotate(${lean}, 257, 380)`);
    }
    if (bunnyEarsRef.current) {
      const fold = s.bunnyEarFold.value;
      const earScaleY = 1 - fold * 0.85;
      // Fold ears down from their base (y ≈ 140)
      bunnyEarsRef.current.setAttribute('transform',
        `translate(0, ${140 * (1 - earScaleY)}) scale(1, ${earScaleY})`
      );
    }
    if (bunnyFaceRef.current) {
      bunnyFaceRef.current.setAttribute('transform', `translate(${lx * 0.06}, ${ly * 0.05})`);
    }

    // Duck group
    if (duckGroupRef.current) {
      const lean = s.duckLean.value;
      const hop = s.duckHop.value;
      duckGroupRef.current.setAttribute('transform', `translate(0, ${hop}) rotate(${lean}, 335, 380)`);
    }
    if (duckBeakRef.current) {
      duckBeakRef.current.setAttribute('transform', `translate(${lx * 0.12}, 0)`);
    }
    if (duckFaceRef.current) {
      duckFaceRef.current.setAttribute('transform', `translate(${lx * 0.06}, ${s.duckSquint.value * 2})`);
    }

    // Bubbles
    if (bubblesRef.current) {
      bubblesRef.current.style.opacity = m === 'success' ? '1' : '0';
    }

    // In idle mode we always want to track the mouse, so never fully settle
    if (m === 'idle') allSettled = false;

    if (allSettled && intro >= 0.99) {
      a.running = false;
      // Don't schedule next frame
    } else {
      a.rafId = requestAnimationFrame(tick);
    }
  }, []);

  // Ensure the loop is always running
  const ensureRunning = useCallback(() => {
    if (!anim.current.running) {
      anim.current.running = true;
      anim.current.lastTime = performance.now();
      anim.current.rafId = requestAnimationFrame(tick);
    }
  }, [tick]);

  // Start intro + loop on mount
  useEffect(() => {
    springs.current.introVal.setTarget(1);
    ensureRunning();
    return () => cancelAnimationFrame(anim.current.rafId);
  }, [ensureRunning]);

  // Restart loop whenever mood changes
  useEffect(() => {
    ensureRunning();
  }, [mood, lookAtHint, ensureRunning]);

  return (
    <div className={`relative w-full h-full flex items-end justify-center overflow-hidden pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 390 400" className="w-full h-auto max-h-full" aria-hidden="true">
        {/* Ground Line */}
        <line x1="20" y1="380" x2="370" y2="380" stroke="var(--color-outline-variant)" strokeWidth="3" strokeLinecap="round" />

        {/* ===== POODLE (back, tall) ===== */}
        <g>
          {/* Body - procedural path */}
          <path ref={poodleBodyRef} d={INITIAL_POODLE_PATH} fill={COLORS.poodle} rx="8" />
          {/* Head group moves with bend + hop */}
          <g ref={poodleHeadRef}>
            {/* Topknot */}
            <circle ref={poodleTopknotRef} cx="176" cy="30" r="28" fill={COLORS.poodle} />
            {/* Ear puffs */}
            <ellipse cx="118" cy="65" rx="18" ry="22" fill={COLORS.poodle} />
            <ellipse cx="234" cy="65" rx="18" ry="22" fill={COLORS.poodle} />
          </g>
          {/* Face group slides independently */}
          <g ref={poodleFaceRef}>
            {/* Eyes */}
            <circle cx="158" cy="58" r="5" fill="white" />
            <circle cx="158" cy="58" r="2.5" fill="#111" />
            <circle cx="194" cy="58" r="5" fill="white" />
            <circle cx="194" cy="58" r="2.5" fill="#111" />
            {/* Nose */}
            <ellipse cx="176" cy="72" rx="4" ry="3" fill="#222" />
            {/* Mouth */}
            {displayMood === 'error' ? (
              <path d="M 166 82 Q 176 76 186 82" stroke="#222" strokeWidth="2" fill="none" />
            ) : displayMood === 'shy' ? (
              <path d="M 170 80 L 182 80" stroke="#222" strokeWidth="2" fill="none" />
            ) : (
              <path d="M 166 78 Q 176 85 186 78" stroke="#222" strokeWidth="2" fill="none" />
            )}
          </g>
        </g>

        {/* ===== BUNNY (middle, shy) ===== */}
        <g ref={bunnyGroupRef}>
          {/* Ears */}
          <g ref={bunnyEarsRef}>
            <path d={SHAPES.bunny.earL} fill={COLORS.bunny} />
            <path d={SHAPES.bunny.earInnerL} fill="#ffb6c1" />
            <path d={SHAPES.bunny.earR} fill={COLORS.bunny} />
            <path d={SHAPES.bunny.earInnerR} fill="#ffb6c1" />
          </g>
          {/* Body */}
          <path d={SHAPES.bunny.body} fill={COLORS.bunny} />
          {/* Face */}
          <g ref={bunnyFaceRef}>
            {displayMood === 'shy' ? (
              <>
                <path d="M 234 172 Q 242 166 250 172" stroke="white" strokeWidth="2.5" fill="none" />
                <path d="M 264 172 Q 272 166 280 172" stroke="white" strokeWidth="2.5" fill="none" />
              </>
            ) : displayMood === 'error' ? (
              <>
                <circle cx="242" cy="170" r="8" fill="white" />
                <circle cx="242" cy="170" r="3" fill="#111" />
                <circle cx="272" cy="170" r="8" fill="white" />
                <circle cx="272" cy="170" r="3" fill="#111" />
              </>
            ) : (
              <>
                <circle cx="242" cy="170" r="6" fill="white" />
                <circle cx="242" cy="170" r="2.5" fill="#111" />
                <circle cx="272" cy="170" r="6" fill="white" />
                <circle cx="272" cy="170" r="2.5" fill="#111" />
              </>
            )}
            <ellipse cx="257" cy="182" rx="3.5" ry="2.5" fill="#ffb6c1" />
          </g>
        </g>

        {/* ===== DUCK (right, deadpan) ===== */}
        <g ref={duckGroupRef}>
          <path d={SHAPES.duck.body} fill={COLORS.duck} />
          <path d={SHAPES.duck.wing} fill="#c4a812" opacity="0.6" />
          {/* Eyes */}
          <g ref={duckFaceRef}>
            {displayMood === 'shy' ? (
              <>
                <path d="M 328 222 L 338 222" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 348 222 L 358 222" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="333" cy="222" r="2.5" fill="#333" />
                <circle cx="353" cy="222" r="2.5" fill="#333" />
              </>
            )}
            {displayMood === 'error' && (
              <path d="M 362 214 Q 366 218 362 222" stroke="#667" strokeWidth="1.5" fill="none" />
            )}
          </g>
          {/* Beak */}
          <g ref={duckBeakRef}>
            {displayMood === 'error' ? (
              <path d="M 322 237 Q 335 232 348 237 Q 358 240 368 237" stroke="#e65c00" strokeWidth="3" fill="none" />
            ) : (
              <path d={SHAPES.duck.beak} fill="#e65c00" />
            )}
          </g>
        </g>

        {/* ===== GINGER CAT (front-left, friendly) ===== */}
        <g ref={catGroupRef}>
          {/* Ears */}
          <g ref={catEarsRef}>
            <path d={SHAPES.cat.earL} fill={COLORS.cat} />
            <path d={SHAPES.cat.earR} fill={COLORS.cat} />
          </g>
          {/* Body */}
          <path d={SHAPES.cat.body} fill={COLORS.cat} />
          {/* Face */}
          <g ref={catFaceRef}>
            {displayMood === 'shy' ? (
              <>
                <path d="M 105 312 Q 112 306 119 312" stroke="#fff" strokeWidth="2.5" fill="none" />
                <path d="M 135 312 Q 142 306 149 312" stroke="#fff" strokeWidth="2.5" fill="none" />
              </>
            ) : (
              <>
                <circle cx="112" cy="310" r="3.5" fill="#222" />
                <circle cx="142" cy="310" r="3.5" fill="#222" />
              </>
            )}
            {/* Mouth */}
            {displayMood === 'error' ? (
              <path d="M 118 328 Q 127 322 136 328" stroke="#222" strokeWidth="2" fill="none" />
            ) : displayMood === 'typing' ? (
              <ellipse cx="127" cy="325" rx="3" ry="4" fill="#222" />
            ) : displayMood === 'success' ? (
              <path d="M 115 322 Q 127 332 139 322" stroke="#222" strokeWidth="2" fill="none" />
            ) : (
              <path d="M 118 322 Q 127 329 136 322" stroke="#222" strokeWidth="2" fill="none" />
            )}
            {/* Whiskers */}
            <g opacity="0.5">
              <line x1="95" y1="316" x2="70" y2="312" stroke="#fff" strokeWidth="1.5" />
              <line x1="95" y1="322" x2="68" y2="322" stroke="#fff" strokeWidth="1.5" />
              <line x1="95" y1="328" x2="70" y2="332" stroke="#fff" strokeWidth="1.5" />
              <line x1="159" y1="316" x2="184" y2="312" stroke="#fff" strokeWidth="1.5" />
              <line x1="159" y1="322" x2="186" y2="322" stroke="#fff" strokeWidth="1.5" />
              <line x1="159" y1="328" x2="184" y2="332" stroke="#fff" strokeWidth="1.5" />
            </g>
          </g>
        </g>

        {/* Success Bubbles */}
        <g ref={bubblesRef} style={{ transition: 'opacity 0.4s' }} opacity="0">
          <circle cx="100" cy="200" r="12" fill="var(--color-primary)" opacity="0.25">
            <animate attributeName="cy" from="200" to="50" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="190" cy="160" r="8" fill="var(--color-secondary)" opacity="0.25">
            <animate attributeName="cy" from="160" to="20" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="310" cy="180" r="10" fill="var(--color-tertiary)" opacity="0.25">
            <animate attributeName="cy" from="180" to="30" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="250" cy="130" r="6" fill="var(--color-primary)" opacity="0.2">
            <animate attributeName="cy" from="130" to="10" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.25" to="0" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
}
