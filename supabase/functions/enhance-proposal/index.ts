import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coverMessage, projectTitle, projectDescription } = await req.json();

    if (!coverMessage) {
      return new Response(
        JSON.stringify({ success: false, error: "Cover message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are an expert freelancer proposal writer. Enhance the following proposal to make it more compelling, professional, and persuasive while keeping the freelancer's original voice.

Project Title: ${projectTitle || "Project"}
Project Description: ${projectDescription || "Not provided"}

Original Proposal: ${coverMessage}

Please provide an enhanced version that:
- Opens with a strong, personalized hook
- Demonstrates understanding of the project requirements
- Highlights relevant experience and skills
- Shows enthusiasm and professionalism
- Includes a clear call-to-action
- Maintains the original intent but improves clarity and persuasiveness
- Stays concise (under 300 words)

Return only the enhanced proposal, without any preamble or explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("AI Gateway error:", data);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: data.error?.message || "Failed to enhance proposal" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const enhancedProposal = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        success: true,
        enhanced_proposal: enhancedProposal,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error enhancing proposal:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to enhance proposal";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
