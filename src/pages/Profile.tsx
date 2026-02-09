import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import Navbar from "@/components/Navbar";
import ReviewsPanel from "@/components/dashboard/ReviewsPanel";
import MessagingPanel from "@/components/dashboard/MessagingPanel";

export default function Profile() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    skills: [] as string[],
    hourly_rate: "",
    portfolio_url: "",
    availability: "available",
    company_name: "",
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            full_name: data.full_name || "",
            bio: data.bio || "",
            skills: data.skills || [],
            hourly_rate: data.hourly_rate?.toString() || "",
            portfolio_url: data.portfolio_url || "",
            availability: data.availability || "available",
            company_name: data.company_name || "",
          });
        }
      });
  }, [user]);

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        bio: form.bio,
        skills: form.skills,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        portfolio_url: form.portfolio_url,
        availability: form.availability,
        company_name: form.company_name,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!" });
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." rows={4} />
                </div>

                {role === "business_owner" && (
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                  </div>
                )}

                {role === "freelancer" && (
                  <>
                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <div className="flex gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder="Add a skill..."
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                        />
                        <Button type="button" variant="secondary" onClick={addSkill}>Add</Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.skills.map((s) => (
                          <Badge key={s} variant="secondary" className="gap-1">
                            {s}
                            <button type="button" onClick={() => removeSkill(s)}><X className="h-3 w-3" /></button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Hourly Rate ($)</Label>
                        <Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} placeholder="50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Availability</Label>
                        <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="busy">Busy</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Portfolio URL</Label>
                      <Input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://..." />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          {user && <ReviewsPanel userId={user.id} />}

          {/* Messaging Section */}
          <MessagingPanel />
        </div>
      </div>
    </div>
  );
}
