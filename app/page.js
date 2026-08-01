"use client";

import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import TestimonialSlider from "../components/TestimonialSlider";
import SiteHeader from "../components/SiteHeader";
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

const badgeColor = {
  yellow: "bg-[#fef9c3] text-[#a16207]",
  mint: "bg-[#dcfce7] text-[#15803d]",
  pink: "bg-[#ffe4e6] text-[#be123c]",
  lavender: "bg-[#f3e8ff] text-[#6b21a8]",
  peach: "bg-[#ffedd5] text-[#c2410c]",
  blue: "bg-[#e0f2fe] text-[#0369a1]",
};

const iconColor = {
  mint: "bg-[#dcfce7] text-[#15803d]",
  lavender: "bg-[#f3e8ff] text-[#6b21a8]",
  peach: "bg-[#ffedd5] text-[#c2410c]",
};

function Badge({ color, className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-tags align-middle font-semibold ${badgeColor[color]} ${className}`}
    >
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div
      className={`${inter.variable} font-inter bg-slate-50 text-slate-900 leading-normal overflow-x-hidden [&_*]:box-border`}
    >
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-[100px] px-4 sm:px-6 pb-[50px] relative overflow-hidden text-center bg-white">
        {/* Background Gradient Glow Circles */}
        <div className="absolute rounded-full pointer-events-none z-[1] blur-[60px] opacity-[0.85] w-[650px] h-[650px] bg-[radial-gradient(circle,rgba(0,128,255,0.22)_0%,rgba(0,128,255,0.05)_60%,rgba(255,255,255,0)_80%)] top-[-150px] left-[90%] -translate-x-1/2"></div>
        <div className="absolute rounded-full pointer-events-none z-[1] blur-[60px] opacity-[0.85] w-[520px] h-[520px] bg-[radial-gradient(circle,rgba(56,189,248,0.45)_0%,rgba(56,189,248,0.1)_60%,rgba(255,255,255,0)_80%)] top-10 -left-[120px]"></div>
        <div className="absolute rounded-full pointer-events-none z-[1] blur-[60px] opacity-[0.85] w-[550px] h-[550px] bg-[radial-gradient(circle,rgba(168,85,247,0.4)_0%,rgba(168,85,247,0.08)_60%,rgba(255,255,255,0)_80%)] top-[340px] right-[160px]"></div>

        <div className="max-w-[720px] mx-auto relative z-[2]">
          <div className="mb-5">
            {/* Social Proof Trust Stack */}
            <div className="inline-flex items-center gap-3">
              <div className="flex items-center">
                <Image src="/images/testimony-1.png" alt="User 1" width={32} height={32} className="w-[30px] h-[30px] rounded-full border-2 border-white object-cover" />
                <Image src="/images/testimony-2.png" alt="User 2" width={32} height={32} className="w-[30px] h-[30px] rounded-full border-2 border-white object-cover -ml-2" />
                <Image src="/images/testimony-3.png" alt="User 3" width={32} height={32} className="w-[30px] h-[30px] rounded-full border-2 border-white object-cover -ml-2" />
                <Image src="/images/testimony-4.png" alt="User 4" width={32} height={32} className="w-[30px] h-[30px] rounded-full border-2 border-white object-cover -ml-2" />
              </div>
              <div className="flex flex-col items-start text-left leading-[1.2]">
                <div className="flex items-center gap-0.5 text-amber-500 text-[11px]">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <span className="font-bold ml-1 text-slate-900">5.0</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Dipercaya 2,500+ freelancer</span>
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-[2.5rem] md:text-[3.25rem] wide:text-[4.25rem] font-bold leading-[1.08] sm:leading-[1.02] tracking-[-0.05em] text-slate-900 mb-6">
            Kelola{" "}
            <span className="inline-block bg-signal-blue text-white px-[22px] py-0.5 rounded-tags font-bold">proyek freelance</span> dalam satu platform
          </h1>
          <p className="text-base sm:text-[19px] leading-[1.55] text-slate-500 max-w-[640px] mx-auto mb-8 sm:mb-10 tracking-[-0.015em]">
            Atur jadwal kerja, buat invoice otomatis, dan bagikan hasil karya ke klien secara profesional.
          </p>

          <div>
            <Link
              href="/login"
              className="relative inline-flex items-center gap-3 bg-signal-blue text-white py-3 px-6 sm:pl-9 sm:pr-[42px] sm:py-4 rounded-buttons no-underline font-semibold text-base sm:text-[19px] tracking-[-0.02em] border-none shadow-glow-blue transition-all duration-[250ms] cursor-pointer hover:-translate-y-0.5 hover:shadow-glow-blue-lg"
            >
              <span>Mulai Gratis Sekarang</span>
              <i className="fas fa-arrow-right text-base"></i>
            </Link>
          </div>
        </div>

        {/* Hero Visual Mockup Showcase */}
        <div className="relative z-[3] max-w-[1100px] mx-auto mt-8 p-2 sm:p-5">
          <div className="bg-white border border-slate-100 rounded-images shadow-float p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
              </div>
              <span className="text-xs text-slate-500 font-mono truncate">
                app.freyn.com/dashboard/projects
              </span>
            </div>

            <div className="p-3 sm:p-5 bg-slate-50 rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                <div className="bg-white p-4 rounded-xl shadow-card">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="font-bold text-sm">Redesain UI/UX App</span>
                    <Badge color="mint" className="text-[10px] px-2 py-0.5">Sedang Berjalan</Badge>
                  </div>
                  <p className="text-xs text-slate-500 text-left">Tenggat: 28 Juli &middot; Client: PT Aksara</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-card">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="font-bold text-sm">Invoice #INV-2025</span>
                    <Badge color="peach" className="text-[10px] px-2 py-0.5">Lunas</Badge>
                  </div>
                  <p className="text-xs text-slate-500 text-left">Total: Rp 10.000.000 (PDF Siap)</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-card">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="font-bold text-sm">Portal Deliverables</span>
                    <Badge color="lavender" className="text-[10px] px-2 py-0.5">Siap Diulas</Badge>
                  </div>
                  <p className="text-xs text-slate-500 text-left">freyn.com/result/proj-99</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating: Client chat bubble — top-right of mockup */}
          <div className="hidden wide:block absolute z-[5] pointer-events-none -top-[130px] -right-[30px]">
            <div className="relative bg-white border border-slate-100 rounded-2xl rounded-bl-sm shadow-float p-4 px-5 max-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-900">Klien</span>
                <span className="text-[10px] text-slate-500 ml-auto">Baru saja</span>
              </div>
              <p className="text-xs text-slate-800 m-0 leading-[1.45] text-left">
                Invoice sudah diterima!<br />Kami setuju dengan proposal ini. 👍
              </p>
              <Image
                src="/images/testimony-2.png"
                alt="Foto Klien"
                width={48}
                height={48}
                className="absolute -left-14 bottom-0 rounded-full object-cover border-4 border-solid border-white shadow-md"
              />
            </div>
          </div>
        </div>

        {/* === 3 Floating Elements Around Hero Title === */}

        {/* Top-Right: Invoice mini UI card */}
        <div className="hidden wide:block absolute z-[5] pointer-events-none bg-white border border-slate-100 rounded-[18px] shadow-float p-[18px] px-5 text-left w-[220px] top-[120px] right-[5%]">
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center">
              <i className="fas fa-file-invoice-dollar text-base text-signal-blue"></i>
            </div>
            <div>
              <span className="text-[13px] font-bold block text-slate-900">Buat Invoice</span>
              <span className="text-[10px] text-slate-500">#INV-2025-08</span>
            </div>
          </div>
          <div className="flex justify-between items-center py-2.5 px-3 bg-slate-50 rounded-xl">
            <span className="text-sm font-bold text-slate-900">Rp 5,6jt</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#dcfce7] text-[#15803d]">Terkirim ✓</span>
          </div>
        </div>

        {/* Left: Proyek Aktif mini UI card */}
        <div className="hidden wide:block absolute z-[5] pointer-events-none bg-white border-[2.5px] border-[#93c5fd] rounded-[18px] shadow-float-sitemap p-[18px] px-[22px] w-[250px] top-[360px] left-[5%]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#dcfce7] flex items-center justify-center shrink-0">
              <i className="fas fa-layer-group text-base text-[#15803d]"></i>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-slate-500 block">Proyek Aktif</span>
              <span className="text-sm font-bold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis block">Redesain App</span>
            </div>
            <span className="text-[11px] font-bold py-[3px] px-[9px] rounded-md bg-[#dcfce7] text-[#15803d]">75%</span>
          </div>

          <div className="h-[7px] bg-slate-100 rounded overflow-hidden mb-3.5">
            <div className="w-3/4 h-full bg-[#22c55e] rounded"></div>
          </div>

          {/* Skeleton lines for extra height & detail */}
          <div className="flex flex-col gap-1.5 mb-3.5">
            <div className="h-1.5 rounded-sm bg-[#e0f2fe] w-full"></div>
            <div className="h-1.5 rounded-sm bg-slate-100 w-[65%]"></div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-500 font-medium">3/4 Milestone</span>
            <div className="flex items-center">
              <Image src="/images/testimony-1.png" alt="Assignee" width={22} height={22} className="rounded-full border-2 border-white" />
              <Image src="/images/testimony-3.png" alt="Assignee" width={22} height={22} className="rounded-full border-2 border-white -ml-1.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Pitch Intro Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-white text-center">
        <div className="max-w-[1200px] mx-auto px-0 sm:px-6">
          <p className="text-xl sm:text-[2rem] md:text-[2.5rem] font-bold leading-[1.3] sm:leading-[1.25] tracking-[-0.036em] text-slate-900 max-w-[1040px] mx-auto">
            Freyn <span className="text-signal-blue font-bold">&rarr;</span> adalah platform terlengkap untuk bisnis freelance Anda dengan menggabungkan{" "}
            <Badge color="yellow" className="px-3.5 py-1 text-[0.85em]">📁 manajemen proyek</Badge>,{" "}
            <Badge color="mint" className="px-3.5 py-1 text-[0.85em]">📅 kalender kerja</Badge>,{" "}
            <Badge color="lavender" className="px-3.5 py-1 text-[0.85em]">📇 database klien</Badge>,{" "}
            <Badge color="peach" className="px-3.5 py-1 text-[0.85em]">🏷️ katalog layanan</Badge>,{" "}
            <Badge color="pink" className="px-3.5 py-1 text-[0.85em]">🧾 invoice otomatis</Badge>,{" "}
            <Badge color="blue" className="px-3.5 py-1 text-[0.85em]">📦 portal penyerahan hasil (Result)</Badge>, dan{" "}
            <Badge color="lavender" className="px-3.5 py-1 text-[0.85em]">✨ portofolio publik</Badge>.
          </p>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 text-center bg-white">
        <div className="max-w-[1200px] mx-auto px-0 sm:px-6">
          <h2 className="text-xl sm:text-[2rem] md:text-[2.75rem] font-bold tracking-[-0.04em] leading-[1.3] mb-8 sm:mb-14">
            Efektif &amp; Menguntungkan untuk{" "}
            <span className="inline-block bg-signal-blue text-white px-5 py-1.5 rounded-tags text-lg sm:text-2xl md:text-3xl align-middle leading-snug">freelancer &middot; studio &middot; desainer UX/UI</span>
          </h2>

          <div className="grid grid-cols-1 wide:grid-cols-3 gap-4 sm:gap-7 max-w-[1180px] mx-auto">
            {/* Card 1: Freelancer Kreatif */}
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 sm:p-9 sm:px-[30px] text-left shadow-card transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between gap-6 relative overflow-hidden hover:-translate-y-1.5 hover:shadow-float hover:border-sky-wash">
              <div>
                <div className={`w-11 h-11 rounded-xs flex items-center justify-center text-xl mb-4 ${iconColor.mint}`}>
                  <i className="uil uil-palette"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-[-0.02em]">Freelancer Kreatif</h3>
                <p className="text-sm leading-[1.6] text-slate-500 m-0">
                  Atur seluruh pekerjaan klien, kelola tenggat waktu dalam kalender interaktif, dan terima pembayaran lebih cepat dengan invoice otomatis.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg py-3.5 px-4 border border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-900">Proyek &amp; Invoice</span>
                <span className="text-xs font-bold text-[#16a34a]">Rp 10M &middot; Lunas</span>
              </div>
            </div>

            {/* Card 2: Desainer UI/UX & Web */}
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 sm:p-9 sm:px-[30px] text-left shadow-card transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between gap-6 relative overflow-hidden hover:-translate-y-1.5 hover:shadow-float hover:border-sky-wash">
              <div>
                <div className={`w-11 h-11 rounded-xs flex items-center justify-center text-xl mb-4 ${iconColor.lavender}`}>
                  <i className="uil uil-vector-square"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-[-0.02em]">Desainer UI/UX &amp; Web</h3>
                <p className="text-sm leading-[1.6] text-slate-500 m-0">
                  Pamerkan portofolio publik profesional (`/portfolio/username`) dan berikan akses deliverable hasil karya desain secara interaktif.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg py-3.5 px-4 border border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-900">Portofolio Publik</span>
                <span className="text-xs font-bold text-[#2563eb]">Live Showcase &rarr;</span>
              </div>
            </div>

            {/* Card 3: Pengembang & Studio */}
            <div className="bg-white border border-slate-100 rounded-[20px] p-6 sm:p-9 sm:px-[30px] text-left shadow-card transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between gap-6 relative overflow-hidden hover:-translate-y-1.5 hover:shadow-float hover:border-sky-wash">
              <div>
                <div className={`w-11 h-11 rounded-xs flex items-center justify-center text-xl mb-4 ${iconColor.peach}`}>
                  <i className="uil uil-brackets-curly"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-[-0.02em]">Pengembang &amp; Studio</h3>
                <p className="text-sm leading-[1.6] text-slate-500 m-0">
                  Atur katalog harga layanan, pantau margin pendapatan bulanan, dan organisasikan database kontak klien untuk skala bisnis.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg py-3.5 px-4 border border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-900">Katalog Layanan</span>
                <span className="text-xs font-bold text-[#ea580c]">Paket &amp; Tarif</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Feature Blocks */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 max-w-[1200px] mx-auto" id="features">
        {/* Feature 1: Manajemen Proyek & Kalender */}
        <div className="bg-white border border-slate-100 rounded-images shadow-card p-6 sm:p-8 md:p-12 grid grid-cols-1 wide:grid-cols-[1fr_1.1fr] gap-6 sm:gap-12 items-center mb-2 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-2 border border-slate-200 rounded-tags py-1.5 px-3.5 text-[11px] font-semibold uppercase text-slate-900 mb-5 shadow-[0px_2px_6px_rgba(0,0,0,0.02)]">
              <span className="font-bold">LANGKAH 1</span>
              <span className="text-slate-500">&middot;</span>
              <span className="text-slate-500 font-medium">PROYEK &amp; KALENDER</span>
            </div>
            <h2 className="text-2xl sm:text-[1.85rem] md:text-[2.35rem] font-bold leading-[1.15] sm:leading-[1.08] tracking-[-0.036em] text-slate-900 mb-4 sm:mb-5">
              Manajemen Proyek &amp; Kalender Interaktif
            </h2>
            <p className="text-base leading-[1.6] text-slate-500 mb-8">
              Organisasikan semua status pekerjaan (In Progress, Completed, Overdue), milestone, dan jadwal kerja dalam kalender terpadu agar tidak pernah melewatkan tenggat waktu.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-900">Status Milestone</span>
                <span className="text-[13px] text-slate-500">Pantau tahapan progres secara langsung</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-900">Kalender Kerja</span>
                <span className="text-[13px] text-slate-500">Integrasi kalender jadwal &amp; deadline</span>
              </div>
            </div>
          </div>
          <div className="bg-[#16a34a] border border-slate-100 rounded-images p-4 sm:p-7 shadow-card">
            <div className="flex flex-col gap-4">
              {/* Card 1: Project Status */}
              <div className="bg-white p-5 rounded-2xl shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm">Redesain Aplikasi Mobile</span>
                  <Badge color="mint" className="px-3.5 py-1 text-[0.85em]">Berjalan</Badge>
                </div>
                <div className="h-[7px] bg-[#e0f2fe] rounded relative overflow-hidden mb-1.5">
                  <div className="h-full w-[72%] bg-signal-blue rounded"></div>
                </div>
                <span className="text-[11px] text-slate-500">72% selesai &middot; Tenggat 28 Jul</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 2: Calendar Event */}
                <div className="bg-white p-5 rounded-2xl shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#eff6ff] flex items-center justify-center shrink-0">
                      <i className="fas fa-calendar-day text-base text-signal-blue"></i>
                    </div>
                    <div>
                      <span className="font-bold text-sm block">Review Desain — Sprint 3</span>
                      <span className="text-xs text-slate-500">Hari ini, 14:00 WIB &middot; via Zoom</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Milestone Tracker */}
                <div className="bg-white p-5 rounded-2xl shadow-card">
                  <span className="font-bold text-sm block mb-2.5">Milestone Proyek</span>
                  <div className="flex gap-1.5">
                    <div className="flex-1 h-1.5 rounded-sm bg-[#22c55e]"></div>
                    <div className="flex-1 h-1.5 rounded-sm bg-[#22c55e]"></div>
                    <div className="flex-1 h-1.5 rounded-sm bg-[#22c55e]"></div>
                    <div className="flex-1 h-1.5 rounded-sm bg-slate-200"></div>
                    <div className="flex-1 h-1.5 rounded-sm bg-slate-200"></div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Badge color="yellow" className="px-3.5 py-1 text-[0.85em]">3/5 Selesai</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Invoicing & Portal Penyerahan Hasil */}
        <div className="bg-white border border-slate-100 rounded-images shadow-card p-6 sm:p-8 md:p-12 grid grid-cols-1 wide:grid-cols-[1.1fr_1fr] gap-6 sm:gap-12 items-center mb-2 sm:mb-8">
          <div className="bg-signal-blue border border-slate-100 rounded-images p-5 sm:p-7">
            <div className="flex flex-col gap-4">
              {/* Card 1: Invoice Detail */}
              <div className="bg-white p-5 rounded-2xl shadow-card">
                <div className="flex justify-between items-start mb-3.5">
                  <div>
                    <span className="text-[11px] text-slate-500 tracking-[0.05em]">INVOICE #INV-2025-08</span>
                    <h4 className="text-[15px] font-bold mt-1 mb-0">Desain Website &amp; Branding</h4>
                  </div>
                  <Badge color="mint" className="px-3.5 py-1 text-[0.85em]">LUNAS</Badge>
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-500">Total Tagihan</span>
                  <span className="text-lg font-bold text-slate-900">Rp 10.000.000</span>
                </div>
              </div>

              {/* Card 2: Result Portal */}
              <div className="bg-white p-5 rounded-2xl shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] flex items-center justify-center shrink-0">
                    <i className="fas fa-external-link-alt text-[15px] text-[#7c3aed]"></i>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-sm block">Portal Penyerahan Hasil</span>
                    <span className="text-xs text-slate-500">freyn.com/result/proj-99</span>
                  </div>
                  <Badge color="lavender" className="px-3.5 py-1 text-[0.85em]">Siap Diulas</Badge>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 border border-slate-200 rounded-tags py-1.5 px-3.5 text-[11px] font-semibold uppercase text-slate-900 mb-5 shadow-[0px_2px_6px_rgba(0,0,0,0.02)]">
              <span className="font-bold">LANGKAH 2</span>
              <span className="text-slate-500">&middot;</span>
              <span className="text-slate-500 font-medium">INVOICE &amp; PORTAL KLIEN</span>
            </div>
            <h2 className="text-2xl sm:text-[1.85rem] md:text-[2.35rem] font-bold leading-[1.15] sm:leading-[1.08] tracking-[-0.036em] text-slate-900 mb-4 sm:mb-5">
              Invoice Otomatis &amp; Portal Penyerahan Karya (Result)
            </h2>
            <p className="text-base leading-[1.6] text-slate-500 mb-8">
              Buat tagihan profesional yang bisa diunduh dalam format PDF dan berikan klien akses langsung ke tautan portal penyerahan hasil karya (`/result/[id]`) yang aman.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-900">Invoice &amp; PDF</span>
                <span className="text-[13px] text-slate-500">Penagihan instan &amp; cetak PDF otomatis</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-900">Portal Deliverables</span>
                <span className="text-[13px] text-slate-500">Tautan penyerahan berkas untuk klien</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Portofolio Publik & Katalog Layanan */}
        <div className="bg-white border border-slate-100 rounded-images shadow-card p-6 sm:p-8 md:p-12 grid grid-cols-1 wide:grid-cols-[1fr_1.1fr] gap-6 sm:gap-12 items-center mb-2 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-2 border border-slate-200 rounded-tags py-1.5 px-3.5 text-[11px] font-semibold uppercase text-slate-900 mb-5 shadow-[0px_2px_6px_rgba(0,0,0,0.02)]">
              <span className="font-bold">LANGKAH 3</span>
              <span className="text-slate-500">&middot;</span>
              <span className="text-slate-500 font-medium">PORTOFOLIO &amp; HARGA LAYANAN</span>
            </div>
            <h2 className="text-2xl sm:text-[1.85rem] md:text-[2.35rem] font-bold leading-[1.15] sm:leading-[1.08] tracking-[-0.036em] text-slate-900 mb-4 sm:mb-5">
              Portofolio Publik Freelancer &amp; Katalog Layanan
            </h2>
            <p className="text-base leading-[1.6] text-slate-500 mb-8">
              Tampilkan karya terbaik Anda melalui halaman portofolio publik (`/portfolio/username`) dan organisasikan katalog harga paket layanan Anda untuk gaet klien baru.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-900">Portofolio Publik</span>
                <span className="text-[13px] text-slate-500">Halaman pamer karya profesional</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-900">Katalog Layanan</span>
                <span className="text-[13px] text-slate-500">Atur paket harga &amp; lingkup kerja</span>
              </div>
            </div>
          </div>
          <div className="bg-[#ea580c] border border-slate-100 rounded-images p-5 sm:p-7 shadow-card">
            <div className="flex flex-col gap-4">
              {/* Card 1: Portfolio Showcase */}
              <div className="bg-white p-5 rounded-2xl shadow-card">
                <div className="flex justify-between items-center mb-3">
                  <Badge color="lavender" className="px-3.5 py-1 text-[0.85em]">🔮 Portofolio Publik</Badge>
                  <span className="text-[11px] text-slate-500">freyn.com/portfolio/desainer</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  <div className="h-[52px] rounded-lg bg-gradient-to-br from-[#c7d2fe] to-[#e0e7ff]"></div>
                  <div className="h-[52px] rounded-lg bg-gradient-to-br from-[#fbcfe8] to-[#fce7f3]"></div>
                  <div className="h-[52px] rounded-lg bg-gradient-to-br from-[#bbf7d0] to-[#dcfce7]"></div>
                </div>
                <span className="text-xs text-slate-500">12 karya terpublikasi</span>
              </div>

              {/* Card 2: Service Catalog */}
              <div className="bg-white p-5 rounded-2xl shadow-card">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-sm">Katalog Layanan</span>
                  <Badge color="peach" className="px-3.5 py-1 text-[0.85em]">3 Paket</Badge>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 text-center">
                    <span className="text-[11px] text-slate-500 block">Starter</span>
                    <span className="font-bold text-sm">Rp 2.5M</span>
                  </div>
                  <div className="flex-1 py-2.5 px-3 rounded-xl bg-[#eff6ff] text-center border border-[#bfdbfe]">
                    <span className="text-[11px] text-signal-blue block">Pro</span>
                    <span className="font-bold text-sm text-signal-blue">Rp 5M</span>
                  </div>
                  <div className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 text-center">
                    <span className="text-[11px] text-slate-500 block">Premium</span>
                    <span className="font-bold text-sm">Rp 10M</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Client Database */}
              <div className="bg-white p-5 rounded-2xl shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#dcfce7] flex items-center justify-center shrink-0">
                    <i className="fas fa-users text-[15px] text-[#15803d]"></i>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-sm block">Database Klien</span>
                    <span className="text-xs text-slate-500">32 kontak aktif tersimpan</span>
                  </div>
                  <Badge color="mint" className="px-3.5 py-1 text-[0.85em]">Aktif</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Trust Banner */}
      <section className="bg-signal-blue rounded-images py-10 sm:py-16 px-5 sm:px-8 mx-4 sm:mx-6 my-8 sm:my-16 max-w-[1200px] md:mx-auto text-center text-white shadow-glow-blue">
        <h2 className="text-xl sm:text-[2rem] md:text-[3rem] font-bold leading-[1.15] sm:leading-[1.05] tracking-[-0.04em] m-0">
          Ribuan freelancer menggunakan{" "}
          <span className="inline-block bg-white text-signal-blue px-5 py-0.5 rounded-tags">Freyn &rarr;</span> untuk mengelola proyek &amp; pendapatan
        </h2>
      </section>

      {/* Wavy "GAET KLIEN ⭐️" Section */}
      <section className="pt-12 sm:pt-20 px-4 sm:px-6 pb-10 text-center">
        <div className="inline-block bg-signal-blue text-white text-2xl sm:text-[2.25rem] md:text-[3.25rem] font-black py-3 px-5 sm:py-4 sm:px-8 md:py-6 md:px-[60px] leading-none rounded-tags tracking-[-0.04em] shadow-glow-blue">GAET KLIEN ⭐️</div>
        <p className="max-w-[640px] mx-auto mt-6 text-base sm:text-lg leading-[1.6] text-slate-500 font-medium">
          Bangun reputasi profesional, tampilkan portofolio terbaik, dan biarkan klien datang kepada Anda.
        </p>
      </section>

      {/* Testimonials Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 pb-12 sm:pb-24 bg-white" id="testimony">
        <div className="max-w-[1200px] mx-auto px-0 sm:px-6">
          <TestimonialSlider />
        </div>
      </section>

      {/* Big Final Hero Blue CTA Section */}
      <section className="px-4 sm:px-6 bg-white" id="contact">
        <div className="max-w-[1200px] mx-auto px-0 sm:px-6">
          <div className="grid grid-cols-1 wide:grid-cols-[1.2fr_0.8fr] items-end gap-8 overflow-hidden">
            <div className="text-center wide:text-left pt-8 px-4 sm:px-6 wide:px-0 pb-0 wide:pb-16">
              <h2 className="text-2xl sm:text-[2rem] md:text-[2.75rem] font-extrabold leading-[1.2] sm:leading-[1.15] tracking-[-0.03em] text-slate-900 mb-4 sm:mb-5">Siap Kelola Bisnis Freelance Lebih Rapi?</h2>
              <p className="text-base sm:text-lg leading-[1.6] text-slate-500 mb-8 sm:mb-10 max-w-none wide:max-w-[520px] mx-auto wide:mx-0">
                Gabung sekarang dan rasakan kemudahan mengelola proyek, klien, dan invoice dalam satu platform.
              </p>
              <Link
                href="/login"
                className="relative inline-flex items-center gap-3 bg-signal-blue text-white py-4 px-8 md:py-[22px] md:pr-[60px] md:pl-[52px] rounded-buttons no-underline font-bold text-xl md:text-[1.75rem] wide:text-[2.25rem] tracking-[-0.03em] border-none shadow-glow-blue transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0px_16px_40px_rgba(0,128,255,0.45)]"
              >
                <span>Mulai Gratis Sekarang &rarr;</span>
              </Link>
            </div>
            <div className="order-1 wide:order-none flex justify-center wide:justify-end items-end self-end -mb-1">
              <img src="/images/phone.png" alt="Freyn App Preview" className="max-w-full h-auto max-h-[440px] object-contain block drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-slate-100 bg-white">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-5 text-slate-500 text-sm text-center sm:text-left">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <div className="w-7 h-7 flex rounded-lg overflow-hidden">
              <img src="/images/logo-freyn.png" alt="Freyn Logo" className="w-full h-full object-contain" />
            </div>
            <span>Freyn</span>
          </div>
          <p className="m-0">&copy; 2025 Freyn. Hak cipta dilindungi undang-undang.</p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-500" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            <a href="#" className="text-slate-500" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
            <a href="#" className="text-slate-500" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
