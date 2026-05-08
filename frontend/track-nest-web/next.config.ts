import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    images: {
        remotePatterns: [{
            protocol: "http",
            hostname: "localhost",
            port: "8800",   
        }]
    }
};

export default nextConfig;
