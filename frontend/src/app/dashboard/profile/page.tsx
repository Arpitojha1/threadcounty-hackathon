import { ProfileClient } from "@/components/profile/ProfileClient";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile | ThreadCounty",
  description: "Manage your ThreadCounty profile and account settings.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    
    isAdmin = profile?.is_admin === true;
  }

  return <ProfileClient isAdmin={isAdmin} />;
}
