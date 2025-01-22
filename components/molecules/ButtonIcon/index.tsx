import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import * as nostr from "@/lib/nostr";
import { cn, getKeyPairFromLocalStorage } from "@/lib/utils";

export default function ButtonIcon({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const onClickHandler = async () => {
    const existingKeyPair = getKeyPairFromLocalStorage();
    console.log(existingKeyPair);
    await nostr.CreateEvent(existingKeyPair?.nsec!);
  };
  return (
    <div className={cn("", className)}>
      <Button variant="outline" size="icon" onClick={onClickHandler}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
