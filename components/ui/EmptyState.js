export default function EmptyState({ icon, title, description }) {
  return (
    <div className="text-center py-16 px-8 text-slate-600">
      {icon && <i className={`${icon} text-5xl mb-4 text-slate-300 block`}></i>}
      {title && <h3 className="text-lg mb-2 text-slate-600">{title}</h3>}
      {description && <p className="text-sm text-slate-600 m-0">{description}</p>}
    </div>
  );
}
