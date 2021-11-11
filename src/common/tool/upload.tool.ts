import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { CLOUDINARY_PATH, CLOUDINARY_PATH_DEV, DEVELOPMENT } from "src/common/config/env";

const cloudinary = require("cloudinary").v2;
const sharp = require("sharp");
const fs = require("fs");
const multer = require('multer');

export class UploadTool {
    static imagePath: string = !DEVELOPMENT ? CLOUDINARY_PATH : CLOUDINARY_PATH_DEV;

    static multerFilter = (req, file, cb) => {
        console.log(`file.mimetype`, file.mimetype);
        // if (!file.mimetype.startsWith("image")) {
        //     return cb(
        //         new Error("Not an image! Please upload only images"),
        //         false
        //     );
        // }
        cb(null, true);
    };

    static imageUpload: MulterOptions = {
        storage: multer.memoryStorage(),
        fileFilter: UploadTool.multerFilter,
    };

    static uploadMediaToServer = async (file: any) => {
        try {
            const response = await cloudinary.uploader.upload(file, {
                folder: 'Tweeter'
            });
            return response && response.secure_url;
        } catch (error) {
            throw error;
        }
    };

    static resizeImage = async (file, width, height, format, quality) => {

        try {
            await sharp(file.buffer)
                // .resize(width, height)
                .toFormat(format)
                .jpeg({ quality })
                .toFile(`${UploadTool.imagePath}/uploader.jpeg`);
        } catch (error) {
            throw error;
        }
    };

    static resizeAndUploadSingle = async (
        file,
        width = 2000,
        height = 1333,
        format = "jpeg",
        quality = 100
    ) => {
        try {
            // First, resize image using sharp
            await UploadTool.resizeImage(file, width, height, format, quality);

            // When we have the file, save it to local storage
            const uploadResponse = await UploadTool.uploadMediaToServer(
                `${UploadTool.imagePath}/uploader.${format}`
            );
            // remove file in local machine
            fs.unlink(`${UploadTool.imagePath}/uploader.${format}`, (err) => {
                console.log("err", err);
            });

            return uploadResponse;
        } catch (error) {
            throw error;
        }
    };

    static resizeAndUploadMulti = async (
        files,
        width = 2000,
        height = 1333,
        format = "jpeg",
        quality = 90
    ) => {
        const imagesLink = [];

        await Promise.all(
            files.map(async (file) => {
                await UploadTool.resizeImage(file, width, height, format, quality);

                const uploadResponse = await UploadTool.uploadMediaToServer(
                    `${UploadTool.imagePath}/uploader.${format}`
                );

                fs.unlink(`${UploadTool.imagePath}/uploader.${format}`, (err) => {
                    console.log("err", err);
                });

                imagesLink.push(uploadResponse);
            })
        );

        return imagesLink;
    };

    static uploadVideo = async (file: any) => {
        // write video to disk and upload to cloudinary
        const filePath = `${UploadTool.imagePath}/uploader.mp4`;
        const writeStream = fs.createWriteStream(filePath);
        file.pipe(writeStream);
        return new Promise((resolve, reject) => {
            writeStream.on("finish", async () => {
                try {
                    const uploadResponse = await UploadTool.uploadMediaToServer(
                        filePath
                    );
                    fs.unlink(filePath, (err) => {
                        console.log("err", err);
                    });
                    resolve(uploadResponse);
                } catch (error) {
                    reject(error);
                }
            });
        });
    };

}