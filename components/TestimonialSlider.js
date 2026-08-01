"use client";

import Image from "next/image";

const testimonials = [
  {
    id: 1,
    text: "Akhirnya menemukan alat manajemen freelance yang sangat memahami kebutuhan desainer! Dulu mengelola 15+ klien sangat berantakan. Sekarang saya bisa memantau setiap milestone proyek dan tidak pernah terlambat kirim.",
    author: "Rina Dewi",
    role: "Desainer Grafis & Brand",
    image: "/images/testimony-1.png",
    tag: "🟢 Terverifikasi",
    tagColor: "mint",
    rating: 5,
  },
  {
    id: 2,
    text: "Fitur portal penyerahan hasil proyek (Result) sangat luar biasa. Klien saya sekarang bisa mengecek progres proyek sendiri tanpa terus menerus berkirim pesan. Tagihan otomatisnya juga menghemat 5 jam admin per minggu.",
    author: "Budi Wijaya",
    role: "Pengembang Web Fullstack",
    image: "/images/testimony-2.png",
    rating: 5,
    tag: "🟣 Studio Dev",
    tagColor: "lavender",
  },
  {
    id: 3,
    text: "Beralih dari spreadsheet ke Freyn 3 bulan lalu. Pelacakan pendapatannya sangat mendalam — saya bisa melihat layanan mana yang paling menguntungkan dan membagikan portofolio publik (`/portfolio/ayu`) dengan cepat.",
    author: "Ayu Safitri",
    role: "UI/UX Designer",
    image: "/images/testimony-3.png",
    rating: 5,
    tag: "🟡 Pro User",
    tagColor: "yellow",
  },
];

const badgeColor = {
  yellow: "bg-[#fef9c3] text-[#a16207]",
  mint: "bg-[#dcfce7] text-[#15803d]",
  pink: "bg-[#ffe4e6] text-[#be123c]",
  lavender: "bg-[#f3e8ff] text-[#6b21a8]",
  peach: "bg-[#ffedd5] text-[#c2410c]",
  blue: "bg-[#e0f2fe] text-[#0369a1]",
};

export default function TestimonialSlider() {
  return (
    <div className="max-w-[1180px] mx-auto">
      <div className="grid grid-cols-1 wide:grid-cols-3 gap-4 sm:gap-7">
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-100 rounded-[20px] py-8 px-7 text-left shadow-card transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between gap-5 hover:-translate-y-1.5 hover:shadow-float hover:border-sky-wash"
          >
            {/* Header: Avatar, Name, Role & Tag */}
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-slate-100">
                  <Image
                    src={item.image}
                    alt={item.author}
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900 m-0 mb-0.5 leading-tight">{item.author}</h4>
                  <span className="text-xs text-slate-500 font-medium block">{item.role}</span>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-tags align-middle font-semibold text-[11px] py-[3px] px-2.5 whitespace-nowrap shrink-0 ${badgeColor[item.tagColor]}`}
              >
                {item.tag}
              </span>
            </div>

            {/* Quote Body */}
            <p className="text-sm leading-[1.65] text-slate-500 m-0 tracking-[-0.01em]">"{item.text}"</p>

            {/* Footer: Rating Stars */}
            <div className="flex justify-between items-center pt-3.5 border-t border-slate-50">
              <div className="flex gap-[3px] text-amber-500 text-[13px]">
                {[...Array(item.rating)].map((_, i) => (
                  <i key={i} className="fas fa-star"></i>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-900">5.0 / 5.0</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
