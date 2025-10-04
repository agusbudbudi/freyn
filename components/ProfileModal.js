"use client";

import { useState, useEffect } from "react";
import { toast } from "@/components/ui/toast";

export default function ProfileModal({ isOpen, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("Session expired. Please login again.");
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
      }
    };

    fetchProfile();
  }, [isOpen]);

  if (!isOpen) return null;

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
          onSaved?.(updatedUser);
        } catch {}
        onClose();
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

  return (
    <div className="modal" style={{ display: "block" }}>
      <div className="modal-content" style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile</h2>
          <button className="close" onClick={onClose} disabled={loading}>
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
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  className="form-control"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  disabled
                  readOnly
                  title="Email tidak dapat diubah"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +62..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  name="bio"
                  className="form-control"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <div className="modal-buttons-sticky">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
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
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
