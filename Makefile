.PHONY: up down build logs test frontend clean k8s-apply k8s-delete

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f --tail=100

restart:
	docker compose down && docker compose up -d

test:
	pytest tests/ -v --tb=short

test-fast:
	pytest tests/ -x -q

frontend:
	cd frontend && npm install && npm run dev

frontend-build:
	cd frontend && npm run build

clean:
	docker compose down -v --remove-orphans
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true

# Kubernetes
# One signing secret shared by every service that issues or checks login tokens.
# Created once with a random value; never committed.
k8s-secret:
	kubectl get secret jwt-secret -n hyperscale >/dev/null 2>&1 || \
		kubectl create secret generic jwt-secret -n hyperscale --from-literal=secret_key=$$(openssl rand -hex 32)

k8s-apply:
	kubectl apply -f k8s/namespace.yaml
	$(MAKE) k8s-secret
	kubectl apply -f k8s/postgres.yaml
	kubectl apply -f k8s/redis.yaml
	kubectl apply -f k8s/auth-service.yaml
	kubectl apply -f k8s/main-service.yaml
	kubectl apply -f k8s/product-service.yaml
	kubectl apply -f k8s/user-service.yaml
	kubectl apply -f k8s/payment-service.yaml
	kubectl apply -f k8s/order-service.yaml
	kubectl apply -f k8s/ingress.yaml

k8s-delete:
	kubectl delete namespace hyperscale

k8s-status:
	kubectl get all -n hyperscale

# Dev helpers
ps:
	docker compose ps

infra:
	docker compose up -d postgres mongodb redis rabbitmq
