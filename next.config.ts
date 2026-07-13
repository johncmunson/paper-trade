import type { NextConfig } from "next"
import { marketAlwaysOpen } from "./lib/marketConfig"

marketAlwaysOpen()

const nextConfig: NextConfig = {}

export default nextConfig
