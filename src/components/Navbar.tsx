"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Menu, X, User as UserIcon, LogOut, Package, Heart } from "lucide-react";
import { YoutubeIcon, InstagramIcon, TwitterIcon } from "@/components/SocialIcons";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useWishlist } from "@/context/WishlistContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { totalCount } = useCart();
  const { user, logout } = useAuth();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const { wishlistCount } = useWishlist();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Top Banner Bar */}
      <div className="bg-black text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          {/* Social Icons & Channel */}
          <div className="flex items-center space-x-4">
            <a
              href="https://www.youtube.com/@user-Abhishek0079"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-red-400 transition flex items-center gap-1.5"
              title="YouTube"
            >
              <YoutubeIcon className="w-4 h-4 text-red-500" />
              <span>YouTube</span>
            </a>
            <a
              href="https://www.instagram.com/mr1abhisheksharma/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-400 transition flex items-center gap-1.5"
              title="Instagram"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>Instagram</span>
            </a>
            <a
              href="https://x.com/KingAbhi07_"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-400 transition flex items-center gap-1.5"
              title="Twitter"
            >
              <TwitterIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>Twitter</span>
            </a>
          </div>

          {/* Announcement */}
          <p className="tracking-wide text-gray-300 text-center">
            Free shipping on orders over {formatPrice(100)}
          </p>

          {/* Currency Switcher & Auth / Admin */}
          <div className="flex items-center space-x-4 text-xs">
            {/* Currency Pill */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-full p-0.5">
              <button
                onClick={() => setCurrency("INR")}
                className={`px-2 py-0.5 rounded-full transition font-semibold ${
                  currency === "INR"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Indian Rupee"
              >
                ₹ INR
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-2 py-0.5 rounded-full transition font-semibold ${
                  currency === "USD"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="US Dollar"
              >
                $ USD
              </button>
            </div>

            {user ? (
              <span className="hidden sm:inline text-gray-300">
                Hi, <strong className="text-white">{user.username}</strong>
              </span>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 text-gray-300">
                <Link href="/login" className="hover:text-white transition">
                  Sign In
                </Link>
                <span>/</span>
                <Link href="/register" className="hover:text-white transition">
                  Register
                </Link>
              </div>
            )}
            <a href="http://127.0.0.1:8000/admin/" target="_blank" className="hidden sm:inline text-gray-400 hover:text-white transition">
              Admin
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-1 group">
              <span className="text-2xl font-black tracking-tight text-black group-hover:text-neutral-800 transition">
                <span className="text-3xl font-extrabold text-indigo-600">T</span>HE VIBE
              </span>
            </Link>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <Link href="/" className="hover:text-black transition">
              Home
            </Link>
            <Link href="/shop" className="hover:text-black transition">
              Shop All
            </Link>
            <Link href="/shop?category=hoodiessweatshirts" className="hover:text-black transition">
              Hoodies
            </Link>
            <Link href="/shop?category=t-shirts" className="hover:text-black transition">
              T-Shirts
            </Link>
            <Link href="/shop?category=bags" className="hover:text-black transition">
              Bags
            </Link>
            {user && (
              <Link href="/orders" className="hover:text-black transition">
                My Orders
              </Link>
            )}
          </nav>

          {/* Cart & Auth Actions */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition p-1.5 rounded-full hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                    {user.username.slice(0, 2)}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <UserIcon className="w-4 h-4 text-gray-500" />
                      My Profile
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Package className="w-4 h-4 text-gray-500" />
                      My Orders
                    </Link>
                    <Link
                      href="/refund"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Request Refund
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left border-t border-gray-100"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-black transition p-1 rounded-lg hover:bg-gray-50"
              >
                <UserIcon className="w-5 h-5 text-gray-600" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="relative p-2 text-gray-700 hover:text-red-600 transition flex items-center"
              aria-label="Wishlist"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-black transition flex items-center"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[11px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {totalCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-black"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-black" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-2">
          {/* Mobile Currency Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
            <span className="text-gray-500">Currency</span>
            <div className="flex items-center bg-gray-100 rounded-full p-0.5">
              <button
                onClick={() => setCurrency("INR")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  currency === "INR" ? "bg-black text-white" : "text-gray-600"
                }`}
              >
                ₹ INR
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  currency === "USD" ? "bg-black text-white" : "text-gray-600"
                }`}
              >
                $ USD
              </button>
            </div>
          </div>

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded px-2"
          >
            Home
          </Link>
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded px-2"
          >
            Shop All
          </Link>
          <Link
            href="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded px-2 flex justify-between items-center"
          >
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded px-2 flex justify-between items-center"
          >
            <span>Cart</span>
            {totalCount > 0 && (
              <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {totalCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded px-2"
              >
                My Profile
              </Link>
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded px-2"
              >
                My Orders
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded px-2"
              >
                Sign Out ({user.username})
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-gray-100 flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-sm font-medium bg-black text-white rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-sm font-medium border border-gray-300 text-gray-800 rounded-lg"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
