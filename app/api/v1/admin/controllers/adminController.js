const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Admin, User } = require('../../../../models'); // Adjust the path according to your model location

// Admin Authentication
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { 
                id: admin._id,
                email: admin.email,
                isAdmin: true
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Admin Profile Management
const getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select('-password');
        res.json({
            success: true,
            admin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.user.id);

        if (email) admin.email = email;
        if (name) admin.name = name;

        if (currentPassword && newPassword) {
            const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
            admin.password = await bcrypt.hash(newPassword, 10);
        }

        await admin.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            admin: {
                id: admin._id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// User Management
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};

        const users = await User.find(query)
            .select('-password')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.countDocuments(query);

        res.json({
            success: true,
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, email, status } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (email) user.email = email;
        if (name) user.name = name;
        if (status !== undefined) user.status = status;

        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                status: user.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Dashboard Statistics
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        const inactiveUsers = await User.countDocuments({ status: 'inactive' });

        // Add more statistics as needed
        const stats = {
            totalUsers,
            activeUsers,
            inactiveUsers,
            // Add more metrics here
        };

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    login,
    getProfile,
    updateProfile,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getDashboardStats
}; 