using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace ScalaPOS.Endpoints
{
    public static class AIEndpoints
    {
        public static void MapAIEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/ai").WithTags("AI Assistant");

            // 1. Helpdesk Response Drafter
            group.MapPost("/helpdesk/draft", async (DraftRequest req) =>
            {
                // In a production environment with an OpenAI API key, you would:
                // 1. Construct a prompt: "You are a polite customer service agent for a restaurant. 
                //    Draft a brief, professional response to this ticket titled '{req.TicketTitle}'.
                //    Description: '{req.TicketDescription}'"
                // 2. Call the OpenAI /v1/chat/completions endpoint.
                // 3. Return the `choices[0].message.content`.

                // For this demonstration, we'll simulate an intelligent LLM response.
                await Task.Delay(1500); // Simulate network latency to an LLM provider

                string draft;
                var tone = req.TicketDescription.ToLower();

                if (tone.Contains("refund") || tone.Contains("wrong") || tone.Contains("cold") || tone.Contains("late"))
                {
                    draft = $"Hi {req.CustomerName ?? "Customer"},\n\nI sincerely apologize for the inconvenience you experienced regarding {req.TicketTitle.ToLower()}. We take this very seriously and I would love to make this right for you.\n\nCould you please confirm your order number so I can investigate and process a resolution immediately?\n\nBest regards,\nCustomer Support Team";
                }
                else if (tone.Contains("login") || tone.Contains("password") || tone.Contains("account"))
                {
                    draft = $"Hello {req.CustomerName ?? "Customer"},\n\nThanks for reaching out about your account access. You can reset your password by clicking 'Forgot Password' on the login screen. A reset link will be emailed to your registered address.\n\nLet me know if you are still having trouble logging in after trying that.\n\nWarmly,\nTechnical Support";
                }
                else
                {
                    draft = $"Hi {req.CustomerName ?? "Customer"},\n\nThank you for reaching out to us regarding {req.TicketTitle}. \n\nI have received your request and am currently looking into it. I will get back to you with an update shortly.\n\nPlease let me know if you have any additional details to add in the meantime.\n\nBest,\nSupport Team";
                }

                return Results.Ok(new { draft });
            })
            .WithName("DraftHelpdeskResponse")
            .WithSummary("Generate an AI draft response for a customer ticket");

            // 2. Analytics Insights Generator
            group.MapPost("/analytics/ask", async (AnalyticsAIRequest req) =>
            {
                // Production behavior: Stringify the `req.ContextData` (e.g., last 30 days of KPI/Revenue data).
                // Send it to the LLM alongside the `req.Question` as the System Prompt.
                
                await Task.Delay(2000); // Simulate analytical 'thinking'

                string answer;
                var q = req.Question.ToLower();

                if (q.Contains("revenue") || q.Contains("sales") || q.Contains("money"))
                {
                    answer = "Based on the provided data, your revenue is trending upwards. The highest earning period correlated with weekends. I recommend running targeted promotions on Tuesdays to boost mid-week sales.";
                }
                else if (q.Contains("product") || q.Contains("item") || q.Contains("sell"))
                {
                    answer = "Your top performing items are consistently beverages and signature mains. However, 3 items in your inventory are currently below the reorder threshold. You should restock them soon to prevent stockouts on popular dishes.";
                }
                else
                {
                    answer = "Looking at the general trends over the selected period, customer volume and order frequency remain stable. The data suggests a healthy conversion rate across all payment methods.";
                }

                return Results.Ok(new { answer });
            })
            .WithName("AskAnalyticsAI")
            .WithSummary("Ask natural language questions about your business data");
        }
    }

    public class DraftRequest
    {
        public string TicketTitle { get; set; }
        public string TicketDescription { get; set; }
        public string CustomerName { get; set; }
    }

    public class AnalyticsAIRequest
    {
        public string Question { get; set; }
        // The raw JSON data from the UI to feed the AI context
        public JsonElement ContextData { get; set; } 
    }
}
