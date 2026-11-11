<?php

namespace App\Http\Controllers;

use App\Models\BadutaMaster;
use App\Models\BadutaKunjungan;
use App\Models\BadutaTindakLanjut;
use App\Models\Kemantren;
use App\Models\Kelurahan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BadutaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = BadutaMaster::with([
            'kelurahan.kemantren',
            'kunjungans' => fn($q) => $q->latest()->limit(1)
        ]);

        if ($user->role === 'kader') {
            $query->where('created_by', $user->id);
        } elseif ($user->role === 'admin_kemantren') {
            $query->whereHas('kelurahan', function ($q) use ($user) {
                $q->where('kemantren_id', $user->kemantren_id);
            });
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => 
                $q->where('nama_anak', 'ilike', "%{$s}%")
                  ->orWhere('nik_anak', 'like', "%{$s}%")
                  ->orWhere('nama_ibu', 'ilike', "%{$s}%")
                  ->orWhere('nik_ibu', 'like', "%{$s}%")
            );
        }
        if ($request->filled('kelurahan_id')) {
            $query->where('kelurahan_id', $request->kelurahan_id);
        }
        if ($request->filled('status_risiko')) {
            $query->where('status_risiko', $request->status_risiko);
        }

        if ($request->urutkan === 'Terlama') {
            $query->oldest();
        } elseif ($request->urutkan === 'Nama A-Z') {
            $query->orderBy('nama_anak', 'asc');
        } else {
            $query->latest();
        }

        $statsQuery = clone $query;

        return Inertia::render('Baduta/Index', [
            'badutas' => $query->paginate(10)->withQueryString(),
            'stats' => [
                'total' => (clone $statsQuery)->count(),
                'berisiko' => (clone $statsQuery)->where('status_risiko', 'berisiko')->count(),
                'tidak_berisiko' => (clone $statsQuery)->where('status_risiko', 'tidak_berisiko')->count(),
            ],
            'kelurahans' => Kelurahan::orderBy('nama')->get(['id', 'nama']),
            'filters' => $request->only(['search', 'kelurahan_id', 'status_risiko', 'urutkan'])
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        $kemantrens = Kemantren::orderBy('id');
        $kelurahans = Kelurahan::orderBy('id');

        if ($user->role === 'kader' || $user->role === 'admin_kemantren') {
            if ($user->kemantren_id) {
                $kemantrens->where('id', $user->kemantren_id);
                $kelurahans->where('kemantren_id', $user->kemantren_id);
            }
        }

        if ($user->role === 'kader') {
            $tpkMembers = $user->tpkMembers()->orderBy('nama_anggota')->get(['id', 'nama_anggota', 'unsur']);
        } else {
            $tpkMembers = \App\Models\TpkMember::orderBy('nama_anggota')->get(['id', 'nama_anggota', 'unsur']);
        }

        return Inertia::render('Baduta/Create', [
            'kemantrens' => $kemantrens->get(['id', 'nama']),
            'kelurahans' => $kelurahans->get(['id', 'kemantren_id', 'nama']),
            'tpkMembers' => $tpkMembers,
            'defaultKemantrenId' => $user->kemantren_id,
            'defaultKelurahanId' => $user->kelurahan_id,
        ]);
    }

    public function checkNik(Request $request)
    {
        $nik = $request->query('nik');
        $master = BadutaMaster::where('nik_anak', $nik)->with(['kunjungans' => fn($q) => $q->latest()])->first();

        if (!$master) {
            return response()->json(['found' => false]);
        }

        $latestKunjungan = $master->kunjungans->first();

        return response()->json([
            'found' => true,
            'kunjungan_ke' => $master->kunjungans->count() + 1,
            'master' => $master,
            'latest' => $latestKunjungan ? [
                'berat_badan_saat_ini' => $latestKunjungan->berat_badan_saat_ini,
                'panjang_badan_saat_ini' => $latestKunjungan->panjang_badan_saat_ini,
                'lingkar_kepala_saat_ini' => $latestKunjungan->lingkar_kepala_saat_ini,
                'penggunaan_kontrasepsi' => $latestKunjungan->penggunaan_kontrasepsi,
                'metode_kb' => $latestKunjungan->metode_kb,
                'usia_kehamilan_saat_lahir' => $latestKunjungan->usia_kehamilan_saat_lahir,
                'berat_badan_lahir' => $latestKunjungan->berat_badan_lahir,
                'panjang_badan_lahir' => $latestKunjungan->panjang_badan_lahir,
                'lingkar_kepala_lahir' => $latestKunjungan->lingkar_kepala_lahir,
                'mengalami_asfiksia' => $latestKunjungan->mengalami_asfiksia,
                'sumber_air_minum_utama' => $latestKunjungan->sumber_air_minum_utama,
                'fasilitas_jamban' => $latestKunjungan->fasilitas_jamban,
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nik_anak' => 'required|string|size:16',
            'nama_anak' => 'required|string|max:255',
            'tanggal_lahir_anak' => 'required|date|before_or_equal:today',
            'jenis_kelamin_anak' => 'required|in:Laki-laki,Perempuan',
            'anak_ke' => 'required|integer|min:1',
            'tanggal_lahir_anak_sebelumnya' => 'nullable|date|before_or_equal:today',

            'nik_ibu' => 'required|string|size:16|different:nik_anak',
            'nama_ibu' => 'required|string|max:255',
            'tanggal_lahir_ibu' => 'required|date|before_or_equal:today',
            'nomor_whatsapp_ibu' => 'nullable|numeric',
            'alamat' => 'required|string',
            'rt' => 'required|numeric',
            'rw' => 'required|numeric',
            'domisili_min_6_bulan' => 'accepted',

            'kemantren_id' => 'required|exists:kemantrens,id',
            'kelurahan_id' => 'required|exists:kelurahans,id',
            'bulan_laporan' => 'required|string',
            'tahun_laporan' => 'required|string',
            'tanggal_kunjungan' => 'required|date',
            'tpk_member_id' => 'nullable|exists:tpk_members,id',
            'tim_tpk' => 'nullable|string',
            'nama_tpk' => 'nullable|string',
            'unsur_tpk' => 'nullable|string',

            'penggunaan_kontrasepsi' => 'required|string',
            'pemberian_asi' => 'required|string',

            'usia_kehamilan_saat_lahir' => 'required|integer|min:20|max:45',
            'berat_badan_lahir' => 'required|numeric|min:0.3|max:6',
            'panjang_badan_lahir' => 'required|numeric|min:20|max:65',
            'lingkar_kepala_lahir' => 'required|numeric|min:20|max:55',
            'mengalami_asfiksia' => 'required|string',

            'tanggal_pengukuran' => 'required|date|before_or_equal:today',
            'berat_badan_saat_ini' => 'required|numeric|min:1|max:20',
            'panjang_badan_saat_ini' => 'required|numeric|min:30|max:125',
            'lingkar_kepala_saat_ini' => 'required|numeric|min:25|max:60',

            'mengisi_kka' => 'required|string',
            'imunisasi_dasar_lengkap' => 'required|string',
            'kehadiran_posyandu_bkb' => 'required|string',
            'paparan_asap_rokok' => 'required|string',

            'mendapatkan_mbg_3b' => 'required|string',
            'mendapatkan_pmt' => 'required|string',
            'input_elsimil' => 'required|string',
            'sumber_air_minum_utama' => 'required|string',
            'fasilitas_jamban' => 'required|string',

            'fasilitasi_bantuan_sosial' => 'required|string',
            'menerima_bantuan_sanitasi' => 'required|string',
            'memberikan_penyuluhan' => 'required|string',
            'fasilitasi_rujukan_faskes' => 'required|string',
            'sasaran_mudah_ditemui' => 'required|string',
            'sasaran_kooperatif' => 'required|string',
        ]);

        DB::transaction(function () use ($request, $validated) {
            $tglLahirAnak = Carbon::parse($validated['tanggal_lahir_anak']);
            $tglUkur = Carbon::parse($validated['tanggal_pengukuran']);
            $usiaBulan = (int)$tglLahirAnak->diffInMonths($tglUkur);
            $usiaHari = (int)$tglLahirAnak->diffInDays($tglUkur);
            $kriteriaBaduta = $usiaHari <= 28 ? 'Bayi baru lahir (0-28 hari)' : 'Baduta (28 hari-23 bulan)';

            // Evaluasi Indikator Faktor Risiko Baduta
            $faktorRisiko = [];
            if ((float)$validated['berat_badan_lahir'] < 2.5) $faktorRisiko[] = 'Bayi baru lahir - BBLR';
            if ((float)$validated['panjang_badan_lahir'] < 48.0) $faktorRisiko[] = 'Bayi baru lahir - Panjang < 48cm';
            if ((int)$validated['usia_kehamilan_saat_lahir'] < 37) $faktorRisiko[] = 'Bayi baru lahir - Kurang Bulan';
            if ($validated['penggunaan_kontrasepsi'] === 'Tidak') $faktorRisiko[] = 'Ibu belum ber-KB';

            // Z-Score Risks (Threshold < -1 SD)
            $zTbU = $request->filled('zscore_tb_u') ? (float)$request->zscore_tb_u : null;
            $zBbU = $request->filled('zscore_bb_u') ? (float)$request->zscore_bb_u : null;
            $zBbTb = $request->filled('zscore_bb_tb') ? (float)$request->zscore_bb_tb : null;

            if ($zTbU !== null && $zTbU < -1.0) $faktorRisiko[] = 'Risiko TB/U (<-1 SD)';
            if ($zBbU !== null && $zBbU < -1.0) $faktorRisiko[] = 'Risiko BB/U (<-1 SD)';
            if ($zBbTb !== null && $zBbTb < -1.0) $faktorRisiko[] = 'Risiko BB/TB (<-1 SD)';

            // Evaluasi 2T (Tidak Naik BB 2 Kali Berturut-turut)
            if ($request->filled('berat_badan_bulan_lalu')) {
                $bbSekarang = (float)$validated['berat_badan_saat_ini'];
                $bbLalu = (float)$request->berat_badan_bulan_lalu;
                if ($bbSekarang <= $bbLalu) {
                    $prevKunjungan = BadutaKunjungan::whereHas('master', fn($q) => $q->where('nik_anak', $validated['nik_anak']))
                        ->latest()
                        ->first();
                    if ($prevKunjungan && $prevKunjungan->berat_badan_bulan_lalu && ((float)$prevKunjungan->berat_badan_saat_ini <= (float)$prevKunjungan->berat_badan_bulan_lalu)) {
                        $faktorRisiko[] = 'Tidak naik BB dua kali berturut turut (2T)';
                    }
                }
            }

            if ($request->fasilitas_jamban !== '1. Jamban milik sendiri dengan leher angsa & tangki septik/IPAL') {
                $faktorRisiko[] = 'Sanitasi';
            }

            $airTidakLayak = ['Sumur tidak terlindung', 'Mata air tidak terlindung', 'Air permukaan (sungai/danau/waduk/kolam/irigasi)', 'Air Hujan'];
            if (in_array($request->sumber_air_minum_utama, $airTidakLayak)) {
                $faktorRisiko[] = 'Air Minum';
            }

            $statusRisiko = count($faktorRisiko) > 0 ? 'berisiko' : 'tidak_berisiko';

            $master = BadutaMaster::updateOrCreate(
                ['nik_anak' => $validated['nik_anak']],
                [
                    'nama_anak' => $validated['nama_anak'],
                    'tanggal_lahir_anak' => $validated['tanggal_lahir_anak'],
                    'jenis_kelamin_anak' => $validated['jenis_kelamin_anak'],
                    'anak_ke' => $validated['anak_ke'],
                    'tanggal_lahir_anak_sebelumnya' => $request->tanggal_lahir_anak_sebelumnya,
                    'nik_ibu' => $validated['nik_ibu'],
                    'nama_ibu' => $validated['nama_ibu'],
                    'tanggal_lahir_ibu' => $validated['tanggal_lahir_ibu'],
                    'nomor_whatsapp_ibu' => $request->nomor_whatsapp_ibu,
                    'alamat' => $validated['alamat'],
                    'rt' => $validated['rt'],
                    'rw' => $validated['rw'],
                    'domisili_min_6_bulan' => true,
                    'kemantren_id' => $validated['kemantren_id'],
                    'kelurahan_id' => $validated['kelurahan_id'],
                    'created_by' => $request->user()->id,
                    'status_risiko' => $statusRisiko,
                ]
            );

            $pathElsimil = $request->file('unggah_screenshot_elsimil')?->store('baduta/elsimil', 'public');
            $pathRumah = $request->file('unggah_foto_depan_rumah')?->store('baduta/rumah', 'public');
            $pathJamban = $request->file('unggah_foto_jamban')?->store('baduta/jamban', 'public');

            $kunjunganKe = $master->kunjungans()->count() + 1;

            $kunjungan = BadutaKunjungan::create([
                'baduta_master_id' => $master->id,
                'user_id' => $request->user()->id,
                'tpk_member_id' => $request->tpk_member_id,
                'bulan_laporan' => $validated['bulan_laporan'],
                'tahun_laporan' => $validated['tahun_laporan'],
                'tanggal_kunjungan' => $validated['tanggal_kunjungan'],
                'kunjungan_ke' => $kunjunganKe,
                'tim_tpk' => $request->tim_tpk,
                'nama_tpk' => $request->nama_tpk,
                'unsur_tpk' => $request->unsur_tpk,

                'penggunaan_kontrasepsi' => $validated['penggunaan_kontrasepsi'],
                'metode_kb' => $request->metode_kb,
                'alasan_tidak_kb' => $request->alasan_tidak_kb,

                'usia_anak_bulan' => $usiaBulan,
                'kriteria_baduta' => $kriteriaBaduta,
                'pemberian_asi' => $validated['pemberian_asi'],
                'riwayat_asi_setelah_6_bulan' => $request->riwayat_asi_setelah_6_bulan,

                'usia_kehamilan_saat_lahir' => $validated['usia_kehamilan_saat_lahir'],
                'berat_badan_lahir' => $validated['berat_badan_lahir'],
                'panjang_badan_lahir' => $validated['panjang_badan_lahir'],
                'lingkar_kepala_lahir' => $validated['lingkar_kepala_lahir'],
                'mengalami_asfiksia' => $validated['mengalami_asfiksia'],

                'tanggal_pengukuran' => $validated['tanggal_pengukuran'],
                'berat_badan_saat_ini' => $validated['berat_badan_saat_ini'],
                'panjang_badan_saat_ini' => $validated['panjang_badan_saat_ini'],
                'lingkar_kepala_saat_ini' => $validated['lingkar_kepala_saat_ini'],
                'berat_badan_bulan_lalu' => $request->berat_badan_bulan_lalu,
                'tinggi_badan_bulan_lalu' => $request->tinggi_badan_bulan_lalu,
                'lingkar_kepala_bulan_lalu' => $request->lingkar_kepala_bulan_lalu,

                'zscore_bb_u' => $zBbU,
                'zscore_tb_u' => $zTbU,
                'zscore_bb_tb' => $zBbTb,

                'mengisi_kka' => $validated['mengisi_kka'],
                'imunisasi_dasar_lengkap' => $validated['imunisasi_dasar_lengkap'],
                'alasan_imunisasi_tidak_lengkap' => $request->alasan_imunisasi_tidak_lengkap,
                'kehadiran_posyandu_bkb' => $validated['kehadiran_posyandu_bkb'],
                'paparan_asap_rokok' => $validated['paparan_asap_rokok'],
                'sumber_paparan_asap_rokok' => is_array($request->sumber_paparan_asap_rokok) ? implode(', ', $request->sumber_paparan_asap_rokok) : $request->sumber_paparan_asap_rokok,
                'sumber_paparan_lainnya' => $request->sumber_paparan_lainnya,

                'mendapatkan_mbg_3b' => $validated['mendapatkan_mbg_3b'],
                'mendapatkan_pmt' => $validated['mendapatkan_pmt'],
                'sumber_pmt' => $request->sumber_pmt,
                'lama_menerima_pmt_hari' => $request->lama_menerima_pmt_hari,
                'progres_setelah_pmt' => is_array($request->progres_setelah_pmt) ? implode(', ', $request->progres_setelah_pmt) : $request->progres_setelah_pmt,
                'input_elsimil' => $validated['input_elsimil'],
                'hasil_skrining_elsimil' => $request->hasil_skrining_elsimil,
                'unggah_screenshot_elsimil' => $pathElsimil,

                'sumber_air_minum_utama' => $validated['sumber_air_minum_utama'],
                'fasilitas_jamban' => $validated['fasilitas_jamban'],
                'unggah_foto_depan_rumah' => $pathRumah,
                'unggah_foto_jamban' => $pathJamban,

                'fasilitasi_bantuan_sosial' => $validated['fasilitasi_bantuan_sosial'],
                'menerima_bantuan_sanitasi' => $validated['menerima_bantuan_sanitasi'],
                'sumber_bantuan_sanitasi' => $request->sumber_bantuan_sanitasi,
                'sumber_bantuan_sanitasi_lainnya' => $request->sumber_bantuan_sanitasi_lainnya,
                'nilai_bantuan_sanitasi' => $request->nilai_bantuan_sanitasi,

                'memberikan_penyuluhan' => $validated['memberikan_penyuluhan'],
                'penyuluhan_kie' => $request->penyuluhan_kie,
                'fasilitasi_rujukan_faskes' => $validated['fasilitasi_rujukan_faskes'],
                'sasaran_mudah_ditemui' => $validated['sasaran_mudah_ditemui'],
                'sasaran_kooperatif' => $validated['sasaran_kooperatif'],
                'catatan' => $request->catatan,

                'faktor_risiko' => $faktorRisiko,
                'berisiko' => count($faktorRisiko) > 0 ? 'Berisiko' : 'Tidak Berisiko',
            ]);

            if ($request->filled('tindak_lanjut_risiko')) {
                foreach ($request->tindak_lanjut_risiko as $tl) {
                    BadutaTindakLanjut::create([
                        'baduta_kunjungan_id' => $kunjungan->id,
                        'faktor_risiko' => $tl['faktor_risiko'],
                        'identifikasi_penyebab' => is_array($tl['identifikasi_penyebab'] ?? null) ? implode(', ', $tl['identifikasi_penyebab']) : ($tl['identifikasi_penyebab'] ?? null),
                        'progres' => $tl['progres'] ?? null,
                        'tindak_lanjut' => $tl['tindak_lanjut'] ?? null,
                        'alasan_belum_dilaksanakan' => $tl['alasan_belum_dilaksanakan'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('baduta.index');
    }

    public function show(BadutaMaster $baduta)
    {
        $baduta->load(['kelurahan.kemantren', 'kader', 'kunjungans.tindakLanjuts', 'kunjungans.tpkMember']);

        return Inertia::render('Baduta/Show', [
            'baduta' => $baduta,
        ]);
    }

    public function destroy(Request $request, BadutaMaster $baduta)
    {
        $user = $request->user();

        if ($user->role === 'kader' && $baduta->created_by !== $user->id) {
            abort(403);
        }
        if ($user->role === 'admin_kemantren' && $baduta->kelurahan->kemantren_id !== $user->kemantren_id) {
            abort(403);
        }

        $baduta->delete();
        return redirect()->back();
    }
}