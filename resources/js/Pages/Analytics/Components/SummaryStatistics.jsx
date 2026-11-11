
export default function SummaryStatistics({
    label,
    total = 0,
    riskData = [],
}) {
    const format = (value) =>
        Number(value).toLocaleString('id-ID');

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                        Total {label}
                    </p>
                    <h2 className="mt-1 text-4xl font-bold text-gray-900">
                        {format(total)}
                    </h2>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                        Total {label} Berisiko
                    </p>
                    <h2 className="mt-1 text-3xl font-bold text-gray-900">
                        —
                    </h2>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                        Total {label} Tidak Berisiko
                    </p>
                    <h2 className="mt-1 text-3xl font-bold text-gray-900">
                        —
                    </h2>
                </div>
            </div>

            <p className="mt-5 border-t pt-3 text-xs text-gray-400">
                {riskData.length === 0
                    ? 'Belum ada data status risiko.'
                    : 'Kategori risiko tersedia; pemetaan berisiko dan tidak berisiko perlu diverifikasi.'}
            </p>
        </div>
    );
}
