#!/usr/bin/env node

/**
 * MongoDB Index Creation Script
 * 
 * This script creates optimized indexes for the aggregation queries
 * used in repairs and selfChecks routes based on current database models.
 * 
 * Updated to match current schema and query patterns:
 * - Users: firebaseUid, name, phoneNumber, role, recipientType, supportedDistrict
 * - Vehicles: vehicleId (unique), userId
 * - Repairs: vehicleId, repairedAt, repairStationCode, isAccident, repairCategories, memo
 * - SelfChecks: vehicleId, createdAt, various boolean check fields
 * - RepairStations: code (unique), firebaseUid, region, aid, coordinate (2dsphere)
 * 
 * Run with: node scripts/create-indexes.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

async function createIndexSafely(collection, indexSpec, options = {}) {
    try {
        const result = await collection.createIndex(indexSpec, options);
        console.log(`  ✅ Created index: ${JSON.stringify(indexSpec)} ${options.name ? `(${options.name})` : ''}`);
        return result;
    } catch (error) {
        if (error.code === 86) { // IndexKeySpecsConflict
            console.log(`  ⚠️  Index already exists: ${JSON.stringify(indexSpec)}`);
        } else {
            console.log(`  ❌ Failed to create index ${JSON.stringify(indexSpec)}: ${error.message}`);
        }
    }
}

async function createIndexes() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db();
        
        // Indexes for users collection
        console.log('\nCreating indexes for users collection...');
        const usersCollection = db.collection('users');
        await createIndexSafely(usersCollection, { firebaseUid: 1 }, { unique: true, name: 'firebaseUid_unique' });
        await createIndexSafely(usersCollection, { name: 1 }, { name: 'name_text_search' });
        await createIndexSafely(usersCollection, { phoneNumber: 1 }, { name: 'phoneNumber_search' });
        await createIndexSafely(usersCollection, { role: 1 }, { name: 'role_filter' });
        await createIndexSafely(usersCollection, { recipientType: 1 }, { name: 'recipientType_filter' });
        await createIndexSafely(usersCollection, { supportedDistrict: 1 }, { name: 'supportedDistrict_filter' });
        await createIndexSafely(usersCollection, { createdAt: -1 }, { name: 'createdAt_sort' });
        // Compound index for common search patterns
        await createIndexSafely(usersCollection, { role: 1, createdAt: -1 }, { name: 'role_createdAt_compound' });
        
        // Indexes for vehicles collection
        console.log('\nCreating indexes for vehicles collection...');
        const vehiclesCollection = db.collection('vehicles');
        await createIndexSafely(vehiclesCollection, { vehicleId: 1 }, { unique: true, name: 'vehicleId_unique' });
        await createIndexSafely(vehiclesCollection, { userId: 1 }, { name: 'userId_owner_lookup' });
        await createIndexSafely(vehiclesCollection, { createdAt: -1 }, { name: 'vehicles_createdAt_sort' });
        // Compound index for vehicle-user relationship queries
        await createIndexSafely(vehiclesCollection, { userId: 1, createdAt: -1 }, { name: 'userId_createdAt_compound' });
        
        // Indexes for repairs collection
        console.log('\nCreating indexes for repairs collection...');
        const repairsCollection = db.collection('repairs');
        await createIndexSafely(repairsCollection, { vehicleId: 1 }, { name: 'vehicleId_repairs_lookup' });
        await createIndexSafely(repairsCollection, { repairedAt: -1 }, { name: 'repairedAt_sort' });
        await createIndexSafely(repairsCollection, { repairStationCode: 1 }, { name: 'repairStationCode_filter' });
        await createIndexSafely(repairsCollection, { isAccident: 1 }, { name: 'isAccident_filter' });
        await createIndexSafely(repairsCollection, { repairCategories: 1 }, { name: 'repairCategories_filter' });
        await createIndexSafely(repairsCollection, { billingPrice: 1 }, { name: 'billingPrice_range' });
        await createIndexSafely(repairsCollection, { memo: 'text' }, { name: 'memo_text_search' });
        // Compound indexes for common query patterns
        await createIndexSafely(repairsCollection, { vehicleId: 1, repairedAt: -1 }, { name: 'vehicleId_repairedAt_compound' });
        await createIndexSafely(repairsCollection, { repairedAt: -1, repairStationCode: 1 }, { name: 'repairedAt_station_compound' });
        await createIndexSafely(repairsCollection, { repairedAt: -1, isAccident: 1 }, { name: 'repairedAt_accident_compound' });
        await createIndexSafely(repairsCollection, { repairCategories: 1, repairedAt: -1 }, { name: 'categories_repairedAt_compound' });
        
        // Indexes for selfchecks collection  
        console.log('\nCreating indexes for selfchecks collection...');
        const selfchecksCollection = db.collection('selfchecks');
        await createIndexSafely(selfchecksCollection, { vehicleId: 1 }, { name: 'vehicleId_selfchecks_lookup' });
        await createIndexSafely(selfchecksCollection, { createdAt: -1 }, { name: 'selfchecks_createdAt_sort' });
        // Compound index for vehicle-date queries
        await createIndexSafely(selfchecksCollection, { vehicleId: 1, createdAt: -1 }, { name: 'vehicleId_createdAt_selfchecks' });
        
        // Indexes for individual check fields (used in issue filtering)
        const checkFields = [
            'motorNoise', 'abnormalSpeed', 'batteryBlinking', 'chargingNotStart',
            'breakDelay', 'breakPadIssue', 'tubePunctureFrequent', 'tireWearFrequent',
            'batteryDischargeFast', 'incompleteCharging', 'seatUnstable', 'seatCoverIssue',
            'footRestLoose', 'antislipWorn', 'frameNoise', 'frameCrack'
        ];
        
        for (const field of checkFields) {
            await createIndexSafely(selfchecksCollection, { [field]: 1 }, { name: `${field}_issue_filter` });
        }
        
        // Compound indexes for date-based issue queries
        await createIndexSafely(selfchecksCollection, { 
            createdAt: -1, 
            motorNoise: 1, 
            abnormalSpeed: 1 
        }, { name: 'createdAt_motor_issues' });
        
        await createIndexSafely(selfchecksCollection, { 
            createdAt: -1, 
            batteryBlinking: 1, 
            chargingNotStart: 1,
            batteryDischargeFast: 1,
            incompleteCharging: 1
        }, { name: 'createdAt_battery_issues' });
        
        await createIndexSafely(selfchecksCollection, { 
            createdAt: -1, 
            breakDelay: 1, 
            breakPadIssue: 1 
        }, { name: 'createdAt_brake_issues' });
        
        // Indexes for RepairStations collection
        console.log('\nCreating indexes for RepairStations collection...');
        const repairStationsCollection = db.collection('repairStations');
        await createIndexSafely(repairStationsCollection, { code: 1 }, { unique: true, name: 'code_unique' });
        await createIndexSafely(repairStationsCollection, { firebaseUid: 1 }, { name: 'firebaseUid_station_lookup' });
        await createIndexSafely(repairStationsCollection, { region: 1 }, { name: 'region_filter' });
        await createIndexSafely(repairStationsCollection, { state: 1 }, { name: 'state_filter' });
        await createIndexSafely(repairStationsCollection, { city: 1 }, { name: 'city_filter' });
        // 2dsphere index for geospatial queries (already defined in model but ensuring it exists)
        await createIndexSafely(repairStationsCollection, { coordinate: '2dsphere' }, { name: 'coordinate_geospatial' });
        
        // Indexes for guardians collection (if exists)
        console.log('\nCreating indexes for guardians collection...');
        const guardiansCollection = db.collection('guardians');
        await createIndexSafely(guardiansCollection, { firebaseUid: 1 }, { name: 'guardian_firebaseUid_lookup' });
        
        console.log('\n✅ Index creation process completed!');
        
        // List all indexes to verify
        console.log('\n📋 Current indexes:');
        
        const collections = ['users', 'vehicles', 'repairs', 'selfchecks', 'repairStations', 'guardians'];
        for (const collectionName of collections) {
            console.log(`\n${collectionName}:`);
            try {
                const indexes = await db.collection(collectionName).listIndexes().toArray();
                indexes.forEach(index => {
                    console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
                });
            } catch (error) {
                console.log(`  ⚠️  Collection ${collectionName} not found or error listing indexes`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
createIndexes().catch(console.error); 