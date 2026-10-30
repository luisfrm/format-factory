import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary",
  onConfirm,
}: Readonly<ConfirmDialogProps>) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-bg/70 backdrop-blur-[2px]",
            "data-[state=open]:animate-[ff-overlay-in_180ms_ease-out]",
            "data-[state=closed]:animate-[ff-overlay-out_140ms_ease-in]",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2",
            "rounded-panel border border-border-strong bg-surface p-5",
            "shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]",
            "data-[state=open]:animate-[ff-dialog-in_200ms_cubic-bezier(0.2,0,0,1)]",
            "data-[state=closed]:animate-[ff-dialog-out_150ms_cubic-bezier(0.4,0,1,1)]",
          )}
        >
          <DialogPrimitive.Title className="text-[14px] font-semibold tracking-tight text-text">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-[12px] leading-relaxed text-muted">
            {description}
          </DialogPrimitive.Description>

          <div className="mt-5 flex justify-end gap-2">
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="sm">
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
            <Button
              size="sm"
              className={cn(
                tone === "danger" && "bg-danger hover:bg-danger/90",
              )}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
