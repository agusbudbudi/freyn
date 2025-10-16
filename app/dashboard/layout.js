"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "../../styles/dashboard.css";
import "../../styles/mobile.css";
import "../../styles/invoices.css";
import ProfileModal from "@/components/ProfileModal";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("workspace");
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    } catch (e) {}
    setIsProfileMenuOpen(false);
    router.push("/login");
  };

  // Load current user from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        setCurrentUser(JSON.parse(raw));
      }
    } catch (e) {}
  }, []);

  // Auth guard: ensure token exists and is valid, otherwise redirect
  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.replace("/login");
          return;
        }
        // Optional server verification
        try {
          const res = await fetch("/api/auth/verify-token", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!data?.success) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("workspace");
            router.replace("/login");
            return;
          }
          if (data?.data?.user) {
            localStorage.setItem("user", JSON.stringify(data.data.user));
            setCurrentUser(data.data.user);
          }
          if (data?.data?.workspace) {
            localStorage.setItem(
              "workspace",
              JSON.stringify(data.data.workspace)
            );
          }
        } catch (e) {
          // If verification endpoint fails, still allow based on local token
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Close menus when clicking outside and on Escape
  useEffect(() => {
    const handleClick = (e) => {
      if (!isProfileMenuOpen) return;
      const inButton = e.target.closest(".profile-button");
      const inMenu = e.target.closest(".profile-menu-dropdown");
      if (!inButton && !inMenu) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKey = (e) => {
      if (e.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isProfileMenuOpen]);

  if (!authChecked) {
    return null;
  }

  const avatarUrl = currentUser?.profileImage
    ? currentUser.profileImage
    : `https://api.dicebear.com/9.x/personas/svg?backgroundColor=b6e3f4&scale=100&seed=${encodeURIComponent(
        currentUser?.email || currentUser?.fullName || "default"
      )}`;

  const firstName =
    (currentUser?.fullName || currentUser?.name || "")
      .trim()
      .split(" ")
      .filter(Boolean)[0] || null;

  const navItems = [
    {
      section: "Overview",
      items: [
        { href: "/dashboard", icon: "uil-chart-line", label: "Dashboard" },
        {
          href: "/dashboard/projects/calendar",
          icon: "uil-calendar-alt",
          label: "Calendar",
          badge: "New",
        },
        {
          href: "/dashboard/projects",
          icon: "uil-folder-open",
          label: "Projects",
        },
        {
          href: "/dashboard/clients",
          icon: "uil-users-alt",
          label: "Clients",
        },
        {
          href: "/dashboard/services",
          icon: "uil-package",
          label: "Services",
        },
        {
          href: "/dashboard/invoices",
          icon: "uil-invoice",
          label: "Invoices",
          badge: "New",
        },
      ],
    },
    {
      section: "Settings",
      items: [
        {
          href: "/dashboard/workspace",
          icon: "uil-window",
          label: "Workspace",
        },
        {
          href: "/dashboard/portfolio",
          icon: "uil-palette",
          label: "Portfolio",
          badge: "New",
        },
      ],
    },
    {
      section: "Tools",
      items: [
        {
          href: "https://splitbill-alpha.vercel.app/invoice.html",
          icon: "uil-invoice",
          label: "Invoice Split Bill",
          external: true,
        },
        { href: "#", icon: "uil-chart", label: "Reports", badge: "Soon" },
      ],
    },
  ];

  const pageMetadata = {
    "/dashboard": {
      title: "Dashboard",
      subtitle: "Track your design projects 🚀",
    },
    "/dashboard/projects/calendar": {
      title: "Projects Calendar",
      subtitle: "View by day, week, or month 📅",
    },
    "/dashboard/projects": {
      title: "Projects",
      subtitle: "Manage all your projects 👨🏻‍💻",
    },
    "/dashboard/clients": {
      title: "Clients",
      subtitle: "Manage your clients 👥",
    },
    "/dashboard/services": {
      title: "Services",
      subtitle: "Manage your services 💼",
    },
    "/dashboard/invoices": {
      title: "Invoices",
      subtitle: "Track and manage invoices 💳",
    },
    "/dashboard/invoices/add": {
      title: "Create Invoice",
      subtitle: "Generate a new invoice 📄",
    },
    "/dashboard/workspace": {
      title: "Workspace",
      subtitle: "Manage your workspace details 🛠️",
    },
    "/dashboard/portfolio": {
      title: "Portfolio",
      subtitle: "Build and publish your public portfolio ✨",
    },
  };

  const defaultPageMeta = pageMetadata["/dashboard"];

  const currentPageMeta =
    pageMetadata[pathname] ||
    Object.entries(pageMetadata)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([key]) => pathname.startsWith(key))?.[1] ||
    defaultPageMeta;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo sidebar-logo">
            <div className="logo-icon">
              {/* <i className="fas fa-palette"></i> */}
              <Image
                src="/images/logo-freyn.png"
                alt="Logo"
                width={32}
                height={32}
                className="logo-img"
                priority
              />
            </div>
            <span>Freyn</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <i className="uil uil-multiply"></i>
          </button>
        </div>

        <div className="sidebar-nav">
          {navItems.map((section, idx) => (
            <div key={idx} className="nav-section">
              <div className="nav-section-title">{section.section}</div>
              {section.items.map((item, itemIdx) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/dashboard/invoices" &&
                    pathname.startsWith("/dashboard/invoices/"));

                if (item.external) {
                  return (
                    <a
                      key={itemIdx}
                      href={item.href}
                      className="nav-item"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className={`uil ${item.icon}`}></i>
                      {item.label}
                      <i className="uil uil-external-link-alt"></i>
                    </a>
                  );
                }

                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    onClick={closeSidebar}
                  >
                    <i className={`uil ${item.icon}`}></i>
                    {item.label}
                    {item.badge && (
                      <span className="status-badge status-review">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          © 2025 Freyn | Freelance Management
        </div>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`mobile-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
      ></div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="content-header">
          <div className="header-top">
            <div className="mobile-header">
              <div className="header-title">
                <button
                  className="mobile-menu-btn"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                >
                  <i className="fas fa-bars"></i>
                </button>
                <div>
                  <h1 className="page-title" id="page-title">
                    {currentPageMeta.title}
                  </h1>
                  <p className="page-subtitle" id="page-subtitle">
                    {currentPageMeta.subtitle}
                  </p>
                </div>
              </div>
              <div
                className="profile-right"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {firstName && (
                  <span className="profile-greeting">
                    Hi, <strong>{firstName}</strong>!
                  </span>
                )}
                <div className="profile-menu profile-button">
                  <button
                    type="button"
                    className="avatar-button"
                    onClick={toggleProfileMenu}
                    aria-label="Toggle profile menu"
                    style={{
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      display: "flex",
                    }}
                  >
                    <Image
                      src={avatarUrl}
                      className="avatar-profile"
                      alt={
                        currentUser?.fullName ||
                        currentUser?.name ||
                        "Profile"
                      }
                      width={40}
                      height={40}
                      unoptimized
                    />
                  </button>
                </div>
              </div>

              {/* Profile Menu Dropdown */}
              {isProfileMenuOpen && (
                <>
                  <div className="profile-menu-dropdown show">
                    <div className="profile-header">
                      <div
                        className="profile-image"
                        style={{
                          borderRadius: "50%",
                          background: "#b6e3f4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Image
                          src={avatarUrl}
                          alt={
                            currentUser?.fullName ||
                            currentUser?.name ||
                            "Profile"
                          }
                          fill
                          sizes="64px"
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      </div>
                      <div>
                        <div className="profile-name">
                          {currentUser?.fullName || currentUser?.name || "User"}
                        </div>
                        <div className="profile-email">
                          {currentUser?.email || "user@example.com"}
                        </div>
                      </div>
                    </div>

                    <div className="profile-menu-items">
                      <button
                        className="profile-menu-item"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                      >
                        <i className="uil uil-user"></i>
                        View Profile
                      </button>
                      <button
                        className="profile-menu-item logout"
                        onClick={handleLogout}
                      >
                        <i className="uil uil-sign-out-alt"></i>
                        Logout
                      </button>
                    </div>
                  </div>
                  <div className="profile-overlay show"></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Modal */}
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onSaved={(u) => setCurrentUser(u)}
        />

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
