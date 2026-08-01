export default function Modal({
  onClose,
  title,
  children,
  footer,
  maxWidth = "960px",
  fullScreenOnMobile = false,
}) {
  return (
    <div
      className={`fixed inset-0 bg-slate-900/[0.48] flex items-center justify-center z-[1200] ${fullScreenOnMobile ? "p-0 sm:p-6" : "p-6"
        }`}
      role="dialog"
    >
      <div
        className={`w-full overflow-y-auto bg-white flex flex-col ${fullScreenOnMobile
            ? "h-full rounded-none shadow-none sm:h-auto sm:max-h-full sm:rounded-2xl sm:shadow-[0_16px_40px_rgba(15,23,42,0.25)]"
            : "max-h-full rounded-2xl shadow-[0_16px_40px_rgba(15,23,42,0.25)]"
          }`}
        style={{ width: `min(${maxWidth}, 100%)` }}
      >
        <div className="py-2.5 px-6 border-b border-solid border-slate-200 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 m-0">{title}</h2>
          <button
            className="bg-slate-100 border-none w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-slate-700"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="uil uil-times"></i>
          </button>
        </div>
        <div
          className={`flex-1 overflow-y-auto ${fullScreenOnMobile ? "max-h-none sm:max-h-[75vh]" : "max-h-[75vh]"
            }`}
        >
          {children}
        </div>
        {footer && (
          <div className="py-2.5 px-6 border-t border-solid border-slate-100 flex justify-end items-center gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
