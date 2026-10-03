import { getCategories, getProducts, getSlides } from "@/lib/api";
import InteractiveHomeView from "@/components/home/InteractiveHomeView";

export const revalidate = 0;

export const metadata = {
  title: "The Vibe | Streetwear & Heavyweight Apparel",
  description:
    "Explore meticulously crafted streetwear, 450 GSM French Terry hoodies, boxy graphic tees, and daily essentials.",
};

export default async function HomePage() {
  const [slides, categories, products] = await Promise.all([
    getSlides(),
    getCategories(),
    getProducts(),
  ]);

  return (
    <InteractiveHomeView
      slides={slides}
      categories={categories}
      products={products}
    />
  );
}
