import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Briefcase, Users, DollarSign } from "lucide-react";

interface AnalyticsPanelProps {
  role: "business_owner" | "freelancer";
}

export default function AnalyticsPanel({ role }: AnalyticsPanelProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const [projectsRes, proposalsRes, paymentsRes] = await Promise.all([
        role === "business_owner"
          ? supabase.from("projects").select("*").eq("owner_id", user.id)
          : supabase.from("projects").select("*").eq("assigned_freelancer_id", user.id),
        role === "business_owner"
          ? supabase.from("proposals").select("*, projects!inner(owner_id)").eq("projects.owner_id", user.id)
          : supabase.from("proposals").select("*").eq("freelancer_id", user.id),
        role === "business_owner"
          ? supabase.from("payments").select("*").eq("payer_id", user.id)
          : supabase.from("payments").select("*").eq("payee_id", user.id),
      ]);
      setProjects(projectsRes.data || []);
      setProposals(proposalsRes.data || []);
      setPayments(paymentsRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [user, role]);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(221, 83%, 53%)",
    "hsl(142, 71%, 45%)",
    "hsl(38, 92%, 50%)",
  ];

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalProposals = proposals.length;
    const acceptedProposals = proposals.filter(p => p.status === "accepted").length;
    const conversionRate = totalProposals > 0 ? Math.round((acceptedProposals / totalProposals) * 100) : 0;
    const totalEarnings = payments.filter(p => p.status === "completed").reduce((s, p) => s + (p.amount || 0), 0);
    const pendingPayments = payments.filter(p => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0);
    return { totalProjects, totalProposals, conversionRate, totalEarnings, pendingPayments, acceptedProposals };
  }, [projects, proposals, payments]);

  const earningsOverTime = useMemo(() => {
    const completed = payments.filter(p => p.status === "completed");
    const byMonth: Record<string, number> = {};
    completed.forEach(p => {
      const month = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      byMonth[month] = (byMonth[month] || 0) + (p.amount || 0);
    });
    return Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));
  }, [payments]);

  const proposalStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    proposals.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [proposals]);

  const projectStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const projectsOverTime = useMemo(() => {
    const byMonth: Record<string, number> = {};
    projects.forEach(p => {
      const month = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      byMonth[month] = (byMonth[month] || 0) + 1;
    });
    return Object.entries(byMonth).map(([month, count]) => ({ month, count }));
  }, [projects]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {role === "business_owner" ? "Projects Posted" : "Assigned Projects"}
                </p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <Users className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {role === "business_owner" ? "Proposals Received" : "Proposals Sent"}
                </p>
                <p className="text-2xl font-bold">{stats.totalProposals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {role === "business_owner" ? "Total Spent" : "Total Earned"}
                </p>
                <p className="text-2xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="earnings">
        <TabsList>
          <TabsTrigger value="earnings">
            {role === "business_owner" ? "Spending" : "Earnings"}
          </TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {role === "business_owner" ? "Spending Over Time" : "Earnings Over Time"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {earningsOverTime.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No payment data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={earningsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, "Amount"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Projects Over Time</CardTitle></CardHeader>
              <CardContent>
                {projectsOverTime.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No projects yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={projectsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Project Status</CardTitle></CardHeader>
              <CardContent>
                {projectStatusData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No projects yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {projectStatusData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="proposals" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Proposal Status Breakdown</CardTitle></CardHeader>
            <CardContent>
              {proposalStatusData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No proposals yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={proposalStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" allowDecimals={false} className="text-xs" />
                    <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {proposalStatusData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
