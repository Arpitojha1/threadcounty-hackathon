"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

type User = {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
  created_at: string;
  tier: string;
  uploadCount?: number;
};

export function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  const supabase = createClient();

  // Fetch upload counts for users
  useEffect(() => {
    async function fetchUploadCounts() {
      // In a real app with many users, we'd paginate this or use an RPC.
      // Here we fetch uploads grouped by user or just fetch all and group.
      const { data: uploads, error } = await supabase.from("uploads").select("user_id");
      if (uploads && !error) {
        const counts: Record<string, number> = {};
        uploads.forEach(u => {
          counts[u.user_id] = (counts[u.user_id] || 0) + 1;
        });
        
        setUsers(prev => prev.map(u => ({
          ...u,
          uploadCount: counts[u.id] || 0
        })));
      }
      setLoadingUploads(false);
    }
    
    fetchUploadCounts();
  }, []);

  const handleTierChange = async (userId: string, newTier: string) => {
    setUpdating(userId);
    // Because of RLS, an admin can update the subscriptions table
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan_tier: newTier })
      .eq("user_id", userId);
      
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, tier: newTier } : u));
    } else {
      console.error("Failed to update tier:", error);
    }
    setUpdating(null);
  };

  return (
    <div className="overflow-x-auto p-1">
      <table className="w-full text-left font-sans text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-muslin/10 bg-muslin/5">
            <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">User</th>
            <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Role</th>
            <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Joined</th>
            <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Uploads</th>
            <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs">Plan Tier</th>
            <th className="py-3 px-4 text-concrete-grey font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-muslin/5 hover:bg-muslin/5 transition-colors group">
              <td className="py-3 px-4">
                <div className="font-medium text-muslin">{user.username}</div>
                {user.full_name && <div className="text-concrete-grey text-xs mt-0.5">{user.full_name}</div>}
              </td>
              <td className="py-3 px-4">
                <span className={cn(
                  "px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider",
                  user.role === 'admin' ? "bg-shuttle-red/20 text-shuttle-red" : "bg-concrete-grey/20 text-concrete-grey"
                )}>
                  {user.role}
                </span>
              </td>
              <td className="py-3 px-4 text-concrete-grey font-mono text-xs">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 px-4 text-muslin font-mono text-xs">
                {loadingUploads ? '...' : (user.uploadCount || 0)}
              </td>
              <td className="py-3 px-4">
                <select
                  value={user.tier}
                  onChange={(e) => handleTierChange(user.id, e.target.value)}
                  disabled={updating === user.id}
                  className="bg-loom-iron border border-muslin/20 text-muslin text-xs px-2 py-1 font-mono uppercase focus:outline-none focus:border-shuttle-red disabled:opacity-50"
                >
                  <option value="free">Free</option>
                  <option value="student">Student</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </td>
              <td className="py-3 px-4 text-right">
                <Link
                  href={`/admin/reports?user_id=${user.id}`}
                  className="font-sans text-xs font-semibold text-concrete-grey hover:text-shuttle-red transition-colors"
                >
                  View Reports &rarr;
                </Link>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-concrete-grey">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
