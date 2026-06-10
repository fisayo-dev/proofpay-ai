export const DELIVERY_METHODS = [
  "CU hostel delivery",
  "Campus pickup",
  "Lagos city dispatch",
  "Nationwide courier",
] as const;

export const CURRENCY = "NGN";
export const DEFAULT_DELIVERY_METHOD = DELIVERY_METHODS[0];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];