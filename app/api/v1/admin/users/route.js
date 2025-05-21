import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Guardians } from '@/lib/db/models';
import { validateAdminToken } from '@/lib/auth/adminAuth';
import { getCorsHeaders } from '@/lib/cors';

// Connect to MongoDB on module initialization
await connectToMongoose();

export async function GET(request) {
    const origin = request.headers.get("origin") || "";

    // Verify admin authentication
    const authResponse = await validateAdminToken(request);
    if (authResponse instanceof NextResponse) {
        return authResponse;
    }

    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
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
                .select('name phoneNumber role recipientType smsConsent guardianIds createdAt updatedAt')
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
}

export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(request.headers.get("origin") || ""),
    });
}

export async function PATCH(request, { params }) {
    const origin = request.headers.get("origin") || "";

    // Verify admin authentication
    const authResponse = await validateAdminToken(request);
    if (authResponse instanceof NextResponse) {
        return authResponse;
    }

    try {
        const { id } = params;
        const data = await request.json();
        
        // Validate input data
        const allowedFields = ['name', 'phoneNumber', 'recipientType', 'role', 'smsConsent', 'guardians'];
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
} 