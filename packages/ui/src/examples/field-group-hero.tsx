import { FieldGroup } from "@/components/layouts/field-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** A two-column field grid - the FieldGroup hero. */
export function FieldGroupHero() {
  return (
    <div className="flex w-full flex-col gap-4">
      <FieldGroup cols={2}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="preview-x">X</Label>
          <Input id="preview-x" defaultValue="100" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="preview-y">Y</Label>
          <Input id="preview-y" defaultValue="200" />
        </div>
      </FieldGroup>
    </div>
  )
}
