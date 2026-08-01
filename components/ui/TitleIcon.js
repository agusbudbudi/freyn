const styles = {
  pie: "bg-[#f3e8ff] text-[#6b21a8]",
  trophy: "bg-[#fef9c3] text-[#a16207]",
  line: "bg-[#e0f2fe] text-[#0369a1]",
  schedule: "bg-[#dcfce7] text-[#15803d]",
  wallet: "bg-[#ffedd5] text-[#c2410c]",
  money: "bg-[#ffe4e6] text-[#be123c]",
};

export default function TitleIcon({ variant, children }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg mr-2 ${styles[variant]} [&>i]:text-sm [&>i]:leading-none`}
    >
      {children}
    </span>
  );
}
