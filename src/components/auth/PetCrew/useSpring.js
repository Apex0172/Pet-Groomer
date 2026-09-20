// A simple spring physics helper for requestAnimationFrame loops
// No React state updates per frame, just raw math.

export class Spring {
  constructor(initialValue, config = { stiffness: 170, damping: 14 }) {
    this.value = initialValue;
    this.target = initialValue;
    this.velocity = 0;
    this.stiffness = config.stiffness;
    this.damping = config.damping;
    this.settled = true;
  }

  setTarget(target) {
    if (this.target !== target) {
      this.target = target;
      this.settled = false;
    }
  }

  // dt in seconds
  update(dt) {
    if (this.settled) return true;
    
    // Clamp huge dt values (e.g. tab was hidden)
    if (dt > 0.1) dt = 0.016;
    if (dt <= 0) return this.settled;

    // F = -kX - cv
    const fSpring = -this.stiffness * (this.value - this.target);
    const fDamper = -this.damping * this.velocity;
    
    // a = F/m (assuming m=1)
    const acceleration = fSpring + fDamper;
    
    this.velocity += acceleration * dt;
    this.value += this.velocity * dt;

    if (Math.abs(this.velocity) < 0.01 && Math.abs(this.target - this.value) < 0.01) {
      this.value = this.target;
      this.velocity = 0;
      this.settled = true;
    }
    
    return this.settled;
  }
}
