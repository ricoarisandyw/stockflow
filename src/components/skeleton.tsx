function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ""}`} />;
}

function SkeletonTableRows({ rows, columnWidths }: { rows: number; columnWidths: string[] }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`skeleton-row-${rowIndex}`}>
          {columnWidths.map((width, colIndex) => (
            <td key={`skeleton-cell-${rowIndex}-${colIndex}`} className="px-4 py-2">
              <Skeleton className={`h-4 ${width}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export const SkeletonComponent = {
  base: Skeleton,
  tableRows: SkeletonTableRows,
};
