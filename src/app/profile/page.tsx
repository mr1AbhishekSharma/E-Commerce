import ProfileView from "@/components/ProfileView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Profile | The Vibe",
  description: "Manage your personal account details, shipping addresses, and preferences at The Vibe.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
