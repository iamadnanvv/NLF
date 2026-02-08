import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  projectId: string;
  requiredSkills: string[];
}

export default function MatchedFreelancers({ projectId, requiredSkills }: Props) {
  const [freelancers, setFreelancers] = useState<(Tables<"profiles"> & { matchCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      // Get all freelancer profiles (those with skills)
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .not("skills", "is", null);

      if (data) {
        const matched = data
          .map((p) => {
            const matchCount = (p.skills || []).filter((s) => requiredSkills.includes(s)).length;
            return { ...p, matchCount };
          })
          .filter((p) => p.matchCount > 0)
          .sort((a, b) => b.matchCount - a.matchCount);
        setFreelancers(matched);
      }
      setLoading(false);
    };
    if (requiredSkills.length > 0) fetch();
    else { setFreelancers([]); setLoading(false); }
  }, [projectId, requiredSkills]);

  if (loading) return <p className="text-sm text-muted-foreground">Finding matches...</p>;

  if (freelancers.length === 0) {
    return (
      <Card className="py-8 text-center">
        <CardContent><p className="text-muted-foreground text-sm">No matched freelancers found. Try adding more skills to your project.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {freelancers.map((f) => (
        <Card key={f.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{f.full_name || "Unnamed"}</h4>
                {f.hourly_rate && <p className="text-sm text-muted-foreground">${f.hourly_rate}/hr</p>}
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{f.bio}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(f.skills || []).map((s) => (
                    <Badge key={s} variant={requiredSkills.includes(s) ? "default" : "outline"} className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className="bg-accent text-accent-foreground">{f.matchCount} match{f.matchCount > 1 ? "es" : ""}</Badge>
                <Badge variant="outline" className="text-xs">{f.availability}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
