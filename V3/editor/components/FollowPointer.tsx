import stringToColor from "@/lib/stringToColor";
import { motion } from "framer-motion";

function FollowPointer({
    x, y, info,
}: {
    x: number;
    y: number;
    info: {
        name: string;
        email: string;
        avatar: string;
        color?: string; // Optional color from user profile
    };
}) {
    // Use profile color if available, fallback to generated color
    const color = info.color || stringToColor(info.email || '1');

    return (
        <motion.div
            className="absolute z-50 pointer-events-none"
            style={{
                top: y,
                left: x,
            }}
            initial={{
                scale: 1,
                opacity: 1,
            }}
            animate={{
                scale: 1,
                opacity: 1,
            }}
            exit={{
                scale: 0,
                opacity: 0,
            }}
        >
            {/* Cursor pointer */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                    transform: "translate(-2px, -2px)",
                }}
            >
                <path
                    d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                />
            </svg>

            {/* User name label */}
            <motion.div
                className="px-2 py-1 text-white text-sm rounded-md"
                style={{
                    backgroundColor: color,
                    marginLeft: "10px",
                    marginTop: "-8px",
                }}
                initial={{
                    scale: 0.5,
                    opacity: 0,
                }}
                animate={{
                    scale: 1,
                    opacity: 1,
                }}
                exit={{
                    scale: 0.5,
                    opacity: 0,
                }}
            >
                {info?.name || info.email}
            </motion.div>
        </motion.div>
    )
}
export default FollowPointer;
