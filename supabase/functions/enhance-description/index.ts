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
    const { description, title } = await req.json();

    if (!description) {
      return new Response(
        JSON.stringify({ success: false, error: "Description is required" }),
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

    const prompt = `You are an expert job description writer. Enhance the following project description to make it clear, compelling, and professional. Keep it concise but detailed.

Project Title: ${title || "Untitled Project"}
Current Description: ${description}

Please provide an enhanced version that:
- Clearly states the project goals
- Lists specific deliverables
- Is written in a professional but approachable tone
- Maintains the original intent but improves clarity
- Is suitable for freelancers to understand the scope

Return only the enhanced description, without any preamble or explanation.`;

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
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("AI Gateway error:", data);
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error?.message || "Failed to enhance description",
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const enhancedDescription = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        success: true,
        enhanced_description: enhancedDescription,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error enhancing description:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to enhance description";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
