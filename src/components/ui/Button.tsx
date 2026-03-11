import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-xl bg-ferkous-600 hover:bg-ferkous-700 dark:bg-ferkous-500 dark:hover:bg-ferkous-600 text-white font-medium shadow transition ${className}`}
    >
      {children}
    </button>
  );
}
