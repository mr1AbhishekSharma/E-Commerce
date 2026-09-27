import WishlistView from "@/components/WishlistView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Wishlist | The Vibe",
  description: "View and manage your saved fashion favorites at The Vibe.",
};

export default function WishlistPage() {
  return <WishlistView />;
}
