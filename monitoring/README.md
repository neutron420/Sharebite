# Monitoring With Grafana Cloud + Alloy

This project supports sending metrics directly to Grafana Cloud Hosted Prometheus using Grafana Alloy.

## 1) Set environment variables

Add the following to your `.env` file:

```env
GRAFANA_CLOUD_PROM_REMOTE_WRITE_URL=https://prometheus-prod-xx-prod-ap-south-1.grafana.net/api/prom/push
GRAFANA_CLOUD_PROM_USERNAME=your_prometheus_instance_id
GRAFANA_CLOUD_API_KEY=your_rotated_alloy_data_write_token
```

Or set them in PowerShell for a one-off local run:

```powershell
$env:GRAFANA_CLOUD_PROM_REMOTE_WRITE_URL = "https://prometheus-prod-xx-prod-ap-south-1.grafana.net/api/prom/push"
$env:GRAFANA_CLOUD_PROM_USERNAME = "your-prometheus-instance-id"
$env:GRAFANA_CLOUD_API_KEY = "your-rotated-token"
```

## 2) Run with Docker Compose (recommended)

```powershell
docker compose --profile monitoring up -d web ws alloy
```

The Alloy service uses `monitoring/alloy/config.alloy` and scrapes:

- `web:3000/api/metrics`
- `ws:8080/metrics`

## 3) Run Alloy directly on host (optional)

```powershell
alloy run .\monitoring\alloy\config.alloy
```

If you run Alloy on host, use `monitoring/alloy/config.alloy.example` and change targets to your host ports.

## 4) Verify ingestion in Grafana Cloud

In Grafana Explore, run:

```promql
up
```

You should see `sharebite_web` and `sharebite_ws` targets with value `1`.

## 5) Import the prebuilt dashboard

1. Open Grafana Cloud.
2. Go to Dashboards > New > Import.
3. Upload `monitoring/grafana/sharebite-overview-dashboard.json`.
4. Select your Prometheus data source.
5. Save the dashboard.

The dashboard includes:

- Service availability (`up`)
- API throughput and status splits
- API p50/p95 latency
- WebSocket active connections
- WebSocket message rate and errors
- Top API routes by traffic and latency

## 6) Set up alerts

Use `monitoring/grafana/prometheus-alert-rules.yml` as your baseline alert rule set.

You can copy these expressions into Grafana Alerting rules if you are using Grafana Cloud-managed alerting.

## Notes

- Do not hardcode API keys in source files.
- If token is exposed, revoke and create a new one.
- Web app metrics endpoint is `/api/metrics`.
- WebSocket metrics endpoint is `/metrics`.
