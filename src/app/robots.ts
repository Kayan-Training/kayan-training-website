import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        allow: "/",
        disallow: ["/dashboard", "/ar/dashboard", "/en/dashboard", "/ar/auth", "/en/auth", "/ar/search", "/en/search"],
        userAgent: "*",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
