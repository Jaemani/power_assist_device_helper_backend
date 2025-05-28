import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles } from '@/lib/db/models'; 
import mongoose from 'mongoose';
import { withAuth } from '@/lib/auth/withAuth';
import { getAuth } from 'firebase-admin/auth'
import { getCorsHeaders } from '@/lib/cors';
import { validateAdminToken } from '@/lib/auth/adminAuth';

await connectToMongoose();

export async function OPTIONS(req) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
    });
}

export const POST = withAuth(async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    console.log("POST users/");
    try {
        const body = await req.json();
        const {name, supportedDistrict, vehicleId, model, purchasedAt, manufacturedAt, recipientType, vehicleType} = body; // smsConsent 뺌
        const firebaseUid = decoded.user_id;
        const phoneNumber = decoded.phone_number;
        const role = 'user'
        
        const smsConsent = false; // 임시

        try {   

            if (firebaseUid === undefined || firebaseUid === "" || phoneNumber === undefined || phoneNumber === "") {
                return new NextResponse(JSON.stringify({ error: 'Invalid ID token' }), {
                    status: 401,
                    headers: getCorsHeaders(origin),
                    
                });
            }
            
            const user = await Users.findOne({ firebaseUid });

            if (user) {
                console.log("Response users/ User exsist. ")
                console.log(firebaseUid ? firebaseUid.toString() : "No firebase uid");
                return new NextResponse(JSON.stringify({ error: 'User already exists' }), {
                    status: 409,
                    headers: getCorsHeaders(origin),
                    
                });
            }
            
            if (Object.keys(body).length === 0) {
                console.log("Response users/ is new User. ")
                console.log(firebaseUid ? firebaseUid.toString() : "No firebase uid");
                return new NextResponse(JSON.stringify({ message: 'new User' }), {
                    status: 200,
                    headers: getCorsHeaders(origin),
                });
            }
            // // dummy decoded data
            // const firebaseUid = "test"
            // const phoneNumber = "01012345678"
            // const role = "user"

            // find a vehicle
            const vehicle = await Vehicles.findOne({ vehicleId: vehicleId });
            if (!vehicle) {
                return new NextResponse(JSON.stringify({ error: 'Invalid vehicleId' }), {
                    status: 404,
                    headers: getCorsHeaders(origin),
                    
                });
            }

            if (vehicle.userId !== null) {
                return new NextResponse(JSON.stringify({ error: 'This Vehicle has an owner' }), {
                    status: 403,
                    headers: getCorsHeaders(origin),
                    
                });
            }
            
            // if (typeof smsConsent !== 'boolean') {
            //   return new NextResponse(
            //     JSON.stringify({ error: 'Missing or invalid smsConsent' }),
            //     { status: 400, headers: getCorsHeaders(origin) }
            //   );
            // }

            // new user
            const newUser = new Users({
                name,
                firebaseUid, // from decoded token
                phoneNumber, // from decoded token
                role, // default role = 'user'
                recipientType,
                smsConsent,
                supportedDistrict,
                guardianIds: [], // array of ObjectId, empty at first. type by manager manually later
            });
            
            await newUser.save();
            console.log("Response users/ new User created. ")
            console.log(firebaseUid ? firebaseUid.toString() : "no Firebase uid");
            console.log(newUser);

            await Vehicles.updateOne(
                { _id: vehicle._id }, // filter
                { $set: { 
                    userId:new mongoose.Types.ObjectId(newUser._id.toString()) , // newly generated user's ObjectId
                    model: model,
                    purchasedAt: new Date(purchasedAt), // ISOString to Date
                    manufacturedAt: new Date(manufacturedAt), // ISOString to Date
                    vehicleType: vehicleType,
                 } } // update
            );

            console.log("Response users/ Vehicle updated. ")
            console.log(vehicle ? vehicle._id.toString() : "no vehicle id");
            return NextResponse.json({ 
                userId: newUser._id.toString(), // ourput newly generated ObjectId
                name: newUser.name,
                phoneNumber: newUser.phoneNumber,
                role: newUser.role,
                recipientType: newUser.recipientType,
                smsConsent: newUser.smsConsent,
                supportedDistrict: newUser.supportedDistrict,
                vehicleId: vehicle.vehicleId,
            }, { 
                status: 201,
                headers: getCorsHeaders(origin) 
            });

        } catch (error) {
            console.error('Error creating user:', error);
            return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
                status: 500,
                headers: getCorsHeaders(origin),
                
            });
        }

    }catch (error) {
        console.error('Error in POST function:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: getCorsHeaders(origin),
            
        });
    }
});

////////////////////////////////////////////////////////////
// 관리자용 API
////////////////////////////////////////////////////////////

export const GET = withAuth(async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    if (decoded.role === 'admin') {

        try {
            // Get query parameters
            const { searchParams } = new URL(req.url);
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '10');
            const search = searchParams.get('search') || '';

            // Calculate skip for pagination
            const skip = (page - 1) * limit;

            // Build query - exclude guardian users
            const query = {
                role: { $ne: 'guardian' }
            };
            
            // Add search filter if provided
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ];
            }

            // Execute query with pagination
            const [users, total] = await Promise.all([
                Users.find(query)
                    .select('name phoneNumber role recipientType supportedDistrict smsConsent guardianIds createdAt updatedAt')
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 })
                    .lean(),
                Users.countDocuments(query)
            ]);
            
            // Add guardian information to each user
            const usersWithGuardians = await Promise.all(users.map(async (user) => {
                if (user.guardianIds && user.guardianIds.length > 0) {
                    // Get guardian documents by their IDs
                    const guardianDocs = await Guardians.find({
                        _id: { $in: user.guardianIds }
                    }).lean();
                    
                    // For each guardian, get the user info
                    const guardianUsers = [];
                    for (const guardianDoc of guardianDocs) {
                        const guardianUser = await Users.findOne({
                            firebaseUid: guardianDoc.firebaseUid
                        }).select('name').lean();
                        
                        if (guardianUser) {
                            guardianUsers.push({
                                name: guardianUser.name
                            });
                        }
                    }
                    
                    return { ...user, guardians: guardianUsers };
                }
                return { ...user, guardians: [] };
            }));

            // Return formatted response
            return NextResponse.json({
                success: true,
                users: usersWithGuardians,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total
            }, { headers: getCorsHeaders(origin) });
        } catch (error) {
            console.error('Error in admin users API:', error);
            return NextResponse.json(
                { success: false, message: 'Internal server error' },
                {
                    status: 500,
                    headers: getCorsHeaders(origin)
                }
            );
        }
    }else{
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: getCorsHeaders(origin),
        });
    }
});


export const PATCH = withAuth(async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    if (decoded.role === 'admin') {

        // Verify admin authentication
        const authResponse = await validateAdminToken(req);
        if (authResponse instanceof NextResponse) {
            return authResponse;
        }

        try {
            const { id } = params;
            const data = await req.json();
            
            // Validate input data
            const allowedFields = ['name', 'phoneNumber', 'recipientType', 'role', 'smsConsent', 'supportedDistrict', 'guardians'];
            const updateData = {};
            
            Object.keys(data).forEach(key => {
                if (allowedFields.includes(key)) {
                    updateData[key] = data[key];
                }
            });

            // Handle guardians separately
            let guardiansToProcess = null;
            if (updateData.guardians) {
                guardiansToProcess = updateData.guardians;
                delete updateData.guardians;
            }

            // Get the current user
            const user = await Users.findById(id).lean();
            if (!user) {
                return NextResponse.json(
                    { success: false, message: 'User not found' },
                    {
                        status: 404,
                        headers: getCorsHeaders(origin)
                    }
                );
            }

            // Process guardians if provided
            let newGuardianIds = [];
            if (guardiansToProcess) {
                // Get existing guardian IDs
                const existingGuardians = user.guardianIds || [];
                
                try {
                    // Remove existing guardians
                    if (existingGuardians.length > 0) {
                        await Guardians.deleteMany({ _id: { $in: existingGuardians } });
                    }
                    
                    // Parse guardian entries from newline-separated text
                    const guardianEntries = guardiansToProcess.trim().split('\n').filter(line => line.trim());
                    
                    for (const entry of guardianEntries) {
                        const name = entry.trim();
                        if (name) {
                            // Generate a temporary unique ID
                            const tempFirebaseUid = `guardian_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                            
                            // Create guardian user record
                            const guardianUser = await Users.create({
                                name,
                                role: 'guardian',
                                recipientType: '',
                                phoneNumber: '',
                                smsConsent: false,
                                firebaseUid: tempFirebaseUid,
                                guardianIds: [] // Empty array for guardian users
                            });
                            
                            // Create guardian relationship record
                            const guardian = await Guardians.create({
                                firebaseUid: tempFirebaseUid,
                                userId: user._id // Reference to the main user
                            });
                            
                            // Add guardian ID to the collection
                            newGuardianIds.push(guardian._id);
                        }
                    }
                } catch (guardianError) {
                    console.error('Error processing guardians:', guardianError);
                }
            }

            // Update user with regular fields and guardian IDs if processed
            const updateFields = {
                ...updateData,
                updatedAt: new Date()
            };
            
            if (guardiansToProcess) {
                updateFields.guardianIds = newGuardianIds;
            }
            
            // Perform the user update
            const updatedUser = await Users.findByIdAndUpdate(
                id,
                updateFields,
                { new: true }
            ).select('name phoneNumber role recipientType smsConsent guardianIds createdAt updatedAt');

            // Add guardian information
            if (updatedUser.guardianIds && updatedUser.guardianIds.length > 0) {
                // Get guardian documents by their IDs
                const guardianDocs = await Guardians.find({
                    _id: { $in: updatedUser.guardianIds }
                }).lean();
                
                // For each guardian, get the user info
                const guardianUsers = [];
                for (const guardianDoc of guardianDocs) {
                    const guardianUser = await Users.findOne({
                        firebaseUid: guardianDoc.firebaseUid
                    }).select('name').lean();
                    
                    if (guardianUser) {
                        guardianUsers.push({
                            name: guardianUser.name
                        });
                    }
                }
                
                updatedUser.guardians = guardianUsers;
            } else {
                updatedUser.guardians = [];
            }

            return NextResponse.json({
                success: true,
                user: updatedUser
            }, { headers: getCorsHeaders(origin) });
        } catch (error) {
            console.error('Error in admin update user API:', error);
            return NextResponse.json(
                { success: false, message: 'Internal server error' },
                {
                    status: 500,
                    headers: getCorsHeaders(origin)
                }
            );
        }
    }else{
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: getCorsHeaders(origin),
        });
    }
});
