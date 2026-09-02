/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许局域网 IP 和本机域名在开发模式下跨域加载资源
  allowedDevOrigins: ['192.168.112.1:3000', 'localhost:3000'],
};

export default nextConfig;