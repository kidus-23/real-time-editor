'use client';

import { FormEvent, useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input"
import { Button } from "./ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useDocumentData } from "react-firebase-hooks/firestore";
import useOwner from "@/lib/useOwner";
import Editor from "./Editor";
import DeleteDocument from "./DeleteDocument";
import InviteUser from "./InviteUser";

function Document({ id }: { id: string }) {

    const [data, loading, error] = useDocumentData(doc(db, "documents", id));
    const [input, setInput] = useState("");
    const [isUpdating, startTransition] = useTransition();
    const isOwner = useOwner();

    useEffect(() => {
        if (data) {
            setInput(data.title);
        }
    }, [data]);

    // Debug logging
    console.log("=== Document Component START ===");
    console.log("Document component - ID:", id);
    console.log("Document component - Data:", data);
    console.log("Document component - Loading:", loading);
    console.log("Document component - Error:", error);

    if (loading) {
        console.log("Document component - Rendering: Loading...");
        return <div>Loading document...</div>;
    }

    if (error) {
        console.log("Document component - Rendering: Error");
        return <div>Error loading document: {error.message}</div>;
    }

    if (!data) {
        console.log("Document component - Rendering: Not found");
        return <div>Document not found</div>;
    }

    console.log("Document component - Rendering: Full document with editor");

    const updateTitle = (e: FormEvent) => {
        e.preventDefault();

        if (input.trim()) {
            startTransition(async () => {
                await updateDoc(doc(db, "documents", id), {
                    title: input,

                });
            })
        }
    }


    return (
        <div>
            <div className="flex max-w-6xl mx-auto justify-between pb-5">
                <form className="flex flex-1 space-x-2" onSubmit={updateTitle}>
                    {/*update title*/}
                    <Input value={input} onChange={(e) => setInput(e.target.value)} />

                    <Button disabled={isUpdating} type="submit">
                        {isUpdating ? "Updating..." : "Update"}
                    </Button>

                    {/* IF */}
                    {isOwner && (
                        <>
                            {/*InviteUser*/}
                            <InviteUser />
                            {/*DeleteDoc*/}
                            <DeleteDocument />
                        </>
                    )}
                    {/* isOwner && InviteUser, Delete Doc*/}

                </form>
            </div>

            <div>
                {/*ManageUsers*/}


                {/*Avatar*/}

            </div>

            {/*Collaborative Editor*/}
            <Editor />
        </div>
    )
}
export default Document