import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@zeroxsolutions/ui/components/ui/card';

export interface PropEntry {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface PropsTableProps {
  rows: PropEntry[];
}

/**
 * Renders a hand-authored props list (Decision 1) as a styled table inside a
 * `Card`. Each row carries the prop name, its TS type, its default, and a
 * short description. The data is authored per item - not auto-extracted.
 */
export function PropsTable({ rows }: PropsTableProps) {
  return (
    <Card data-slot="props-table" size="sm">
      <CardHeader>
        <CardTitle>Props</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Name
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Type
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Default
                </th>
                <th scope="col" className="py-2 font-medium">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.name}
                  className="border-b align-top last:border-b-0"
                >
                  <td className="py-2 pr-4 font-mono text-xs">{row.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                    {row.type}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                    {row.default ?? '-'}
                  </td>
                  <td className="py-2">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
