import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.anyio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["app"] == "Local AI Video Studio"
        assert data["version"] == "0.1.0"


@pytest.mark.anyio
async def test_system_info_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/system/info")
        assert response.status_code == 200
        data = response.json()
        assert "python_version" in data
        assert "os_name" in data
        assert "cpu_name" in data
        assert "ram_total_gb" in data
        assert "cuda_available" in data
        assert "gpu" in data
        assert isinstance(data["cuda_available"], bool)


@pytest.mark.anyio
async def test_ai_engine_generate_requires_installed_model():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "prompt": "Cyberpunk city with rain",
            "model_name": "model-animatediff",
            "aspect_ratio": "16:9",
            "resolution": "720p",
            "duration_seconds": 5,
        }
        response = await client.post("/api/generate", json=payload)
        assert response.status_code == 409
        assert "Tải đầy đủ" in response.json()["detail"]


@pytest.mark.anyio
async def test_projects_crud():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. List projects
        response = await client.get("/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["total"] >= 2

        # 2. Create project
        create_payload = {
            "name": "Test Animation Project",
            "prompt": "Glowing floating island in the clouds",
            "negative_prompt": "foggy, dark",
            "model_name": "model-animatediff",
            "aspect_ratio": "16:9",
            "resolution": "1080p",
            "duration_seconds": 5,
            "seed": 12345,
        }
        create_res = await client.post("/api/projects", json=create_payload)
        assert create_res.status_code == 201
        new_proj = create_res.json()
        assert new_proj["name"] == "Test Animation Project"
        proj_id = new_proj["id"]

        # 3. Retrieve created project
        get_res = await client.get(f"/api/projects/{proj_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == proj_id


@pytest.mark.anyio
async def test_models_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/models")
        assert response.status_code == 200
        data = response.json()
        assert len(data["models"]) >= 3
        # Ensure status accurately reports based on filesystem
        assert all(m["status"] in ["Installed", "Not Installed", "Downloading"] for m in data["models"])


@pytest.mark.anyio
async def test_cloud_providers_crud():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. List providers
        res = await client.get("/api/providers")
        assert res.status_code == 200
        data = res.json()
        assert len(data["providers"]) >= 4

        # 2. Save API Key
        save_res = await client.post(
            "/api/providers/kling",
            json={"api_key": "kling_test_secret_key_12345", "is_active": True},
        )
        assert save_res.status_code == 200

        # 3. Check masked key appears
        res2 = await client.get("/api/providers")
        providers = {p["provider_id"]: p for p in res2.json()["providers"]}
        assert providers["kling"]["has_key"] is True
        assert "••••" in providers["kling"]["masked_key"]

        # 4. Test provider key
        test_res = await client.post(
            "/api/providers/kling/test",
            json={"api_key": "kling_test_secret_key_12345"},
        )
        assert test_res.status_code == 200
        assert test_res.json()["valid"] is True
