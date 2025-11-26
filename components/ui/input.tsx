import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-slate-700 placeholder:text-slate-400 selection:bg-indigo-100 selection:text-indigo-900 border-slate-300 h-10 w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
        "aria-invalid:border-rose-500 aria-invalid:ring-rose-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
