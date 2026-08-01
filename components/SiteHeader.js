"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { id: "features", label: "Fitur" },
  { id: "testimony", label: "Testimoni" },
  { id: "contact", label: "Hubungi Kami" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerBg, setHeaderBg] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const smoothScrollTo = (e, targetId) => {
    if (!isHome) return;
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      closeMobileMenu();
    }
  };

  useEffect(() => {
    const handleScroll = () => setHeaderBg(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[990] bg-slate-900/40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        ></div>
      )}

      <header
        className={`fixed top-0 inset-x-0 w-full backdrop-blur-lg border-b border-slate-100 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] z-[1000] transition-all duration-300 ${headerBg ? "bg-white/[0.98] shadow-card" : "bg-white/[0.92]"
          }`}
      >
        <nav className="max-w-[1200px] mx-auto px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-1 text-lg font-bold text-slate-900 tracking-[-0.03em] no-underline"
          >
            <div className="w-7 h-7 flex rounded-lg overflow-hidden">
              <img
                src="/images/logo-freyn.png"
                alt="Freyn Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span>Freyn</span>
          </Link>

          <div className="flex items-center gap-8">
            <ul
              className={
                isMobileMenuOpen
                  ? "flex flex-col absolute top-full left-0 right-0 z-[999] bg-white p-6 border-t-0 border border-slate-200 rounded-none gap-4 sm:gap-7 list-none m-0"
                  : "hidden md:flex gap-7 list-none m-0 p-0"
              }
            >
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <Link
                    href={`/#${link.id}`}
                    className="no-underline text-slate-500 font-medium text-sm transition-colors duration-200 hover:text-slate-900"
                    onClick={(e) => smoothScrollTo(e, `#${link.id}`)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="hidden md:inline-flex items-center justify-center bg-transparent text-slate-800 border border-slate-200 px-5 py-2 rounded-buttons no-underline font-medium text-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900"
              >
                Masuk
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 bg-slate-900 text-white border-none px-5 py-2 rounded-buttons no-underline font-medium text-sm shadow-[0px_4px_12px_rgba(15,23,42,0.15)] transition-all duration-200 hover:bg-signal-blue hover:shadow-glow-blue"
              >
                Coba Gratis
                <i className="fas fa-arrow-right text-[11px]"></i>
              </Link>
              <button
                className="flex md:hidden items-center justify-center w-6 h-6 shrink-0 bg-transparent border-none text-xl cursor-pointer text-slate-900"
                onClick={toggleMobileMenu}
                aria-label="Buka menu navigasi"
              >
                <i
                  className={isMobileMenuOpen ? "fas fa-times" : "fas fa-bars"}
                ></i>
              </button>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
