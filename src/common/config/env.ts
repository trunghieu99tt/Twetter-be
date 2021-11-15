import * as dotenv from 'dotenv';

dotenv.config();

// get env
export const getEnv = (key: string) => {
    const value = process.env[key];
    return value || '';
};

// server
export const ENVIRONMENT = getEnv('ENVIRONMENT');
export const PRODUCTION = ENVIRONMENT === 'production';
export const DEVELOPMENT = ENVIRONMENT === 'development';

export const PORT = getEnv('PORT');

// project
export const PROJECT_NAME = getEnv('PROJECT_NAME');
export const PROJECT_VERSION = getEnv('PROJECT_VERSION');

// Cloudinary
export const CLOUDINARY_URL = getEnv('CLOUDINARY_URL');
export const CLOUDINARY_PATH = getEnv('CLOUDINARY_PATH');
export const CLOUDINARY_PATH_DEV = getEnv('CLOUDINARY_PATH_DEV');

// MongoDB
export const MONGO_URL = getEnv('MONGO_URL');
export const MONGO_DB_NAME = getEnv('MONGO_DB_NAME');
export const MONGO_USERNAME = getEnv('MONGO_USERNAME');
export const MONGO_PASSWORD = getEnv('MONGO_PASSWORD');
export const DATABASE_URL = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster0.xblod.mongodb.net/${MONGO_DB_NAME}?retryWrites=true&w=majority`;

// swagger
export const SWAGGER_PATH = getEnv('SWAGGER_PATH');


// Auth
export const JWT_SECRET = getEnv('JWT_SECRET');
export const JWT_EXP = Number(getEnv('JWT_EXP'));

// Google
export const GOOGLE_SECRET = getEnv('GOOGLE_SECRET');
export const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');

// Github
export const GITHUB_CLIENT_ID = getEnv('GITHUB_CLIENT_ID');
export const GITHUB_REDIRECT_URL = getEnv('GITHUB_REDIRECT_URL');
export const GITHUB_CLIENT_SECRET = getEnv('GITHUB_CLIENT_SECRET');

// Mailer
export const MAILER_EMAIL_ID = getEnv('MAILER_EMAIL_ID');
export const MAILER_PASSWORD = getEnv('MAILER_PASSWORD');