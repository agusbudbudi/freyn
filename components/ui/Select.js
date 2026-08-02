import { inputClasses } from "./Input";
import { cn } from "@/lib/cn";

export default function Select({ className = "", children, ...props }) {
  return (
    <div className="relative inline-block w-full">
      <select
        className={cn(inputClasses(props.disabled), "appearance-none cursor-pointer pr-12", className)}
        {...props}
      >
        {children}
      </select>
      <i
        className="uil uil-angle-down absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-lg leading-none peer-disabled:text-slate-400"
        aria-hidden="true"
      ></i>
    </div>
  );
}
