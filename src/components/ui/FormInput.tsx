import type { InputHTMLAttributes } from "react";

type FormInputProps = InputHTMLAttributes<HTMLInputElement>;

export default function FormInput({ className = "", ...props }: FormInputProps) {
  return (
    <input
      {...props}
      className={`
w-full
bg-slate-800
text-white
placeholder-gray-400
border border-slate-600
rounded-lg
px-4
py-2
focus:outline-none
focus:ring-2
focus:ring-emerald-500
${className}`}
    />
  );
}
