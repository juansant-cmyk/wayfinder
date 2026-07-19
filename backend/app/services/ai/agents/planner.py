from app.services.ai.context import TripChatContext


class PlannerAgent:
    name = "planner"
    description = "Builds or adjusts multi-day itinerary suggestions."

    async def run(self, ctx: TripChatContext) -> str:
        top = ctx.candidates[:3]
        lines = [f"- {c.title} ({c.reason})" for c in top] or ["- (no scored stops yet)"]
        dest = ctx.destination or "your trip"
        return (
            f"[planner:{self.name}] Draft day plan for {dest}:\n"
            + "\n".join(lines)
            + "\n(Wire plans API + OpenAI tools to expand this.)"
        )
