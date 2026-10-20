import asyncio
import os
import sys
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force test environment
os.environ["ENVIRONMENT"] = "testing"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_safaipay.db"
os.environ["SYNC_DATABASE_URL"] = "sqlite:///./test_safaipay.db"

from app.core.database import Base, get_db
from app.main import app
from app.core.security import create_access_token
from database.seed import seed_database

TEST_DB_URL = "sqlite+aiosqlite:///./test_safaipay.db"

test_engine = create_async_engine(
    TEST_DB_URL,
    echo=False,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Create test tables and seed data once before tests run."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # Run seed on test db
    await seed_database()
    
    yield

    # Cleanup after test session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    if os.path.exists("./test_safaipay.db"):
        try:
            os.remove("./test_safaipay.db")
        except Exception:
            pass

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def admin_token(client):
    res = await client.post("/api/v1/auth/login", json={
        "identifier": "admin@safaipay.org",
        "password": "AdminPassword123!"
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

@pytest_asyncio.fixture
async def collector_token(client):
    res = await client.post("/api/v1/auth/login", json={
        "identifier": "+923002220001",
        "password": "SafaiPassword123!"
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

@pytest_asyncio.fixture
async def customer_token(client):
    res = await client.post("/api/v1/auth/login", json={
        "identifier": "+923001110001",
        "password": "SafaiPassword123!"
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

@pytest_asyncio.fixture
async def recycler_token(client):
    res = await client.post("/api/v1/auth/login", json={
        "identifier": "+923003330001",
        "password": "SafaiPassword123!"
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

