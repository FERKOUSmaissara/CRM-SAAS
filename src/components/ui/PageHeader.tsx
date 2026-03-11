import AvatarMenu from "./AvatarMenu";

export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg mb-6 transition-all">
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-white opacity-10 blur-3xl rounded-full" />

      <div className="absolute top-4 right-4">
        <AvatarMenu />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-gray-200 mt-1">{subtitle}</p>}
    </div>
  );
}
