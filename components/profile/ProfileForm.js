"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BackButton from "@/components/ui/BackButton";
import FormField from "@/components/ui/FormField";
import Input, { Textarea } from "@/components/ui/Input";

export default function ProfileForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Session expired. Please login again.");
      setFetching(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data?.user) {
          setFormData({
            fullName: data.data.user.fullName || "",
            email: data.data.user.email || "",
            phone: data.data.user.phone || "",
            bio: data.data.user.bio || "",
          });
        } else {
          setError(data.message || "Failed to load profile");
        }
      } catch (e) {
        setError("Failed to load profile");
        console.error(e);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters long");
      return;
    }
    if (formData.phone && formData.phone.trim().length < 6) {
      setError("Phone must be at least 6 characters long");
      return;
    }
    if (formData.bio && formData.bio.length > 500) {
      setError("Bio must be at most 500 characters long");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session expired. Please login again.");
        return;
      }

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone ? formData.phone.trim() : "",
          bio: formData.bio || "",
        }),
      });
      const data = await res.json();

      if (data.success && data.data?.user) {
        toast.success("Profile updated successfully");
        try {
          const prev = JSON.parse(localStorage.getItem("user") || "{}");
          const updatedUser = {
            ...prev,
            fullName: data.data.user.fullName,
            email: data.data.user.email,
            phone: data.data.user.phone || "",
            bio: data.data.user.bio || "",
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          window.dispatchEvent(
            new CustomEvent("profile-updated", { detail: updatedUser })
          );
        } catch { }
        router.back();
      } else {
        setError(data.message || "Failed to update profile");
        toast.error(data.message || "Failed to update profile");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to update profile");
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
        <Card className="p-8">
          <p>Loading profile...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      <Card>
        <div className="p-6 flex items-center gap-3">
          <BackButton onClick={() => router.back()} />
          <div>
            <h2 className="text-base font-semibold text-slate-900 m-0">
              Edit Profile
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-0">
              Manage your personal information
            </p>
          </div>
        </div>

        <form className="p-6" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm flex items-center gap-2">
              <i className="uil uil-exclamation-triangle"></i> {error}
            </div>
          )}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
            <FormField label="Full Name">
              <Input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </FormField>

            <FormField label="Email">
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                disabled
                readOnly
                title="Email tidak dapat diubah"
              />
            </FormField>

            <FormField label="Phone">
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +62..."
              />
            </FormField>

            <FormField label="Bio" className="[grid-column:1/-1]">
              <Textarea
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              <i className="uil uil-save"></i>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
