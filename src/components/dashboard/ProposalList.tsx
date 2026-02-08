import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  projectId: string;
}

type ProposalWithProfile = Tables<"proposals"> & {
  profile?: { full_name: string; skills: string[] | null; hourly_rate: number | null };
};

export default function ProposalList({ projectId }: Props) {
  const [proposals, setProposals] = useState<ProposalWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("proposals")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (data?.length) {
      const freelancerIds = [...new Set(data.map((p) => p.freelancer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, skills, hourly_rate")
        .in("user_id", freelancerIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      setProposals(data.map((p) => ({ ...p, profile: profileMap.get(p.freelancer_id) })));
    } else {
      setProposals([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProposals(); }, [projectId]);

  const updateStatus = async (proposalId: string, status: "accepted" | "declined") => {
    const { error } = await supabase.from("proposals").update({ status }).eq("id", proposalId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Proposal ${status}` });
      fetchProposals();
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading proposals...</p>;

  if (proposals.length === 0) {
    return <Card className="py-8 text-center"><CardContent><p className="text-muted-foreground text-sm">No proposals yet for this project.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-3">
      {proposals.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{p.profile?.full_name || "Anonymous"}</h4>
                {p.proposed_rate && <p className="text-sm text-muted-foreground">${p.proposed_rate}/hr</p>}
                <p className="mt-2 text-sm">{p.cover_message}</p>
              </div>
              <div className="flex items-center gap-2">
                {p.status === "pending" ? (
                  <>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-accent" onClick={() => updateStatus(p.id, "accepted")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => updateStatus(p.id, "declined")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Badge variant={p.status === "accepted" ? "default" : "destructive"}>{p.status}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
