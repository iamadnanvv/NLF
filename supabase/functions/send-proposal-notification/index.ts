import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProposalNotificationRequest {
  projectId: string;
  freelancerId: string;
  projectTitle: string;
  freelancerName: string;
  proposedRate: number | null;
  coverMessage: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { projectId, freelancerId, projectTitle, freelancerName, proposedRate, coverMessage }: ProposalNotificationRequest = await req.json();

    // Get project owner's email
    const { data: project } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new Error("Project not found");
    }

    const { data: ownerAuth } = await supabase.auth.admin.getUserById(project.owner_id);
    
    if (!ownerAuth?.user?.email) {
      throw new Error("Project owner email not found");
    }

    const emailResponse = await resend.emails.send({
      from: "NLF <notifications@lovable.app>",
      to: [ownerAuth.user.email],
      subject: `New Proposal for "${projectTitle}"`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px;">New Proposal Received!</h1>
          <p style="color: #666; font-size: 16px;">You have a new proposal for your project <strong>"${projectTitle}"</strong>.</p>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">From: ${freelancerName}</h3>
            ${proposedRate ? `<p style="margin: 0 0 10px 0; color: #666;"><strong>Proposed Rate:</strong> $${proposedRate}/hr</p>` : ''}
            <p style="margin: 0; color: #666;"><strong>Message:</strong></p>
            <p style="margin: 10px 0 0 0; color: #333; white-space: pre-wrap;">${coverMessage}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">Log in to your NLF dashboard to review and respond to this proposal.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">You're receiving this because you posted a project on NLF.</p>
        </div>
      `,
    });

    console.log("Proposal notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending proposal notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
