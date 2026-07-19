from app.services.ai.agents.lodging import LodgingAgent
from app.services.ai.agents.planner import PlannerAgent
from app.services.ai.agents.suggest_tonight import SuggestTonightAgent

AGENT_REGISTRY = {
    "planner": PlannerAgent(),
    "lodging": LodgingAgent(),
    "suggest_tonight": SuggestTonightAgent(),
}
