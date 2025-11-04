"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

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

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        {/* Left: Hero Onboarding */}
        <aside className="auth-hero">
          <img
            className="hero-illus"
            src="/images/hero-login.png"
            alt="Freyn dashboard preview"
          />
          <h2 className="hero-title">
            {isLogin
              ? "Welcome back to your workspace 👋"
              : "Empower your freelance journey 🚀"}
          </h2>
          <p className="hero-subtitle">
            Kelola proyek dan klien Anda lebih cepat, rapi, dan aman.
          </p>

          <ul className="hero-points">
            <li>Progress proyek lebih terpantau</li>
            <li>Data aman, privat, dan terenkripsi</li>
            <li>Dashboard ringkas untuk insight cepat</li>
          </ul>
        </aside>

        {/* Right: Auth Panel (Forms) */}
        <section className="auth-panel">
          <div className="auth-panel-inner">
            <div className="hero-brand logo">
              <div className="logo-icon">
                <img
                  src="/images/logo-freyn.png"
                  alt="Freyn logo"
                  className="logo-img"
                />
              </div>
              <span className="logo-text">Freyn</span>
            </div>
            {/* Login Form */}
            <div className={`form-page ${isLogin ? "active" : ""}`}>
              <div className="auth-header">
                <h1 className="auth-title">Welcome Back 😎</h1>
                <p className="auth-subtitle">
                  Sign in to your account to continue
                </p>
              </div>

              {alert.show && isLogin && (
                <div className={`alert alert-${alert.type}`}>
                  <i
                    className={`fas fa-${
                      alert.type === "error"
                        ? "exclamation-circle"
                        : "check-circle"
                    }`}
                  ></i>
                  {alert.message}
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <div className="form-group auth">
                  <label className="form-label" htmlFor="login-email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    className={`form-control ${
                      errors.loginEmail ? "error" : ""
                    }`}
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => {
                      setLoginData({ ...loginData, email: e.target.value });
                      setErrors({ ...errors, loginEmail: "" });
                    }}
                  />
                  {errors.loginEmail && (
                    <div className="form-error" style={{ display: "block" }}>
                      {errors.loginEmail}
                    </div>
                  )}
                </div>

                <div className="form-group auth">
                  <label className="form-label" htmlFor="login-password">
                    Password
                  </label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword.login ? "text" : "password"}
                      id="login-password"
                      className={`form-control ${
                        errors.loginPassword ? "error" : ""
                      }`}
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
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          login: !showPassword.login,
                        })
                      }
                    >
                      <i
                        className={`input-icon ${
                          showPassword.login ? "uil-eye-slash" : "uil-eye"
                        }`}
                      ></i>
                    </button>
                  </div>
                  {errors.loginPassword && (
                    <div className="form-error" style={{ display: "block" }}>
                      {errors.loginPassword}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary btn-full ${
                    loading ? "btn-loading" : ""
                  }`}
                  disabled={loading}
                >
                  <div className="btn-spinner"></div>
                  <span className="btn-text">Login</span>
                </button>
              </form>

              <div className="auth-switch">
                <p className="auth-switch-text">Don't have an account?</p>
                <a href="#" className="auth-switch-link" onClick={switchForm}>
                  Create an account
                </a>
              </div>
            </div>

            {/* Register Form */}
            <div className={`form-page ${!isLogin ? "active" : ""}`}>
              <div className="auth-header">
                <h1 className="auth-title">Create Account 👋🏻</h1>
                <p className="auth-subtitle">
                  Join us to start managing your projects
                </p>
              </div>

              {alert.show && !isLogin && (
                <div className={`alert alert-${alert.type}`}>
                  <i
                    className={`fas fa-${
                      alert.type === "error"
                        ? "exclamation-circle"
                        : "check-circle"
                    }`}
                  ></i>
                  {alert.message}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group auth">
                  <label className="form-label" htmlFor="register-fullname">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="register-fullname"
                    className={`form-control ${
                      errors.registerFullName ? "error" : ""
                    }`}
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
                    <div className="form-error" style={{ display: "block" }}>
                      {errors.registerFullName}
                    </div>
                  )}
                </div>

                <div className="form-group auth">
                  <label className="form-label" htmlFor="register-email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="register-email"
                    className={`form-control ${
                      errors.registerEmail ? "error" : ""
                    }`}
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
                    <div className="form-error" style={{ display: "block" }}>
                      {errors.registerEmail}
                    </div>
                  )}
                </div>

                <div className="form-group auth">
                  <label className="form-label" htmlFor="register-password">
                    Password
                  </label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword.register ? "text" : "password"}
                      id="register-password"
                      className={`form-control ${
                        errors.registerPassword ? "error" : ""
                      }`}
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
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          register: !showPassword.register,
                        })
                      }
                    >
                      <i
                        className={`input-icon ${
                          showPassword.register ? "uil-eye-slash" : "uil-eye"
                        }`}
                      ></i>
                    </button>
                  </div>
                  {errors.registerPassword && (
                    <div className="form-error" style={{ display: "block" }}>
                      {errors.registerPassword}
                    </div>
                  )}
                  {passwordStrength.show && (
                    <div
                      className={`password-strength strength-${passwordStrength.level}`}
                    >
                      <div className="strength-bar">
                        <div className="strength-fill"></div>
                      </div>
                      <div className="strength-text">
                        {passwordStrength.text}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group  auth">
                  <label
                    className="form-label"
                    htmlFor="register-confirm-password"
                  >
                    Confirm Password
                  </label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      id="register-confirm-password"
                      className={`form-control ${
                        errors.registerConfirmPassword ? "error" : ""
                      }`}
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
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          confirm: !showPassword.confirm,
                        })
                      }
                    >
                      <i
                        className={`input-icon ${
                          showPassword.confirm ? "uil-eye-slash" : "uil-eye"
                        }`}
                      ></i>
                    </button>
                  </div>
                  {errors.registerConfirmPassword && (
                    <div className="form-error" style={{ display: "block" }}>
                      {errors.registerConfirmPassword}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary btn-full ${
                    loading ? "btn-loading" : ""
                  }`}
                  disabled={loading}
                >
                  <div className="btn-spinner"></div>
                  <span className="btn-text">Create Account</span>
                </button>
              </form>

              <div className="auth-switch">
                <p className="auth-switch-text">Already have an account?</p>
                <a href="#" className="auth-switch-link" onClick={switchForm}>
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
