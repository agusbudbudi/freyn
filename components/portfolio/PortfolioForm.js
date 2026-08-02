"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BackButton from "@/components/ui/BackButton";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const defaultSocials = {
  email: "",
  whatsapp: "",
  youtube: "",
  instagram: "",
  tiktok: "",
  linkedin: "",
  facebook: "",
  x: "",
  threads: "",
};

const socialPlatforms = [
  { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { key: "whatsapp", label: "WhatsApp", type: "text", placeholder: "https://wa.me/" },
  { key: "youtube", label: "YouTube", type: "url", placeholder: "https://youtube.com/@username" },
  { key: "instagram", label: "Instagram", type: "url", placeholder: "https://instagram.com/username" },
  { key: "tiktok", label: "TikTok", type: "url", placeholder: "https://www.tiktok.com/@username" },
  { key: "linkedin", label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/in/username" },
  { key: "facebook", label: "Facebook", type: "url", placeholder: "https://facebook.com/username" },
  { key: "x", label: "X (Twitter)", type: "url", placeholder: "https://x.com/username" },
  { key: "threads", label: "Threads", type: "url", placeholder: "https://www.threads.net/@username" },
];

const defaultForm = {
  title: "",
  description: "",
  coverImage: "",
  slug: "",
  links: [{ name: "", url: "", icon: "" }],
  socials: { ...defaultSocials },
};

const fileInputClasses =
  "border-0 text-sm text-slate-700 cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-medium file:text-slate-900 hover:file:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed";

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

function ensureSocials(socials) {
  if (!socials || typeof socials !== "object") {
    return { ...defaultSocials };
  }
  return Object.keys(defaultSocials).reduce((acc, key) => {
    acc[key] = socials[key] || "";
    return acc;
  }, {});
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

function slugifyName(value = "") {
  return slugify(value);
}

export default function PortfolioForm() {
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState(defaultForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slugFeedback, setSlugFeedback] = useState({ message: "", type: "muted" });
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [originalSlug, setOriginalSlug] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLinkIndex, setUploadingLinkIndex] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setFetching(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          setError("Authentication required");
          return;
        }

        const res = await fetch("/api/portfolio", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.message || "Failed to load portfolio");
          toast.error(data.message || "Failed to load portfolio");
          return;
        }

        const portfolio = data.data?.portfolio || null;
        const suggestedSlug = portfolio?.slug
          ? portfolio.slug
          : portfolio?.ownerName
            ? slugifyName(portfolio.ownerName)
            : portfolio?.workspaceName
              ? slugifyName(portfolio.workspaceName)
              : "";

        const next = portfolio
          ? {
            title: portfolio.title || "",
            description: portfolio.description || "",
            coverImage: portfolio.coverImage || "",
            slug: portfolio.slug || "",
            links: ensureLinks(portfolio.links),
            socials: ensureSocials(portfolio.socials),
          }
          : {
            ...defaultForm,
            links: defaultForm.links,
            socials: { ...defaultSocials },
            slug: slugify(suggestedSlug || ""),
          };

        setFormData(next);
        setOriginalSlug(next.slug || "");
      } catch (err) {
        console.error(err);
        setError("Failed to load portfolio");
        toast.error("Failed to load portfolio");
      } finally {
        setFetching(false);
      }
    };

    fetchPortfolio();
  }, []);

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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleSocialChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      socials: { ...prev.socials, [key]: value },
    }));
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Cover image must be an image file");
      if (event.target) event.target.value = "";
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      toast.error("Cover image must be smaller than 6MB");
      return;
    }

    setUploadingCover(true);

    try {
      const dataUrl = await optimizeImageFile(file, {
        maxWidth: 1280,
        maxHeight: 640,
        quality: 0.82,
        mimeType: "image/webp",
      });

      if (estimateDataUrlBytes(dataUrl) > 900 * 1024) {
        toast.error("Optimized cover image is still too large (max 900KB)");
        return;
      }

      setFormData((prev) => ({ ...prev, coverImage: dataUrl }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to process image file");
    } finally {
      setUploadingCover(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleLinkChange = (index, key, value) => {
    setFormData((prev) => {
      const updated = [...prev.links];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, links: updated };
    });
  };

  const handleLinkIconUpload = async (event, index) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Link icon must be an image file");
      if (event.target) event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Icon must be smaller than 2MB");
      if (event.target) event.target.value = "";
      return;
    }

    try {
      setUploadingLinkIndex(index);
      const dataUrl = await optimizeImageFile(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.85,
        mimeType: file.type === "image/png" ? "image/png" : "image/webp",
      });

      if (estimateDataUrlBytes(dataUrl) > 220 * 1024) {
        toast.error("Optimized icon is still too large (max 220KB)");
        return;
      }

      handleLinkChange(index, "icon", dataUrl);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process icon file");
    } finally {
      setUploadingLinkIndex(null);
      if (event.target) event.target.value = "";
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
      return { ...prev, links: prev.links.filter((_, idx) => idx !== index) };
    });
  };

  const handleSlugChange = (event) => {
    setSlugFeedback({ message: "", type: "muted" });
    setFormData((prev) => ({ ...prev, slug: event.target.value }));
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
        message: "Slug can only contain lowercase letters, numbers, and hyphens",
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setSlugFeedback(
          data.data?.available
            ? { message: "Nice! This slug is available.", type: "success" }
            : { message: "This slug is already in use.", type: "error" }
        );
      } else {
        setSlugFeedback({
          message: data.message || "Failed to validate slug",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setSlugFeedback({ message: "Failed to validate slug", type: "error" });
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
        message: "Slug can only contain lowercase letters, numbers, and hyphens",
        type: "error",
      });
      return false;
    }

    const links = formData.links || [];
    for (const link of links) {
      const hasValue = (link.name || link.url).trim().length > 0;
      if (!hasValue) continue;
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

    const socials = formData.socials || {};
    if (socials.email && socials.email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(socials.email.trim())) {
        setError("Please enter a valid email address");
        return false;
      }
    }

    const socialUrlKeys = [
      "youtube",
      "instagram",
      "tiktok",
      "linkedin",
      "facebook",
      "x",
      "threads",
    ];

    for (const key of socialUrlKeys) {
      const value = socials[key];
      if (!value || !value.trim()) continue;
      try {
        const parsed = new URL(value.trim());
        if (!parsed.protocol.startsWith("http")) {
          throw new Error("Invalid protocol");
        }
      } catch (err) {
        setError("Please enter valid URLs for your social media profiles");
        return false;
      }
    }

    if (socials.whatsapp && socials.whatsapp.trim()) {
      const value = socials.whatsapp.trim();
      const phonePattern = /^\+?[0-9()\s-]{5,}$/;
      if (!phonePattern.test(value)) {
        try {
          const parsed = new URL(value);
          if (!parsed.protocol.startsWith("http")) {
            throw new Error("Invalid WhatsApp");
          }
        } catch (err) {
          setError("Please enter a valid WhatsApp number or URL");
          return false;
        }
      }
    }

    setError("");
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

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
        socials: Object.keys(defaultSocials).reduce((acc, key) => {
          const value = formData.socials?.[key]?.trim?.();
          if (value) acc[key] = value;
          return acc;
        }, {}),
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
        router.push("/dashboard/portfolio");
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

  const busy = loading || uploadingCover || uploadingLinkIndex !== null;

  if (fetching) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>Loading portfolio...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      <Card>
        <div className="p-6 flex items-center gap-3">
          <BackButton onClick={() => router.push("/dashboard/portfolio")} />
          <div>
            <h2 className="text-base font-semibold text-slate-900 m-0">Portfolio</h2>
            <p className="text-xs text-slate-500 mt-1 mb-0">
              Manage your public portfolio page
            </p>
          </div>
        </div>

        <form className="p-6" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm flex items-center gap-2">
              <i className="uil uil-exclamation-triangle"></i> {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <FormField label="Cover Image">
              <div className="flex flex-col gap-3">
                {formData.coverImage ? (
                  <>
                    <img
                      src={formData.coverImage}
                      alt="Portfolio Cover"
                      className="w-full h-auto object-cover rounded-xl border border-slate-200"
                    />
                    <span className="text-sm text-slate-500 flex items-center gap-1.5">
                      <i className="uil uil-info-circle"></i>
                      <p className="m-0">Best size 960×300</p>
                    </span>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    Add a cover image to make your work stand out. (Use PNG or JPG,
                    best size 960×300)
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className={`${fileInputClasses} max-w-[260px]`}
                    disabled={loading || uploadingCover}
                  />
                  {formData.coverImage && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="ml-auto"
                      disabled={loading || uploadingCover}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, coverImage: "" }))
                      }
                    >
                      <i className="uil uil-trash-alt"></i>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </FormField>

            <FormField label="Portfolio Title *">
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter portfolio title"
                maxLength={140}
              />
            </FormField>

            <FormField label="Portfolio Description">
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={handleDescriptionChange}
                modules={modules}
                placeholder="Describe your portfolio..."
              />
            </FormField>

            <FormField label="Slug *">
              <Input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleSlugChange}
                onBlur={handleSlugBlur}
                placeholder="e.g. john-doe"
              />
              <div
                className={`text-sm mt-1.5 ${slugFeedback.type === "error"
                  ? "text-red-600"
                  : slugFeedback.type === "success"
                    ? "text-emerald-600"
                    : "text-slate-500"
                  }`}
              >
                {checkingSlug
                  ? "Checking slug availability..."
                  : slugFeedback.message || "Customize your public portfolio URL"}
              </div>
            </FormField>

            <FormField label="Social Media">
              <p className="text-sm text-slate-500 mb-3 mt-0">
                Add optional profiles to showcase where people can reach you.
              </p>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                {socialPlatforms.map((platform) => (
                  <FormField key={platform.key} label={platform.label}>
                    <Input
                      type={platform.type}
                      value={formData.socials?.[platform.key] || ""}
                      onChange={(event) =>
                        handleSocialChange(platform.key, event.target.value)
                      }
                      placeholder={platform.placeholder}
                    />
                  </FormField>
                ))}
              </div>
            </FormField>

            <FormField label="Links">
              <div className="flex flex-col gap-4">
                {formData.links.map((link, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3"
                  >
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                      <FormField label="Link Name">
                        <Input
                          type="text"
                          value={link.name}
                          onChange={(event) =>
                            handleLinkChange(index, "name", event.target.value)
                          }
                          placeholder="e.g. Behance"
                        />
                      </FormField>
                      <FormField label="URL">
                        <Input
                          type="url"
                          value={link.url}
                          onChange={(event) =>
                            handleLinkChange(index, "url", event.target.value)
                          }
                          placeholder="https://"
                        />
                      </FormField>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                        {link.icon ? (
                          <img
                            src={link.icon}
                            alt={`${link.name || "Link"} icon`}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                            Icon
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleLinkIconUpload(event, index)}
                          className={`${fileInputClasses} max-w-[250px]`}
                          disabled={loading || uploadingLinkIndex === index}
                        />
                      </div>

                      <div className="flex gap-3 ml-auto justify-end flex-wrap">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={loading || uploadingLinkIndex === index}
                          onClick={() => handleDeleteLink(index)}
                        >
                          <i className="uil uil-trash-alt"></i>
                          Delete
                        </Button>
                        {index === formData.links.length - 1 && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={loading || uploadingLinkIndex !== null}
                            onClick={handleAddLink}
                          >
                            Add Link
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FormField>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/dashboard/portfolio")}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              <i className="uil uil-save"></i>
              {loading ? "Saving..." : "Save Portfolio"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

async function optimizeImageFile(file, options = {}) {
  const { maxWidth, maxHeight, quality = 0.85, mimeType } = options;
  const originalDataUrl = await readFileAsDataUrl(file);

  if (!maxWidth && !maxHeight && !mimeType) {
    return originalDataUrl;
  }

  const image = await loadImage(originalDataUrl);
  const originalWidth = image.width || 1;
  const originalHeight = image.height || 1;

  const widthRatio = maxWidth ? maxWidth / originalWidth : 1;
  const heightRatio = maxHeight ? maxHeight / originalHeight : 1;
  const scale = Math.min(widthRatio, heightRatio, 1);

  const targetWidth = Math.max(1, Math.round(originalWidth * scale));
  const targetHeight = Math.max(1, Math.round(originalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const preferredType =
    mimeType || (file.type === "image/png" ? "image/png" : "image/webp");
  const normalizedType =
    preferredType === "image/jpg" ? "image/jpeg" : preferredType;
  const outputQuality =
    normalizedType === "image/png" ? undefined : quality ?? 0.85;

  const optimizedDataUrl = canvas.toDataURL(normalizedType, outputQuality);

  const originalSize = estimateDataUrlBytes(originalDataUrl);
  const optimizedSize = estimateDataUrlBytes(optimizedDataUrl);

  return optimizedSize > 0 && optimizedSize < originalSize
    ? optimizedDataUrl
    : originalDataUrl;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function estimateDataUrlBytes(dataUrl = "") {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(",")[1] || "";
  if (!base64) return 0;
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}
