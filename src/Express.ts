import express from 'express';
import bodyParser from "body-parser";
import fileUpload from 'express-fileupload';

export function buildBaseExpress() {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
        useTempFiles : true,
        tempFileDir : '/tmp/',
    }));
    return app;
}
