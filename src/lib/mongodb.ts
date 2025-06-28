import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Setting } from './models';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env'
    );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function seedDatabase() {
    try {
        // Seed Admin User
        const adminEmail = 'admin@example.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            await User.create({
                name: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                isAdmin: true,
                status: 'active',
            });
            console.log('Default admin user created.');
        }

        // Seed Default API Key
        const apiKeySetting = await Setting.findOne({ key: 'apiKey' });
        if (!apiKeySetting) {
            await Setting.create({ key: 'apiKey', value: 'oKREnlZLQeSs_ntZ2TAV6A' });
            console.log('Default API key has been set.');
        }
        
        // Seed Default IP Restriction
        const ipSetting = await Setting.findOne({ key: 'ipRestrictions' });
        if (!ipSetting) {
            await Setting.create({ key: 'ipRestrictions', value: ['40.81.241.64'] });
            console.log('Default IP restriction has been set.');
        }
    } catch (error) {
        console.error('Error during database seeding:', error);
    }
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then(async (mongoose) => {
            await seedDatabase();
            return mongoose;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectDB;
