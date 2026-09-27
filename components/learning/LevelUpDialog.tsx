"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
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
import { getQuantaAssetUrl } from "@/lib/quanta-assets";
import { showAppToast } from "@/lib/app-toast";
import { renderLevelCard } from "@/lib/learning/share-card";
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
  const title = getLevelTitle(level);
  const variant = levelQuantaVariant(level);

  useEffect(() => {
    if (!hydrated) return;
    if (level > lastCelebratedLevel) setOpen(true);
  }, [hydrated, level, lastCelebratedLevel, totalXp]);

  const continueLearning = () => {
    markLevelCelebrated(level);
    setOpen(false);
  };

  const shareAchievement = async () => {
    const image = new Image();
    image.src = getQuantaAssetUrl(variant);
    image.decoding = "async";

    try {
      await image.decode();
    } catch {
      // The card remains useful without Quanta if the asset is unavailable.
    }

    const canvas = document.createElement("canvas");
    renderLevelCard(
      {
        level,
        title,
        totalXp,
        quantaImage: image.naturalWidth > 0 ? image : null,
      },
      canvas
    );

    const blob = await canvasToBlob(canvas);
    if (!blob) {
      showAppToast("Couldn't create the achievement image");
      return;
    }

    const file = new File([blob], `quanta-level-${level}.png`, {
      type: "image/png",
    });
    if (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({ files: [file] });
        showAppToast("Achievement shared");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    const link = document.createElement("a");
    link.download = file.name;
    link.href = URL.createObjectURL(blob);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
    showAppToast("Achievement image downloaded");
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
            You reached level {level}: {title}.
          </DialogDescription>
        </DialogHeader>
        <QuantaImage
          variant={variant}
          size="lg"
          className="mx-auto"
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={shareAchievement}>
            <Share2 className="h-4 w-4" />
            Share achievement
          </Button>
          <Button onClick={continueLearning}>Continue learning</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}
