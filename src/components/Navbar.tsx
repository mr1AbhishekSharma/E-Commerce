"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { YoutubeIcon, InstagramIcon, TwitterIcon } from "@/components/SocialIcons";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Top Banner Bar */}
      <div className="bg-black text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
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
          <p className="tracking-wide text-gray-300">
            Free shipping on standard orders over $100
          </p>
          <div className="hidden sm:flex items-center space-x-3 text-gray-400 text-xs">
            <a href="http://127.0.0.1:8000/admin/" target="_blank" className="hover:text-white transition">
              Admin Portal
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
                <span className="text-3xl font-extrabold">T</span>HE VIBE
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
          </nav>

          {/* Cart & Actions */}
          <div className="flex items-center space-x-5">
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-black transition flex items-center"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="ml-1 text-xs font-semibold bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Mobile menu button */}
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
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded px-2"
          >
            Cart
          </Link>
        </div>
      )}
    </header>
  );
}
