import Document from "@/components/Document";

function DocumentPage({
    params,
}: {
    params: { id: string };
}) {
    const { id } = params;
    return (
        <div
            className="flex flex-col flex-1 min-h-screen"
            style={{
                margin: "0 auto",
                maxWidth: "900px",
                width: "100%",
            }}
        >
            <Document id={id} />
        </div>
    );
}

export default DocumentPage