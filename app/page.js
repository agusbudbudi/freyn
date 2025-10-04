"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import TestimonialSlider from "../components/TestimonialSlider";
import "../styles/home.css";

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [headerBg, setHeaderBg] = useState(false);

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking nav links
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Smooth scroll to section
  const smoothScrollTo = (e, targetId) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      closeMobileMenu();
    }
  };

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHeaderBg(true);
      } else {
        setHeaderBg(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(
      ".feature-section, .feature-card, .testimonials-section"
    );

    animatedElements.forEach((el) => {
      el.classList.add("fade-in");
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Cleanup when navigating away from home page
  useEffect(() => {
    return () => {
      // Reset header styles when leaving home page
      const headers = document.querySelectorAll(".header");
      headers.forEach((header) => {
        header.style.position = "";
        header.style.background = "";
        header.style.backdropFilter = "";
        header.style.border = "";
        header.style.boxShadow = "";
        header.style.transform = "";
      });
    };
  }, []);

  return (
    <div className="home-page">
      {/* Header */}
      <header
        className="header"
        style={{
          background: headerBg
            ? "rgba(255, 255, 255, 0.98)"
            : "rgba(255, 255, 255, 0.4)",
          boxShadow: headerBg
            ? "0 12px 40px rgba(31, 38, 135, 0.12)"
            : "0 8px 32px rgba(31, 38, 135, 0.08)",
          transform: headerBg ? "translateY(-1px)" : "translateY(0)",
          border: headerBg
            ? "1px solid rgba(255, 255, 255, 0.6)"
            : "1px solid rgba(255, 255, 255, 0.5)",
        }}
      >
        <nav className="nav-container">
          <div className="logo">
            <div className="logo-icon">
              <i className="fas fa-palette"></i>
            </div>
            <span>Freyn</span>
          </div>

          <div className="nav-menu-container">
            <ul
              className={`nav-menu ${isMobileMenuOpen ? "mobile-open" : ""}`}
              style={
                isMobileMenuOpen
                  ? {
                      display: "flex",
                      flexDirection: "column",
                      position: "absolute",
                      top: "110%",
                      left: "0",
                      right: "0",
                      background: "white",
                      padding: "1.5rem",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                      borderRadius: "16px",
                      zIndex: "999",
                    }
                  : undefined
              }
            >
              <li>
                <a
                  href="#features"
                  className="nav-link"
                  onClick={(e) => smoothScrollTo(e, "#features")}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#testimony"
                  className="nav-link"
                  onClick={(e) => smoothScrollTo(e, "#testimony")}
                >
                  Testimonials
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="nav-link"
                  onClick={(e) => smoothScrollTo(e, "#contact")}
                >
                  Contact Us
                </a>
              </li>
            </ul>

            <div className="nav-actions">
              <button
                className="mobile-menu-btn"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                <i
                  className={isMobileMenuOpen ? "fas fa-times" : "fas fa-bars"}
                ></i>
              </button>
              <Link href="/login" className="btn-header">
                Sign In
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Your All-in-One
              <span className="highlight"> Freelance Management</span> System
            </h1>
            <p className="hero-subtitle">
              Streamline your freelance business. Manage projects, track
              clients, monitor progress, and boost your productivity with our
              comprehensive management solution.
            </p>

            <div className="hero-buttons">
              <Link href="/login" className="btn-primary">
                <i className="fas fa-rocket"></i>
                Get Started Free
              </Link>
            </div>

            <div className="hero-badges">
              <div className="badge">
                <i className="fas fa-check"></i>
                <span>No credit card required</span>
              </div>
              <div className="badge">
                <i className="fas fa-check"></i>
                <span>14-day free trial</span>
              </div>
              <div className="badge">
                <i className="fas fa-check"></i>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          <div className="hero-preview">
            <div className="dashboard-preview">
              <div className="dashboard-header">
                <div className="window-controls">
                  <div className="control-dot"></div>
                  <div className="control-dot"></div>
                  <div className="control-dot"></div>
                </div>
                <span style={{ marginLeft: "1rem", fontSize: "0.9rem" }}>
                  Dashboard
                </span>
              </div>
              <div className="dashboard-body">
                <div className="preview-stats">
                  <div className="preview-stat">
                    <div className="preview-stat-number">24</div>
                    <div className="preview-stat-label">Total Projects</div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-stat-number">8</div>
                    <div className="preview-stat-label">In Progress</div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-stat-number">16</div>
                    <div className="preview-stat-label">Completed</div>
                  </div>
                </div>

                <div className="preview-chart">
                  <div className="chart-header">
                    Project Completion Progress
                  </div>
                  <div className="chart-placeholder">
                    <i
                      className="fas fa-chart-pie"
                      style={{ marginRight: "8px" }}
                    ></i>
                    Interactive Charts & Analytics
                  </div>
                </div>

                <div className="preview-projects">
                  <div className="projects-header">Recent Projects</div>
                  <div className="project-item">
                    <span className="project-name">Website Redesign</span>
                    <span className="project-status status-progress">
                      In Progress
                    </span>
                  </div>
                  <div className="project-item">
                    <span className="project-name">Logo Design</span>
                    <span className="project-status status-completed">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1 - Dark */}
      <section className="feature-section dark" id="features">
        <div className="feature-highlight">
          <div className="feature-content">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="uil uil-folder-open"></i>
                </div>
                <h3 className="feature-title">Project Management</h3>
                <p className="feature-description">
                  Organize and track all your projects in one place. Set
                  deadlines, monitor progress, and never miss a delivery date.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="uil uil-users-alt"></i>
                </div>
                <h3 className="feature-title">Client Management</h3>
                <p className="feature-description">
                  Keep detailed client profiles, contact information, and
                  project history. Build stronger relationships with your
                  clients.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="uil uil-wallet"></i>
                </div>
                <h3 className="feature-title">Revenue Tracking</h3>
                <p className="feature-description">
                  Monitor your earnings, track payments, and get insights into
                  your most profitable projects and clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2 */}
      <section className="feature-section">
        <div className="feature-container">
          <div className="feature-content">
            <h2>Complete Project Lifecycle Management</h2>
            <p>
              From project initiation to final delivery, manage every aspect of
              your freelance projects. Provide clients with professional project
              results, seamless communication, and secure deliverable access all
              in one place.
            </p>
            <ul className="feature-list">
              <li>
                <div className="feature-icon">
                  <i className="uil uil-file-check-alt"></i>
                </div>
                <span>Professional project tracking & status updates</span>
              </li>
              <li>
                <div className="feature-icon">
                  <i className="uil uil-invoice"></i>
                </div>
                <span>Automated invoice generation & download</span>
              </li>
              <li>
                <div className="feature-icon">
                  <i className="uil uil-eye"></i>
                </div>
                <span>Direct client access to design results</span>
              </li>
              <li>
                <div className="feature-icon">
                  <i className="uil uil-comment-dots"></i>
                </div>
                <span>Integrated feedback & communication system</span>
              </li>
            </ul>
          </div>
          <div className="feature-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
              </div>
              <div className="mockup-title">Activity Dashboard</div>
            </div>
            <div className="mockup-content">
              <div className="chart-placeholder">
                <Image
                  src="/images/dashboard.png"
                  alt="Dashboard Preview"
                  width={500}
                  height={300}
                  className="dashboard-image"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
              <div style={{ textAlign: "left", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                  Easily monitor sales increases
                </h3>
                <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>
                  Track your project performance and revenue growth with
                  detailed analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 3 */}
      <section className="feature-section">
        <div className="feature-container">
          <div className="feature-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
              </div>
            </div>
            <div className="mockup-content">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    background: "var(--primary-color)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "1.5rem",
                  }}
                >
                  <i className="fas fa-chart-pie"></i>
                </div>
                <div>
                  <h4 style={{ marginBottom: "4px" }}>Project Analytics</h4>
                  <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>
                    Get detailed insights
                  </p>
                </div>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">24</span>
                  <span className="stat-label">Total Projects</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">8</span>
                  <span className="stat-label">In Progress</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Rp 10 jt</span>
                  <span className="stat-label">Est. Revenue</span>
                </div>
              </div>
            </div>
          </div>
          <div className="feature-content">
            <h2>Comprehensive Business Management Dashboard</h2>
            <p>
              Centralize your entire freelance business operations. Manage
              projects, track clients, organize services, and monitor your
              business growth all from one powerful dashboard with real-time
              insights.
            </p>
            <ul className="feature-list">
              <li>
                <i className="fas fa-check"></i> Complete project lifecycle
                management
              </li>
              <li>
                <i className="fas fa-check"></i> Centralized client database &
                communication
              </li>
              <li>
                <i className="fas fa-check"></i> Service catalog & pricing
                management
              </li>
              <li>
                <i className="fas fa-check"></i> Real-time business analytics &
                reporting
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Mobile/Client Section */}
      <section className="feature-section client-feature">
        <div className="feature-container">
          <div className="feature-content">
            <h2>Engage with your clients instantly</h2>
            <p>
              Improve client engagement with automated workflows and real-time
              project updates that keep everyone in the loop.
            </p>
            <ul className="feature-list">
              <li>
                <div className="feature-icon">
                  <i className="uil uil-bolt-alt"></i>
                </div>
                <span>Real-time project updates</span>
              </li>
              <li>
                <div className="feature-icon">
                  <i className="uil uil-comments"></i>
                </div>
                <span>Client communication hub</span>
              </li>
              <li>
                <div className="feature-icon">
                  <i className="uil uil-file-check-alt"></i>
                </div>
                <span>Easy access deliverables</span>
              </li>
              <li>
                <div className="feature-icon">
                  <i className="uil uil-rocket"></i>
                </div>
                <span>Project status tracking</span>
              </li>
            </ul>
          </div>

          <Image
            src="/images/phone.png"
            alt="Mobile Freelance Management App"
            width={1000}
            height={1000}
            className="phone-image"
            style={{ maxWidth: "100%", height: "auto" }}
            priority
            unoptimized
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" id="testimony">
        <div className="testimonials-container">
          <div className="testimonials-header">
            <h2 className="testimonials-title">
              Kind words from our customers ✨
            </h2>
            <p className="cta-subtitle">
              See how our platform makes freelance work simpler and smarter.
            </p>
          </div>

          <TestimonialSlider />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta" id="contact">
        <div className="cta-container">
          <h2 className="cta-title">Grow Better With Freyn Today 🚀</h2>
          <p className="cta-subtitle">
            Start your journey to better freelance management. Get organized,
            stay productive, and grow your design business with confidence.
          </p>

          <div className="cta-buttons">
            <Link href="/dashboard" className="btn-white">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-bottom">
          <div className="footer-logo">
            <div className="logo-icon">
              <i className="fas fa-palette"></i>
            </div>
            <span>Freyn</span>
          </div>
          <p>&copy; 2025 Freyn. All rights reserved.</p>
          <div className="footer-social">
            <a href="#" className="social-link">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="social-link">
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="#" className="social-link">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
