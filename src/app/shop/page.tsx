import { getCategories, getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface ShopPageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export const revalidate = 0;

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category, search } = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(category, search),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="border-b border-gray-100 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          {category ? `${category.toUpperCase()} Collection` : "All Products"}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Browse through {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Categories
            </h3>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link
                  href="/shop"
                  className={`block px-3 py-2 rounded-lg transition ${
                    !category ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/shop?category=${cat.slug}`}
                    className={`block px-3 py-2 rounded-lg transition ${
                      category === cat.slug
                        ? "bg-black text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {cat.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-500 text-sm">No products found matching your filter.</p>
              <Link
                href="/shop"
                className="mt-4 inline-block bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition"
              >
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
