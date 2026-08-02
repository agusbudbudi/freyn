"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from "@/components/ui/Card";
import Button, { buttonClasses } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Alert from "@/components/ui/Alert";

const stripHtml = (html = "") => {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function PortfolioPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const getAuthToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();
      if (!token) {
        setPortfolio(null);
        setError("Authentication required");
        return;
      }

      const res = await fetch("/api/portfolio", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setPortfolio(data.data?.portfolio || null);
      } else {
        const message = data.message || "Failed to load portfolio";
        setError(message);
        toast.error(message);
        setPortfolio(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load portfolio");
      toast.error("Failed to load portfolio");
      setPortfolio(null);
    } finally {
      setLoading(false);
    }
  };

  const portfolioItems = portfolio ? [portfolio] : [];

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Portfolio Management</CardTitle>
            <CardSubtitle>
              Create a public portfolio link showcasing your best work.
            </CardSubtitle>
          </div>
          <Button onClick={() => router.push("/dashboard/portfolio/edit")}>
            <i className="uil uil-edit"></i>
            {portfolio ? "Edit Portfolio" : "Create Portfolio"}
          </Button>
        </CardHeader>

        <CardBody className="p-4">
          {loading ? (
            <LoadingState message="Loading portfolio..." />
          ) : portfolioItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {portfolioItems.map((item, idx) => (
                <Card key={item.slug || idx} className="rounded-2xl shadow-none overflow-hidden flex flex-col min-h-full">
                  {item.coverImage ? (
                    <button
                      type="button"
                      className="group relative p-0 border-none m-0 cursor-pointer block bg-transparent overflow-hidden leading-none"
                      onClick={() => router.push("/dashboard/portfolio/edit")}
                    >
                      <img
                        src={item.coverImage}
                        alt={`${item.title || "Portfolio"} cover`}
                        className="w-full max-h-[260px] object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center gap-2 bg-gray-900/45 text-white font-medium opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
                        <i className="uil uil-edit"></i>
                        Edit Portfolio
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="h-[260px] flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-100 [&>i]:text-4xl"
                      onClick={() => router.push("/dashboard/portfolio/edit")}
                    >
                      <i className="uil uil-image"></i>
                      <span>Edit Portfolio</span>
                    </button>
                  )}
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <h3 className="m-0 text-lg font-semibold text-slate-900 flex-1 min-w-0">{item.title}</h3>
                      {item.slug && (
                        <a
                          href={`/portfolio/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonClasses({ variant: "outline", size: "sm" })}
                        >
                          See Portfolio
                          <i className="uil uil-external-link-alt"></i>
                        </a>
                      )}
                    </div>
                    {item.slug && (
                      <div className="text-sm mt-1">
                        Public URL slug:{" "}
                        <span className="text-emerald-700 bg-emerald-100 py-0.5 px-2 rounded-full text-xs">{item.slug}</span>
                      </div>
                    )}
                    {item.description && (
                      <p className="m-0 text-gray-600 text-sm">
                        {stripHtml(item.description)}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Alert type="error">
              <i className="uil uil-exclamation-triangle"></i> {error}
            </Alert>
          ) : (
            <EmptyState
              icon="uil uil-palette"
              title="No portfolio yet"
              description="Create your public portfolio to share a curated collection of projects, links, and achievements."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
