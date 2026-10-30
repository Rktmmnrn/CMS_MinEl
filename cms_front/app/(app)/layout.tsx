import type { Metadata } from "next";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return <Providers>{children}</Providers>;
}
