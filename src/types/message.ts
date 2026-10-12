export interface Message {
    id: number,
    channelId: number,
    authorId: number,
    content: string,
    createdAt: string,
    mentionedUsers: number[],
}