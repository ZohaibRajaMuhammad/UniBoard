import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { DeploymentSetupNotice } from "@/components/system/DeploymentSetupNotice";
import { appEnv, isAppConfigured } from "@/lib/deployment";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniBoard",
  description: "Academic collaboration workspace with grounded AI, live rooms, and structured course operations."
};

export const viewport: Viewport = {
  themeColor: "#3657f7",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-light" data-theme="light" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {isAppConfigured ? (
          <ClerkProvider publishableKey={appEnv.clerkPublishableKey}>
            <ThemeProvider>
              <NotificationProvider>
                <ConvexClientProvider>{children}</ConvexClientProvider>
              </NotificationProvider>
            </ThemeProvider>
          </ClerkProvider>
        ) : (
          <DeploymentSetupNotice />
        )}
      </body>
    </html>
  );
}
