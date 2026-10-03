import { getCategories, getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import ScrollablePriceRange from "@/components/ScrollablePriceRange";
import Link from "next/link";
import { SlidersHorizontal, X, Search, Sparkles } from "lucide-react";

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    min_price?: string;
    max_price?: string;
  }>;
}

export const revalidate = 0;

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category, search, sort, min_price, max_price } = await searchParams;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      categorySlug: category,
      search,
      ordering: sort,
      minPrice: min_price ? parseFloat(min_price) : undefined,
      maxPrice: max_price ? parseFloat(max_price) : undefined,
    }),
  ]);

  const hasActiveFilters = Boolean(category || search || sort || min_price || max_price);

  const buildFilterUrl = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    if (min_price) params.set("min_price", min_price);
    if (max_price) params.set("max_price", max_price);

    for (const [key, val] of Object.entries(newParams)) {
      if (val === undefined || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    const q = params.toString();
    return q ? `/shop?${q}` : "/shop";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Bar */}
      <div className="border-b border-gray-100 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-gray-900">
              {search
                ? `Results for “${search}”`
                : category
                ? `${category.replace(/-/g, " ").toUpperCase()} Collection`
                : "Explore Collection"}
            </h1>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Showing {products.length} {products.length === 1 ? "fashion item" : "fashion items"}
          </p>
        </div>

        {/* Sort & Filters Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Active Filter Pills or Clear */}
          {hasActiveFilters && (
            <Link
              href="/shop"
              className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </Link>
          )}

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 ml-auto">
            <span className="text-gray-400 font-semibold uppercase">Sort:</span>
            <div className="flex items-center space-x-2">
              <Link
                href={buildFilterUrl({ sort: undefined })}
                className={`font-semibold hover:text-black transition ${
                  !sort ? "text-black underline" : "text-gray-500"
                }`}
              >
                Featured
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href={buildFilterUrl({ sort: "price_asc" })}
                className={`font-semibold hover:text-black transition ${
                  sort === "price_asc" ? "text-black underline" : "text-gray-500"
                }`}
              >
                Price: Low
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href={buildFilterUrl({ sort: "price_desc" })}
                className={`font-semibold hover:text-black transition ${
                  sort === "price_desc" ? "text-black underline" : "text-gray-500"
                }`}
              >
                Price: High
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href={buildFilterUrl({ sort: "newest" })}
                className={`font-semibold hover:text-black transition ${
                  sort === "newest" ? "text-black underline" : "text-gray-500"
                }`}
              >
                Newest
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="space-y-6">
          {/* Categories Filter */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-black" />
              Categories
            </h3>
            <ul className="space-y-1 text-sm font-medium">
              <li>
                <Link
                  href={buildFilterUrl({ category: undefined })}
                  className={`block px-3 py-2 rounded-xl transition ${
                    !category
                      ? "bg-black text-white font-bold"
                      : "text-gray-700 hover:bg-neutral-50"
                  }`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={buildFilterUrl({ category: cat.slug })}
                    className={`block px-3 py-2 rounded-xl transition ${
                      category === cat.slug
                        ? "bg-black text-white font-bold"
                        : "text-gray-700 hover:bg-neutral-50"
                    }`}
                  >
                    {cat.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Scrollable Price Range Filter */}
          <ScrollablePriceRange
            minPrice={min_price ? parseFloat(min_price) : null}
            maxPrice={max_price ? parseFloat(max_price) : null}
            minBoundary={0}
            maxBoundary={200}
            step={5}
            category={category}
            search={search}
            sort={sort}
            mode="url"
          />
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-dashed border-gray-200 p-8">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No products match your filters</h3>
              <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
                Try loosening your filters or searching with different keywords.
              </p>
              <Link
                href="/shop"
                className="inline-block bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-neutral-800 transition"
              >
                Reset Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 md:gap-6">
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
