"use client";

import { useOthers,useSelf } from "@liveblocks/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";


function Avatars() {
    const others = useOthers();
    const self = useSelf();

    const all = [self, ...others];
  return (
    <div className="flex gap-2 items-center">
        <p className="font-light text-sm">User currently editing this page</p>
        
        <div className="flex -space-x-5 ">
            {all.map((other,i) => (
                <TooltipProvider key={`${other?.id ?? "unknown"}-${i}`}>
                    <Tooltip>
                        <TooltipTrigger>
                            <Avatar className="border-2 hover:z-50">
                            <AvatarImage src={other?.info.avatar} />
                            <AvatarFallback>{other?.info.name}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{self?.id === other?.id ? "You" : other?.id}</p>
                        </TooltipContent>
                </Tooltip>
                </TooltipProvider>
                
            ))}
        </div>

    </div>
  )
}

export default Avatars