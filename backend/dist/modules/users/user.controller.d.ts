import { Request, Response } from "express";
type MulterRequest = Request & {
    file?: Express.Multer.File;
};
export declare function listUsers(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getCurrentUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCurrentUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function uploadUserAvatar(req: MulterRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getRoles(req: Request, res: Response): Promise<void>;
export declare function getPermissions(req: Request, res: Response): Promise<void>;
export declare function getUserPermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateUserPermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getRole(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createRole(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateRole(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteRole(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=user.controller.d.ts.map