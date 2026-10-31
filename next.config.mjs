/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/tools", destination: "/legacy/tools.html" },
      { source: "/owner", destination: "/legacy/owner.html" },
      { source: "/share", destination: "/legacy/share.html" },
      { source: "/resume", destination: "/legacy/resume.html" },
    ];
  },
  async redirects() {
    return [
      { source: "/tools.html", destination: "/tools", permanent: true },
      { source: "/owner.html", destination: "/owner", permanent: true },
      { source: "/share.html", destination: "/share", permanent: true },
      { source: "/resume.html", destination: "/resume", permanent: true },
    ];
  },
};
export default nextConfig;
