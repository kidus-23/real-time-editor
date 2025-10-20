'use client';

import { useInboxNotifications } from "@liveblocks/react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { acceptRoomInvite, declineRoomInvite } from "@/actions/actions";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface RoomInviteActivityData {
    roomId: string;
    documentTitle: string;
    inviterEmail: string;
    inviterName: string;
    invitedAt: string;
}

export function NotificationInbox() {
    const { t } = useTranslation();
    const { inboxNotifications, error, isLoading } = useInboxNotifications();
    const { user } = useUser();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Handle loading and error states
    if (error || !inboxNotifications) {
        return null; // Don't show notification bell if there's an error or no data
    }

    const unreadCount = inboxNotifications.filter((n) => !n.readAt).length;

    const handleAccept = async (notificationId: string, roomId: string) => {
        if (!user?.primaryEmailAddress?.emailAddress) return;

        setProcessingId(notificationId);
        startTransition(async () => {
            try {
                const result = await acceptRoomInvite(
                    roomId,
                    user.primaryEmailAddress!.emailAddress,
                    notificationId
                );

                if (result.success) {
                    toast.success(t("notifications.roomInvite.accepted"));
                    // Navigate to the document
                    router.push(`/doc/${roomId}`);
                } else {
                    toast.error(result.error || t("notifications.roomInvite.error"));
                }
            } catch (error) {
                toast.error(t("notifications.roomInvite.error"));
            } finally {
                setProcessingId(null);
            }
        });
    };

    const handleDecline = async (notificationId: string) => {
        if (!user?.primaryEmailAddress?.emailAddress) return;

        setProcessingId(notificationId);
        startTransition(async () => {
            try {
                const result = await declineRoomInvite(
                    user.primaryEmailAddress!.emailAddress,
                    notificationId
                );

                if (result.success) {
                    toast.success(t("notifications.roomInvite.declined"));
                } else {
                    toast.error(result.error || t("notifications.roomInvite.error"));
                }
            } catch (error) {
                toast.error(t("notifications.roomInvite.error"));
            } finally {
                setProcessingId(null);
            }
        });
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{t("notifications.title")}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                    {inboxNotifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            {t("notifications.noNotifications")}
                        </p>
                    ) : (
                        inboxNotifications.map((notification) => {
                            // Check if this is a room invite notification
                            if (notification.kind === "$roomInvite") {
                                const data = notification.activities[0]
                                    ?.data as unknown as RoomInviteActivityData;

                                if (!data) return null;

                                const isProcessing = processingId === notification.id;
                                const isRead = !!notification.readAt;

                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 rounded-lg border ${isRead ? "bg-muted/50" : "bg-background"
                                            }`}
                                    >
                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="font-semibold text-sm">
                                                    {t("notifications.roomInvite.title")}
                                                </h4>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {t("notifications.roomInvite.message", {
                                                        inviterName: data.inviterName,
                                                        documentTitle: data.documentTitle,
                                                    })}
                                                </p>
                                            </div>

                                            {!isRead && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleAccept(notification.id, data.roomId)
                                                        }
                                                        disabled={isProcessing || isPending}
                                                    >
                                                        {t("notifications.roomInvite.accept")}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDecline(notification.id)}
                                                        disabled={isProcessing || isPending}
                                                    >
                                                        {t("notifications.roomInvite.decline")}
                                                    </Button>
                                                </div>
                                            )}

                                            <p className="text-xs text-muted-foreground">
                                                {new Date(data.invitedAt).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }

                            return null;
                        })
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
