import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MatchNotificationRequest {
  freelancerUserId: string;
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  matchedSkills: string[];
  budgetMin: number | null;
  budgetMax: number | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { freelancerUserId, projectId, projectTitle, projectDescription, matchedSkills, budgetMin, budgetMax }: MatchNotificationRequest = await req.json();

    // Get freelancer's email
    const { data: freelancerAuth } = await supabase.auth.admin.getUserById(freelancerUserId);
    
    if (!freelancerAuth?.user?.email) {
      throw new Error("Freelancer email not found");
    }

    const budgetText = budgetMin && budgetMax 
      ? `$${budgetMin} - $${budgetMax}`
      : budgetMin 
        ? `From $${budgetMin}`
        : budgetMax 
          ? `Up to $${budgetMax}`
          : 'Not specified';

    const emailResponse = await resend.emails.send({
      from: "NLF <notifications@lovable.app>",
      to: [freelancerAuth.user.email],
      subject: `New Project Match: "${projectTitle}"`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px;">🎯 New Project Match!</h1>
          <p style="color: #666; font-size: 16px;">A new project matches your skills!</p>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 20px;">${projectTitle}</h2>
            <p style="margin: 0 0 15px 0; color: #666;">${projectDescription.slice(0, 200)}${projectDescription.length > 200 ? '...' : ''}</p>
            
            <p style="margin: 0 0 10px 0; color: #666;"><strong>Budget:</strong> ${budgetText}</p>
            
            <div style="margin-top: 15px;">
              <p style="margin: 0 0 8px 0; color: #666;"><strong>Your Matching Skills:</strong></p>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${matchedSkills.map(skill => `<span style="background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 16px; font-size: 14px;">${skill}</span>`).join('')}
              </div>
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px;">Log in to your NLF dashboard to view this project and submit a proposal!</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">You're receiving this because your skills match this project on NLF.</p>
        </div>
      `,
    });

    console.log("Match notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending match notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
