import { Button } from "@/components/ui/button"

/** All Button variants on one row - the hero preview for the Button doc page. */
export function ButtonHero() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  )
}
