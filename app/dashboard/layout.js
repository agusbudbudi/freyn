"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "../../styles/invoices.css";
import { toast } from "@/components/ui/toast";
import workspacePermissionsConfig from "@/lib/workspacePermissions.json";
import StatusBadge from "@/components/ui/StatusBadge";

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
        badgeStatus: "status-waiting",
        permission: "invoices",
      },
    ],
  },
  {
    section: "Settings",
    items: [
      {
        href: "/dashboard/portfolio",
        icon: "uil-palette",
        label: "Portfolio",
        badge: "New",
        badgeStatus: "status-waiting",
        permission: "portfolio",
      },
      {
        href: "/dashboard/workspace",
        icon: "uil-window",
        label: "Workspace",
        permission: "workspace-settings",
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
    } catch (e) { }
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
    } catch (e) { }
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
      const inMenu = e.target.closest(".js-profile-menu-dropdown");
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

  useEffect(() => {
    const handleProfileUpdated = (e) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdated);
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
    "/dashboard/projects/add": {
      title: "Create Project",
      subtitle: "Add a new project 👨🏻‍💻",
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
    "/dashboard/portfolio/edit": {
      title: "Edit Portfolio",
      subtitle: "Update your public portfolio details ✨",
    },
    "/dashboard/profile": {
      title: "Edit Profile",
      subtitle: "Manage your personal information 👤",
    },
  };

  const activeNavHref =
    navItems
      .flatMap((section) => section.items)
      .filter((item) => !item.external)
      .map((item) => item.href)
      .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b.length - a.length)[0] || null;

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
    <div className="p-4 sm:p-6 mt-[72px] md:mt-[62px]">
      <div className="p-4 rounded-lg border bg-red-50 text-red-800 border-red-200 flex items-center gap-2">
        <i className="uil uil-lock"></i>
        This page cannot be accessed due to workspace permission restrictions.
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`w-[200px] bg-white text-ink flex flex-col fixed h-screen overflow-y-auto z-[1000] border-r border-slate-400 shadow-card transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-5 relative">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[26px] font-bold text-ink justify-start"
          >
            <div className="w-8 h-8 flex">
              <Image
                src="/images/logo-freyn.png"
                alt="Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span>Freyn</span>
          </Link>
          <button
            className="flex md:hidden absolute top-[25px] right-5 bg-surface-bg border border-border-subtle text-base text-graphite cursor-pointer py-[3px] px-[7px] rounded-full transition-all duration-200 hover:bg-slate-100 hover:text-ink"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <i className="uil uil-multiply"></i>
          </button>
        </div>

        <div className="flex-1 py-4">
          {navItems.map((section, idx) => (
            <div key={idx} className="mb-5">
              <div className="text-xs font-semibold text-pencil-gray uppercase tracking-[0.5px] mx-5 mb-3">{section.section}</div>
              {section.items.map((item, itemIdx) => {
                const isActive = item.href === activeNavHref;

                if (item.external) {
                  return (
                    <a
                      key={itemIdx}
                      href={item.href}
                      className="flex items-center py-2 px-3 mx-3 my-0.5 rounded-lg text-xs font-medium gap-2.5 text-graphite no-underline transition-all duration-200 hover:bg-surface-bg hover:text-ink [&>i:first-child]:w-5 [&>i:first-child]:mr-1.5 [&>i:first-child]:text-base"
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
                    className={`flex items-center py-2 px-3 mx-3 my-0.5 rounded-lg text-xs font-medium gap-2.5 no-underline transition-all duration-200 [&>i:first-child]:w-5 [&>i:first-child]:mr-1.5 [&>i:first-child]:text-base ${isActive
                      ? "bg-signal-blue/10 text-signal-blue"
                      : "text-graphite hover:bg-surface-bg hover:text-ink"
                      }`}
                    onClick={closeSidebar}
                  >
                    <i className={`uil ${item.icon}`}></i>
                    {item.label}
                    {item.badge && (
                      <StatusBadge status={item.badgeStatus || "status-review"}>{item.badge}</StatusBadge>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-auto py-4 px-5 text-[10px] text-pencil-gray text-center">
          © {new Date().getFullYear()} Freyn | Freelance Management
        </div>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-[999] transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={closeSidebar}
      ></div>

      {/* Main Content */}
      <div className="flex-1 md:ml-[200px] bg-slate-50 min-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-400 shadow-card py-1.5 px-8 fixed top-0 right-0 left-0 md:left-[200px] z-[100] max-md:py-3 max-md:px-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center w-full justify-between">
              <div className="flex items-center">
                <button
                  className="flex md:hidden items-center justify-center w-10 h-10 shrink-0 bg-transparent text-xl text-slate-900 cursor-pointer rounded-lg transition-all duration-200 mr-5 border border-[#e7e7e7] hover:bg-slate-50"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                >
                  <i className="fas fa-bars"></i>
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 m-0" id="page-title">
                    {currentPageMeta.title}
                  </h1>
                  <p className="text-xs text-slate-500 m-0" id="page-subtitle">
                    {currentPageMeta.subtitle}
                  </p>
                </div>
              </div>
              <div className="text-[22px] items-center flex relative">
                <button
                  type="button"
                  className="profile-button group flex items-center gap-2 border-none bg-transparent py-1 px-2 rounded-[10px] cursor-pointer transition-shadow duration-200"
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
                    <div className="hidden md:flex flex-col items-end text-sm text-slate-900 mr-2 leading-[1.2]">
                      {firstName && (
                        <span>
                          Hi, <strong>{firstName}</strong>!
                        </span>
                      )}
                      {currentWorkspace?.name && (
                        <span className="hidden sm:inline-flex items-center gap-1 mt-1">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <i className="uil uil-folder-check bg-blue-100 text-blue-700 py-0.5 px-1 rounded-full text-xs"></i>
                            {currentWorkspace.name}
                          </span>
                          {userRole && (
                            <span className="inline-flex items-center text-[10px] font-semibold capitalize bg-signal-blue/[0.12] text-signal-blue py-0.5 px-2 rounded-full">
                              {formatWorkspaceRole(userRole)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                  <span className="inline-flex items-center justify-center">
                    <Image
                      src={avatarUrl}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#e7e7e7] transition-all duration-200 group-hover:border-sky-wash group-hover:scale-105"
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
                  <div className="js-profile-menu-dropdown absolute top-[80%] right-5 w-[260px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01),0_6px_20px_rgba(0,0,0,0.05)] border border-slate-200 z-[1100] overflow-hidden">
                    <div className="py-2.5 px-3.5 relative rounded-t-2xl flex justify-start gap-4 border-b border-slate-100 items-center">
                      <div className="w-10 h-10 rounded-full relative overflow-hidden shrink-0" style={{ background: "#b6e3f4" }}>
                        <Image
                          src={avatarUrl}
                          alt={
                            currentUser?.fullName ||
                            currentUser?.name ||
                            "Profile"
                          }
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-slate-900 mb-0.5">
                          {currentUser?.fullName || currentUser?.name || "User"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {currentUser?.email || "user@example.com"}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5">
                      <button
                        className="flex items-center gap-3 py-2 px-2 rounded-md no-underline text-slate-900 text-sm transition-all duration-200 cursor-pointer border-none bg-transparent w-full text-left hover:bg-slate-50 [&>i]:w-5 [&>i]:text-center [&>i]:text-slate-500"
                        onClick={handleToggleWorkspaceSwitcher}
                        type="button"
                      >
                        <i className="uil uil-folder-check"></i>
                        Select Workspace
                        <i
                          className={`uil ${isWorkspaceSwitcherOpen
                            ? "uil-angle-up"
                            : "uil-angle-down"
                            } ml-auto text-slate-500`}
                        ></i>
                      </button>

                      {isWorkspaceSwitcherOpen && (
                        <div className="flex flex-col gap-1 p-1 bg-white rounded-md border border-slate-100 mb-2">
                          {workspaceOptionsLoading ? (
                            <div className="text-xs text-slate-500 py-1.5 px-1">
                              Loading workspaces...
                            </div>
                          ) : workspaceOptionsError ? (
                            <div className="text-xs text-red-500 py-1.5 px-1">
                              {workspaceOptionsError}
                            </div>
                          ) : workspaceOptions.length === 0 ? (
                            <div className="text-xs text-slate-500 py-1.5 px-1">
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
                                  className={`flex justify-between items-center gap-3 py-1 px-2 rounded-md border-none cursor-pointer transition-all duration-200 text-xs text-slate-900 disabled:cursor-not-allowed disabled:opacity-70 ${isActive ? "bg-blue-100" : "bg-transparent hover:bg-slate-50"
                                    }`}
                                  onClick={() =>
                                    handleSwitchWorkspace(optionId)
                                  }
                                  disabled={
                                    switchingWorkspace || !optionId || isActive
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-[#16a34a] shadow-[0_0_0_2px_rgba(22,163,74,0.15)]" : "bg-slate-100"
                                        }`}
                                    ></span>
                                    <div className="flex flex-col items-start gap-0.5">
                                      <span className="font-semibold text-[10px] text-slate-900 text-left max-w-[130px] whitespace-nowrap overflow-hidden text-ellipsis">
                                        {option.name || "Workspace"}
                                      </span>
                                      <span className="text-[9px] text-slate-500 capitalize">
                                        {formatWorkspaceRole(option.role)}
                                      </span>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-medium ${isActive ? "text-slate-500" : "text-signal-blue"}`}>
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
                        className="flex items-center gap-3 py-2 px-2 rounded-md no-underline text-slate-900 text-sm transition-all duration-200 cursor-pointer border-none bg-transparent w-full text-left hover:bg-slate-50 [&>i]:w-5 [&>i]:text-center [&>i]:text-slate-500"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          router.push("/dashboard/profile");
                        }}
                      >
                        <i className="uil uil-user"></i>
                        View Profile
                      </button>
                      <button
                        className="flex items-center gap-3 py-2 px-2 rounded-md no-underline text-red-500 text-sm transition-all duration-200 cursor-pointer border-none bg-transparent w-full text-left hover:bg-red-50 [&>i]:w-5 [&>i]:text-center [&>i]:text-red-500"
                        onClick={handleLogout}
                      >
                        <i className="uil uil-sign-out-alt"></i>
                        Logout
                      </button>
                    </div>
                  </div>
                  <div
                    className="fixed inset-0 z-[1099]"
                    onClick={() => setIsProfileMenuOpen(false)}
                  ></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div key={activeWorkspaceId || "default"}>
          {showRestrictionBanner ? restrictedContent : children}
        </div>
      </div>
    </div>
  );
}
