<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Hanya Superadmin dan Admin Kemantren
        abort_unless(
            $user->hasAnyRole([
                'superadmin',
                'admin_kemantren'
            ]),
            403
        );

        $isSuperadmin = $user->hasRole('superadmin');

        // Admin Kemantren wajib punya wilayah
        if (!$isSuperadmin && !$user->kemantren_id) {
            abort(403, 'Wilayah admin belum ditentukan.');
        }

        // Validasi parameter filter
        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            'kemantren' => ['nullable', 'integer'],
            'kelurahan' => ['nullable', 'integer'],
        ]);

        $month = $validated['month'] ?? '';

        $kemantren = $isSuperadmin
            ? (string) ($validated['kemantren'] ?? '')
            : (string) $user->kemantren_id;

        $kelurahan = (string) (
            $validated['kelurahan'] ?? ''
        );

        // Ambil seluruh kemantren yang diizinkan
        $kemantrens = DB::table('kemantrens')
            ->when(
                !$isSuperadmin,
                fn ($q) => $q->where(
                    'id',
                    $user->kemantren_id
                )
            )
            ->orderBy('nama')
            ->get(['id', 'nama']);

        // Ambil kelurahan sesuai cakupan admin
        $kelurahans = DB::table('kelurahans')
            ->when(
                !$isSuperadmin,
                fn ($q) => $q->where(
                    'kemantren_id',
                    $user->kemantren_id
                )
            )
            ->orderBy('nama')
            ->get(['id', 'nama', 'kemantren_id']);

        // Periksa apakah kemantren diizinkan
        if (
            $kemantren &&
            !$kemantrens->contains(
                fn ($item) =>
                    (string) $item->id === $kemantren
            )
        ) {
            abort(403, 'Kemantren tidak diizinkan.');
        }

        // Periksa apakah kelurahan sesuai wilayah
        if (
            $kelurahan &&
            !$kelurahans->contains(
                fn ($item) =>
                    (string) $item->id === $kelurahan
                    && (
                        !$kemantren ||
                        (string) $item->kemantren_id
                            === $kemantren
                    )
            )
        ) {
            abort(403, 'Kelurahan tidak diizinkan.');
        }

        // Daftar bulan Januari-Desember
        // mulai tahun 2024 hingga tahun berjalan
        $months = collect(
            range(2024, now('Asia/Jakarta')->year)
        )
            ->flatMap(function ($year) {
                return collect(range(1, 12))
                    ->map(function ($month) use ($year) {
                        $date = Carbon::create(
                            $year,
                            $month,
                            1
                        );

                        return [
                            'value' => $date->format('Y-m'),
                            'label' => $date->locale('id')
                                ->translatedFormat('F Y'),
                        ];
                    });
            })
            ->sortByDesc('value')
            ->values()
            ->all();

        // Tabel modul SIM-TPK
        $tables = [
            'catin' => 'catin_masters',
            'bumil' => 'bumil_masters',
            'bulin' => 'bulin_masters',
            'baduta' => 'baduta_masters',
        ];

        $summary = [];
        $risks = [];

        foreach ($tables as $module => $table) {
            $query = DB::table($table);

            // Filter berdasarkan kemantren
            if ($kemantren) {
                if ($module === 'catin') {
                    // Catin tidak mempunyai kolom
                    // kemantren_id secara langsung
                    $query->whereIn(
                        'kelurahan_id',
                        DB::table('kelurahans')
                            ->select('id')
                            ->where(
                                'kemantren_id',
                                $kemantren
                            )
                    );
                } else {
                    $query->where(
                        'kemantren_id',
                        $kemantren
                    );
                }
            }

            // Filter berdasarkan kelurahan
            if ($kelurahan) {
                $query->where(
                    'kelurahan_id',
                    $kelurahan
                );
            }

            // Filter bulan pencatatan data
            if ($month) {
                $start = Carbon::createFromFormat(
                    'Y-m-d',
                    $month . '-01'
                )->startOfDay();

                $end = $start->copy()->endOfMonth();

                $query->whereBetween(
                    'created_at',
                    [$start, $end]
                );
            }

            // Total data sesuai filter
            $summary[$module] = (clone $query)
                ->count();

            // Distribusi status risiko
            $risks[$module] = (clone $query)
                ->select('status_risiko')
                ->selectRaw('COUNT(*) as total')
                ->groupBy('status_risiko')
                ->orderBy('status_risiko')
                ->get()
                ->map(fn ($item) => [
                    'status' => $item->status_risiko
                        ?? 'Belum ditentukan',
                    'total' => (int) $item->total,
                ])
                ->values()
                ->all();
        }

        return Inertia::render('Analytics/Index', [
            'summary' => $summary,
            'risks' => $risks,

            // Data untuk Global Filter
            'filters' => [
                'month' => $month,
                'kemantren' => $kemantren,
                'kelurahan' => $kelurahan,
            ],
            'months' => $months,
            'kemantrens' => $kemantrens,
            'kelurahans' => $kelurahans,
            'role' => $isSuperadmin
                ? 'superadmin'
                : 'admin_kemantren',
        ]);
    }
}
