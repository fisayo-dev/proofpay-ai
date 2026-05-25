"use client"

import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      offset={24}
      gap={14}
      closeButton
      icons={{
        success: (
          <span className="flex mr-4 size-8 items-center justify-center rounded-full bg-success/12 text-success">
            <CircleCheckIcon className="size-4" />
          </span>
        ),
        info: (
          <span className="flex mr-4 size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <InfoIcon className="size-4" />
          </span>
        ),
        warning: (
          <span className="flex mr-4 size-8 items-center justify-center rounded-full bg-warning/14 text-warning">
            <TriangleAlertIcon className="size-4" />
          </span>
        ),
        error: (
          <span className="flex mr-4 size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <OctagonXIcon className="size-4" />
          </span>
        ),
        loading: (
          <span className="flex mr-4 size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
          </span>
        ),
      }}
      style={
        {
          "--normal-bg": "color-mix(in oklab, var(--card) 94%, white 6%)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "color-mix(in oklab, var(--border) 82%, var(--primary) 18%)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--card)",
          "--success-text": "var(--card-foreground)",
          "--success-border": "color-mix(in oklab, var(--success) 28%, var(--border) 72%)",
          "--info-bg": "var(--card)",
          "--info-text": "var(--card-foreground)",
          "--info-border": "color-mix(in oklab, var(--primary) 28%, var(--border) 72%)",
          "--warning-bg": "var(--card)",
          "--warning-text": "var(--card-foreground)",
          "--warning-border": "color-mix(in oklab, var(--warning) 30%, var(--border) 70%)",
          "--error-bg": "var(--card)",
          "--error-text": "var(--card-foreground)",
          "--error-border": "color-mix(in oklab, var(--destructive) 30%, var(--border) 70%)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: cn(
            "group pointer-events-auto rounded-[calc(var(--radius)*1.4)] border bg-card/95 px-4 py-4 text-card-foreground shadow-[0_24px_80px_-48px_rgba(14,30,86,0.32)] backdrop-blur-xl",
            "data-[type=success]:border-success/30 data-[type=info]:border-primary/25 data-[type=warning]:border-warning/35 data-[type=error]:border-destructive/30"
          ),
          content: "gap-3",
          title: "font-heading text-sm font-semibold tracking-tight text-foreground",
          description: "text-sm leading-6 text-muted-foreground",
          icon: "mt-0.5",
          actionButton:
            "rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          cancelButton:
            "rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted",
          closeButton:
            "border-border/70 bg-background/85 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
