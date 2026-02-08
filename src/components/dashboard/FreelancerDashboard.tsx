import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { DollarSign, Clock, Send } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Tables<"projects">[]>([]);
  const [myProposals, setMyProposals] = useState<(Tables<"proposals"> & { project?: Tables<"projects"> })[]>([]);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [applyProjectId, setApplyProjectId] = useState<string | null>(null);
  const [coverMessage, setCoverMessage] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch profile skills
    supabase.from("profiles").select("skills").eq("user_id", user.id).single()
      .then(({ data }) => setMySkills(data?.skills || []));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Fetch open projects
    supabase.from("projects").select("*").eq("status", "open").order("created_at", { ascending: false })
      .then(({ data }) => {
        // Sort by skill match
        const sorted = (data || []).sort((a, b) => {
          const aMatch = (a.required_skills || []).filter(s => mySkills.includes(s)).length;
          const bMatch = (b.required_skills || []).filter(s => mySkills.includes(s)).length;
          return bMatch - aMatch;
        });
        setProjects(sorted);
      });

    // Fetch my proposals
    supabase.from("proposals").select("*").eq("freelancer_id", user.id).order("created_at", { ascending: false })
      .then(async ({ data: proposals }) => {
        if (!proposals?.length) { setMyProposals([]); return; }
        const projectIds = [...new Set(proposals.map(p => p.project_id))];
        const { data: projectsData } = await supabase.from("projects").select("*").in("id", projectIds);
        const projectMap = new Map((projectsData || []).map(p => [p.id, p]));
        setMyProposals(proposals.map(p => ({ ...p, project: projectMap.get(p.project_id) })));
      });
  }, [user, mySkills]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !applyProjectId) return;
    setSubmitting(true);
    const { error } = await supabase.from("proposals").insert({
      project_id: applyProjectId,
      freelancer_id: user.id,
      cover_message: coverMessage,
      proposed_rate: proposedRate ? parseFloat(proposedRate) : null,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already applied", description: "You have already submitted a proposal for this project.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Proposal submitted!" });
      setCoverMessage("");
      setProposedRate("");
      setApplyProjectId(null);
      // Refresh
      const { data: proposals } = await supabase.from("proposals").select("*").eq("freelancer_id", user.id).order("created_at", { ascending: false });
      if (proposals?.length) {
        const projectIds = [...new Set(proposals.map(p => p.project_id))];
        const { data: projectsData } = await supabase.from("projects").select("*").in("id", projectIds);
        const projectMap = new Map((projectsData || []).map(p => [p.id, p]));
        setMyProposals(proposals.map(p => ({ ...p, project: projectMap.get(p.project_id) })));
      }
    }
  };

  const getMatchCount = (skills: string[] | null) => (skills || []).filter(s => mySkills.includes(s)).length;

  const appliedProjectIds = new Set(myProposals.map(p => p.project_id));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl">Find Work</h1>
        <p className="text-muted-foreground">Discover projects that match your skills</p>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Browse Projects</TabsTrigger>
          <TabsTrigger value="proposals">My Proposals ({myProposals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          {mySkills.length === 0 && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-primary">💡 Add skills to your profile to see matched projects first.</p>
              </CardContent>
            </Card>
          )}

          {projects.length === 0 ? (
            <Card className="py-16 text-center"><CardContent><p className="text-muted-foreground">No open projects right now. Check back soon!</p></CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((p) => {
                const matchCount = getMatchCount(p.required_skills);
                const alreadyApplied = appliedProjectIds.has(p.id);
                return (
                  <Card key={p.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.title}</CardTitle>
                          <CardDescription className="mt-1">{p.category}</CardDescription>
                        </div>
                        {matchCount > 0 && <Badge className="bg-accent text-accent-foreground">{matchCount} skill match{matchCount > 1 ? "es" : ""}</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                      <div className="mb-3 flex flex-wrap gap-1">
                        {p.required_skills?.map((s) => (
                          <Badge key={s} variant={mySkills.includes(s) ? "default" : "outline"} className="text-xs">{s}</Badge>
                        ))}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                        {(p.budget_min || p.budget_max) && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${p.budget_min || 0} - ${p.budget_max || "∞"}</span>}
                        {p.timeline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.timeline}</span>}
                      </div>
                      <div className="mt-auto">
                        {alreadyApplied ? (
                          <Badge variant="secondary">Applied</Badge>
                        ) : (
                          <Dialog open={applyProjectId === p.id} onOpenChange={(open) => { if (!open) setApplyProjectId(null); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="gap-2" onClick={() => setApplyProjectId(p.id)}>
                                <Send className="h-4 w-4" /> Submit Proposal
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Submit Proposal</DialogTitle></DialogHeader>
                              <form onSubmit={handleApply} className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Cover Message</Label>
                                  <Textarea value={coverMessage} onChange={(e) => setCoverMessage(e.target.value)} rows={4} required placeholder="Why are you a great fit for this project?" />
                                </div>
                                <div className="space-y-2">
                                  <Label>Proposed Rate ($/hr)</Label>
                                  <Input type="number" value={proposedRate} onChange={(e) => setProposedRate(e.target.value)} placeholder="50" />
                                </div>
                                <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Submitting..." : "Submit Proposal"}</Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="proposals" className="mt-6">
          {myProposals.length === 0 ? (
            <Card className="py-16 text-center"><CardContent><p className="text-muted-foreground">You haven't submitted any proposals yet.</p></CardContent></Card>
          ) : (
            <div className="space-y-4">
              {myProposals.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{p.project?.title || "Project"}</h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.cover_message}</p>
                        {p.proposed_rate && <p className="mt-1 text-sm">${p.proposed_rate}/hr</p>}
                      </div>
                      <Badge variant={p.status === "accepted" ? "default" : p.status === "declined" ? "destructive" : "secondary"}>
                        {p.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
