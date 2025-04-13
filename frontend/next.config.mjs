/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                // pathname: '/p/**', // Optional: More specific path if needed
            },
            {
                protocol: 'https',
                hostname: 'lh4.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'lh5.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'lh6.googleusercontent.com',
            },
            // Add Google Street View hostname
            {
                protocol: 'https',
                hostname: 'streetviewpixels-pa.googleapis.com',
            },
            // Add other Google User Content hostnames if necessary
        ],
    },
};

export default nextConfig; 