#!/usr/bin/env node

/**
 * MongoDB Index Creation Script
 * 
 * This script creates optimized indexes for the aggregation queries
 * used in repairs and selfChecks routes.
 * 
 * Run with: node scripts/create-indexes.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

async function createIndexes() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db();
        
        // Indexes for vehicles collection
        console.log('Creating indexes for vehicles collection...');
        await db.collection('vehicles').createIndex({ _id: 1, userId: 1 });
        await db.collection('vehicles').createIndex({ userId: 1 });
        await db.collection('vehicles').createIndex({ vehicleId: 1 });
        
        // Indexes for users collection
        console.log('Creating indexes for users collection...');
        await db.collection('users').createIndex({ _id: 1 });
        await db.collection('users').createIndex({ name: 1 });
        await db.collection('users').createIndex({ phoneNumber: 1 });
        
        // Indexes for repairs collection
        console.log('Creating indexes for repairs collection...');
        await db.collection('repairs').createIndex({ vehicleId: 1 });
        await db.collection('repairs').createIndex({ repairedAt: -1 });
        await db.collection('repairs').createIndex({ vehicleId: 1, repairedAt: -1 });
        await db.collection('repairs').createIndex({ repairStationCode: 1 });
        await db.collection('repairs').createIndex({ isAccident: 1 });
        
        // Indexes for selfchecks collection
        console.log('Creating indexes for selfchecks collection...');
        await db.collection('selfchecks').createIndex({ vehicleId: 1 });
        await db.collection('selfchecks').createIndex({ createdAt: -1 });
        await db.collection('selfchecks').createIndex({ vehicleId: 1, createdAt: -1 });
        
        // Compound indexes for common query patterns
        console.log('Creating compound indexes...');
        await db.collection('repairs').createIndex({ 
            repairedAt: -1, 
            repairStationCode: 1, 
            isAccident: 1 
        });
        
        await db.collection('selfchecks').createIndex({
            createdAt: -1,
            motorNoise: 1,
            abnormalSpeed: 1,
            batteryBlinking: 1,
            chargingNotStart: 1,
            breakDelay: 1,
            breakPadIssue: 1,
            tubePunctureFrequent: 1,
            tireWearFrequent: 1,
            batteryDischargeFast: 1,
            incompleteCharging: 1,
            seatUnstable: 1,
            seatCoverIssue: 1,
            footRestLoose: 1,
            antislipWorn: 1,
            frameNoise: 1,
            frameCrack: 1
        });
        
        console.log('✅ All indexes created successfully!');
        
        // List all indexes to verify
        console.log('\n📋 Current indexes:');
        
        const collections = ['vehicles', 'users', 'repairs', 'selfchecks'];
        for (const collectionName of collections) {
            console.log(`\n${collectionName}:`);
            const indexes = await db.collection(collectionName).listIndexes().toArray();
            indexes.forEach(index => {
                console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
            });
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