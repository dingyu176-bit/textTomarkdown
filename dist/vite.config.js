import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
    base: "/text/",
    plugins: [
        react(),
        nodePolyfills(), // ✅ 关键：替代 path / process / url 等 Node 能力
    ],
    server: {
        host: true,
        port: 6288,
        allowedHosts: true,
    },
});