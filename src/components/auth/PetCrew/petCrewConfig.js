// Configuration and static shape data for the Pet Crew.
// To swap animals or change colors, edit this file.

export const COLORS = {
  poodle: 'var(--color-poodle)',
  cat: 'var(--color-cat)',
  bunny: 'var(--color-bunny)',
  duck: 'var(--color-duck)'
};

// We define the base shapes here. 
// Some shapes (like the poodle body) are procedurally generated in the render loop.
export const SHAPES = {
  cat: {
    // Semicircle x0-255, y250-380
    body: "M 0 380 A 127.5 127.5 0 0 1 255 380 Z",
    // Left ear, Right ear
    earL: "M 30 270 L 60 210 L 90 250 Z",
    earR: "M 165 250 L 195 210 L 225 270 Z"
  },
  bunny: {
    // Rectangle x210-305, y139-380
    body: "M 210 380 L 210 139 C 210 120 305 120 305 139 L 305 380 Z",
    earL: "M 225 145 C 225 20 255 20 255 145 Z",
    earInnerL: "M 233 140 C 233 40 247 40 247 140 Z",
    earR: "M 260 145 C 260 20 290 20 290 145 Z",
    earInnerR: "M 268 140 C 268 40 282 40 282 140 Z"
  },
  duck: {
    // Pill x280-390, y199-380
    body: "M 280 380 L 280 254 A 55 55 0 0 1 390 254 L 390 380 Z",
    wing: "M 300 300 C 340 300 360 340 360 380 C 320 380 300 340 300 300 Z",
    beak: "M 320 230 Q 335 240 350 230 Q 365 240 380 230 Q 365 250 350 245 Q 335 250 320 230 Z"
  }
};
