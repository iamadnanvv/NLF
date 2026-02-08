import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

export default function Onboarding() {
  const { user, role, setUserRole } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) navigate("/auth");
    if (role) navigate("/dashboard");
  }, [user, role, navigate]);

  const handleSelect = async (selectedRole: "business_owner" | "freelancer") => {
    setSubmitting(true);
    const { error } = await setUserRole(selectedRole);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: "Could not set role. Please try again.", variant: "destructive" });
    } else {
      navigate("/profile");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-2xl text-center">
          <h1 className="mb-2 text-3xl">How will you use Adaline?</h1>
          <p className="mb-10 text-muted-foreground">Choose your role to personalize your experience</p>

          <div className="grid gap-6 md:grid-cols-2">
            <Card
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => !submitting && handleSelect("business_owner")}
            >
              <CardContent className="flex flex-col items-center p-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mb-2 text-xl">Business Owner</CardTitle>
                <CardDescription className="text-center">
                  Post projects and find talented freelancers to bring your ideas to life.
                </CardDescription>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => !submitting && handleSelect("freelancer")}
            >
              <CardContent className="flex flex-col items-center p-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                  <User className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="mb-2 text-xl">Freelancer</CardTitle>
                <CardDescription className="text-center">
                  Discover matched projects and submit proposals to grow your career.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
