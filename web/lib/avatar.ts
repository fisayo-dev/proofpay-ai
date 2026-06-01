const AVATAR_BACKGROUND_COLORS = "f0f9ff,e0f2fe,ecfeff";

export function getVendorAvatarUrl(seedParts: Array<string | null | undefined>) {
  const seed =
    seedParts
      .filter(Boolean)
      .join("-")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 96) || "vendor";

  return `https://api.dicebear.com/10.x/lorelei/svg?seed=${seed}&radius=50&color=${AVATAR_BACKGROUND_COLORS}`
}
