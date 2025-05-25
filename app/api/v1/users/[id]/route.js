import { NextResponse } from 'next/server';
import { Users, Guardians } from '@/lib/db/models';
import { validateAdminToken } from '@/lib/auth/adminAuth';
import connectToMongoose from '@/lib/db/connect';
import mongoose from 'mongoose';
import { getCorsHeaders } from '@/lib/cors';
import { withAuth } from '@/lib/auth/withAuth';

// Connect to MongoDB on module initialization
await connectToMongoose();

////////////////////////////////////////////////////////////
// 관리자용 API
////////////////////////////////////////////////////////////

export const GET = withAuth(async (req, { params }, decoded) => {
    const origin = req.headers.get("origin") || "";
    if (decoded.role === 'admin') {

        // Verify admin authentication
        const authResponse = await validateAdminToken(req);
        if (authResponse instanceof NextResponse) {
            return authResponse;
        }

        try {
            // Find user by ID
            const user = await Users.findById(params.id)
                .select('name phoneNumber role recipientType supportedDistrict smsConsent guardianIds createdAt updatedAt')
                .lean();

            if (!user) {
                return NextResponse.json(
                    { success: false, message: 'User not found' },
                    { 
                        status: 404,
                        headers: getCorsHeaders(origin)
                    }
                );
            }

            // Add guardian information
            if (user.guardianIds && user.guardianIds.length > 0) {
                // Get guardians directly by their IDs
                const guardians = await Guardians.find({
                    _id: { $in: user.guardianIds }
                }).select('name').lean();
                
                // Map guardian names
                user.guardians = guardians.map(guardian => ({
                    name: guardian.name
                }));
            } else {
                user.guardians = [];
            }

            return NextResponse.json(
                { success: true, user },
                { headers: getCorsHeaders(origin) }
            );
        } catch (error) {
            console.error('Error in admin get user API:', error);
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

export const DELETE = withAuth(async (req, { params }, decoded) => {
    if (decoded.role === 'admin') {
        const origin = req.headers.get("origin") || "";

        // Verify admin authentication
        const authResponse = await validateAdminToken(req);
        if (authResponse instanceof NextResponse) {
            return authResponse;
        }

        try {
            // Delete user by ID
            const user = await Users.findByIdAndDelete(params.id);

            if (!user) {
                return NextResponse.json(
                    { success: false, message: 'User not found' },
                    { 
                        status: 404,
                        headers: getCorsHeaders(origin)
                    }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'User deleted successfully'
            }, {
                headers: getCorsHeaders(origin)
            });
        } catch (error) {
            console.error('Error in admin delete user API:', error);
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
    if (decoded.role === 'admin') {
        const origin = req.headers.get("origin") || "";

        // Verify admin authentication
        const authResponse = await validateAdminToken(req);
        if (authResponse instanceof NextResponse) {
            return authResponse;
        }

        try {
            // Await params before accessing properties
            const resolvedParams = await params;
            const id = resolvedParams.id;
            const data = await req.json();
            
            // Validate input data
            const allowedFields = ['name', 'phoneNumber', 'recipientType', 'supportedDistrict', 'role', 'smsConsent', 'guardians'];
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
                            
                            // Create guardian user record with required fields
                            const guardianUser = await Users.create({
                                name,
                                role: 'guardian',
                                recipientType: '', // Updated to use Korean value
                                supportedDistrict: '', // Default value for guardians
                                phoneNumber: '', // Provide a dummy phone number to pass validation
                                smsConsent: false,
                                firebaseUid: tempFirebaseUid,
                                guardianIds: [] // Empty array for guardian users
                            });
                            
                            // Create guardian relationship record
                            const guardian = await Guardians.create({
                                name, // Add name directly to guardian record
                                firebaseUid: tempFirebaseUid,
                                userId: user._id // Reference to the main user
                            });
                            
                            // Add guardian ID to the collection
                            newGuardianIds.push(guardian._id);
                        }
                    }
                } catch (guardianError) {
                    console.error('Error processing guardians:', guardianError);
                    // Don't return here, continue to update other fields if possible
                }
            }

            // Update user with regular fields and guardian IDs if processed
            const updateFields = {
                ...updateData,
                updatedAt: new Date()
            };
            
            if (guardiansToProcess && newGuardianIds.length > 0) {
                updateFields.guardianIds = newGuardianIds;
            }
            
            // Perform the user update
            const updatedUser = await Users.findByIdAndUpdate(
                id,
                updateFields,
                { new: true }
            ).select('name phoneNumber role recipientType supportedDistrict smsConsent guardianIds createdAt updatedAt');

            // Add guardian information to response
            let guardians = [];
            if (updatedUser.guardianIds && updatedUser.guardianIds.length > 0) {
                // Get guardian documents directly by IDs
                const guardianDocs = await Guardians.find({
                    _id: { $in: updatedUser.guardianIds }
                }).select('name').lean();
                
                guardians = guardianDocs.map(doc => ({
                    name: doc.name
                }));
            }

            const responseUser = {
                ...updatedUser.toObject(), 
                guardians
            };

            return NextResponse.json({
                success: true,
                user: responseUser
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

export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(request.headers.get("origin") || ""),
    });
} 