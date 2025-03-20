"use client";

import { useState } from "react";
import { useGeneratedApps } from "@/lib/contexts/GeneratedAppsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface RenameAppSheetProps {
  appId: string;
  appName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRenameComplete?: () => void;
}

export function RenameAppSheet({
  appId,
  appName,
  isOpen,
  onOpenChange,
  onRenameComplete,
}: RenameAppSheetProps) {
  const { updateApp } = useGeneratedApps();
  const [newName, setNewName] = useState(appName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      setError("App name cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      await updateApp(appId, { name: newName.trim() });
      
      onOpenChange(false);
      if (onRenameComplete) {
        onRenameComplete();
      }
    } catch (err) {
      console.error("Error renaming app:", err);
      setError("Failed to rename app. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Rename App</SheetTitle>
          <SheetDescription>
            Enter a new name for your app
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="App name"
              className="w-full"
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}