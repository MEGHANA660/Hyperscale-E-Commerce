"""The services an order depends on must be deployable together on Kubernetes.

There is no cluster in CI, so this reads the manifests, Makefile and CI workflow and
checks the wiring that broke before: a missing payment-service, an undefined or
mismatched signing secret, and images that CI never builds.
"""
import os
import re

import pytest
import yaml

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
K8S = os.path.join(ROOT, "k8s")
CHECKOUT_SERVICES = ["product-service", "user-service", "order-service", "payment-service"]
# services that issue or verify login tokens in the checkout path
TOKEN_SERVICES = ["user-service", "order-service", "payment-service"]


def load(name):
    with open(os.path.join(K8S, f"{name}.yaml")) as f:
        return [d for d in yaml.safe_load_all(f) if d]


def deployment(name):
    return next(d for d in load(name) if d["kind"] == "Deployment")


def env_of(name):
    c = deployment(name)["spec"]["template"]["spec"]["containers"][0]
    return {e["name"]: e for e in c.get("env", [])}


@pytest.mark.parametrize("name", CHECKOUT_SERVICES)
def test_every_checkout_service_has_a_deployment_and_service(name):
    kinds = {d["kind"] for d in load(name)}
    assert {"Deployment", "Service"} <= kinds
    svc = next(d for d in load(name) if d["kind"] == "Service")
    assert svc["metadata"]["name"] == name and svc["spec"]["ports"][0]["port"] == 8000


def test_order_service_urls_point_at_services_that_exist():
    env = env_of("order-service")
    for var, target in [("PRODUCT_SERVICE_URL", "product-service"), ("PAYMENT_SERVICE_URL", "payment-service")]:
        assert env[var]["value"] == f"http://{target}:8000", var


@pytest.mark.parametrize("name", TOKEN_SERVICES)
def test_token_services_share_one_signing_secret(name):
    ref = env_of(name)["SECRET_KEY"]["valueFrom"]["secretKeyRef"]
    assert (ref["name"], ref["key"]) == ("jwt-secret", "secret_key")


def test_signing_secret_is_created_by_make_k8s_apply_and_never_committed():
    mk = open(os.path.join(ROOT, "Makefile")).read()
    assert "create secret generic jwt-secret" in mk
    apply_block = mk[mk.index("k8s-apply:"):mk.index("k8s-delete:")]
    assert "$(MAKE) k8s-secret" in apply_block
    # no literal secret value in any manifest
    for f in os.listdir(K8S):
        text = open(os.path.join(K8S, f)).read()
        assert not re.search(r"secret_key:\s*\S+", text), f"literal secret value in {f}"


def test_make_k8s_apply_deploys_every_checkout_service():
    mk = open(os.path.join(ROOT, "Makefile")).read()
    apply_block = mk[mk.index("k8s-apply:"):mk.index("k8s-delete:")]
    for name in CHECKOUT_SERVICES:
        assert f"k8s/{name}.yaml" in apply_block, name


def test_payment_service_is_not_exposed_through_the_ingress():
    ing = open(os.path.join(K8S, "ingress.yaml")).read()
    assert "payment-service" not in ing  # only the order service may call it


def test_order_service_runs_a_single_replica_while_its_queue_is_in_memory():
    assert deployment("order-service")["spec"]["replicas"] == 1


@pytest.mark.parametrize("name", CHECKOUT_SERVICES)
def test_ci_builds_every_image_the_manifests_use(name):
    image = deployment(name)["spec"]["template"]["spec"]["containers"][0]["image"]
    wf = yaml.safe_load(open(os.path.join(ROOT, ".github", "workflows", "ci-cd.yml")))
    matrix = wf["jobs"]["build"]["strategy"]["matrix"]
    builds = {s: s for s in matrix["service"]}
    for inc in matrix.get("include", []):
        builds[inc["service"]] = inc.get("path", inc["service"])
    assert name in builds and image.endswith(f"hyperscale-{name}:latest")
    # the folder CI builds from really exists and has a Dockerfile
    folder = os.path.join(ROOT, "services", builds[name])
    assert os.path.isfile(os.path.join(folder, "Dockerfile")), folder
