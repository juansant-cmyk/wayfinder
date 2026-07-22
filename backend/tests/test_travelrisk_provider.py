import httpx
import pytest

from app.providers.travelrisk import (
    TravelRiskApiProvider,
    TravelRiskCountryNotFound,
    TravelRiskMissingKey,
    TravelRiskUnavailable,
    map_travelrisk_report,
    normalize_travelrisk_severity,
)

pytestmark = pytest.mark.unit


def country_payload() -> dict:
    return {
        "iso_code": "JPN",
        "name": "Japan",
        "advisory_level": 1,
        "advisory_description": "Exercise normal precautions",
        "advisory_date": "2026-07-01T00:00:00Z",
        "risk_score": 1.5,
        "last_updated": "2026-07-18T12:00:00Z",
    }


def score_payload() -> dict:
    return {
        "iso_code": "JPN",
        "name": "Japan",
        "risk_score": 2.25,
        "advisory_level": 1,
        "active_alerts": 1,
        "calculation": {"base_score": 1, "alert_impact": 1.25, "composite": 2.25},
    }


def alert_payload(alert_id: int = 42) -> dict:
    return {
        "id": alert_id,
        "external_id": f"gdacs-{alert_id}",
        "alert_type": "earthquake",
        "severity": "Critical",
        "country_iso": "JPN",
        "location": "Eastern Honshu",
        "latitude": 38.5,
        "longitude": 142.1,
        "description": "Strong earthquake detected",
        "event_date": "2026-07-18T10:00:00Z",
    }


def test_travelrisk_payload_maps_country_score_and_alerts():
    report = map_travelrisk_report(country_payload(), score_payload(), [alert_payload()])

    assert report.country_iso == "JPN"
    assert report.country_name == "Japan"
    assert report.risk_score == 2.25
    assert report.advisory_description == "Exercise normal precautions"
    assert report.alerts[0].provider_alert_id == "42"
    assert report.alerts[0].severity == "extreme"
    assert report.alerts[0].areas == "Eastern Honshu"


@pytest.mark.parametrize(
    ("provider_value", "expected"),
    [("Critical", "extreme"), ("High", "high"), ("Medium", "moderate"), ("Low", "low")],
)
def test_travelrisk_severity_mapping(provider_value, expected):
    assert normalize_travelrisk_severity(provider_value) == expected


@pytest.mark.asyncio
async def test_travelrisk_provider_sends_key_and_paginates_alerts():
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        assert request.headers["X-API-Key"] == "dummy-travelrisk-key"
        if request.url.path == "/api/v1/countries/JPN":
            return httpx.Response(200, json=country_payload())
        if request.url.path == "/api/v1/risk-score/JPN":
            return httpx.Response(200, json=score_payload())
        if request.url.path == "/api/v1/alerts":
            skip = int(request.url.params["skip"])
            rows = [alert_payload(1)] if skip == 0 else [alert_payload(2)]
            return httpx.Response(200, json={"total": 2, "data": rows})
        return httpx.Response(404)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    provider = TravelRiskApiProvider(
        api_key="dummy-travelrisk-key",
        base_url="https://travelriskapi.com/api/v1",
        client=client,
    )

    report = await provider.country_report("jpn")

    assert [alert.provider_alert_id for alert in report.alerts] == ["1", "2"]
    assert len(requests) == 4
    await client.aclose()


@pytest.mark.asyncio
async def test_travelrisk_provider_accepts_alpha2_country_code():
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path == "/api/v1/countries/USA":
            return httpx.Response(200, json=country_payload() | {"iso_code": "USA", "name": "United States"})
        if request.url.path == "/api/v1/risk-score/USA":
            return httpx.Response(200, json=score_payload() | {"iso_code": "USA", "name": "United States"})
        if request.url.path == "/api/v1/alerts":
            return httpx.Response(200, json={"total": 0, "data": []})
        return httpx.Response(404)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    provider = TravelRiskApiProvider(api_key="dummy", client=client)

    await provider.country_report("US")
    await client.aclose()


@pytest.mark.asyncio
async def test_travelrisk_missing_key_fails_before_request():
    with pytest.raises(TravelRiskMissingKey):
        await TravelRiskApiProvider(api_key="").country_report("JPN")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("status_code", "error_type"),
    [(401, TravelRiskMissingKey), (404, TravelRiskCountryNotFound), (429, TravelRiskUnavailable), (500, TravelRiskUnavailable)],
)
async def test_travelrisk_http_errors_are_normalized(status_code, error_type):
    client = httpx.AsyncClient(
        transport=httpx.MockTransport(lambda request: httpx.Response(status_code, json={}))
    )
    provider = TravelRiskApiProvider(api_key="dummy", client=client)

    with pytest.raises(error_type):
        await provider.country_report("JPN")
    await client.aclose()


def test_travelrisk_invalid_score_is_rejected():
    invalid = score_payload()
    invalid["risk_score"] = "not-a-number"

    with pytest.raises(TravelRiskUnavailable):
        map_travelrisk_report(country_payload(), invalid, [])
