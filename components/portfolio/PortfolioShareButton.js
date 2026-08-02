"use client";

import { toast } from "@/components/ui/toast";

export default function PortfolioShareButton({ url }) {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link disalin ke clipboard");
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error(error);
      toast.error("Gagal membagikan link");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Bagikan portfolio"
      className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-white/60 shadow-card flex items-center justify-center text-slate-700 transition-all duration-200 hover:bg-white hover:text-signal-blue"
    >
      <i className="uil uil-share-alt text-base"></i>
    </button>
  );
}
