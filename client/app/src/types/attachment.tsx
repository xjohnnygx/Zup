export type New_Attachment = {
    sender: number;
    recipient: number;
    url: string;
};

export type Attachment = {
    attachmentID: number;
    instanceType: string;
    sender: number;
    recipient: number;
    type: string;
    url: string;
    dateTime: string;
};