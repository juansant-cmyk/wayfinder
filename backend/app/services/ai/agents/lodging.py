from app.services.ai.context import TripChatContext


class LodgingAgent:
    name = "lodging"
    description = "Searches and compares hotels using the hotel provider."

    async def run(self, ctx: TripChatContext) -> str:
        hotels = [c for c in ctx.candidates if c.kind == "hotel"]
        dest = ctx.destination or "the area"
        if not hotels:
            return (
                f"[lodging:{self.name}] No hotel candidates scored for {dest}. "
                "Next: call get_hotel_provider().search_hotels via a tool."
            )
        best = hotels[0]
        return (
            f"[lodging:{self.name}] Top stay idea: {best.title} "
            f"(score {best.score:.2f}) — {best.reason}"
        )
