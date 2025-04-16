/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  // 对动态路由进行设置
  trailingSlash: true,
  // 确保静态资产使用相对路径而非绝对路径
  assetPrefix: "",
  basePath: "",
  // 当使用静态导出时，不支持服务器端API路由
  // 如果应用有API路由，需要考虑替代方案
};

module.exports = nextConfig;
