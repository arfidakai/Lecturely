"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
      if (!loading && !user) {
        router.push("/login");
      }
    }, [user, loading, router]);

    // Show loading while checking auth
    if (loading || !user) {
      return (
        <div className="min-h-screen w-full bg-gradient-to-b from-purple-100 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200 animate-pulse">
              <span className="text-3xl">🎓</span>
            </div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
