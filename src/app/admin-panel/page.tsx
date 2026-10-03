import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Panel | The Vibe Operations",
  description: "Comprehensive management panel for orders, catalog, customers, coupons, reviews and refund operations.",
};

export default function AdminPanelPage() {
  return <AdminDashboard />;
}
