/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/spreadsheet', destination: '/' },
      { source: '/students', destination: '/' },
      { source: '/results', destination: '/' },
      { source: '/courses', destination: '/' },
      { source: '/semesters', destination: '/' },
      { source: '/analytics', destination: '/' },
      { source: '/rankings', destination: '/' },
      { source: '/reports', destination: '/' },
      { source: '/import-export', destination: '/' },
      { source: '/settings', destination: '/' },
    ];
  },
};

export default nextConfig;
