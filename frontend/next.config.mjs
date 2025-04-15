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
            // Add Freepik hostname(s) - VERIFY THIS IS CORRECT
            {
                protocol: 'https',
                hostname: 'img.freepik.com',
            },
            // Add others if Freepik uses more domains, e.g., 'image.freepik.com'
            // Add hostname for the Leipzig image if it's external and not from Freepik
            {
                protocol: 'https', // Or http if needed
                hostname: 'PLACEHOLDER_FOR_LEIPZIG_IMAGE_HOSTNAME', // e.g., images.unsplash.com
            },
            // Add other Google User Content hostnames if necessary
        ],
    },
};

export default nextConfig; 