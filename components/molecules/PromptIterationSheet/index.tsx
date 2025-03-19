"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GeneratedApp } from "@/lib/generatedAppsDB";

interface PromptIterationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  originalPrompt: string;
  onSubmit: (followUpPrompt: string) => Promise<void>;
  isLoading?: boolean;
}

export default function PromptIterationSheet({
  isOpen,
  onClose,
  originalPrompt,
  onSubmit,
  isLoading = false,
}: PromptIterationSheetProps) {
  const [followUpPrompt, setFollowUpPrompt] = useState("");

  const handleSubmit = async () => {
    if (!followUpPrompt.trim()) return;
    
    await onSubmit(followUpPrompt);
    setFollowUpPrompt(""); // Clear the input after submission
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Iterate on Generated App</SheetTitle>
          <SheetDescription>
            Provide a follow-up prompt to improve or modify the generated app
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Original Prompt</h3>
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
              {originalPrompt}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Follow-up Prompt</h3>
            <textarea
              className="w-full min-h-[120px] p-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#368564]"
              value={followUpPrompt}
              onChange={(e) => setFollowUpPrompt(e.target.value)}
              placeholder="Enter your follow-up prompt here..."
            />
          </div>
        </div>
        
        <SheetFooter>
          <Button
            className="w-full bg-[#368564] hover:bg-[#2c6b51] text-white"
            onClick={handleSubmit}
            disabled={isLoading || !followUpPrompt.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate New Version"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}