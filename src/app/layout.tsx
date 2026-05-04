import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { DeploymentSetupNotice } from "@/components/system/DeploymentSetupNotice";
import { appEnv, isAppConfigured } from "@/lib/deployment";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniBoard",
  description: "Real-time anonymous class noticeboard built on Convex and Clerk."
};

export const viewport: Viewport = {
  themeColor: "#3657f7",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 font-sans text-white antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {isAppConfigured ? (
          <ClerkProvider publishableKey={appEnv.clerkPublishableKey}>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ClerkProvider>
        ) : (
          <DeploymentSetupNotice />
        )}
      </body>
    </html>
  );
}
