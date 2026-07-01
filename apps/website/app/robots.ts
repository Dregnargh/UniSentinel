import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://unisentinel.com/sitemap.xml",
    host: "https://unisentinel.com",
  };
}
