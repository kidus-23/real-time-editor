'use client'

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useTransition } from "react";
import { createNewDocument } from "@/actions/actions";
import { useTranslation } from "@/hooks/useTranslation";

function NewDocumentButton() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { t } = useTranslation();

    const handleCreateNewDocument = () => {
        startTransition(async () => {
            const { docId } = await createNewDocument();
            router.push(`/doc/${docId}`)
        });
    }
    return <Button onClick={handleCreateNewDocument} disabled={isPending} className="hover-scale" size="default">
        {isPending ? t("newDocumentButton.creating") : t("newDocumentButton.button")}
    </Button>;
}

export default NewDocumentButton;