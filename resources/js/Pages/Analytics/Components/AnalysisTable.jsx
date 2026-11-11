
export default function AnalysisTable({ label, rows = [] }) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <h3 className="font-bold text-gray-900">
                    Tabel Analisis {label}
                </h3>

                <input
                    type="text"
                    disabled
                    placeholder="Search Kemantren..."
                    className="rounded border-gray-300 text-sm disabled:bg-gray-100"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase text-gray-600">
                        <tr>
                            <th className="px-5 py-4">Kemantren</th>
                            <th className="px-5 py-4">Total Sasaran</th>
                            <th className="px-5 py-4">Berisiko</th>
                            <th className="px-5 py-4">Tidak Berisiko</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-5 py-12 text-center text-gray-400">
                                    Data analisis wilayah belum tersedia.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={row.id}>
                                    <td className="px-5 py-4">{row.name}</td>
                                    <td className="px-5 py-4">{row.total}</td>
                                    <td className="px-5 py-4">{row.risky}</td>
                                    <td className="px-5 py-4">{row.notRisky}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="border-t px-5 py-4 text-xs text-gray-500">
                Menampilkan {rows.length} wilayah
            </div>
        </div>
    );
}
