import type { components } from "@/generated/api/schema";

type TInvoiceDetail = components["schemas"]["InvoiceDetail"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function InvoicePrintView({ invoice }: { invoice: TInvoiceDetail }) {
  return (
    <div className="hidden print:block print:p-8 print:text-black">
      <div className="flex items-start justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Invoice</h1>
          <p className="mt-1 text-sm">{invoice.invoiceNumber}</p>
        </div>
        <span className="rounded-full border border-gray-400 px-3 py-1 text-xs font-medium">
          {invoice.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-gray-600">Billed to</p>
          <p className="mt-1">{invoice.customerName}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="font-medium text-gray-600">Issue date: </span>
            {formatDate(invoice.issueDate)}
          </p>
          <p>
            <span className="font-medium text-gray-600">Due date: </span>
            {formatDate(invoice.dueDate)}
          </p>
        </div>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-400 text-left">
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Unit price</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Line total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-2">{item.productName}</td>
              <td className="py-2 text-right">
                {item.unitPrice.toLocaleString()}
              </td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">
                {item.lineTotal.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{invoice.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax ({invoice.taxRate}%)</span>
          <span>{invoice.taxAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-t border-gray-400 pt-1 text-base font-bold">
          <span>Total</span>
          <span>{invoice.total.toLocaleString()}</span>
        </div>
      </div>

      {invoice.notes && (
        <div className="mt-6 text-sm">
          <p className="font-medium text-gray-600">Notes</p>
          <p className="mt-1">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
