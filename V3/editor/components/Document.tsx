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
import ManageUsers from "./ManageUsers";

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

    if (loading) {
        return <div>Loading document...</div>;
    }

    if (error) {
        return <div>Error loading document: {error.message}</div>;
    }

    if (!data) {
        return <div>Document not found</div>;
    }

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

                    {/* Always show buttons for testing */}
                    <InviteUser />
                    <DeleteDocument />

                    {/* Show owner status */}
                    <div className="flex items-center text-sm text-gray-600">
                        {isOwner ? "👑 Owner" : "👤 Editor"}
                    </div>

                </form>
            </div>

            <div className="flex max-w-6xl mx-auto justify-between items-center mb-5">
                <ManageUsers />
                {/*ManageUsers*/}


                {/*Avatar*/}

            </div>

            {/*Collaborative Editor*/}
            <Editor />
        </div>
    )
}
export default Document