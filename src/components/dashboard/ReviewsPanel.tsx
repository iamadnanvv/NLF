import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  project_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name?: string;
  project_title?: string;
}

interface ReviewsPanelProps {
  userId: string;
  showAddReview?: boolean;
  projectId?: string;
  revieweeId?: string;
}

export default function ReviewsPanel({ userId, showAddReview = false, projectId, revieweeId }: ReviewsPanelProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const fetchReviews = async () => {
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    if (!reviewsData?.length) {
      setReviews([]);
      return;
    }

    // Get reviewer names and project titles
    const reviewerIds = [...new Set(reviewsData.map((r) => r.reviewer_id))];
    const projectIds = [...new Set(reviewsData.map((r) => r.project_id))];

    const [{ data: profiles }, { data: projects }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", reviewerIds),
      supabase.from("projects").select("id, title").in("id", projectIds),
    ]);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
    const projectMap = new Map((projects || []).map((p) => [p.id, p.title]));

    setReviews(
      reviewsData.map((r) => ({
        ...r,
        reviewer_name: profileMap.get(r.reviewer_id) || "Anonymous",
        project_title: projectMap.get(r.project_id) || "Project",
      }))
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectId || !revieweeId) return;

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      project_id: projectId,
      rating,
      comment: comment.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already reviewed", description: "You have already reviewed this user for this project.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Review submitted!" });
      setDialogOpen(false);
      setRating(5);
      setComment("");
      fetchReviews();
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            className={cn(interactive && "cursor-pointer transition-transform hover:scale-110")}
            disabled={!interactive}
          >
            <Star
              className={cn(
                "h-5 w-5",
                star <= (interactive ? hoverRating || rating : count)
                  ? "fill-rating text-rating"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg">Reviews</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-rating text-rating" />
            <span>{averageRating}</span>
            <span>({reviews.length})</span>
          </div>
        </div>
        {showAddReview && projectId && revieweeId && user?.id !== revieweeId && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Leave Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave a Review</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  {renderStars(rating, true)}
                </div>
                <div className="space-y-2">
                  <Label>Comment (optional)</Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Share your experience working together..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{review.reviewer_name}</span>
                  {renderStars(review.rating)}
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mb-1">{review.comment}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  For: {review.project_title} • {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
