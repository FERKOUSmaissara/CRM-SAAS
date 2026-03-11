import React from "react";

function clsx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type CardProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
};

export default function Card({ title, subtitle, children, className, headerRight }: CardProps) {
  return (
    <div className={clsx("bg-white rounded-2xl shadow-sm border border-gray-100", className)}>
      {title || subtitle || headerRight ? (
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
          <div>
            {title ? <div className="text-sm font-semibold text-gray-900">{title}</div> : null}
            {subtitle ? <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div> : null}
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
      ) : null}
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}
