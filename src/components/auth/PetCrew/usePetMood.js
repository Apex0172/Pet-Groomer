import { useMemo, useEffect, useRef } from 'react';

export function usePetMood({ focusedField, passwordVisible, status }) {
  // We track the previous passwordVisible state to trigger a "hop" 
  // when the password gets hidden again. But since animations are handled
  // in the rAF loop, we might just pass `mood` down. If we need a hop, 
  // we could just let the rAF loop handle the transition.
  
  const mood = useMemo(() => {
    if (status === 'success') return 'success';
    if (status === 'error') return 'error';
    if (status === 'submitting') return 'submitting';
    
    // If password is visible (and maybe they are looking at it), they get shy
    // We'll just check if it's visible. If they are focusing email but password is visible?
    // Usually passwordVisible is a global toggle, so if it's true, they are shy.
    if (passwordVisible) return 'shy';
    
    if (focusedField === 'email' || focusedField === 'password') {
      return 'typing';
    }
    
    return 'idle';
  }, [focusedField, passwordVisible, status]);

  // Determine an approximate lookAt point in a [0, 1] normalized space (or pixels).
  // The animation loop expects pixel offsets from the center of the panel.
  // For simplicity, we can pass normalized hints to the animation loop.
  // If focusedField === 'email', target is higher. If 'password', slightly lower.
  // We'll let the layout pass a specific `lookAt` coordinate if we want exact tracking,
  // or we can just send { x, y } hints here.
  const lookAtHint = useMemo(() => {
    // These are arbitrary normalized coordinates [x, y] relative to the form's center.
    // The actual tracking will be refined in the rAF loop.
    if (focusedField === 'email') return { x: 150, y: -50 };
    if (focusedField === 'password') return { x: 150, y: 50 };
    return { x: 0, y: 0 }; // idle will track mouse anyway
  }, [focusedField]);

  return { mood, lookAtHint };
}
