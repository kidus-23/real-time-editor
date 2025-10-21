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
    const { inboxNotifications, error } = useInboxNotifications();
    const { user } = useUser();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

    // Handle loading and error states
    if (error || !inboxNotifications) {
        return null; // Don't show notification bell if there's an error or no data
    }

    const unreadCount = inboxNotifications.filter((n) => !n.readAt && !processedIds.has(n.id)).length;

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
                    setProcessedIds(prev => new Set(prev).add(notificationId));
                    // Navigate to the document
                    router.push(`/doc/${roomId}`);
                } else {
                    toast.error(result.error || t("notifications.roomInvite.error"));
                }
            } catch {
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
                    setProcessedIds(prev => new Set(prev).add(notificationId));
                } else {
                    toast.error(result.error || t("notifications.roomInvite.error"));
                }
            } catch {
                toast.error(t("notifications.roomInvite.error"));
            } finally {
                setProcessingId(null);
            }
        });
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover-scale rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full animate-pulse"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-white dark:bg-[#0f0f0f] border-l border-gray-200 dark:border-gray-800 w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="text-2xl font-bold tracking-tight">{t("notifications.title")}</SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-4">
                    {inboxNotifications.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-8 text-center">
                            <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
                                {t("notifications.noNotifications")}
                            </p>
                        </div>
                    ) : (
                        inboxNotifications.map((notification) => {
                            if (processedIds.has(notification.id)) return null;
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
                                        className={`bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg p-5 transition-all duration-300 ${isRead ? "opacity-60" : ""}`}
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-bold text-base text-gray-900 dark:text-white">
                                                    {t("notifications.roomInvite.title")}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                                                    {t("notifications.roomInvite.message", {
                                                        inviterName: data.inviterName,
                                                        documentTitle: data.documentTitle,
                                                    })}
                                                </p>
                                            </div>

                                            {!isRead && (
                                                <div className="flex gap-3">
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleAccept(notification.id, data.roomId)
                                                        }
                                                        disabled={isProcessing || isPending}
                                                        className="hover-scale flex-1"
                                                    >
                                                        {t("notifications.roomInvite.accept")}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDecline(notification.id)}
                                                        disabled={isProcessing || isPending}
                                                        className="hover-scale flex-1"
                                                    >
                                                        {t("notifications.roomInvite.decline")}
                                                    </Button>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
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
