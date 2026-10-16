import "./globals.css";
import type { Metadata, Viewport } from "next";
import { hospitalConfig } from "@/lib/config/runtime";
import PwaRegistration from "@/components/PwaRegistration";
export const metadata: Metadata = { title: hospitalConfig.branding.appName, description: "Hospital disaster preparedness and operations", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { themeColor: hospitalConfig.branding.primaryColor };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="th"><body><PwaRegistration/><header className="top"><strong>{hospitalConfig.branding.appName}</strong><span>{hospitalConfig.identity.shortNameTh}</span></header>{children}</body></html>; }
