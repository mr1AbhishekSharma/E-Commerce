"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, MessageSquare, CheckCircle2, AlertCircle, Send, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getProductReviews, submitProductReview } from "@/lib/api";
import { Review } from "@/types";

interface ProductReviewsSectionProps {
  slug: string;
}

export default function ProductReviewsSection({ slug }: ProductReviewsSectionProps) {
  const { user, token } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(5.0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [headline, setHeadline] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getProductReviews(slug);
      setReviews(data.reviews || []);
      setAvgRating(data.average_rating || 5.0);
      setReviewCount(data.review_count || 0);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setFormMsg({ type: "error", text: "Please sign in to submit a review." });
      return;
    }

    if (!headline.trim() || !comment.trim()) {
      setFormMsg({ type: "error", text: "Please enter both a headline and your review comments." });
      return;
    }

    setSubmitting(true);
    setFormMsg(null);

    const res = await submitProductReview(token, slug, {
      rating,
      headline,
      comment,
    });

    setSubmitting(false);
    if (res.error) {
      setFormMsg({ type: "error", text: res.error });
    } else {
      setFormMsg({ type: "success", text: "Your review has been submitted successfully!" });
      setHeadline("");
      setComment("");
      setShowForm(false);
      await fetchReviews();
      setTimeout(() => setFormMsg(null), 4000);
    }
  };

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-black" />
              Customer Reviews
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-900">{avgRating.toFixed(1)} out of 5</span>
              <span className="text-xs text-gray-500">({reviewCount} customer {reviewCount === 1 ? "rating" : "ratings"})</span>
            </div>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-black hover:bg-neutral-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition shadow-xs"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Status Message */}
        {formMsg && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              formMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {formMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{formMsg.text}</span>
          </div>
        )}

        {/* Review Submission Form */}
        {showForm && (
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-6 sm:p-8 mb-10 shadow-xs animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">Share Your Experience</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>

            {!user ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-sm text-amber-900 font-semibold mb-2">
                  Please sign in to write a verified customer review.
                </p>
                <Link
                  href={`/login?redirect=/product/${slug}`}
                  className="inline-block bg-black text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-neutral-800 transition"
                >
                  Sign In Now
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star rating selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Overall Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-hidden"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-gray-600 ml-2">
                      {rating === 5 && "5 Stars - Loved it!"}
                      {rating === 4 && "4 Stars - Great"}
                      {rating === 3 && "3 Stars - Average"}
                      {rating === 2 && "2 Stars - Disappointed"}
                      {rating === 1 && "1 Star - Poor"}
                    </span>
                  </div>
                </div>

                {/* Headline */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Review Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Perfect fit, super comfortable!"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black bg-white"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Your Detailed Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like or dislike? How was the fit and quality?"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-black bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-black hover:bg-neutral-800 text-white font-semibold text-xs px-5 py-2 rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Submitting..." : "Submit Review"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <p className="text-gray-500 text-sm mb-3">No reviews yet for this product.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-bold text-black hover:underline"
            >
              Be the first to write a review!
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs uppercase">
                      {rev.user_name ? rev.user_name[0] : "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{rev.user_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded-full">
                          Verified Buyer
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400">
                    {new Date(rev.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="space-y-1 pl-11">
                  <h4 className="font-semibold text-sm text-gray-900">{rev.headline}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
