import type { NextConfig } from "next";

// "standalone" produces a small self-contained server, which is what the Docker image runs.
const config: NextConfig = { output: "standalone" };

export default config;
