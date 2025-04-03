from typing import Dict, List, Any, Optional, Union
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

# Import the location types
from app.models.location import LocationType


# MongoDB collection name
LOCATION_COLLECTION = "locations"


async def create_location(db: AsyncIOMotorDatabase, location_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new location in the database."""
    # Add timestamps
    location_data["created_at"] = datetime.utcnow()
    location_data["updated_at"] = datetime.utcnow()
    
    result = await db[LOCATION_COLLECTION].insert_one(location_data)
    location_data["_id"] = str(result.inserted_id)
    return location_data


async def get_location(db: AsyncIOMotorDatabase, location_id: str) -> Optional[Dict[str, Any]]:
    """Get a location by ID."""
    try:
        location_doc = await db[LOCATION_COLLECTION].find_one({"_id": ObjectId(location_id)})
        if location_doc:
            location_doc["_id"] = str(location_doc["_id"])
            return location_doc
        return None
    except Exception:
        # Invalid ObjectId format or other error
        return None


async def update_location(
    db: AsyncIOMotorDatabase, location_id: str, update_data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """Update a location by ID."""
    try:
        # Make sure update_data doesn't have _id
        if "_id" in update_data:
            del update_data["_id"]
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        await db[LOCATION_COLLECTION].update_one(
            {"_id": ObjectId(location_id)},
            {"$set": update_data}
        )
        
        return await get_location(db, location_id)
    except Exception:
        return None


async def delete_location(db: AsyncIOMotorDatabase, location_id: str) -> bool:
    """Delete a location by ID."""
    try:
        result = await db[LOCATION_COLLECTION].delete_one({"_id": ObjectId(location_id)})
        return result.deleted_count > 0
    except Exception:
        return False


async def list_locations(
    db: AsyncIOMotorDatabase,
    skip: int = 0,
    limit: int = 100,
    location_type: Optional[Union[LocationType, str]] = None,
    tags: Optional[List[str]] = None,
    operational_status: Optional[str] = None
) -> Dict[str, Any]:
    """List locations with filtering options."""
    query = {}
    
    # Apply filters
    if location_type:
        query["location_type"] = location_type
    
    if tags:
        query["tags"] = {"$all": tags}
    
    # Filter by operational status for applicable location types
    if operational_status:
        query["details.operational_status"] = operational_status
    
    # Count total matching documents
    total = await db[LOCATION_COLLECTION].count_documents(query)
    
    # Get paginated results
    cursor = db[LOCATION_COLLECTION].find(query).skip(skip).limit(limit).sort("created_at", -1)
    locations = []
    
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        locations.append(doc)
    
    return {
        "total": total,
        "items": locations
    }


async def get_locations_by_type(
    db: AsyncIOMotorDatabase,
    location_type: Union[LocationType, str],
    skip: int = 0,
    limit: int = 100
) -> Dict[str, Any]:
    """Get locations by type."""
    query = {"location_type": location_type}
    
    total = await db[LOCATION_COLLECTION].count_documents(query)
    cursor = db[LOCATION_COLLECTION].find(query).skip(skip).limit(limit)
    
    locations = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        locations.append(doc)
    
    return {
        "total": total,
        "items": locations
    }


async def search_locations_by_proximity(
    db: AsyncIOMotorDatabase,
    latitude: float,
    longitude: float,
    max_distance_km: float = 10.0,
    limit: int = 20,
    location_type: Optional[Union[LocationType, str]] = None
) -> List[Dict[str, Any]]:
    """Search locations by proximity using MongoDB geospatial query."""
    # 6371 is Earth's radius in kilometers
    pipeline = [
        {
            "$geoNear": {
                "near": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "distanceField": "distance",
                "maxDistance": max_distance_km * 1000,  # Convert to meters
                "spherical": True,
                "distanceMultiplier": 0.001  # Convert distance from meters to kilometers
            }
        }
    ]
    
    # Add location_type filter if provided
    if location_type:
        pipeline.append({"$match": {"location_type": location_type}})
    
    # Limit results
    pipeline.append({"$limit": limit})
    
    # Execute aggregation
    cursor = db[LOCATION_COLLECTION].aggregate(pipeline)
    
    # Process results
    locations = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        locations.append(doc)
    
    return locations


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create required indexes for the locations collection."""
    # Create 2dsphere index for geospatial queries on coordinates
    await db[LOCATION_COLLECTION].create_index([("coordinates", "2dsphere")])
    
    # Create indexes for common query fields
    await db[LOCATION_COLLECTION].create_index([("location_type", 1)])
    await db[LOCATION_COLLECTION].create_index([("tags", 1)])
    await db[LOCATION_COLLECTION].create_index([("created_at", -1)])