import type { MetadataRoute } from "next";

// Web app manifest — gives the app its proper name + icon when added to the
// Home Screen, and `display: standalone` makes it open app-like (also a
// requirement for iOS web push once users install it).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEAR REMIND",
    short_name: "NEAR REMIND",
    description:
      "Save an errand once — we'll nudge you the moment you're close to the right kind of place.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f8",
    theme_color: "#f6f7f8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
