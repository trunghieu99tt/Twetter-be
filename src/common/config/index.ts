import {
  AGORA_APP_CERTIFICATE,
  AGORA_APP_ID,
  CLOUDINARY_FOLDER,
  CLOUDINARY_PATH,
  CLOUDINARY_PATH_DEV,
  CLOUDINARY_URL,
  DATABASE_URL,
  DEVELOPMENT,
  ENVIRONMENT,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_REDIRECT_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_SECRET,
  JWT_EXP,
  JWT_SECRET,
  MAILER_EMAIL_ID,
  MAILER_PASSWORD,
  MONGO_DB_NAME,
  MONGO_PASSWORD,
  MONGO_USERNAME,
  PORT,
  PRODUCTION,
  SWAGGER_PATH,
} from './env';

export default () => ({
  environment: ENVIRONMENT,
  production: PRODUCTION,
  development: DEVELOPMENT,

  port: PORT,

  cloudinary: {
    url: CLOUDINARY_URL,
    path: CLOUDINARY_PATH,
    path_dev: CLOUDINARY_PATH_DEV,
    folder: CLOUDINARY_FOLDER,
  },

  mongo: {
    dbName: MONGO_DB_NAME,
    username: MONGO_USERNAME,
    password: MONGO_PASSWORD,
    url: DATABASE_URL,
  },

  swagger: {
    path: SWAGGER_PATH,
  },

  jwt: {
    secret: JWT_SECRET,
    exp: JWT_EXP,
  },

  google: {
    secret: GOOGLE_SECRET,
    clientId: GOOGLE_CLIENT_ID,
  },

  github: {
    clientId: GITHUB_CLIENT_ID,
    redirectUrl: GITHUB_REDIRECT_URL,
    clientSecret: GITHUB_CLIENT_SECRET,
  },

  mailer: {
    emailId: MAILER_EMAIL_ID,
    password: MAILER_PASSWORD,
  },

  agora: {
    appId: AGORA_APP_ID,
    appCertificate: AGORA_APP_CERTIFICATE,
  },

  imagePath: DEVELOPMENT ? CLOUDINARY_PATH_DEV : CLOUDINARY_PATH,
});
