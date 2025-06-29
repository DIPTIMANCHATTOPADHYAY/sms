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
        
        const settingsToSeed = [
            { key: 'apiKey', value: 'oKREnlZLQeSs_ntZ2TAV6A', name: 'Default API Key' },
            { 
              key: 'proxySettings', 
              value: { ip: '', port: '', username: '', password: '' }, 
              name: 'Default Proxy Settings' 
            },
            { key: 'siteName', value: 'SMS Inspector 2.0', name: 'Default Site Name' },
            { key: 'primaryColor', value: '217.2 91.2% 59.8%', name: 'Default Primary Color' },
            { key: 'emailChangeEnabled', value: true, name: 'Default Email Change Policy' },
            { key: 'signupEnabled', value: true, name: 'Default Signup Policy' },
            { key: 'numberList', value: [], name: 'Default Number List' },
            { key: 'errorMappings', value: [], name: 'Custom Error Mappings' },
        ];

        for (const setting of settingsToSeed) {
            const settingExists = await Setting.findOne({ key: setting.key });
            if (!settingExists) {
                await Setting.create({ key: setting.key, value: setting.value });
                console.log(`${setting.name} has been set.`);
            }
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
