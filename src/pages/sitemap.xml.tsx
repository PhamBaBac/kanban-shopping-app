import { GetServerSideProps } from "next";
import { appInfo } from "@/constants/appInfos";
import axios from "axios";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = appInfo.siteUrl || "http://localhost:3004";

  const staticRoutes = [
    "",
    "/shop",
    "/story",
    "/contact",
  ];

  let productUrls: string[] = [];
  try {
    const response = await axios.get(`${appInfo.baseUrl}/public/products?page=1&pageSize=100`, {
      timeout: 3000,
    });
    const products = response.data?.data || response.data || [];
    if (Array.isArray(products)) {
      productUrls = products.map((p: any) => `/products/${p.slug || "detail"}/${p.id}`);
    }
  } catch {
    // Fallback gracefully if API is offline
  }

  const allUrls = [
    ...staticRoutes.map((route) => `${baseUrl}${route}`),
    ...productUrls.map((route) => `${baseUrl}${route}`),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${url === baseUrl ? "hourly" : "daily"}</changefreq>
    <priority>${url === baseUrl ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default function Sitemap() {
  return null;
}
