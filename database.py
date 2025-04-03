from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    def set_client(self, client: AsyncIOMotorClient, db_name: str):
        """Set the MongoDB client and database from an existing connection."""
        self.client = client
        self.db = client[db_name]
        print(f"Database interface initialized with database: {db_name}")


# Create a singleton instance
db = Database()


async def get_database() -> AsyncIOMotorDatabase:
    """Return database instance."""
    if db.db is None:
        raise RuntimeError("Database connection not initialized")
    return db.db