import { describe, expect, it } from "@jest/globals";

import { mapSafetyReportForScreen } from "./mappers";

describe("mapSafetyReportForScreen", () => {
  it("keeps the city label while identifying country-level coverage", () => {
    const report = mapSafetyReportForScreen({
      location: { label: "Tokyo, Japan", city: "Tokyo" },
      coverage: { country_name: "Japan", country_iso: "JPN", granularity: "country" },
      risk: {
        score: 2.5,
        level: "high",
        advisory_description: "Reconsider travel to affected areas.",
      },
      alerts: [],
      categories: [
        {
          id: "advisory",
          title: "Country Advisory",
          status: "Level 2",
          description: "Reconsider travel to affected areas.",
          source: "TravelRiskAPI",
        },
      ],
      tips: [
        {
          id: "guidance-earthquake",
          title: "Prepare for earthquake shaking",
          description: "Move away from windows.",
          detail: "Drop, cover, and hold on.",
          source: "Wayfinder general preparedness guidance",
          alert_type: "earthquake",
        },
      ],
      fetched_at: "2026-07-18T12:00:00Z",
      is_stale: false,
    });

    expect(report.destinationLabel).toBe("Tokyo, Japan");
    expect(report.scopeLabel).toBe("Country-level risk information for Japan");
    expect(report.risk.label).toBe("High Risk (2.5/5)");
    expect(report.risk.indicatorLeft).toBe("47%");
    expect(report.categories[0].iconName).toBe("shield-checkmark");
    expect(report.tips[0].iconName).toBe("pulse");
  });

  it("handles partial and empty responses without inventing categories", () => {
    const report = mapSafetyReportForScreen({});

    expect(report.destinationLabel).toBe("Selected destination");
    expect(report.scopeLabel).toBe("Country-level risk information");
    expect(report.alerts).toEqual([]);
    expect(report.categories).toEqual([]);
    expect(report.tips).toEqual([]);
  });
});
