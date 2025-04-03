from fastapi import APIRouter, HTTPException, Depends, Query, Path
from typing import List, Optional, Dict, Any, Union
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.location import Location, LocationCreate, LocationUpdate, LocationList, LocationType
from app.services import location_service
from database import get_database


router = APIRouter(
    tags=["locations"]
)


@router.post("/locations", response_model=Location, status_code=201)
async def create_location(
    location: LocationCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new location."""
    location_data = location.model_dump()
    result = await location_service.create_location(db, location_data)
    return result


@router.get("/locations/{location_id}", response_model=Location)
async def get_location(
    location_id: str = Path(..., title="The ID of the location to get"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a location by ID."""
    location = await location_service.get_location(db, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.put("/locations/{location_id}", response_model=Location)
async def update_location(
    location_update: LocationUpdate,
    location_id: str = Path(..., title="The ID of the location to update"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a location."""
    # Check if location exists
    location = await location_service.get_location(db, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Update with non-null fields
    update_data = {
        k: v for k, v in location_update.model_dump(exclude_unset=True).items()
        if v is not None
    }
    
    updated_location = await location_service.update_location(db, location_id, update_data)
    return updated_location


@router.delete("/locations/{location_id}", status_code=204)
async def delete_location(
    location_id: str = Path(..., title="The ID of the location to delete"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a location."""
    deleted = await location_service.delete_location(db, location_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Location not found")
    return None


@router.get("/locations", response_model=LocationList)
async def list_locations(
    skip: int = Query(0, ge=0, description="Number of locations to skip"),
    limit: int = Query(100, ge=1, le=100, description="Max number of locations to return"),
    location_type: Optional[LocationType] = Query(None, description="Filter by location type"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """List locations with pagination and filtering."""
    results = await location_service.list_locations(
        db, skip=skip, limit=limit, location_type=location_type, tags=tags
    )
    return results


# Type-specific endpoints for convenience

@router.get("/stairs", response_model=LocationList)
async def get_stairs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all stairs locations."""
    results = await location_service.get_locations_by_type(
        db, LocationType.STAIRS, skip=skip, limit=limit
    )
    return results


@router.get("/sidewalks", response_model=LocationList)
async def get_sidewalks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all sidewalk locations."""
    results = await location_service.get_locations_by_type(
        db, LocationType.SIDEWALK, skip=skip, limit=limit
    )
    return results


@router.get("/charging-stations", response_model=LocationList)
async def get_charging_stations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get charging station locations."""
    results = await location_service.get_locations_by_type(
        db, LocationType.CHARGING_STATION, skip=skip, limit=limit
    )
    return results


@router.get("/subway-toilets", response_model=LocationList)
async def get_subway_toilets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get subway toilet locations."""
    results = await location_service.get_locations_by_type(
        db, LocationType.SUBWAY_TOILET, skip=skip, limit=limit
    )
    return results


@router.get("/wheelchair-ramps", response_model=LocationList)
async def get_wheelchair_ramps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get wheelchair ramp locations."""
    results = await location_service.get_locations_by_type(
        db, LocationType.WHEELCHAIR_RAMP, skip=skip, limit=limit
    )
    return results


@router.get("/locations/search/proximity", response_model=List[Location])
async def search_by_proximity(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    distance: float = Query(10.0, gt=0, description="Maximum distance in kilometers"),
    location_type: Optional[LocationType] = Query(None, description="Filter by location type"),
    limit: int = Query(20, ge=1, le=50, description="Max number of results"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Find locations near a specific point."""
    locations = await location_service.search_locations_by_proximity(
        db, 
        latitude=latitude, 
        longitude=longitude, 
        max_distance_km=distance,
        limit=limit,
        location_type=location_type
    )
    return locations