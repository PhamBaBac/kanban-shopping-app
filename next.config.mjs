/**
 * @format
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "api.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  transpilePackages: [
    "antd",
    "rc-util",
    "@babel/runtime",
    "@ant-design/icons",
    "@ant-design/icons-svg",
    "rc-pagination",
    "rc-picker",
    "rc-tree",
    "rc-table",
    "rc-input",
  ],
  experimental: {
    // Tối ưu tree-shaking cho các thư viện barrel imports
    // giúp giảm số lượng module được nạp khi compile
    optimizePackageImports: [
      "react-icons",
      "react-icons/bs",
      "react-icons/fa",
      "react-icons/fi",
      "react-icons/hi",
      "react-icons/io",
      "react-icons/md",
      "react-icons/ri",
      "@ant-design/icons",
      "lodash",
      "date-fns",
    ],
  },
};

export default nextConfig;
