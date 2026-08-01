const variants = {
  success: "bg-green-50 text-green-800 border-green-200",
  error: "bg-red-50 text-red-800 border-red-200",
};

export default function Alert({ type = "error", children }) {
  return (
    <div className={`p-4 rounded-lg mb-5 border ${variants[type]}`}>
      {children}
    </div>
  );
}
