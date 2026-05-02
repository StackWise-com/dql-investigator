export const CAPSULE_COLORS = {
  INFO: 0x2196f3,
  WARN: 0xff9800,
  ERROR: 0xf44336,
  DEBUG: 0x607d8b,
  NONE: 0xeceff1,
};

export const CAPSULE_SIZES = {
  INFO: 1.8,
  WARN: 2.2,
  ERROR: 2.6,
  DEBUG: 1.4,
  NONE: 1.2,
};

export function getCapsuleColor(level) {
  return CAPSULE_COLORS[level] || CAPSULE_COLORS.INFO;
}

export function getCapsuleSize(level) {
  return CAPSULE_SIZES[level] || CAPSULE_SIZES.INFO;
}
