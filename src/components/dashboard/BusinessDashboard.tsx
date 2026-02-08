import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Users, Clock, DollarSign } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import ProposalList from "./ProposalList";
import MatchedFreelancers from "./MatchedFreelancers";

const CATEGORIES = ["Design", "Development", "Marketing", "Writing", "Data", "Other"];

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Tables<"projects">[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", budget_min: "", budget_max: "", timeline: "", category: "", skills: [] as string[] });
  const [skillInput, setSkillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    const { data } = await supabase.from("projects").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
    setProjects(data || []);
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (s && !form.skills.includes(s)) setForm({ ...form, skills: [...form.skills, s] });
    setSkillInput("");
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("projects").insert({
      owner_id: user.id,
      title: form.title,
      description: form.description,
      required_skills: form.skills,
      budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
      budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
      timeline: form.timeline,
      category: form.category,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Project posted!" });
      setForm({ title: "", description: "", budget_min: "", budget_max: "", timeline: "", category: "", skills: [] });
      setDialogOpen(false);
      fetchProjects();
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Your Projects</h1>
          <p className="text-muted-foreground">Manage your projects and review proposals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Post a Project</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>Post a New Project</DialogTitle></DialogHeader>
            <form onSubmit={handlePost} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Required Skills</Label>
                <div className="flex gap-2">
                  <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                  <Button type="button" variant="secondary" onClick={addSkill}>Add</Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1">{s}<button type="button" onClick={() => setForm({ ...form, skills: form.skills.filter((sk) => sk !== s) })}><X className="h-3 w-3" /></button></Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Budget Min ($)</Label><Input type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} /></div>
                <div className="space-y-2"><Label>Budget Max ($)</Label><Input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Timeline</Label><Input value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="e.g. 2 weeks" /></div>
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Posting..." : "Post Project"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent>
            <p className="text-muted-foreground">You haven't posted any projects yet. Click "Post a Project" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedProject === p.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedProject(selectedProject === p.id ? null : p.id)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.title}</CardTitle>
                    <CardDescription className="mt-1">{p.category}</CardDescription>
                  </div>
                  <Badge variant={p.status === "open" ? "default" : "secondary"}>{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.required_skills?.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {(p.budget_min || p.budget_max) && (
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${p.budget_min || 0} - ${p.budget_max || "∞"}</span>
                  )}
                  {p.timeline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.timeline}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>Proposals</h2>
            <ProposalList projectId={selectedProject} />
          </div>
          <div>
            <h2 className="mb-4 text-xl font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>Matched Freelancers</h2>
            <MatchedFreelancers projectId={selectedProject} requiredSkills={projects.find(p => p.id === selectedProject)?.required_skills || []} />
          </div>
        </div>
      )}
    </div>
  );
}
