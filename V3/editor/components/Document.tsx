'use client';

import { FormEvent, useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/Input"
import { Button } from "./ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useDocumentData } from "react-firebase-hooks/firestore";
import useOwner from "@/lib/useOwner";
import Editor from "./Editor";
import { Delete } from "lucide-react";
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