"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  MapPin,
  Package,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Home,
  Star,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import VibeLoader from "@/components/VibeLoader";
import {
  updateUserProfile,
  getUserAddresses,
  createUserAddress,
  deleteUserAddress,
  updateUserAddress,
} from "@/lib/api";
import { BillingAddress } from "@/types";

export default function ProfileView() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, refreshUser } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState<"profile" | "addresses">("profile");

  // Profile Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Addresses state
  const [addresses, setAddresses] = useState<BillingAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newStreet, setNewStreet] = useState("");
  const [newApt, setNewApt] = useState("");
  const [newCountry, setNewCountry] = useState("IN");
  const [newZip, setNewZip] = useState("");
  const [newType, setNewType] = useState<"S" | "B">("S");
  const [newDefault, setNewDefault] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMsg, setAddressMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initialize data from user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/profile");
      return;
    }

    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.profile?.phone || "");
      setGender(user.profile?.gender || "");
    }
  }, [user, authLoading, router]);

  // Load addresses when switching to addresses tab
  const fetchAddresses = async () => {
    if (!token) return;
    setLoadingAddresses(true);
    try {
      const data = await getUserAddresses(token);
      setAddresses(data);
    } catch (err) {
      console.error("Failed to load addresses", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
  }, [token]);

  // Save profile changes
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileSaving(true);
    setProfileMsg(null);

    const res = await updateUserProfile(token, {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      gender: gender,
    });

    setProfileSaving(false);
    if (res.error) {
      setProfileMsg({ type: "error", text: res.error });
    } else {
      setProfileMsg({ type: "success", text: "Profile details updated successfully!" });
      await refreshUser();
      setTimeout(() => setProfileMsg(null), 4000);
    }
  };

  // Add new address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddressSaving(true);
    setAddressMsg(null);

    const res = await createUserAddress(token, {
      street_address: newStreet,
      apartment_address: newApt,
      country: newCountry,
      zip: newZip,
      address_type: newType,
      default: newDefault,
    });

    setAddressSaving(false);
    if (res.error) {
      setAddressMsg({ type: "error", text: res.error });
    } else {
      setAddressMsg({ type: "success", text: "New address added to your address book!" });
      setShowAddAddress(false);
      setNewStreet("");
      setNewApt("");
      setNewZip("");
      setNewDefault(false);
      await fetchAddresses();
      setTimeout(() => setAddressMsg(null), 4000);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: number) => {
    if (!token) return;
    if (!confirm("Are you sure you want to remove this address?")) return;

    const ok = await deleteUserAddress(token, id);
    if (ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setAddressMsg({ type: "success", text: "Address removed." });
      setTimeout(() => setAddressMsg(null), 3000);
    }
  };

  // Set default address
  const handleSetDefault = async (id: number) => {
    if (!token) return;
    const res = await updateUserAddress(token, id, { default: true });
    if (!res.error) {
      await fetchAddresses();
      setAddressMsg({ type: "success", text: "Default address updated." });
      setTimeout(() => setAddressMsg(null), 3000);
    }
  };

  if (authLoading || (!user && token)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <VibeLoader size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Profile Banner Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-black text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-inner">
            {user?.username ? user.username.slice(0, 2) : "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : user?.username}
              </h1>
              <span title="Verified Customer">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </span>
            </div>
            <p className="text-neutral-400 text-sm mt-0.5 flex items-center gap-2">
              <span>@{user?.username}</span>
              <span>•</span>
              <span>{user?.email || "No email linked"}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition"
          >
            <Package className="w-4 h-4 text-neutral-300" />
            <span>My Orders</span>
          </Link>
          <Link
            href="/shop"
            className="flex items-center gap-2 bg-white text-black hover:bg-neutral-100 text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            <span>Explore Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 mb-8 space-x-8">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
            activeTab === "profile"
              ? "border-black text-black"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Personal Details
        </button>
        <button
          onClick={() => setActiveTab("addresses")}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
            activeTab === "addresses"
              ? "border-black text-black"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Address Book ({addresses.length})
        </button>
      </div>

      {/* TAB 1: Personal Details */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Edit Profile Information</h2>
            <p className="text-sm text-gray-500 mb-6">
              Update your account details and contact preferences below.
            </p>

            {profileMsg && (
              <div
                className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {profileMsg.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-black hover:bg-neutral-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {profileSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Side Info Cards */}
          <div className="space-y-6">
            <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">Account Overview</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <dt className="text-gray-500">Username</dt>
                  <dd className="font-semibold text-gray-900">{user?.username}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <dt className="text-gray-500">Member Status</dt>
                  <dd className="text-emerald-700 font-bold">Standard Active</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-gray-500">Primary Country</dt>
                  <dd className="font-medium text-gray-700">India / Worldwide</dd>
                </div>
              </dl>
            </div>

            <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold mb-1.5 flex items-center gap-2">
                <span>The Vibe Club</span>
              </h3>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Enjoy early access to sales, fast dispatch, and dedicated priority support.
              </p>
              <Link
                href="/shop"
                className="inline-block text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg border border-neutral-700 transition"
              >
                Browse Latest Drops
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Address Book */}
      {activeTab === "addresses" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
              <p className="text-sm text-gray-500">
                Manage your shipping and billing delivery destinations for speedy checkout.
              </p>
            </div>
            {!showAddAddress && (
              <button
                onClick={() => setShowAddAddress(true)}
                className="bg-black hover:bg-neutral-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add New Address
              </button>
            )}
          </div>

          {addressMsg && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                addressMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {addressMsg.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span>{addressMsg.text}</span>
            </div>
          )}

          {/* New Address Form Modal/Panel */}
          {showAddAddress && (
            <div className="bg-white border-2 border-black/10 rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Add a New Address</h3>
                <button
                  onClick={() => setShowAddAddress(false)}
                  className="text-gray-400 hover:text-gray-700 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Address Type
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as "S" | "B")}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black bg-white"
                    >
                      <option value="S">Shipping Address</option>
                      <option value="B">Billing Address</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Country
                    </label>
                    <select
                      value={newCountry}
                      onChange={(e) => setNewCountry(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black bg-white"
                    >
                      <option value="IN">India (IN)</option>
                      <option value="US">United States (US)</option>
                      <option value="GB">United Kingdom (GB)</option>
                      <option value="CA">Canada (CA)</option>
                      <option value="AU">Australia (AU)</option>
                      <option value="DE">Germany (DE)</option>
                      <option value="FR">France (FR)</option>
                      <option value="SG">Singapore (SG)</option>
                      <option value="AE">United Arab Emirates (AE)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="123 Main St, Near Central Square"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Apartment, Suite, Unit (Optional)
                    </label>
                    <input
                      type="text"
                      value={newApt}
                      onChange={(e) => setNewApt(e.target.value)}
                      placeholder="Apartment 4B"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Postal / ZIP Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newZip}
                      onChange={(e) => setNewZip(e.target.value)}
                      placeholder="560001 or 10001"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="set-default"
                    checked={newDefault}
                    onChange={(e) => setNewDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black"
                  />
                  <label htmlFor="set-default" className="text-sm text-gray-700">
                    Set this as my default {newType === "S" ? "shipping" : "billing"} address
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addressSaving}
                    className="bg-black hover:bg-neutral-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
                  >
                    {addressSaving ? "Saving Address..." : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of addresses */}
          {loadingAddresses ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No addresses saved yet</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Add your delivery destination now for one-tap express checkouts on all future orders.
              </p>
              <button
                onClick={() => setShowAddAddress(true)}
                className="bg-black hover:bg-neutral-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white border rounded-2xl p-5 relative transition shadow-2xs hover:shadow-sm ${
                    addr.default ? "border-black/60 bg-neutral-50/30" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                        {addr.address_type === "B" ? "Billing" : "Shipping"}
                      </span>
                      {addr.default && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-black text-white flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Default
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {addr.id && (
                        <button
                          onClick={() => handleDeleteAddress(addr.id!)}
                          title="Delete address"
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-800">
                    <p className="font-semibold text-gray-900">{addr.street_address}</p>
                    {addr.apartment_address && (
                      <p className="text-gray-600">{addr.apartment_address}</p>
                    )}
                    <p className="text-gray-600">
                      PIN/ZIP: <span className="font-medium text-gray-900">{addr.zip}</span>
                    </p>
                    <p className="text-gray-600">
                      Country: <span className="font-medium text-gray-900">{addr.country}</span>
                    </p>
                  </div>

                  {!addr.default && addr.id && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleSetDefault(addr.id!)}
                        className="text-xs font-semibold text-neutral-700 hover:text-black hover:underline"
                      >
                        Set as Default
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
