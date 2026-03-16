import { type DocumentItem } from "@/lib/schema";

type Props = {
  documents: DocumentItem[];
  title?: string;
};

const statusStyles: Record<DocumentItem["status"], string> = {
  uploaded: "bg-green-50 text-green-700 border-green-200",
  missing: "bg-amber-50 text-amber-700 border-amber-200",
  needs_review: "bg-blue-50 text-blue-700 border-blue-200",
};

const statusLabels: Record<DocumentItem["status"], string> = {
  uploaded: "Uploaded",
  missing: "Missing",
  needs_review: "Needs review",
};

export default function DocumentChecklist({
  documents,
  title = "Document checklist",
}: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-gray-500">
          {documents.filter((document) => document.status === "uploaded").length}/
          {documents.length} uploaded
        </span>
      </div>

      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{document.name}</p>
                <p className="text-sm text-gray-500">{document.type}</p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[document.status]}`}
              >
                {statusLabels[document.status]}
              </span>
            </div>

            {document.evidenceNote ? (
              <p className="mt-3 text-sm text-gray-600">{document.evidenceNote}</p>
            ) : null}

            {document.url ? (
              <p className="mt-3 break-all text-sm text-blue-700">{document.url}</p>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                No file link is attached yet.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
