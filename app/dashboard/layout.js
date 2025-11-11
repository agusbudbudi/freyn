"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "../../styles/dashboard.css";
import "../../styles/mobile.css";
import "../../styles/invoices.css";
import ProfileModal from "@/components/ProfileModal";
import { toast } from "@/components/ui/toast";
import workspacePermissionsConfig from "@/lib/workspacePermissions.json";

const MENU_ITEMS_CONFIG = Array.isArray(workspacePermissionsConfig?.menuItems)
  ? workspacePermissionsConfig.menuItems
  : [];

const DEFAULT_ROLE_PERMISSIONS =
  workspacePermissionsConfig?.defaultPermissions || {};

const OWNER_MENU_KEYS = MENU_ITEMS_CONFIG.map((item) => item.key);

const RAW_NAV_SECTIONS = [
  {
    section: "Overview",
    items: [
      {
        href: "/dashboard",
        icon: "uil-chart-line",
        label: "Dashboard",
        permission: "dashboard",
      },
      {
        href: "/dashboard/projects/calendar",
        icon: "uil-calendar-alt",
        label: "Calendar",
        permission: "calendar",
      },
      {
        href: "/dashboard/projects",
        icon: "uil-folder-open",
        label: "Projects",
        permission: "projects",
      },
      {
        href: "/dashboard/clients",
        icon: "uil-users-alt",
        label: "Clients",
        permission: "clients",
      },
      {
        href: "/dashboard/services",
        icon: "uil-package",
        label: "Services",
        permission: "services",
      },
      {
        href: "/dashboard/invoices",
        icon: "uil-invoice",
        label: "Invoices",
        badge: "New",
        permission: "invoices",
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
        permission: "workspace-settings",
      },
      {
        href: "/dashboard/portfolio",
        icon: "uil-palette",
        label: "Portfolio",
        badge: "New",
        permission: "portfolio",
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
        permission: "invoice-split",
      },
      {
        href: "#",
        icon: "uil-chart",
        label: "Reports",
        badge: "Soon",
        permission: "reports",
      },
    ],
  },
];

const ROUTE_PERMISSION_RULES = [
  { pattern: /^\/dashboard$/, permission: "dashboard" },
  {
    pattern: /^\/dashboard\/projects\/calendar(?:\/|$)/,
    permission: "calendar",
  },
  { pattern: /^\/dashboard\/projects(?:\/|$)/, permission: "projects" },
  { pattern: /^\/dashboard\/clients(?:\/|$)/, permission: "clients" },
  { pattern: /^\/dashboard\/services(?:\/|$)/, permission: "services" },
  { pattern: /^\/dashboard\/invoices(?:\/|$)/, permission: "invoices" },
  {
    pattern: /^\/dashboard\/workspace(?:\/|$)/,
    permission: "workspace-settings",
  },
  { pattern: /^\/dashboard\/portfolio(?:\/|$)/, permission: "portfolio" },
  { pattern: /^\/dashboard\/reports(?:\/|$)/, permission: "reports" },
];

const getDefaultPermissionsForRole = (role) => {
  if (role === "owner") {
    return [...OWNER_MENU_KEYS];
  }
  const defaults = DEFAULT_ROLE_PERMISSIONS?.[role];
  return Array.isArray(defaults) ? [...defaults] : [];
};

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [workspaceOptions, setWorkspaceOptions] = useState([]);
  const [workspaceOptionsLoading, setWorkspaceOptionsLoading] = useState(false);
  const [workspaceOptionsError, setWorkspaceOptionsError] = useState("");
  const [isWorkspaceSwitcherOpen, setIsWorkspaceSwitcherOpen] = useState(false);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);

  const activeWorkspaceId =
    currentWorkspace?.id ||
    (typeof currentWorkspace?._id === "string"
      ? currentWorkspace?._id
      : currentWorkspace?._id?.toString?.()) ||
    currentWorkspace?.workspaceId?.toString?.() ||
    null;

  const fetchWorkspaceOptions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setWorkspaceOptions([]);
        setWorkspaceOptionsError("Authentication required");
        return;
      }

      setWorkspaceOptionsLoading(true);
      setWorkspaceOptionsError("");

      const res = await fetch("/api/workspace/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setWorkspaceOptions(data.data?.workspaces || []);
      } else {
        setWorkspaceOptionsError(data.message || "Failed to load workspaces");
      }
    } catch (error) {
      setWorkspaceOptionsError("Failed to load workspaces");
    } finally {
      setWorkspaceOptionsLoading(false);
    }
  }, []);

  const formatWorkspaceRole = (role) => {
    if (!role) return "Member";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

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
    setCurrentUser(null);
    setCurrentWorkspace(null);
    setIsProfileMenuOpen(false);
    router.push("/login");
  };

  // Load current user from storage
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        setCurrentUser(JSON.parse(rawUser));
      }
      const rawWorkspace = localStorage.getItem("workspace");
      if (rawWorkspace) {
        setCurrentWorkspace(JSON.parse(rawWorkspace));
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
            setCurrentWorkspace(data.data.workspace);
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

  useEffect(() => {
    if (isProfileMenuOpen) {
      fetchWorkspaceOptions();
    } else {
      setIsWorkspaceSwitcherOpen(false);
    }
  }, [isProfileMenuOpen, fetchWorkspaceOptions]);

  useEffect(() => {
    const handlePermissionsUpdated = () => {
      try {
        const rawWorkspace = localStorage.getItem("workspace");
        if (rawWorkspace) {
          setCurrentWorkspace(JSON.parse(rawWorkspace));
        }
      } catch (e) {
        console.error("Failed to refresh workspace permissions", e);
      }
    };

    window.addEventListener(
      "workspace-permissions-updated",
      handlePermissionsUpdated
    );

    return () => {
      window.removeEventListener(
        "workspace-permissions-updated",
        handlePermissionsUpdated
      );
    };
  }, []);

  const handleToggleWorkspaceSwitcher = () => {
    setIsWorkspaceSwitcherOpen((prev) => !prev);
  };

  const handleSwitchWorkspace = async (workspaceId) => {
    if (!workspaceId || switchingWorkspace) {
      return;
    }

    if (activeWorkspaceId && workspaceId === activeWorkspaceId) {
      setIsWorkspaceSwitcherOpen(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setSwitchingWorkspace(true);

    try {
      const res = await fetch("/api/workspace/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const message = data.message || "Failed to switch workspace";
        toast.error(message);
        return;
      }

      if (data.data?.user) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setCurrentUser(data.data.user);
      }

      if (data.data?.workspace) {
        localStorage.setItem("workspace", JSON.stringify(data.data.workspace));
        setCurrentWorkspace(data.data.workspace);
      }

      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
        document.cookie = `token=${data.data.token}; path=/; max-age=604800; SameSite=Lax`;
      }

      if (typeof window !== "undefined") {
        const switchedWorkspaceId =
          data.data?.workspace?.id || data.data?.workspace?._id || workspaceId;
        window.dispatchEvent(
          new CustomEvent("workspace-switched", {
            detail: {
              workspaceId:
                switchedWorkspaceId?.toString?.() || switchedWorkspaceId,
            },
          })
        );
      }

      await fetchWorkspaceOptions();
      toast.success(data.message || "Workspace switched successfully");
      setIsWorkspaceSwitcherOpen(false);
      setIsProfileMenuOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to switch workspace");
    } finally {
      setSwitchingWorkspace(false);
    }
  };

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

  const userRole = currentUser?.workspaceRole || "member";

  const allowedMenuKeys = useMemo(() => {
    if (!currentUser || !currentWorkspace) {
      return new Set(OWNER_MENU_KEYS);
    }

    if (userRole === "owner") {
      return new Set(OWNER_MENU_KEYS);
    }

    const workspacePermissions = currentWorkspace?.permissions;
    const rolePermissions = Array.isArray(workspacePermissions?.[userRole])
      ? workspacePermissions[userRole]
      : getDefaultPermissionsForRole(userRole);

    return new Set(
      rolePermissions.filter((key) => OWNER_MENU_KEYS.includes(key))
    );
  }, [currentUser, currentWorkspace, userRole]);

  const canAccessMenu = useCallback(
    (permissionKey) => {
      if (!permissionKey) {
        return true;
      }
      if (userRole === "owner") {
        return true;
      }
      return allowedMenuKeys.has(permissionKey);
    },
    [allowedMenuKeys, userRole]
  );

  const navItems = useMemo(() => {
    return RAW_NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessMenu(item.permission)),
    })).filter((section) => section.items.length > 0);
  }, [canAccessMenu]);

  const currentPermissionKey = useMemo(() => {
    if (!pathname) {
      return null;
    }

    const normalizedPath =
      pathname !== "/" && pathname.endsWith("/")
        ? pathname.slice(0, -1)
        : pathname;

    const matchedRule = ROUTE_PERMISSION_RULES.find(({ pattern }) =>
      pattern.test(normalizedPath)
    );

    return matchedRule?.permission || null;
  }, [pathname]);

  if (!authChecked) {
    return null;
  }

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

  const showRestrictionBanner =
    authChecked && currentPermissionKey && !canAccessMenu(currentPermissionKey);

  const restrictedContent = (
    <div className="content-body">
      <div className="alert alert-error">
        <i className="uil uil-lock"></i>
        This page cannot be accessed due to workspace permission restrictions.
      </div>
    </div>
  );

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
              <div className="profile-menu">
                <button
                  type="button"
                  className="profile-right profile-button"
                  onClick={toggleProfileMenu}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleProfileMenu();
                    }
                  }}
                  aria-label="Toggle profile menu"
                >
                  {(firstName || currentWorkspace?.name) && (
                    <div className="profile-greeting">
                      {firstName && (
                        <span>
                          Hi, <strong>{firstName}</strong>!
                        </span>
                      )}
                      {currentWorkspace?.name && (
                        <span className="profile-greeting-workspace">
                          <span className="profile-greeting-workspace-name">
                            <i className="uil uil-folder-check"></i>
                            {currentWorkspace.name}
                          </span>
                          {userRole && (
                            <span className="profile-role-label">
                              {formatWorkspaceRole(userRole)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                  <span className="avatar-wrapper">
                    <Image
                      src={avatarUrl}
                      className="avatar-profile"
                      alt={
                        currentUser?.fullName || currentUser?.name || "Profile"
                      }
                      width={40}
                      height={40}
                      unoptimized
                    />
                  </span>
                </button>
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
                        onClick={handleToggleWorkspaceSwitcher}
                        type="button"
                      >
                        <i className="uil uil-folder-check"></i>
                        Select Workspace
                        <i
                          className={`uil ${
                            isWorkspaceSwitcherOpen
                              ? "uil-angle-up"
                              : "uil-angle-down"
                          } workspace-switcher-caret`}
                        ></i>
                      </button>

                      {isWorkspaceSwitcherOpen && (
                        <div className="workspace-switcher">
                          {workspaceOptionsLoading ? (
                            <div className="workspace-switcher-placeholder">
                              Loading workspaces...
                            </div>
                          ) : workspaceOptionsError ? (
                            <div className="workspace-switcher-placeholder error">
                              {workspaceOptionsError}
                            </div>
                          ) : workspaceOptions.length === 0 ? (
                            <div className="workspace-switcher-placeholder">
                              No additional workspaces yet.
                            </div>
                          ) : (
                            workspaceOptions.map((option) => {
                              const optionId = option.id?.toString();
                              const isActive =
                                optionId && activeWorkspaceId
                                  ? optionId === activeWorkspaceId
                                  : false;
                              return (
                                <button
                                  key={optionId || option.slug || option.name}
                                  type="button"
                                  className={`workspace-switcher-item ${
                                    isActive ? "active" : ""
                                  }`}
                                  onClick={() =>
                                    handleSwitchWorkspace(optionId)
                                  }
                                  disabled={
                                    switchingWorkspace || !optionId || isActive
                                  }
                                >
                                  <div className="workspace-switcher-left">
                                    <span
                                      className={`workspace-switcher-dot ${
                                        isActive ? "active" : ""
                                      }`}
                                    ></span>
                                    <div className="workspace-switcher-text">
                                      <span className="workspace-switcher-name">
                                        {option.name || "Workspace"}
                                      </span>
                                      <span className="workspace-switcher-meta">
                                        {formatWorkspaceRole(option.role)}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="workspace-switcher-action">
                                    {isActive
                                      ? "Current"
                                      : switchingWorkspace
                                      ? "Switching..."
                                      : "Switch"}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}

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
        <div key={activeWorkspaceId || "default"}>
          {showRestrictionBanner ? restrictedContent : children}
        </div>
      </div>
    </div>
  );
}
