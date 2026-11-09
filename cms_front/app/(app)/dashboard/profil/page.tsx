import type { Metadata } from "next";
import { ProfileForms } from "@/components/admin/profile-forms";

export const metadata: Metadata = { title: "Mon profil" };

export default function ProfilePage() {
    return <ProfileForms />;
}
