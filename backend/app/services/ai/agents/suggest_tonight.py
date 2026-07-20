from app.services.ai.context import TripChatContext


class SuggestTonightAgent:
    name = "suggest_tonight"
    description = "Weather-aware food / activity suggestions for tonight."

    async def run(self, ctx: TripChatContext) -> str:
        weather = ctx.weather_summary or "weather unknown"
        foodish = [c for c in ctx.candidates if c.kind in ("food", "place")]
        picks = foodish[:2] or ctx.candidates[:2]
        lines = [f"- {c.title}: {c.reason} (score {c.score:.2f})" for c in picks]
        return (
            f"[suggest_tonight:{self.name}] Context: {weather}.\n"
            + "\n".join(lines)
            + "\n(Demo angle: rainy -> soup / indoor.)"
        )
