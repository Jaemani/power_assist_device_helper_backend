import os
from typing import Union
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

## MongoDB & dotenv & Encoding Setup
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from urllib.parse import quote_plus
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Import our components
from app.routers import locations
import config
from database import db, get_database
from app.services import location_service

load_dotenv(override=True)

# Use your existing MongoDB connection setup
username = quote_plus(os.getenv("MONGO_USERNAME"))
password = quote_plus(os.getenv("MONGO_PASSWORD"))
db_name = quote_plus(os.getenv("MONGO_DB_NAME"))

uri = "mongodb+srv://" + username + ":" + password + "@cluster0.nc2lcjy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Create a new motor client for async operations
motor_client = AsyncIOMotorClient(uri, server_api=ServerApi('1'))

# Initialize our database interface with the motor client
db.set_client(motor_client, db_name)

# Create a regular client for verification
client = MongoClient(uri, server_api=ServerApi('1'))
# Verify the connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)


app = FastAPI(
    title="Accessibility Location API",
    description="API for accessibility-related location data",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include our location router
app.include_router(
    locations.router,
    prefix=config.API_V1_PREFIX
)

# Keep your original endpoints for backward compatibility
@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


# Add a health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Try a database operation
        await motor_client.admin.command('ping')
        # Create indexes if they don't exist
        await location_service.ensure_indexes(await get_database())
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)