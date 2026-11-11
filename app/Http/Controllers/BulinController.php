<?php

namespace App\Http\Controllers;

use App\Models\BulinMaster;
use App\Models\BulinKunjungan;
use App\Models\BulinTindakLanjut;
use App\Models\Kemantren;
use App\Models\Kelurahan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BulinController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = BulinMaster::with([
            'kelurahan.kemantren',
            'kunjungans' => fn($q) => $q->latest()->limit(1)
        ]);

        // 1. Otoritas Data Berdasarkan Role
        if ($user->role === 'kader') {
            $query->where('created_by', $user->id);
        } elseif ($user->role === 'admin_kemantren') {
            $query->whereHas('kelurahan', function ($q) use ($user) {
                $q->where('kemantren_id', $user->kemantren_id);
            });
        }

        // 2. Filter Pencarian & Kategori
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('nama', 'ilike', "%{$s}%")->orWhere('nik', 'like', "%{$s}%"));
        }
        if ($request->filled('kelurahan_id')) {
            $query->where('kelurahan_id', $request->kelurahan_id);
        }
        if ($request->filled('status_risiko')) {
            $query->where('status_risiko', $request->status_risiko);
        }

        // 3. Sorting
        if ($request->urutkan === 'Terlama') {
            $query->oldest();
        } elseif ($request->urutkan === 'Nama A-Z') {
            $query->orderBy('nama', 'asc');
        } else {
            $query->latest();
        }

        // Hitung Statistik Berdasarkan Scope Role
        $statsQuery = clone $query;
        $totalBulin = (clone $statsQuery)->count();
        $totalBerisiko = (clone $statsQuery)->where('status_risiko', 'berisiko')->count();
        $totalTidakBerisiko = (clone $statsQuery)->where('status_risiko', 'tidak_berisiko')->count();

        return Inertia::render('Bulin/Index', [
            'bulins' => $query->paginate(10)->withQueryString(),
            'stats' => [
                'total' => $totalBulin,
                'berisiko' => $totalBerisiko,
                'tidak_berisiko' => $totalTidakBerisiko,
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

        return Inertia::render('Bulin/Create', [
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
        $master = BulinMaster::where('nik', $nik)->with(['kunjungans' => fn($q) => $q->latest()])->first();

        if (!$master) {
            return response()->json(['found' => false]);
        }

        $latestKunjungan = $master->kunjungans->first();

        return response()->json([
            'found' => true,
            'kunjungan_ke' => $master->kunjungans->count() + 1,
            'master' => $master,
            'persalinan' => $latestKunjungan ? [
                'tanggal_persalinan' => $latestKunjungan->tanggal_persalinan,
                'faskes_tempat_bersalin' => $latestKunjungan->faskes_tempat_bersalin,
                'nama_faskes' => $latestKunjungan->nama_faskes,
                'metode_persalinan' => $latestKunjungan->metode_persalinan,
                'kondisi_bayi' => $latestKunjungan->kondisi_bayi,
                'sumber_air_minum_utama' => $latestKunjungan->sumber_air_minum_utama,
                'fasilitas_jamban' => $latestKunjungan->fasilitas_jamban,
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nik' => 'required|string|size:16',
            'nama' => 'required|string|max:255',
            'tempat_lahir' => 'nullable|string|max:100',
            'tanggal_lahir' => 'required|date|before_or_equal:today',
            'alamat' => 'required|string',
            'rt' => 'required|numeric',
            'rw' => 'required|numeric',
            'nomor_whatsapp' => 'nullable|numeric',
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

            'tanggal_persalinan' => 'required|date|before_or_equal:today',
            'faskes_tempat_bersalin' => 'required|string',
            'nama_faskes' => 'required|string',
            'metode_persalinan' => 'required|string',
            'komplikasi' => 'required|string',
            'kondisi_bayi' => 'required|string',
            'paparan_asap_rokok' => 'required|string',
            'mendapatkan_ttd' => 'required|string',
            'konsumsi_ttd' => 'required|string',
            'input_elsimil' => 'required|string',
            'menggunakan_kbpp' => 'required|string',

            'sumber_air_minum_utama' => 'required|string',
            'fasilitas_jamban' => 'required|string',
            'mendapatkan_mbg_3b' => 'required|string',
            'mendapatkan_pmt' => 'required|string',
            'fasilitasi_bantuan_sosial' => 'required|string',
            'memberikan_penyuluhan' => 'required|string',
            'fasilitasi_rujukan_faskes' => 'required|string',
            'sasaran_mudah_ditemui' => 'required|string',
            'sasaran_kooperatif' => 'required|string',
        ]);

        DB::transaction(function () use ($request, $validated) {
            // Evaluasi Faktor Risiko
            $faktorRisiko = [];
            if ($request->komplikasi === 'Ya') $faktorRisiko[] = 'Komplikasi';
            if ($request->menggunakan_kbpp === 'Tidak') $faktorRisiko[] = 'Belum KBPP';
            
            // Evaluasi Jamban Layak
            if ($request->fasilitas_jamban !== '1. Jamban milik sendiri dengan leher angsa & tangki septik/IPAL') {
                $faktorRisiko[] = 'Sanitasi';
            }

            // Evaluasi Air Layak
            $airTidakLayak = ['Sumur tidak terlindung', 'Mata air tidak terlindung', 'Air permukaan (sungai/danau/waduk/kolam/irigasi)', 'Air Hujan'];
            if (in_array($request->sumber_air_minum_utama, $airTidakLayak)) {
                $faktorRisiko[] = 'Air Minum';
            }

            // Evaluasi Caesar/Tindakan
            if (in_array($request->metode_persalinan, ['Operasi Caesar', 'Vacuum Extraction/Vakum', 'Curetase/Kuret'])) {
                $faktorRisiko[] = 'Tindakan/Caesar';
            }

            $isBerisiko = count($faktorRisiko) > 0 ? 'berisiko' : 'tidak_berisiko';

            // Simpan / Update Master
            $master = BulinMaster::updateOrCreate(
                ['nik' => $validated['nik']],
                [
                    'nama' => $validated['nama'],
                    'tempat_lahir' => $request->tempat_lahir,
                    'tanggal_lahir' => $validated['tanggal_lahir'],
                    'alamat' => $validated['alamat'],
                    'rt' => $validated['rt'],
                    'rw' => $validated['rw'],
                    'nomor_whatsapp' => $request->nomor_whatsapp,
                    'domisili_min_6_bulan' => true,
                    'kemantren_id' => $validated['kemantren_id'],
                    'kelurahan_id' => $validated['kelurahan_id'],
                    'created_by' => $request->user()->id,
                    'status_risiko' => $isBerisiko,
                ]
            );

            // Upload File
            $pathElsimil = $request->file('unggah_screenshot_elsimil')?->store('bulin/elsimil', 'public');
            $pathRumah = $request->file('unggah_foto_depan_rumah')?->store('bulin/rumah', 'public');
            $pathJamban = $request->file('unggah_foto_jamban')?->store('bulin/jamban', 'public');

            $kunjunganKe = $master->kunjungans()->count() + 1;

            // Simpan Kunjungan
            $kunjungan = BulinKunjungan::create([
                'bulin_master_id' => $master->id,
                'user_id' => $request->user()->id,
                'tpk_member_id' => $request->tpk_member_id,
                'bulan_laporan' => $validated['bulan_laporan'],
                'tahun_laporan' => $validated['tahun_laporan'],
                'tanggal_kunjungan' => $validated['tanggal_kunjungan'],
                'kunjungan_ke' => $kunjunganKe,
                'tim_tpk' => $request->tim_tpk,
                'nama_tpk' => $request->nama_tpk,
                'unsur_tpk' => $request->unsur_tpk,

                'tanggal_persalinan' => $validated['tanggal_persalinan'],
                'faskes_tempat_bersalin' => $validated['faskes_tempat_bersalin'],
                'nama_faskes' => $validated['nama_faskes'],
                'metode_persalinan' => $validated['metode_persalinan'],
                'komplikasi' => $validated['komplikasi'],
                'jenis_komplikasi' => is_array($request->jenis_komplikasi) ? implode(', ', $request->jenis_komplikasi) : $request->jenis_komplikasi,
                'komplikasi_lainnya' => $request->komplikasi_lainnya,
                'kondisi_bayi' => $validated['kondisi_bayi'],

                'paparan_asap_rokok' => $validated['paparan_asap_rokok'],
                'sumber_paparan_asap_rokok' => is_array($request->sumber_paparan_asap_rokok) ? implode(', ', $request->sumber_paparan_asap_rokok) : $request->sumber_paparan_asap_rokok,
                'sumber_paparan_lainnya' => $request->sumber_paparan_lainnya,
                'mendapatkan_ttd' => $validated['mendapatkan_ttd'],
                'konsumsi_ttd' => $validated['konsumsi_ttd'],
                'alasan_tidak_konsumsi_ttd' => $request->alasan_tidak_konsumsi_ttd,
                'input_elsimil' => $validated['input_elsimil'],
                'hasil_skrining_elsimil' => $request->hasil_skrining_elsimil,
                'unggah_screenshot_elsimil' => $pathElsimil,

                'menggunakan_kbpp' => $validated['menggunakan_kbpp'],
                'jenis_kbpp' => $request->jenis_kbpp,
                'alasan_menggunakan_kbpp' => $request->alasan_menggunakan_kbpp,
                'alasan_tidak_kbpp' => $request->alasan_tidak_kbpp,

                'sumber_air_minum_utama' => $validated['sumber_air_minum_utama'],
                'fasilitas_jamban' => $validated['fasilitas_jamban'],
                'unggah_foto_depan_rumah' => $pathRumah,
                'unggah_foto_jamban' => $pathJamban,

                'mendapatkan_mbg_3b' => $validated['mendapatkan_mbg_3b'],
                'mendapatkan_pmt' => $validated['mendapatkan_pmt'],
                'sumber_pmt' => $request->sumber_pmt,
                'fasilitasi_bantuan_sosial' => $validated['fasilitasi_bantuan_sosial'],
                'memberikan_penyuluhan' => $validated['memberikan_penyuluhan'],
                'penyuluhan_kie' => $request->penyuluhan_kie,
                'fasilitasi_rujukan_faskes' => $validated['fasilitasi_rujukan_faskes'],
                'sasaran_mudah_ditemui' => $validated['sasaran_mudah_ditemui'],
                'sasaran_kooperatif' => $validated['sasaran_kooperatif'],
                'catatan' => $request->catatan,

                'faktor_risiko' => $faktorRisiko,
                'berisiko' => count($faktorRisiko) > 0 ? 'Berisiko' : 'Tidak Berisiko',
            ]);

            // Simpan Kartu Tindak Lanjut Risiko
            if ($request->filled('tindak_lanjut_risiko')) {
                foreach ($request->tindak_lanjut_risiko as $tl) {
                    BulinTindakLanjut::create([
                        'bulin_kunjungan_id' => $kunjungan->id,
                        'faktor_risiko' => $tl['faktor_risiko'],
                        'progres' => $tl['progres'] ?? null,
                        'tindak_lanjut' => $tl['tindak_lanjut'] ?? null,
                        'alasan_belum_dilaksanakan' => $tl['alasan_belum_dilaksanakan'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('bulin.index');
    }

    public function show(BulinMaster $bulin)
    {
        $bulin->load(['kelurahan.kemantren', 'kader', 'kunjungans.tindakLanjuts', 'kunjungans.tpkMember']);

        return Inertia::render('Bulin/Show', [
            'bulin' => $bulin,
        ]);
    }

    public function destroy(Request $request, BulinMaster $bulin)
    {
        $user = $request->user();

        if ($user->role === 'kader' && $bulin->created_by !== $user->id) {
            abort(403);
        }
        if ($user->role === 'admin_kemantren' && $bulin->kelurahan->kemantren_id !== $user->kemantren_id) {
            abort(403);
        }

        $bulin->delete();
        return redirect()->back();
    }
}