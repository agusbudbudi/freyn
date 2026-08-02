export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-slate-100 bg-white">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-5 text-slate-500 text-sm text-center sm:text-left">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
          <div className="w-7 h-7 flex rounded-lg overflow-hidden">
            <img src="/images/logo-freyn.png" alt="Freyn Logo" className="w-full h-full object-contain" />
          </div>
          <span>Freyn</span>
        </div>
        <p className="m-0">&copy; {currentYear} Freyn. Hak cipta dilindungi undang-undang.</p>
        <div className="flex gap-4">
          <a href="#" className="text-slate-500" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
          <a href="#" className="text-slate-500" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
          <a href="#" className="text-slate-500" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
        </div>
      </div>
    </footer>
  );
}
