import { Request } from 'express';
import { User } from '../../entities/User';

export interface RequestWithUser extends Request {
    user: User;
}

export interface FileWithPath extends Express.Multer.File {
    path: string;
}

export interface FilesWithPath {
    [fieldname: string]: FileWithPath[];
}

export interface MulterRequest extends RequestWithUser {
    file?: FileWithPath;
    files?: {
        [fieldname: string]: FileWithPath[];
    };
}