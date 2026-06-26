import { ProfileClient } from "@/components/profile/ProfileClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | ThreadCounty",
  description: "Manage your ThreadCounty profile and account settings.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
