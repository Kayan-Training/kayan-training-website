import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kayan Training & Consulting",
    short_name: "Kayan",
    description: "Multilingual platform for events, consulting, and knowledge content.",
    start_url: "/",
    display: "standalone",
    background_color: "#121414",
    theme_color: "#121414",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
