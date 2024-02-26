import { Attachment } from "./attachment";

export type Message = {
    messageID: number;
    instanceType: string;
    sender: number;
    recipient: number;
    text: string;
    reference: string|null;
    dateTime: string;
};