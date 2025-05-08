"use client";

import { CrossmintProvider, CrossmintAuthProvider } from "@crossmint/client-sdk-react-ui";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CrossmintProvider apiKey={process.env.NEXT_PUBLIC_CROSSMINT_API_KEY ?? ""}>
      <CrossmintAuthProvider
        loginMethods={["email", "google", "farcaster"]} // Email, Google, and Farcaster login methods
      >
        {children}
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
} 