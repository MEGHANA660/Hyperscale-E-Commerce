"""Payment service: persistence, idempotency, declines, refunds."""
import pytest
from fastapi.testclient import TestClient

from test_integration_services import load_service_app, make_token


@pytest.fixture()
def pay(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    mod = load_service_app("payment_service")
    mod.Base.metadata.create_all(bind=mod.engine)
    client = TestClient(mod.app, raise_server_exceptions=False)
    headers = {"Authorization": f"Bearer {make_token()}"}
    return client, headers


def _body(**kw):
    return {"amount": 500.0, "payment_method": "upi", "order_id": "o-1", **kw}


@pytest.mark.integration
def test_requires_token(pay):
    client, _ = pay
    assert client.post("/payments/process", json=_body()).status_code == 401


@pytest.mark.integration
def test_successful_payment_is_persisted(pay):
    client, h = pay
    r = client.post("/payments/process", json=_body(), headers=h)
    assert r.status_code == 200 and r.json()["status"] == "success"
    txn = r.json()["transaction_id"]
    assert client.get(f"/payments/{txn}", headers=h).json()["amount"] == 500.0


@pytest.mark.integration
def test_same_idempotency_key_charges_once(pay):
    client, h = pay
    h = {**h, "Idempotency-Key": "k1"}
    a = client.post("/payments/process", json=_body(), headers=h).json()
    b = client.post("/payments/process", json=_body(), headers=h).json()
    assert a["transaction_id"] == b["transaction_id"]
    assert b["idempotent_replay"] is True


@pytest.mark.integration
def test_declined_payment_returns_402_and_replays_as_402(pay):
    client, h = pay
    h = {**h, "Idempotency-Key": "k2"}
    for _ in range(2):
        r = client.post("/payments/process", json=_body(payment_method="card_declined"), headers=h)
        assert r.status_code == 402


@pytest.mark.integration
@pytest.mark.parametrize("amount", [0, -5])
def test_invalid_amount_rejected(pay, amount):
    client, h = pay
    assert client.post("/payments/process", json=_body(amount=amount), headers=h).status_code == 422


@pytest.mark.integration
def test_amount_over_limit_declined(pay):
    client, h = pay
    assert client.post("/payments/process", json=_body(amount=99999999), headers=h).status_code == 402


@pytest.mark.integration
def test_refund_once_and_only_for_success(pay):
    client, h = pay
    txn = client.post("/payments/process", json=_body(), headers=h).json()["transaction_id"]
    r = client.post(f"/payments/{txn}/refund", headers=h)
    assert r.status_code == 200 and r.json()["status"] == "refunded"
    assert client.post(f"/payments/{txn}/refund", headers=h).json()["idempotent_replay"] is True
    assert client.post("/payments/txn-nope/refund", headers=h).status_code == 404
