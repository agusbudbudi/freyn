const iconStyles = {
  total: "bg-[#e0f2fe] text-[#0369a1]",
  ongoing: "bg-[#fef9c3] text-[#a16207]",
  completed: "bg-[#dcfce7] text-[#15803d]",
  revenue: "bg-[#ffedd5] text-[#c2410c]",
};

export default function StatCard({ variant, icon, number, label }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card transition-all duration-200 hover:-translate-y-px hover:border-sky-wash relative overflow-hidden">
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="text-xl font-bold text-slate-900 mb-2.5 leading-none">{number}</div>
          <div className="text-slate-500 text-xs font-medium">{label}</div>
        </div>
        <div
          className={`min-w-[30px] h-[30px] rounded-full flex items-center justify-center text-base ${iconStyles[variant]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
