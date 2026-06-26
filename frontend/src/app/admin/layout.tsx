import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-loom-iron text-muslin flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-loom-iron border-r border-muslin/10 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-muslin/10">
          <Link href="/admin" className="block group">
            <h1 className="font-display text-2xl uppercase tracking-wide text-muslin group-hover:text-shuttle-red transition-colors">
              ThreadCounty
            </h1>
            <p className="font-mono text-[10px] text-concrete-grey uppercase tracking-widest mt-1">
              Admin Portal
            </p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 font-sans text-sm font-medium text-muslin/80 hover:text-muslin hover:bg-muslin/5 clip-cut-btn transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-3 py-2 font-sans text-sm font-medium text-muslin/80 hover:text-muslin hover:bg-muslin/5 clip-cut-btn transition-colors"
          >
            Users
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center gap-3 px-3 py-2 font-sans text-sm font-medium text-muslin/80 hover:text-muslin hover:bg-muslin/5 clip-cut-btn transition-colors"
          >
            Reports & Uploads
          </Link>
          <Link
            href="/admin/plans"
            className="flex items-center gap-3 px-3 py-2 font-sans text-sm font-medium text-muslin/80 hover:text-muslin hover:bg-muslin/5 clip-cut-btn transition-colors"
          >
            Plans
          </Link>
        </nav>

        <div className="p-4 border-t border-muslin/10">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 font-sans text-sm font-medium text-concrete-grey hover:text-muslin hover:bg-muslin/5 clip-cut-btn transition-colors"
          >
            &larr; Back to User App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-loom-iron p-6 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
