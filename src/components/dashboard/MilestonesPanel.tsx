import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Check, Clock, DollarSign, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  amount: number | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface MilestonesPanelProps {
  projectId: string;
  isOwner: boolean;
  assignedFreelancerId?: string | null;
}

export default function MilestonesPanel({ projectId, isOwner, assignedFreelancerId }: MilestonesPanelProps) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount: "", dueDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    const { data } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    setMilestones(data || []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("milestones").insert({
      project_id: projectId,
      title: form.title,
      description: form.description || null,
      amount: form.amount ? parseFloat(form.amount) : null,
      due_date: form.dueDate || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Milestone created!" });
      setDialogOpen(false);
      setForm({ title: "", description: "", amount: "", dueDate: "" });
      fetchMilestones();
    }
  };

  const updateStatus = async (milestoneId: string, newStatus: string) => {
    const updates: Partial<Milestone> = { status: newStatus };
    if (newStatus === "completed") {
      updates.completed_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("milestones")
      .update(updates)
      .eq("id", milestoneId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchMilestones();
    }
  };

  const handlePayMilestone = async (milestone: Milestone) => {
    if (!milestone.amount || !assignedFreelancerId) {
      toast({ title: "Error", description: "Missing amount or freelancer assignment", variant: "destructive" });
      return;
    }

    setPayingId(milestone.id);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-order", {
        body: {
          milestone_id: milestone.id,
          project_id: projectId,
          payee_id: assignedFreelancerId,
        },
      });

      if (error || !data?.order_id) {
        toast({ title: "Error", description: error?.message || "Failed to create order", variant: "destructive" });
        setPayingId(null);
        return;
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "NLF",
        description: `Milestone: ${milestone.title}`,
        order_id: data.order_id,
        handler: async (response: any) => {
          // Verify payment
          const { error: verifyError } = await supabase.functions.invoke("razorpay-verify", {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              milestone_id: milestone.id,
            },
          });

          if (verifyError) {
            toast({ title: "Verification failed", description: verifyError.message, variant: "destructive" });
          } else {
            toast({ title: "Payment successful!", description: `₹${milestone.amount} released for "${milestone.title}"` });
            fetchMilestones();
          }
          setPayingId(null);
        },
        modal: {
          ondismiss: () => setPayingId(null),
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Payment failed", variant: "destructive" });
      setPayingId(null);
    }
  };

  const completedCount = milestones.filter((m) => m.status === "completed" || m.status === "paid").length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;
  const totalAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const paidAmount = milestones.filter((m) => m.status === "paid").reduce((sum, m) => sum + (m.amount || 0), 0);

  const statusColors: Record<string, string> = {
    pending: "secondary",
    in_progress: "default",
    completed: "outline",
    paid: "default",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Milestones & Payments</CardTitle>
        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Milestone</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Creating..." : "Create Milestone"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones yet</p>
        ) : (
          <>
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completedCount}/{milestones.length} completed</span>
              </div>
              <Progress value={progress} className="h-2" />
              {totalAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">₹{paidAmount.toFixed(2)} / ₹{totalAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                      )}
                    </div>
                    <Badge variant={statusColors[milestone.status] as "default" | "secondary" | "outline"}>
                      {milestone.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {milestone.amount && (
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />₹{milestone.amount}</span>
                    )}
                    {milestone.due_date && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(milestone.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {milestone.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(milestone.id, "in_progress")}>Start</Button>
                    )}
                    {milestone.status === "in_progress" && (
                      <Button size="sm" className="gap-1" onClick={() => updateStatus(milestone.id, "completed")}>
                        <Check className="h-3 w-3" /> Complete
                      </Button>
                    )}
                    {milestone.status === "completed" && isOwner && milestone.amount && assignedFreelancerId && (
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1"
                        disabled={payingId === milestone.id}
                        onClick={() => handlePayMilestone(milestone)}
                      >
                        <CreditCard className="h-3 w-3" />
                        {payingId === milestone.id ? "Processing..." : `Pay ₹${milestone.amount}`}
                      </Button>
                    )}
                    {milestone.status === "paid" && (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" /> Paid
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
