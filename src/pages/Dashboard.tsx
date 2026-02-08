import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import BusinessDashboard from "@/components/dashboard/BusinessDashboard";
import FreelancerDashboard from "@/components/dashboard/FreelancerDashboard";

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && user && !role) navigate("/onboarding");
  }, [user, role, loading, navigate]);

  if (loading || !role) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {role === "business_owner" ? <BusinessDashboard /> : <FreelancerDashboard />}
      </div>
    </div>
  );
}
