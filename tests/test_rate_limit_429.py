import pytest
from test_integration_services import make_db_client


@pytest.mark.integration
@pytest.mark.parametrize("service", ["order-service", "product-service", "user-service"])
def test_rate_limited_client_gets_clean_429(service):
    client, mod = make_db_client(service)
    try:
        async def always_limited(ip):
            return False
        mod.rate_limiter.check_rate_limit = always_limited
        r = client.get("/health")
        assert r.status_code == 429
        assert r.json() == {"detail": "Rate limit exceeded"}
    finally:
        mod.app.dependency_overrides.clear()