"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { toast } from "@/components/ui/toast";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const defaultForm = {
  title: "",
  description: "",
  coverImage: "",
  slug: "",
  links: [{ name: "", url: "", icon: "" }],
};

function ensureLinks(links) {
  if (!Array.isArray(links) || links.length === 0) {
    return [{ name: "", url: "", icon: "" }];
  }
  return links.map((link) => ({
    name: link?.name || "",
    url: link?.url || "",
    icon: link?.icon || "",
  }));
}

function slugify(value = "") {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function PortfolioModal({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
  suggestedSlug = "",
}) {
  const [formData, setFormData] = useState(defaultForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slugFeedback, setSlugFeedback] = useState({
    message: "",
    type: "muted",
  });
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [originalSlug, setOriginalSlug] = useState("");
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setError("");
    setSlugFeedback({ message: "", type: "muted" });
    setCheckingSlug(false);
    setClosing(false);

    const data = initialData
      ? {
          title: initialData.title || "",
          description: initialData.description || "",
          coverImage: initialData.coverImage || "",
          slug: initialData.slug || "",
          links: ensureLinks(initialData.links),
        }
      : {
          ...defaultForm,
          links: defaultForm.links,
        };

    if (!initialData) {
      const generated = slugify(suggestedSlug || "");
      data.slug = generated || "";
    }

    setFormData(data);
    setOriginalSlug(data.slug || "");
  }, [initialData, isOpen, suggestedSlug]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (!isOpen && !closing) return null;

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  const handleStartClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setClosing(false);
      onClose();
    }, 220);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Cover image must be an image file");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((prev) => ({ ...prev, coverImage: dataUrl }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to read image file");
    }
  };

  const handleLinkChange = (index, key, value) => {
    setFormData((prev) => {
      const updated = [...prev.links];
      updated[index] = {
        ...updated[index],
        [key]: value,
      };
      return { ...prev, links: updated };
    });
  };

  const handleLinkIconUpload = async (event, index) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Link icon must be an image file");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      handleLinkChange(index, "icon", dataUrl);
    } catch (err) {
      console.error(err);
      toast.error("Failed to read icon file");
    }
  };

  const handleAddLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, { name: "", url: "", icon: "" }],
    }));
  };

  const handleDeleteLink = (index) => {
    setFormData((prev) => {
      if (prev.links.length <= 1) {
        return { ...prev, links: [{ name: "", url: "", icon: "" }] };
      }
      const updated = prev.links.filter((_, idx) => idx !== index);
      return { ...prev, links: updated };
    });
  };

  const handleSlugChange = (event) => {
    const { value } = event.target;
    setSlugFeedback({ message: "", type: "muted" });
    setFormData((prev) => ({ ...prev, slug: value }));
  };

  const handleSlugBlur = async () => {
    const trimmed = (formData.slug || "").trim().toLowerCase();
    if (!trimmed) {
      setSlugFeedback({ message: "Slug is required", type: "error" });
      return;
    }

    const normalized = slugify(trimmed);
    if (normalized !== trimmed) {
      setFormData((prev) => ({ ...prev, slug: normalized }));
    }

    if (!normalized.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
      setSlugFeedback({
        message:
          "Slug can only contain lowercase letters, numbers, and hyphens",
        type: "error",
      });
      return;
    }

    if (normalized === (originalSlug || "")) {
      setSlugFeedback({ message: "Using current slug", type: "muted" });
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setSlugFeedback({ message: "Authentication required", type: "error" });
      return;
    }

    try {
      setCheckingSlug(true);
      const res = await fetch(
        `/api/portfolio/check-slug?slug=${encodeURIComponent(normalized)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        if (data.data?.available) {
          setSlugFeedback({
            message: "Nice! This slug is available.",
            type: "success",
          });
        } else {
          setSlugFeedback({
            message: "This slug is already in use.",
            type: "error",
          });
        }
      } else {
        setSlugFeedback({
          message: data.message || "Failed to validate slug",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setSlugFeedback({
        message: "Failed to validate slug",
        type: "error",
      });
    } finally {
      setCheckingSlug(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Portfolio title is required");
      return false;
    }

    if (!formData.slug.trim()) {
      setSlugFeedback({ message: "Slug is required", type: "error" });
      return false;
    }

    if (slugFeedback.type === "error" && slugFeedback.message) {
      return false;
    }

    const normalizedSlug = slugify(formData.slug);
    if (!normalizedSlug) {
      setSlugFeedback({ message: "Slug is required", type: "error" });
      return false;
    }

    if (!normalizedSlug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
      setSlugFeedback({
        message:
          "Slug can only contain lowercase letters, numbers, and hyphens",
        type: "error",
      });
      return false;
    }

    const links = formData.links || [];
    for (const link of links) {
      const hasValue = (link.name || link.url).trim().length > 0;
      if (!hasValue) {
        continue;
      }
      if (!link.name.trim() || !link.url.trim()) {
        setError("Each link must include both a name and URL");
        return false;
      }
      const urlPattern = /^(https?:\/\/)([\w.-]+)(:[0-9]+)?(\/.*)?$/i;
      if (!urlPattern.test(link.url.trim())) {
        setError("Please enter valid URLs for each link");
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Authentication required");
      return;
    }

    setLoading(true);

    try {
      const normalizedSlug = slugify(formData.slug);
      const payload = {
        title: formData.title.trim(),
        description: formData.description || "",
        coverImage: formData.coverImage || "",
        slug: normalizedSlug,
        links: (formData.links || [])
          .filter((link) => (link.name || link.url).trim().length > 0)
          .map((link) => ({
            name: link.name.trim(),
            url: link.url.trim(),
            icon: link.icon || "",
          })),
      };

      const res = await fetch("/api/portfolio", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.data?.portfolio) {
        toast.success("Portfolio saved successfully");
        setOriginalSlug(data.data.portfolio.slug || normalizedSlug);
        setSlugFeedback({ message: "Using current slug", type: "muted" });
        onSaved?.(data.data.portfolio);
        handleStartClose();
      } else {
        setError(data.message || "Failed to save portfolio");
        toast.error(data.message || "Failed to save portfolio");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save portfolio");
      toast.error("Failed to save portfolio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`modal ${closing ? "closing" : ""}`}
      style={{ display: "block" }}
    >
      <div
        className={`modal-content ${closing ? "closing" : ""}`}
        style={{ maxWidth: "860px" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Portfolio</h2>
          <button
            className="close"
            onClick={handleStartClose}
            disabled={loading}
          >
            <i className="uil uil-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <i className="uil uil-exclamation-triangle"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gap: "20px" }}>
              <div className="form-group">
                <label className="form-label">Cover Image</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {formData.coverImage ? (
                    <img
                      src={formData.coverImage}
                      alt="Portfolio Cover"
                      style={{
                        width: "240px",
                        height: "140px",
                        objectFit: "cover",
                        borderRadius: "12px",
                        border: "1px solid var(--border-secondary)",
                      }}
                    />
                  ) : (
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Upload a cover image to highlight your work (PNG, JPG).
                    </p>
                  )}
                  <div className="file-input-row">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="file-input"
                      style={{ maxWidth: "260px" }}
                    />
                    {formData.coverImage && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            coverImage: "",
                          }))
                        }
                      >
                        <i className="uil uil-trash-alt"></i>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Portfolio Title *</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter portfolio title"
                  maxLength={140}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Portfolio Description</label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  modules={modules}
                  placeholder="Describe your portfolio..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  className="form-control"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  onBlur={handleSlugBlur}
                  placeholder="e.g. john-doe"
                />
                <div
                  className="text-sm"
                  style={{
                    marginTop: "6px",
                    color:
                      slugFeedback.type === "error"
                        ? "var(--alert-error-text)"
                        : slugFeedback.type === "success"
                        ? "#16a34a"
                        : "#6b7280",
                  }}
                >
                  {checkingSlug
                    ? "Checking slug availability..."
                    : slugFeedback.message ||
                      "Customize your public portfolio URL"}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Links</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {formData.links.map((link, index) => (
                    <div
                      key={index}
                      style={{
                        border: "1px solid var(--border-secondary)",
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div className="form-row" style={{ gap: "12px" }}>
                        <div className="form-group">
                          <label className="form-label">Link Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={link.name}
                            onChange={(event) =>
                              handleLinkChange(
                                index,
                                "name",
                                event.target.value
                              )
                            }
                            placeholder="e.g. Behance"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">URL</label>
                          <input
                            type="url"
                            className="form-control"
                            value={link.url}
                            onChange={(event) =>
                              handleLinkChange(index, "url", event.target.value)
                            }
                            placeholder="https://"
                          />
                        </div>
                      </div>

                      <div className="link-config-row">
                        <div className="link-icon-upload">
                          {link.icon ? (
                            <img
                              src={link.icon}
                              alt={`${link.name || "Link"} icon`}
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                border: "1px solid var(--border-secondary)",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "8px",
                                border: "1px dashed var(--border-secondary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#9ca3af",
                                fontSize: "12px",
                              }}
                            >
                              Icon
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              handleLinkIconUpload(event, index)
                            }
                            className="file-input"
                            style={{ maxWidth: "250px" }}
                          />
                        </div>

                        <div className="link-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleDeleteLink(index)}
                          >
                            <i className="uil uil-trash-alt"></i>
                            Delete
                          </button>
                          {index === formData.links.length - 1 && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handleAddLink}
                            >
                              Add Link
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-buttons-sticky">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleStartClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <i className="uil uil-save"></i>
                {loading ? "Saving..." : "Save Portfolio"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style jsx global>{`
        .file-input {
          font-size: 14px;
          border-radius: 10px;
          border: 1px solid var(--border-secondary);
          background: var(--bg-secondary);
          color: var(--text-primary);
          padding: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .file-input:focus {
          outline: none;
          border-color: var(--border-focus);
          box-shadow: var(--focus-shadow);
        }
        .file-input::file-selector-button,
        .file-input::-webkit-file-upload-button {
          margin-right: 12px;
          border: none;
          border-radius: 8px;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          padding: 8px 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .file-input:hover::file-selector-button,
        .file-input:hover::-webkit-file-upload-button {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .file-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .file-input-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .file-input-row .btn {
          margin-left: auto;
        }
        .link-config-row {
          display: flex;
          gap: 16px;
          align-items: center;
          width: 100%;
        }
        .link-icon-upload {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .link-icon-upload {
          flex: 1 1 240px;
          min-width: 200px;
        }
        .link-actions {
          display: flex;
          gap: 12px;
          margin-left: auto;
          justify-content: flex-end;
          width: 100%;
        }
        @media (max-width: 640px) {
          .link-config-row {
            flex-wrap: wrap;
          }
          .link-actions {
            flex-wrap: wrap;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
