import { AnimatePresence } from "motion/react";
import { UpdateBanner } from "@/components/update/UpdateBanner";
import { UpdateDialog } from "@/components/update/UpdateDialog";
import { useUpdateWatcher } from "@/components/update/useUpdateWatcher";
import { shouldNotify } from "@/lib/update-policy";
import { useUpdateStore } from "@/store/update-store";

/**
 * Owns the update surface: schedules the silent check, shows the banner and
 * hosts the dialog. Mounted once, under the app header.
 */
export function UpdateCenter() {
  useUpdateWatcher();

  const available = useUpdateStore((state) => state.available);
  const snoozedUntil = useUpdateStore((state) => state.snoozedUntil);
  const skippedVersion = useUpdateStore((state) => state.skippedVersion);
  const dialogOpen = useUpdateStore((state) => state.dialogOpen);
  const openDialog = useUpdateStore((state) => state.openDialog);
  const closeDialog = useUpdateStore((state) => state.closeDialog);

  const visible =
    available !== null &&
    shouldNotify(available.version, { skippedVersion, snoozedUntil });

  return (
    <>
      <AnimatePresence initial={false}>
        {visible && !dialogOpen && (
          <UpdateBanner key="update-banner" onOpen={openDialog} />
        )}
      </AnimatePresence>

      <UpdateDialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? openDialog() : closeDialog())}
      />
    </>
  );
}
