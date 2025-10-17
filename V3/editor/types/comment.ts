export interface CommentAuthor {
    email: string;
    name: string;
    avatar?: string;
}

export interface Comment {
    id?: string;
    content: string;
    highlightedText: string;
    blockId?: string;
    position?: {
        start: number;
        end: number;
    };
    createdBy: CommentAuthor;
    createdAt: any; // Firestore timestamp
    resolved: boolean;
    roomId: string;
}

export interface CommentFormData {
    content: string;
    highlightedText: string;
    blockId?: string;
    position?: {
        start: number;
        end: number;
    };
}
