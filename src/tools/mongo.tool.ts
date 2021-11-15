import * as mongoose from "mongoose";
import { red } from 'chalk';
import { DATABASE_URL } from "src/common/config/env";

export class MongoTool {
    static initialize() {
        mongoose.connect(DATABASE_URL, {
            useFindAndModify: false,
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        mongoose.connection.on('error', (err) => {
            console.log(err);
            console.log(`${red('x')} MongoDB connection error. Please make sure MongoDB is running.`);
            process.exit();
        });
    }
}