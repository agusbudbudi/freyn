"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import { toast } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

const strengthBar = {
  weak: "w-1/3 bg-red-500",
  medium: "w-2/3 bg-amber-500",
  strong: "w-full bg-emerald-500",
};

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Form errors
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    show: false,
    level: "",
    text: "",
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState({
    login: false,
    register: false,
    confirm: false,
  });

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  // Clear forms when switching
  const switchForm = () => {
    setIsLogin(!isLogin);
    setLoginData({ email: "", password: "" });
    setRegisterData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setAlert({ show: false, message: "", type: "" });
    setPasswordStrength({ show: false, level: "", text: "" });
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check password strength
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({ show: false, level: "", text: "" });
      return 0;
    }

    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?\":{}|<>]/.test(password)) strength++;

    let level = "";
    let text = "";

    if (strength <= 2) {
      level = "weak";
      text = "Weak password";
    } else if (strength <= 3) {
      level = "medium";
      text = "Medium strength";
    } else {
      level = "strong";
      text = "Strong password";
    }

    setPasswordStrength({ show: true, level, text });
    return strength;
  };

  // Handle login submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!loginData.email) {
      newErrors.loginEmail = "Email is required";
    } else if (!validateEmail(loginData.email)) {
      newErrors.loginEmail = "Please enter a valid email address";
    }

    if (!loginData.password) {
      newErrors.loginPassword = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
        localStorage.setItem("token", data.data.token);
        if (data.data.workspace) {
          localStorage.setItem(
            "workspace",
            JSON.stringify(data.data.workspace)
          );
        }
        toast.success("Login successful! Redirecting...");
        setAlert({
          show: true,
          message: "Login successful! Redirecting...",
          type: "success",
        });
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        toast.error(data.message || "Login failed");
        setAlert({
          show: true,
          message: data.message || "Login failed",
          type: "error",
        });
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
      setAlert({
        show: true,
        message: "Login failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle register submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!registerData.fullName) {
      newErrors.registerFullName = "Full name is required";
    } else if (registerData.fullName.length < 2) {
      newErrors.registerFullName = "Full name must be at least 2 characters";
    }

    if (!registerData.email) {
      newErrors.registerEmail = "Email is required";
    } else if (!validateEmail(registerData.email)) {
      newErrors.registerEmail = "Please enter a valid email address";
    }

    if (!registerData.password) {
      newErrors.registerPassword = "Password is required";
    } else if (registerData.password.length < 8) {
      newErrors.registerPassword =
        "Password must be at least 8 characters long";
    } else {
      const strength = checkPasswordStrength(registerData.password);
      if (strength < 3) {
        newErrors.registerPassword =
          "Password is too weak. Please create a stronger password.";
      }
    }

    if (!registerData.confirmPassword) {
      newErrors.registerConfirmPassword = "Please confirm your password";
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.registerConfirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Account created successfully!");
        setAlert({
          show: true,
          message: "Account created successfully!",
          type: "success",
        });
        setTimeout(() => {
          switchForm();
          toast.success(
            "Account created! Please sign in with your credentials."
          );
          setAlert({
            show: true,
            message: "Account created! Please sign in with your credentials.",
            type: "success",
          });
        }, 2000);
      } else {
        toast.error(data.message || "Registration failed");
        setAlert({
          show: true,
          message: data.message || "Registration failed",
          type: "error",
        });
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      setAlert({
        show: true,
        message: "Registration failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const formControl = (hasError) =>
    `w-full h-[46px] px-4 rounded-inputs border box-border appearance-none bg-paper font-inter text-[0.9rem] text-ink transition-[border-color,box-shadow] duration-150 focus:outline-none ${hasError
      ? "border-red-500 focus:ring-[3px] focus:ring-red-500/15"
      : "border-border-subtle focus:border-signal-blue focus:ring-[3px] focus:ring-sky-wash"
    }`;

  return (
    <div className={`${inter.variable} font-inter h-screen w-screen bg-paper text-ink flex overflow-hidden`}>
      <div className="w-screen h-screen grid grid-cols-1 split:grid-cols-[1.1fr_0.9fr] bg-paper overflow-hidden">
        {/* Left: Hero Onboarding */}
        <aside className="hidden split:flex flex-col justify-between items-start relative overflow-hidden h-screen px-[60px] py-[52px] bg-[linear-gradient(145deg,#f8fafc_0%,#edf5ff_100%)]">
          <div className="absolute -top-20 -left-20 w-[280px] h-[280px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(0,128,255,0.2)_0%,rgba(255,255,255,0)_70%)]"></div>
          <div className="absolute top-auto -bottom-[60px] -right-[60px] left-auto w-[280px] h-[280px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(168,85,247,0.1)_0%,rgba(255,255,255,0)_70%)]"></div>

          {/* Top Brand + Trust */}
          <div className="flex items-center justify-between w-full">
            <Link href="/" className="flex items-center gap-2 no-underline cursor-pointer">
              <img src="/images/logo-freyn.png" alt="Freyn" className="w-[30px] h-[30px] object-contain" />
              <span className="text-[1.3rem] font-extrabold tracking-[-0.03em] text-ink">Freyn</span>
            </Link>
            <div className="flex items-center gap-2.5 bg-white pl-2 pr-3.5 py-1.5 rounded-tags shadow-[0px_10px_24px_rgba(0,0,0,0.05)]">
              <div className="flex items-center">
                <img src="/images/testimony-1.png" alt="User 1" className="w-6 h-6 rounded-full border-2 border-white object-cover" />
                <img src="/images/testimony-2.png" alt="User 2" className="w-6 h-6 rounded-full border-2 border-white -ml-[7px] object-cover" />
                <img src="/images/testimony-3.png" alt="User 3" className="w-6 h-6 rounded-full border-2 border-white -ml-[7px] object-cover" />
                <img src="/images/testimony-4.png" alt="User 4" className="w-6 h-6 rounded-full border-2 border-white -ml-[7px] object-cover" />
              </div>
              <span className="text-xs font-bold text-carbon whitespace-nowrap">⭐️ 5.0 - 2,500+ freelancer</span>
            </div>
          </div>

          {/* Illustration Cards */}
          <div className="flex-1 flex flex-col gap-3.5 w-full justify-center py-2">
            {/* Card: Proyek Aktif */}
            <div className="bg-white rounded-cards px-5 py-[18px] shadow-[0px_8px_24px_rgba(0,0,0,0.05)] w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
                  <i className="fas fa-layer-group" style={{ color: "#22c55e", fontSize: "14px" }}></i>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-ink leading-none">Redesain App</div>
                  <div className="text-xs text-graphite mt-0.5">3/4 Milestone</div>
                </div>
                <span className="text-sm font-extrabold text-[#22c55e] ml-auto shrink-0">75%</span>
              </div>
              <div className="h-1.5 rounded-md bg-[#f1f5f9] overflow-hidden">
                <div className="h-full rounded-md bg-[#22c55e]" style={{ width: "75%" }}></div>
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <div className="flex">
                  <img src="/images/testimony-1.png" alt="" className="w-[22px] h-[22px] rounded-full border-2 border-white object-cover" />
                  <img src="/images/testimony-2.png" alt="" className="w-[22px] h-[22px] rounded-full border-2 border-white -ml-[7px] object-cover" />
                </div>
                <span className="text-xs text-graphite mt-0.5">Aktif</span>
              </div>
            </div>

            {/* Row: Invoice + Klien Baru side by side */}
            <div className="flex gap-3.5 w-full">
              {/* Card: Invoice */}
              <div className="bg-white rounded-cards px-5 py-[18px] shadow-[0px_8px_24px_rgba(0,0,0,0.05)] w-1/2 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
                    <i className="fas fa-file-invoice-dollar" style={{ color: "#0080ff", fontSize: "14px" }}></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-ink leading-none truncate">Invoice</div>
                    <div className="text-xs text-graphite mt-0.5 truncate">#INV-2025-08</div>
                  </div>
                  <span className="text-[0.7rem] font-bold px-2.5 py-1 rounded-full ml-auto shrink-0 bg-[#dcfce7] text-[#15803d]">Lunas ✓</span>
                </div>
                <div className="text-[1.2rem] font-extrabold tracking-[-0.03em] text-ink mb-2.5 truncate">Rp 10.000.000</div>
                <div className="h-1.5 rounded-md bg-[#f1f5f9] overflow-hidden">
                  <div className="h-full rounded-md bg-signal-blue" style={{ width: "100%" }}></div>
                </div>
              </div>

              {/* Card: Chat Notif */}
              <div className="bg-white rounded-cards px-5 py-[18px] shadow-[0px_8px_24px_rgba(0,0,0,0.05)] w-1/2 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#fdf4ff" }}>
                    <i className="fas fa-comment-dots" style={{ color: "#a855f7", fontSize: "14px" }}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink leading-none truncate">Klien Baru</div>
                    <div className="text-xs text-graphite mt-0.5 truncate">Baru saja</div>
                  </div>
                </div>
                <p className="text-[0.8rem] leading-[1.5] text-graphite italic m-0 line-clamp-3">"Invoice sudah diterima! Kami setuju dengan proposal ini. 👍"</p>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="w-full">
            <h2 className="text-[1.6rem] font-extrabold leading-[1.25] tracking-[-0.03em] text-ink mb-2">
              {isLogin
                ? "Selamat datang kembali di workspace-mu"
                : "Wujudkan karir freelance impianmu"}
            </h2>
            <p className="text-sm leading-[1.55] text-graphite mb-4">
              Kelola proyek, invoice, dan klien dari satu dashboard yang rapi dan profesional.
            </p>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              <li className="flex items-center gap-2 text-[0.825rem] font-semibold text-carbon">
                <i className="fas fa-check-circle text-signal-blue text-sm"></i> Progress proyek &amp; milestone terpantau
              </li>
              <li className="flex items-center gap-2 text-[0.825rem] font-semibold text-carbon">
                <i className="fas fa-check-circle text-signal-blue text-sm"></i> Invoice otomatis, langsung bisa diunduh PDF
              </li>
              <li className="flex items-center gap-2 text-[0.825rem] font-semibold text-carbon">
                <i className="fas fa-check-circle text-signal-blue text-sm"></i> Portal karya profesional untuk klien
              </li>
            </ul>
          </div>
        </aside>

        {/* Right: Auth Panel (Forms) */}
        <section className="px-6 py-10 split:p-12 flex items-center justify-center bg-paper h-screen overflow-y-auto">
          <div className="w-full max-w-[380px]">
            <Link href="/" className="flex split:hidden items-center gap-2 no-underline cursor-pointer mb-6">
              <img
                src="/images/logo-freyn.png"
                alt="Freyn logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-2xl font-extrabold tracking-[-0.03em] text-ink">Freyn</span>
            </Link>
            {/* Login Form */}
            <div className={isLogin ? "block" : "hidden"}>
              <div className="mb-6">
                <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-ink mb-1.5">Welcome Back 😎</h1>
                <p className="text-[0.9rem] text-graphite m-0">
                  Sign in to your account to continue
                </p>
              </div>

              {alert.show && isLogin && (
                <div
                  className={`p-3 px-4 rounded-inputs text-[0.825rem] font-medium mb-[18px] flex items-center gap-2.5 ${alert.type === "error"
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-green-50 text-green-800 border border-green-200"
                    }`}
                >
                  <i
                    className={`fas fa-${alert.type === "error"
                        ? "exclamation-circle"
                        : "check-circle"
                      }`}
                  ></i>
                  {alert.message}
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <div className="mb-[18px]">
                  <label className="block text-[0.825rem] font-semibold text-carbon mb-1.5" htmlFor="login-email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    className={formControl(!!errors.loginEmail)}
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => {
                      setLoginData({ ...loginData, email: e.target.value });
                      setErrors({ ...errors, loginEmail: "" });
                    }}
                  />
                  {errors.loginEmail && (
                    <div className="text-[0.775rem] text-red-500 mt-1 font-medium">
                      {errors.loginEmail}
                    </div>
                  )}
                </div>

                <div className="mb-[18px]">
                  <label className="block text-[0.825rem] font-semibold text-carbon mb-1.5" htmlFor="login-password">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword.login ? "text" : "password"}
                      id="login-password"
                      className={formControl(!!errors.loginPassword)}
                      placeholder="At least 8 characters"
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData({
                          ...loginData,
                          password: e.target.value,
                        });
                        setErrors({ ...errors, loginPassword: "" });
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 bg-transparent border-none text-graphite cursor-pointer p-1 text-[1.1rem] flex items-center justify-center hover:text-ink"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          login: !showPassword.login,
                        })
                      }
                    >
                      <i
                        className={`input-icon ${showPassword.login ? "uil-eye-slash" : "uil-eye"
                          }`}
                      ></i>
                    </button>
                  </div>
                  {errors.loginPassword && (
                    <div className="text-[0.775rem] text-red-500 mt-1 font-medium">
                      {errors.loginPassword}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-signal-blue text-white rounded-buttons border-none font-inter text-[0.95rem] font-bold tracking-[-0.01em] cursor-pointer shadow-lg inline-flex items-center justify-center mt-2 transition-[transform,background-color,box-shadow] duration-150 hover:bg-[#0070e0] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,128,255,0.35)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                  disabled={loading}
                >
                  <div className="btn-spinner"></div>
                  <span className="btn-text">Login</span>
                </button>
              </form>

              <div className="mt-6 text-center text-[0.85rem] flex items-center justify-center gap-1.5">
                <p className="text-graphite m-0">Don't have an account?</p>
                <a href="#" className="text-signal-blue font-bold no-underline hover:underline" onClick={switchForm}>
                  Create an account
                </a>
              </div>
            </div>

            {/* Register Form */}
            <div className={!isLogin ? "block" : "hidden"}>
              <div className="mb-6">
                <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-ink mb-1.5">Create Account 👋🏻</h1>
                <p className="text-[0.9rem] text-graphite m-0">
                  Join us to start managing your projects
                </p>
              </div>

              {alert.show && !isLogin && (
                <div
                  className={`p-3 px-4 rounded-inputs text-[0.825rem] font-medium mb-[18px] flex items-center gap-2.5 ${alert.type === "error"
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-green-50 text-green-800 border border-green-200"
                    }`}
                >
                  <i
                    className={`fas fa-${alert.type === "error"
                        ? "exclamation-circle"
                        : "check-circle"
                      }`}
                  ></i>
                  {alert.message}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                <div className="mb-[18px]">
                  <label className="block text-[0.825rem] font-semibold text-carbon mb-1.5" htmlFor="register-fullname">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="register-fullname"
                    className={formControl(!!errors.registerFullName)}
                    placeholder="Your full name"
                    value={registerData.fullName}
                    onChange={(e) => {
                      setRegisterData({
                        ...registerData,
                        fullName: e.target.value,
                      });
                      setErrors({ ...errors, registerFullName: "" });
                    }}
                  />
                  {errors.registerFullName && (
                    <div className="text-[0.775rem] text-red-500 mt-1 font-medium">
                      {errors.registerFullName}
                    </div>
                  )}
                </div>

                <div className="mb-[18px]">
                  <label className="block text-[0.825rem] font-semibold text-carbon mb-1.5" htmlFor="register-email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="register-email"
                    className={formControl(!!errors.registerEmail)}
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => {
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      });
                      setErrors({ ...errors, registerEmail: "" });
                    }}
                  />
                  {errors.registerEmail && (
                    <div className="text-[0.775rem] text-red-500 mt-1 font-medium">
                      {errors.registerEmail}
                    </div>
                  )}
                </div>

                <div className="mb-[18px]">
                  <label className="block text-[0.825rem] font-semibold text-carbon mb-1.5" htmlFor="register-password">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword.register ? "text" : "password"}
                      id="register-password"
                      className={formControl(!!errors.registerPassword)}
                      placeholder="At least 8 characters"
                      value={registerData.password}
                      onChange={(e) => {
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        });
                        setErrors({ ...errors, registerPassword: "" });
                        checkPasswordStrength(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 bg-transparent border-none text-graphite cursor-pointer p-1 text-[1.1rem] flex items-center justify-center hover:text-ink"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          register: !showPassword.register,
                        })
                      }
                    >
                      <i
                        className={`input-icon ${showPassword.register ? "uil-eye-slash" : "uil-eye"
                          }`}
                      ></i>
                    </button>
                  </div>
                  {errors.registerPassword && (
                    <div className="text-[0.775rem] text-red-500 mt-1 font-medium">
                      {errors.registerPassword}
                    </div>
                  )}
                  {passwordStrength.show && (
                    <div className="mt-2">
                      <div className="h-1 bg-border-subtle rounded-[4px] overflow-hidden mb-1">
                        <div
                          className={`h-full transition-[width,background-color] duration-300 ${strengthBar[passwordStrength.level]}`}
                        ></div>
                      </div>
                      <div className="text-xs font-medium text-graphite">
                        {passwordStrength.text}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-[18px]">
                  <label
                    className="block text-[0.825rem] font-semibold text-carbon mb-1.5"
                    htmlFor="register-confirm-password"
                  >
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      id="register-confirm-password"
                      className={formControl(!!errors.registerConfirmPassword)}
                      placeholder="Re-type your password"
                      value={registerData.confirmPassword}
                      onChange={(e) => {
                        setRegisterData({
                          ...registerData,
                          confirmPassword: e.target.value,
                        });
                        setErrors({ ...errors, registerConfirmPassword: "" });
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 bg-transparent border-none text-graphite cursor-pointer p-1 text-[1.1rem] flex items-center justify-center hover:text-ink"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          confirm: !showPassword.confirm,
                        })
                      }
                    >
                      <i
                        className={`input-icon ${showPassword.confirm ? "uil-eye-slash" : "uil-eye"
                          }`}
                      ></i>
                    </button>
                  </div>
                  {errors.registerConfirmPassword && (
                    <div className="text-[0.775rem] text-red-500 mt-1 font-medium">
                      {errors.registerConfirmPassword}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-signal-blue text-white rounded-buttons border-none font-inter text-[0.95rem] font-bold tracking-[-0.01em] cursor-pointer shadow-lg inline-flex items-center justify-center mt-2 transition-[transform,background-color,box-shadow] duration-150 hover:bg-[#0070e0] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,128,255,0.35)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                  disabled={loading}
                >
                  <div className="btn-spinner"></div>
                  <span className="btn-text">Create Account</span>
                </button>
              </form>

              <div className="mt-6 text-center text-[0.85rem] flex items-center justify-center gap-1.5">
                <p className="text-graphite m-0">Already have an account?</p>
                <a href="#" className="text-signal-blue font-bold no-underline hover:underline" onClick={switchForm}>
                  Sign in here
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
