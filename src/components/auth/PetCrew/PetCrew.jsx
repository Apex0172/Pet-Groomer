import React, { useEffect, useRef } from 'react';
import { Spring } from './useSpring';
import { usePetMood } from './usePetMood';
import { COLORS, SHAPES } from './petCrewConfig';

export default function PetCrew({ focusedField, passwordVisible, status, className = '' }) {
  const { mood, lookAtHint } = usePetMood({ focusedField, passwordVisible, status });
  const svgRef = useRef(null);
  
  // DOM element refs for fast updates
  const refs = {
    poodleBody: useRef(null),
    poodleHead: useRef(null),
    poodleTopknot: useRef(null),
    poodleEyes: useRef(null),
    catFace: useRef(null),
    catEars: useRef(null),
    catBodyGroup: useRef(null),
    bunnyGroup: useRef(null),
    bunnyEars: useRef(null),
    duckGroup: useRef(null),
    duckBeak: useRef(null),
    duckEyes: useRef(null),
    bubbles: useRef(null)
  };

  // Springs
  const springs = useRef({
    // global tracking
    lookX: new Spring(0, { stiffness: 150, damping: 20 }),
    lookY: new Spring(0, { stiffness: 150, damping: 20 }),
    // poodle
    poodleBend: new Spring(0, { stiffness: 120, damping: 14 }),
    poodleKink: new Spring(0, { stiffness: 200, damping: 10 }),
    poodleTopknotLag: new Spring(0, { stiffness: 100, damping: 12 }),
    poodleHop: new Spring(0, { stiffness: 200, damping: 15 }),
    // cat
    catSquash: new Spring(1, { stiffness: 150, damping: 12 }),
    catHop: new Spring(0, { stiffness: 200, damping: 15 }),
    // bunny
    bunnyLean: new Spring(0, { stiffness: 140, damping: 14 }),
    bunnyEarFold: new Spring(0, { stiffness: 120, damping: 14 }),
    bunnyHop: new Spring(0, { stiffness: 200, damping: 15 }),
    // duck
    duckLean: new Spring(0, { stiffness: 130, damping: 14 }),
    duckSquint: new Spring(0, { stiffness: 180, damping: 15 }),
    duckHop: new Spring(0, { stiffness: 200, damping: 15 }),
    // intro scale/fade
    introVal: new Spring(0, { stiffness: 80, damping: 12 })
  });

  const state = useRef({
    mouseX: 0,
    mouseY: 0,
    lastTime: 0,
    rAF: null,
    moodTime: 0,
    successTriggered: false
  });

  // Track mouse
  useEffect(() => {
    const handleMove = (e) => {
      // Normalize -1 to 1 roughly based on window
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      state.current.mouseX = x * 30; 
      state.current.mouseY = y * 20;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Set targets based on mood
  useEffect(() => {
    const s = springs.current;
    
    // Default targets
    s.lookX.setTarget(state.current.mouseX);
    s.lookY.setTarget(state.current.mouseY);
    s.poodleBend.setTarget(0);
    s.poodleKink.setTarget(0);
    s.catSquash.setTarget(1);
    s.bunnyLean.setTarget(0);
    s.bunnyEarFold.setTarget(0);
    s.duckLean.setTarget(0);
    s.duckSquint.setTarget(0);

    if (mood === 'idle') {
      s.lookX.setTarget(state.current.mouseX);
      s.lookY.setTarget(state.current.mouseY);
    } 
    else if (mood === 'typing') {
      s.lookX.setTarget(lookAtHint.x);
      s.lookY.setTarget(lookAtHint.y);
      s.poodleBend.setTarget(lookAtHint.x * 0.4); // lean towards input
      s.bunnyLean.setTarget(3); // deg
      s.duckLean.setTarget(4);
    }
    else if (mood === 'shy') {
      s.lookX.setTarget(-50); // look away
      s.lookY.setTarget(50);
      s.bunnyEarFold.setTarget(1); // fold ears
      s.poodleBend.setTarget(-10); // lean away
      s.duckSquint.setTarget(1);
    }
    else if (mood === 'error') {
      s.lookX.setTarget(0);
      s.lookY.setTarget(30); // look down
      s.poodleKink.setTarget(1); // zig zag
      s.catSquash.setTarget(0.85); // sad squash
    }
    else if (mood === 'submitting') {
      s.lookX.setTarget(0);
      s.lookY.setTarget(20);
    }
    else if (mood === 'success') {
      if (!state.current.successTriggered) {
        state.current.successTriggered = true;
        // Hop wave
        s.catHop.velocity = -200;
        setTimeout(() => s.bunnyHop.velocity = -200, 100);
        setTimeout(() => s.poodleHop.velocity = -200, 200);
        setTimeout(() => s.duckHop.velocity = -200, 300);
      }
      s.lookX.setTarget(0);
      s.lookY.setTarget(-30);
    }

    if (mood !== 'success') {
      state.current.successTriggered = false;
    }
    
    // Wake up loop
    if (!state.current.rAF) {
      state.current.lastTime = performance.now();
      state.current.rAF = requestAnimationFrame(tick);
    }
  }, [mood, lookAtHint]);

  // Intro animation trigger
  useEffect(() => {
    springs.current.introVal.setTarget(1);
    if (!state.current.rAF) {
      state.current.lastTime = performance.now();
      state.current.rAF = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(state.current.rAF);
  }, []);

  const getPoodlePath = (bend, kink) => {
    // max bend 35px, max kink 20px
    const dx = bend;
    const kx = kink * 20;
    
    const bl = [100, 380];
    const tl = [100 + dx, 40];
    const br = [253, 380];
    const tr = [253 + dx, 40];
    
    if (kink > 0.01) {
      return `M ${bl[0]} ${bl[1]} L ${100 + dx*0.3 - kx} 260 L ${100 + dx*0.6 + kx} 150 L ${tl[0]} ${tl[1]} L ${tr[0]} ${tr[1]} L ${253 + dx*0.6 + kx} 150 L ${253 + dx*0.3 - kx} 260 L ${br[0]} ${br[1]} Z`;
    }
    return `M ${bl[0]} ${bl[1]} Q ${100 + dx*0.5} 210 ${tl[0]} ${tl[1]} L ${tr[0]} ${tr[1]} Q ${253 + dx*0.5} 210 ${br[0]} ${br[1]} Z`;
  };

  const tick = (time) => {
    const dt = (time - state.current.lastTime) / 1000;
    state.current.lastTime = time;
    
    // If user prefers reduced motion, force settle
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    let allSettled = true;
    const s = springs.current;
    
    if (prefersReduced) {
      Object.values(s).forEach(spring => {
        spring.value = spring.target;
        spring.settled = true;
      });
    } else {
      Object.values(s).forEach(spring => {
        if (!spring.update(dt)) allSettled = false;
      });
      // Idle mouse tracking continuously updates target slightly, 
      // but we can allow it to settle if mouse stops.
      if (mood === 'idle' && (Math.abs(s.lookX.target - state.current.mouseX) > 1 || Math.abs(s.lookY.target - state.current.mouseY) > 1)) {
        s.lookX.setTarget(state.current.mouseX);
        s.lookY.setTarget(state.current.mouseY);
        allSettled = false;
      }
    }

    // Apply secondary springs
    s.poodleTopknotLag.setTarget(s.poodleBend.value);
    if (!prefersReduced) {
      if (!s.poodleTopknotLag.update(dt)) allSettled = false;
    } else {
      s.poodleTopknotLag.value = s.poodleBend.value;
    }

    // Render DOM updates
    const intro = s.introVal.value; // 0 to 1
    
    if (refs.poodleBody.current) {
      const bend = s.poodleBend.value;
      const kink = s.poodleKink.value;
      refs.poodleBody.current.setAttribute('d', getPoodlePath(bend, kink));
      refs.poodleBody.current.setAttribute('transform', `translate(0, ${s.poodleHop.value}) scale(1, ${intro})`);
      
      const headX = bend;
      const headY = s.poodleHop.value;
      if (refs.poodleHead.current) refs.poodleHead.current.setAttribute('transform', `translate(${headX}, ${headY})`);
      
      const lag = s.poodleBend.value - s.poodleTopknotLag.value;
      if (refs.poodleTopknot.current) refs.poodleTopknot.current.setAttribute('transform', `translate(${-lag}, 0)`);
      
      const eyeX = (s.lookX.value * 0.1) + headX;
      const eyeY = (s.lookY.value * 0.1) + headY + (mood === 'shy' ? 5 : 0);
      if (refs.poodleEyes.current) refs.poodleEyes.current.setAttribute('transform', `translate(${eyeX}, ${eyeY})`);
    }

    if (refs.catBodyGroup.current) {
      const cy = 380;
      refs.catBodyGroup.current.setAttribute('transform', `translate(0, ${s.catHop.value}) scale(${intro}, ${s.catSquash.value * intro}) translate(0, ${-cy * (1 - s.catSquash.value * intro)})`);
      
      const faceX = (s.lookX.value * 0.15);
      const faceY = (s.lookY.value * 0.15) + (mood === 'error' ? 5 : 0);
      if (refs.catFace.current) refs.catFace.current.setAttribute('transform', `translate(${faceX}, ${faceY})`);
      
      const earRot = (s.lookX.value * 0.2);
      if (refs.catEars.current) refs.catEars.current.setAttribute('transform', `rotate(${earRot}, 127, 250)`);
    }

    if (refs.bunnyGroup.current) {
      refs.bunnyGroup.current.setAttribute('transform', `translate(0, ${s.bunnyHop.value}) rotate(${s.bunnyLean.value}, 257, 380) scale(${intro})`);
      const earScale = 1 - (s.bunnyEarFold.value * 0.8);
      if (refs.bunnyEars.current) refs.bunnyEars.current.setAttribute('transform', `translate(0, ${140 * (1 - earScale)}) scale(1, ${earScale})`);
    }

    if (refs.duckGroup.current) {
      refs.duckGroup.current.setAttribute('transform', `translate(0, ${s.duckHop.value}) rotate(${s.duckLean.value}, 335, 380) scale(${intro})`);
      const beakX = (s.lookX.value * 0.15);
      if (refs.duckBeak.current) refs.duckBeak.current.setAttribute('transform', `translate(${beakX}, 0)`);
      if (refs.duckEyes.current) refs.duckEyes.current.setAttribute('transform', `translate(${beakX}, ${(s.duckSquint.value * 2)})`);
    }

    if (refs.bubbles.current) {
      refs.bubbles.current.style.opacity = mood === 'success' ? '1' : '0';
    }

    if (allSettled) {
      state.current.rAF = null;
    } else {
      state.current.rAF = requestAnimationFrame(tick);
    }
  };

  return (
    <div className={`relative w-full h-full flex items-end justify-center overflow-hidden pointer-events-none ${className}`}>
      <svg ref={svgRef} viewBox="0 0 390 400" className="w-full h-auto max-h-full origin-bottom">
        {/* Ground Line */}
        <line x1="0" y1="380" x2="390" y2="380" stroke="var(--color-outline-variant)" strokeWidth="3" />
        
        {/* Poodle (Back) */}
        <path ref={refs.poodleBody} fill={COLORS.poodle} />
        <g ref={refs.poodleHead}>
          <circle ref={refs.poodleTopknot} cx="176" cy="40" r="30" fill={COLORS.poodle} />
          {/* Ears */}
          <ellipse cx="120" cy="70" rx="15" ry="30" fill={COLORS.poodle} />
          <ellipse cx="230" cy="70" rx="15" ry="30" fill={COLORS.poodle} />
          {/* Face */}
          <g ref={refs.poodleEyes}>
            <circle cx="160" cy="50" r="4" fill="white" />
            <circle cx="160" cy="50" r="2" fill="black" />
            <circle cx="192" cy="50" r="4" fill="white" />
            <circle cx="192" cy="50" r="2" fill="black" />
            <circle cx="176" cy="62" r="3" fill="#111" />
            {mood === 'error' ? (
              <path d="M 168 72 Q 176 68 184 72" stroke="black" strokeWidth="2" fill="none" />
            ) : (
              <path d="M 168 70 Q 176 74 184 70" stroke="black" strokeWidth="2" fill="none" />
            )}
          </g>
        </g>

        {/* Bunny (Middle) */}
        <g ref={refs.bunnyGroup}>
          <g ref={refs.bunnyEars}>
            <path d={SHAPES.bunny.earL} fill={COLORS.bunny} />
            <path d={SHAPES.bunny.earInnerL} fill="#ffb6c1" />
            <path d={SHAPES.bunny.earR} fill={COLORS.bunny} />
            <path d={SHAPES.bunny.earInnerR} fill="#ffb6c1" />
          </g>
          <path d={SHAPES.bunny.body} fill={COLORS.bunny} />
          <g>
            {mood === 'shy' ? (
              <>
                <path d="M 235 170 Q 242 165 249 170" stroke="white" strokeWidth="3" fill="none" />
                <path d="M 265 170 Q 272 165 279 170" stroke="white" strokeWidth="3" fill="none" />
              </>
            ) : (
              <>
                <circle cx="242" cy="170" r="6" fill="white" />
                <circle cx="242" cy="170" r="2" fill="black" />
                <circle cx="272" cy="170" r="6" fill="white" />
                <circle cx="272" cy="170" r="2" fill="black" />
              </>
            )}
            <ellipse cx="257" cy="180" rx="3" ry="2" fill="#ffb6c1" />
          </g>
        </g>

        {/* Duck (Right) */}
        <g ref={refs.duckGroup}>
          <path d={SHAPES.duck.body} fill={COLORS.duck} />
          <path d={SHAPES.duck.wing} fill="#ccb610" />
          <g ref={refs.duckEyes}>
            {mood === 'shy' ? (
              <>
                <path d="M 330 220 L 336 220" stroke="black" strokeWidth="2" />
                <path d="M 350 220 L 356 220" stroke="black" strokeWidth="2" />
              </>
            ) : (
              <>
                <circle cx="333" cy="220" r="2" fill="black" />
                <circle cx="353" cy="220" r="2" fill="black" />
              </>
            )}
            {mood === 'error' && (
              <path d="M 360 210 Q 365 215 360 220" stroke="#88b" strokeWidth="2" fill="none" />
            )}
          </g>
          <g ref={refs.duckBeak}>
            {mood === 'error' ? (
              <path d="M 320 235 Q 335 230 350 235 Q 365 240 380 235 L 350 240 Z" fill="#e65c00" />
            ) : (
              <path d={SHAPES.duck.beak} fill="#e65c00" />
            )}
          </g>
        </g>

        {/* Ginger Cat (Front-left) */}
        <g ref={refs.catBodyGroup}>
          <g ref={refs.catEars}>
            <path d={SHAPES.cat.earL} fill={COLORS.cat} />
            <path d={SHAPES.cat.earR} fill={COLORS.cat} />
          </g>
          <path d={SHAPES.cat.body} fill={COLORS.cat} />
          <g ref={refs.catFace}>
            {mood === 'shy' ? (
              <>
                <path d="M 107 310 Q 112 305 117 310" stroke="#333" strokeWidth="2" fill="none" />
                <path d="M 137 310 Q 142 305 147 310" stroke="#333" strokeWidth="2" fill="none" />
              </>
            ) : (
              <>
                <circle cx="112" cy="310" r="3" fill="#222" />
                <circle cx="142" cy="310" r="3" fill="#222" />
              </>
            )}
            
            {mood === 'error' ? (
              <path d="M 120 325 Q 127 320 134 325" stroke="#222" strokeWidth="2" fill="none" />
            ) : mood === 'typing' ? (
              <ellipse cx="127" cy="322" rx="2" ry="3" fill="#222" />
            ) : (
              <path d="M 120 320 Q 127 326 134 320" stroke="#222" strokeWidth="2" fill="none" />
            )}
            
            {/* Whiskers */}
            <path d="M 90 315 L 70 310 M 90 320 L 68 320 M 90 325 L 70 330" stroke="#fff" strokeWidth="1.5" opacity="0.6" />
            <path d="M 164 315 L 184 310 M 164 320 L 186 320 M 164 325 L 184 330" stroke="#fff" strokeWidth="1.5" opacity="0.6" />
          </g>
        </g>
        
        {/* Success Bubbles */}
        <g ref={refs.bubbles} style={{ transition: 'opacity 0.3s' }} opacity="0">
          <circle cx="127" cy="180" r="10" fill="var(--color-primary)" opacity="0.3" className="animate-pulse" />
          <circle cx="200" cy="120" r="15" fill="var(--color-secondary)" opacity="0.3" className="animate-pulse" style={{ animationDelay: '200ms' }} />
          <circle cx="300" cy="150" r="8" fill="var(--color-tertiary)" opacity="0.3" className="animate-pulse" style={{ animationDelay: '400ms' }} />
        </g>
      </svg>
    </div>
  );
}
