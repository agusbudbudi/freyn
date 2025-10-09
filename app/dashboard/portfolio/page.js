"use client";

import { useEffect, useMemo, useState } from "react";
import PortfolioModal from "@/components/PortfolioModal";
import LoadingState from "@/components/LoadingState";
import { toast } from "@/components/ui/toast";

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

const slugifyName = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const suggestedSlug = useMemo(() => {
    if (portfolio?.slug) return portfolio.slug;
    if (portfolio?.ownerName) return slugifyName(portfolio.ownerName);
    if (portfolio?.workspaceName) return slugifyName(portfolio.workspaceName);
    return "";
  }, [portfolio?.slug, portfolio?.ownerName, portfolio?.workspaceName]);

  const portfolioItems = useMemo(
    () => (portfolio ? [portfolio] : []),
    [portfolio]
  );

  return (
    <div className="content-body">
      <div className="content-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Portfolio</h2>
            <p className="card-subtitle">
              Create a public portfolio link showcasing your best work.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <i className="uil uil-edit"></i>
            {portfolio ? "Edit Portfolio" : "Create Portfolio"}
          </button>
        </div>

        <div className="card-body" style={{ padding: "16px" }}>
          {loading ? (
            <LoadingState message="Loading portfolio..." />
          ) : portfolioItems.length > 0 ? (
            <div className="portfolio-grid">
              {portfolioItems.map((item, idx) => (
                <div key={item.slug || idx} className="portfolio-card">
                  {item.coverImage ? (
                    <button
                      type="button"
                      className="portfolio-cover-button"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <img
                        src={item.coverImage}
                        alt={`${item.title || "Portfolio"} cover`}
                        className="portfolio-cover"
                      />
                      <span className="portfolio-cover-overlay">
                        <i className="uil uil-edit"></i>
                        Edit Portfolio
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="portfolio-cover-button placeholder"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <i className="uil uil-image"></i>
                      <span>Edit Portfolio</span>
                    </button>
                  )}
                  <div className="portfolio-content">
                    <div className="portfolio-title-row">
                      <h3 className="portfolio-title">{item.title}</h3>
                      {item.slug && (
                        <a
                          href={`/portfolio/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                        >
                          See Portfolio
                          <i className="uil uil-external-link-alt"></i>
                        </a>
                      )}
                    </div>
                    {item.slug && (
                      <div className="text-sm" style={{ marginTop: "4px" }}>
                        Public URL slug:{" "}
                        <span className="portfolio-slug">{item.slug}</span>
                      </div>
                    )}
                    {item.description && (
                      <p className="portfolio-description">
                        {stripHtml(item.description)}
                      </p>
                    )}
                    {(item.links || []).length > 0 && (
                      <div className="portfolio-links">
                        <h4>Links</h4>
                        <div className="portfolio-links-list">
                          {item.links.map((link, linkIdx) => (
                            <a
                              key={`${link.url}-${linkIdx}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary portfolio-link-item"
                            >
                              {link.name || link.url}
                              <i className="uil uil-link"></i>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="alert alert-error">
              <i className="uil uil-exclamation-triangle"></i> {error}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "48px 16px" }}>
              <i className="uil uil-palette"></i>
              <h3 style={{ marginBottom: "8px" }}>No portfolio yet</h3>
              <p style={{ maxWidth: "480px", margin: "0 auto" }}>
                Create your public portfolio to share a curated collection of
                projects, links, and achievements.
              </p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <PortfolioModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={(updated) => {
            setPortfolio(updated);
            setIsModalOpen(false);
            setError("");
          }}
          initialData={portfolio}
          suggestedSlug={suggestedSlug}
        />
      )}

      <style jsx>{`
        .portfolio-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1fr;
        }
        .portfolio-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-secondary);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 100%;
        }
        .portfolio-cover {
          width: 100%;
          max-height: 260px;
          object-fit: cover;
        }
        .portfolio-cover-button {
          position: relative;
          padding: 0;
          border: none;
          margin: 0;
          cursor: pointer;
          display: block;
          background: transparent;
          overflow: hidden;
          line-height: 0;
        }

        .portfolio-cover-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(17, 24, 39, 0.45);
          color: #fff;
          font-weight: 500;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .portfolio-cover-button:hover .portfolio-cover-overlay {
          opacity: 1;
        }
        .portfolio-cover-button.placeholder {
          height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--text-muted);
          background: var(--bg-tertiary);
        }
        .portfolio-cover-button.placeholder i {
          font-size: 40px;
        }
        .portfolio-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .portfolio-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
          min-width: 0;
        }
        .portfolio-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .portfolio-description {
          margin: 0;
          color: #4b5563;
          font-size: 14px;
        }
        .portfolio-links h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #4b5563;
        }
        .portfolio-links-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .portfolio-link-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .portfolio-slug {
          color: var(--status-done-text);
          background: var(--status-done-bg);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 12px;
        }

        @media (min-width: 1024px) {
          .portfolio-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
