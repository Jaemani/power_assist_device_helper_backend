from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


class LocationType(str, Enum):
    STAIRS = "stairs"
    SIDEWALK = "sidewalk"
    CHARGING_STATION = "charging_station"
    SUBWAY_TOILET = "subway_toilet"
    WHEELCHAIR_RAMP = "wheelchair_ramp"


class Coordinates(BaseModel):
    latitude: float
    longitude: float


class Address(BaseModel):
    street: Optional[str] = None
    city: str
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str


class StairsDetails(BaseModel):
    steps_count: Optional[int] = None
    has_handrail: Optional[bool] = None
    has_ramp_alternative: Optional[bool] = None
    width_meters: Optional[float] = None
    is_covered: Optional[bool] = None


class SidewalkDetails(BaseModel):
    width_meters: Optional[float] = None
    surface_type: Optional[str] = None
    has_tactile_paving: Optional[bool] = None
    is_covered: Optional[bool] = None
    condition: Optional[str] = None  # good, fair, poor


class ChargingDetails(BaseModel):
    station_name: str
    operator: Optional[str] = None
    connector_types: List[str] = []
    total_ports: int
    available_ports: Optional[int] = None
    max_power_kw: Optional[float] = None
    payment_methods: List[str] = []
    open_24h: Optional[bool] = None
    operational_status: str = "operational"  # operational, limited, non-operational
    last_status_update: Optional[datetime] = None


class SubwayToiletDetails(BaseModel):
    station_name: str
    is_accessible: bool
    is_gender_neutral: Optional[bool] = None
    has_changing_table: Optional[bool] = None
    operational_status: str = "operational"
    floor_level: Optional[str] = None
    requires_key: Optional[bool] = None


class WheelchairRampDetails(BaseModel):
    ramp_type: str  # permanent, temporary, portable
    incline_degrees: Optional[float] = None
    width_meters: Optional[float] = None
    surface_type: Optional[str] = None
    has_edge_protection: Optional[bool] = None
    operational_status: str = "operational"


class LocationBase(BaseModel):
    name: str
    location_type: LocationType
    coordinates: Coordinates
    address: Address
    description: Optional[str] = None
    tags: List[str] = []
    images: List[str] = []
    details: Optional[Union[
        StairsDetails,
        SidewalkDetails, 
        ChargingDetails,
        SubwayToiletDetails,
        WheelchairRampDetails
    ]] = None
    metadata: Dict[str, Any] = {}


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    address: Optional[Address] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    images: Optional[List[str]] = None
    details: Optional[Union[
        StairsDetails,
        SidewalkDetails, 
        ChargingDetails,
        SubwayToiletDetails,
        WheelchairRampDetails
    ]] = None
    metadata: Optional[Dict[str, Any]] = None


class LocationInDB(LocationBase):
    id: str = Field(..., alias="_id")
    created_at: datetime
    updated_at: datetime
    data_source: Optional[str] = None  # e.g., "api_import", "manual_entry"

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }


class Location(LocationInDB):
    pass


class LocationList(BaseModel):
    total: int
    items: List[Location]