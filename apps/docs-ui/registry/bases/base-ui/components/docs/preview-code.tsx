"use client"

import { useEffect, useState } from "react"
import { Maximize, Monitor, Smartphone, Tablet } from "lucide-react"

import { CodeBlock } from "@/registry/bases/base-ui/components/code-block"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/bases/base-ui/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/registry/bases/base-ui/ui/toggle-group"
import { cn } from "@/registry/bases/base-ui/lib/utils"

export interface PreviewCodeProps {
  /**
   * Catalog kind (URL segment) + slug - identify the standalone preview route
   * `/preview/<kind>/<slug>` that the iframe loads and that fullscreen opens.
   * Plain strings on purpose: this is a package primitive, so it takes no
   * app-side type.
   */
  kind: string
  slug: string
  /** Registry example name - the Code tab fetches `/r/<exampleName>.json`. */
  exampleName: string
}

type Device = "mobile" | "tablet" | "desktop"

const DEVICES = [
  { value: "mobile" as const, label: "Mobile", width: "max-w-[375px]", Icon: Smartphone },
  { value: "tablet" as const, label: "Tablet", width: "max-w-[768px]", Icon: Tablet },
  { value: "desktop" as const, label: "Desktop", width: "max-w-none", Icon: Monitor },
]

/**
 * The per-block preview surface. Preview/Code is a `Tabs` (tabbed content needs
 * tab semantics). The Preview tab loads the standalone route in an `<iframe>`
 * sized to the active device width, so the component inside sees a REAL viewport
 * and its media queries / `vw` units respond authentically (a width-constrained
 * div would not). The device switcher changes only the iframe's CSS width.
 * Fullscreen is a plain `target="_blank"` link to the standalone route (no
 * Dialog). The Code tab fetches the example source from the built registry
 * item JSON.
 */
export function PreviewCode({ kind, slug, exampleName }: PreviewCodeProps) {
  const [device, setDevice] = useState<Device>("desktop")
  const [source, setSource] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const previewHref = `/preview/${kind}/${slug}`

  useEffect(() => {
    if (!exampleName) return
    let cancelled = false
    setLoading(true)
    fetch(`/r/${exampleName}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.files?.[0]?.content) {
          setSource(data.files[0].content)
        }
      })
      .catch(() => {
        /* source stays null; the Code tab shows the fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [exampleName])

  return (
    <div data-slot="preview-code" className="overflow-hidden rounded-lg border bg-card">
      <Tabs defaultValue="preview">
        <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
          <TabsList data-slot="preview-code-toggle">
            <TabsTrigger value="preview" data-slot="preview-code-trigger">
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" data-slot="preview-code-trigger">
              Code
            </TabsTrigger>
          </TabsList>
          <a
            href={previewHref}
            target="_blank"
            rel="noopener"
            data-slot="preview-code-fullscreen"
            aria-label="Open preview in new tab"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <Maximize className="size-4" />
          </a>
        </div>

        <TabsContent value="preview" className="m-0">
          <div className="flex items-center gap-2 border-b bg-muted/20 px-3 py-2">
            <DeviceSwitcher device={device} onChange={setDevice} />
          </div>
          <div data-slot="component-preview" data-mode="preview" className="bg-background p-4">
            <div className={cn("mx-auto w-full transition-[max-width] duration-200", deviceWidth(device))}>
              <iframe
                src={previewHref}
                title={`${kind}/${slug} preview`}
                className="h-[480px] w-full rounded-md border"
                loading="lazy"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="m-0">
          <div data-slot="component-preview" data-mode="code" className="bg-background p-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading source…</p>
            ) : source ? (
              <CodeBlock code={source} language="tsx" />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Source unavailable.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function deviceWidth(device: Device): string {
  return DEVICES.find((d) => d.value === device)?.width ?? "max-w-none"
}

function DeviceSwitcher({
  device,
  onChange,
}: {
  device: Device
  onChange: (device: Device) => void
}) {
  return (
    <ToggleGroup
      variant="outline"
      spacing={0}
      value={[device]}
      onValueChange={(values) => {
        if (values[0]) onChange(values[0] as Device)
      }}
      aria-label="Preview viewport"
      data-slot="preview-code-device"
    >
      {DEVICES.map(({ value, label, Icon }) => (
        <ToggleGroupItem key={value} value={value} aria-label={label} data-slot="preview-code-device-trigger" data-device={value}>
          <Icon className="size-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
