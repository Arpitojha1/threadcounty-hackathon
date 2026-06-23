import { Navbar } from "@/components/layout/navbar";
import { RememberMeProvider } from "./RememberMeProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RememberMeProvider>
      <div className="min-h-screen bg-muslin dark:bg-loom-iron text-loom-iron dark:text-muslin flex flex-col pt-16">
        <Navbar />
        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </RememberMeProvider>
  );
}
