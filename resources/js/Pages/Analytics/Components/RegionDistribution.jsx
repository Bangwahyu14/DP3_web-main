
export default function RegionDistribution({ regions = [] }) {
    const topRegions = [...regions]
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    const max = Math.max(
        1,
        ...topRegions.map((item) => item.total)
    );

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900">
                        Sebaran Kasus per Wilayah
                    </h3>
                    <p className="text-xs text-gray-500">
                        Perbandingan berdasarkan kemantren
                    </p>
                </div>

                <span className="rounded border px-3 py-1 text-xs text-gray-600">
                    Top 5 Wilayah
                </span>
            </div>

            {topRegions.length === 0 ? (
                <div className="flex min-h-[230px] items-center justify-center text-center text-sm text-gray-400">
                    Data sebaran wilayah belum tersedia.
                </div>
            ) : (
                <div className="space-y-5">
                    {topRegions.map((item) => (
                        <div key={item.name}>
                            <div className="mb-2 flex justify-between text-sm">
                                <span>{item.name}</span>
                                <span>{item.total} Kasus</span>
                            </div>

                            <div className="h-2 rounded-full bg-gray-100">
                                <div
                                    className="h-2 rounded-full bg-gray-600"
                                    style={{
                                        width: `${item.total / max * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
