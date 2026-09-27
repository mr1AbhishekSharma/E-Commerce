import Link from "next/link";
import { Heart } from "lucide-react";
import { YoutubeIcon, InstagramIcon, TwitterIcon } from "@/components/SocialIcons";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-300 pt-16 pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <span className="text-2xl font-black tracking-tight text-white">
              <span className="text-3xl font-extrabold text-indigo-500">T</span>HE VIBE
            </span>
            <p className="text-sm text-neutral-400">
              Modern apparel and lifestyle essentials designed for everyday comfort, quality, and effortless confidence.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="https://www.youtube.com/@user-Abhishek0079"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-red-500 transition"
                aria-label="YouTube"
              >
                <YoutubeIcon className="w-5 h-5 text-red-500" />
              </a>
              <a
                href="https://www.instagram.com/mr1abhisheksharma/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-pink-400 transition"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5 text-pink-400" />
              </a>
              <a
                href="https://x.com/KingAbhi07_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-sky-400 transition"
                aria-label="Twitter"
              >
                <TwitterIcon className="w-5 h-5 text-sky-400" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition">
                  Shop All
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition">
                  Shopping Bag
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition">
                  My Orders
                </Link>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@user-Abhishek0079"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-400 transition text-red-400 font-medium"
                >
                  YouTube Channel
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Customer Support
            </h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/orders" className="hover:text-white transition">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-white transition">
                  Returns & Refunds
                </Link>
              </li>
              <li className="text-neutral-500">Free Express Shipping &gt; $100</li>
              <li className="text-neutral-500">24/7 Dedicated Support</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Join the Vibe
            </h4>
            <p className="text-sm text-neutral-400 mb-3">
              Subscribe for exclusive drops, offers, and seasonal discounts.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white flex-grow"
              />
              <button
                type="button"
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-200 transition"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} The Vibe. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with Django DRF & Next.js <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
