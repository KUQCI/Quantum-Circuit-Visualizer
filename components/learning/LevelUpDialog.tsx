"use client";

import { useEffect, useState } from "react";
import { QuantaImage } from "@/components/mascot/QuantaImage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getLevelTitle,
  levelQuantaVariant,
} from "@/lib/learning/progress";
import { useProgressStore } from "@/store/progress-store";

export function LevelUpDialog() {
  const totalXp = useProgressStore((state) => state.totalXp);
  const lastCelebratedLevel = useProgressStore(
    (state) => state.lastCelebratedLevel
  );
  const markLevelCelebrated = useProgressStore(
    (state) => state.markLevelCelebrated
  );
  const level = useProgressStore((state) => state.getLevel());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (level > lastCelebratedLevel) setOpen(true);
  }, [level, lastCelebratedLevel, totalXp]);

  const continueLearning = () => {
    markLevelCelebrated(level);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Level up!</DialogTitle>
          <DialogDescription>
            You reached level {level}: {getLevelTitle(level)}.
          </DialogDescription>
        </DialogHeader>
        <QuantaImage
          variant={levelQuantaVariant(level)}
          size="lg"
          className="mx-auto"
        />
        <Button onClick={continueLearning}>Continue</Button>
      </DialogContent>
    </Dialog>
  );
}
