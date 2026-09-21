/**
 * @format
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  reactStrictMode: true,
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
