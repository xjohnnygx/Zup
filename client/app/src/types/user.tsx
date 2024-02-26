export type User_Log = {
    email: string;
    password: string;
};

export type New_User = {
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
};

export type User = {
    userID: number;
    instanceType: string;
    username: string;
    email: string;
    password: string;
    code: string;
    photo_url: string|null;
};