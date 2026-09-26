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
import { usePersistHydrated } from "@/lib/use-persist-hydrated";

export function LevelUpDialog() {
  const totalXp = useProgressStore((state) => state.totalXp);
  const lastCelebratedLevel = useProgressStore(
    (state) => state.lastCelebratedLevel
  );
  const markLevelCelebrated = useProgressStore(
    (state) => state.markLevelCelebrated
  );
  const level = useProgressStore((state) => state.getLevel());
  const hydrated = usePersistHydrated(useProgressStore.persist);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (level > lastCelebratedLevel) setOpen(true);
  }, [hydrated, level, lastCelebratedLevel, totalXp]);

  const continueLearning = () => {
    markLevelCelebrated(level);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) continueLearning();
        else setOpen(true);
      }}
    >
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
