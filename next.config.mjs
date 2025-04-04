import nextPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Enable React strict mode for improved error handling
    swcMinify: true,      // Enable SWC minification for improved performance
    compiler: {
        removeConsole: process.env.NODE_ENV !== "development", // Remove console.log in production
    },
    images: {
        remotePatterns: [{hostname:'*'}]
    }
};

// Configuration object tells the next-pwa plugin 
const withPWA = nextPWA({
    dest: "public", // Destination directory for the PWA files
    // disable: process.env.NODE_ENV === "development", // Disable PWA in development mode
    register: true, // Register the PWA service worker
    skipWaiting: true, // Skip waiting for service worker activation
    customWorkerDir: "worker", // Custom service worker file path
    buildExcludes: [/app-build-manifest.json$/]
});

// Export the combined configuration for Next.js with PWA support
const nextConfigWithPWA = withPWA(nextConfig);

export default nextConfigWithPWA;