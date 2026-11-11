<?php

namespace App\Http\Controllers;

use App\Models\BumilMaster;
use App\Models\BumilKunjungan;
use App\Models\BumilTindakLanjut;
use App\Models\Kemantren;
use App\Models\Kelurahan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BumilController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = BumilMaster::with([
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
            $query->where(fn($q) => $q->where('nama', 'ilike', "%{$s}%")->orWhere('nik', 'like', "%{$s}%"));
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
            $query->orderBy('nama', 'asc');
        } else {
            $query->latest();
        }

        $statsQuery = clone $query;

        return Inertia::render('Bumil/Index', [
            'bumils' => $query->paginate(10)->withQueryString(),
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

        return Inertia::render('Bumil/Create', [
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
        $master = BumilMaster::where('nik', $nik)->with(['kunjungans' => fn($q) => $q->latest()])->first();

        if (!$master) {
            return response()->json(['found' => false]);
        }

        $latestKunjungan = $master->kunjungans->first();

        return response()->json([
            'found' => true,
            'kunjungan_ke' => $master->kunjungans->count() + 1,
            'master' => $master,
            'latest' => $latestKunjungan ? [
                'jumlah_anak_dilahirkan' => $latestKunjungan->jumlah_anak_dilahirkan,
                'tanggal_lahir_anak_terakhir' => $latestKunjungan->tanggal_lahir_anak_terakhir,
                'memiliki_riwayat_penyakit' => $latestKunjungan->memiliki_riwayat_penyakit,
                'riwayat_penyakit' => $latestKunjungan->riwayat_penyakit,
                'kehamilan_kembar' => $latestKunjungan->kehamilan_kembar,
                'berat_badan_sebelum_hamil' => $latestKunjungan->berat_badan_sebelum_hamil,
                'tinggi_badan' => $latestKunjungan->tinggi_badan,
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

            'jumlah_anak_dilahirkan' => 'required|integer|min:0|max:20',
            'tanggal_lahir_anak_terakhir' => 'nullable|date|before_or_equal:today',
            'memiliki_riwayat_penyakit' => 'required|string',

            'usia_kehamilan' => 'required|integer|min:1|max:45',
            'hpl' => 'required|date',
            'kehamilan_kembar' => 'required|string',
            'faskes_tempat_pemeriksaan' => 'required|string',
            'nama_faskes' => 'required|string',
            'berat_badan_saat_ini' => 'required|numeric|min:30|max:200',
            'berat_badan_sebelum_hamil' => 'required|numeric|min:30|max:200',
            'tinggi_badan' => 'required|numeric|min:100|max:220',
            'kadar_hb' => 'required|numeric|min:2|max:20',
            'lila' => 'required|numeric|min:10|max:50',
            'tfu' => 'nullable|numeric|min:5|max:50',
            'tbj' => 'nullable|integer|min:100|max:6000',

            'paparan_asap_rokok' => 'required|string',
            'input_elsimil' => 'required|string',
            'sumber_air_minum_utama' => 'required|string',
            'fasilitas_jamban' => 'required|string',
            'mendapatkan_mms' => 'required|string',
            'konsumsi_mms' => 'required|string',
            'mendapatkan_mbg_3b' => 'required|string',
            'mendapatkan_pmt' => 'required|string',
            'fasilitasi_bantuan_sosial' => 'required|string',
            'memberikan_penyuluhan' => 'required|string',
            'fasilitasi_rujukan_faskes' => 'required|string',
            'sasaran_mudah_ditemui' => 'required|string',
            'sasaran_kooperatif' => 'required|string',
        ]);

        DB::transaction(function () use ($request, $validated) {
            $tbMeter = $validated['tinggi_badan'] / 100;
            $imt = round($validated['berat_badan_sebelum_hamil'] / ($tbMeter * $tbMeter), 1);
            $usiaIbu = Carbon::parse($validated['tanggal_lahir'])->age;

            // Evaluasi Indikator Faktor Risiko
            $faktorRisiko = [];
            if ((float)$validated['kadar_hb'] < 12.0) $faktorRisiko[] = 'Anemia (HB <12)';
            if ((float)$validated['lila'] < 23.5) $faktorRisiko[] = 'KEK (Lila <23,5 cm)';
            if ($imt < 18.0) $faktorRisiko[] = 'IMT <18';
            if ($imt >= 25.0) $faktorRisiko[] = 'IMT>=25';
            if ($usiaIbu < 20) $faktorRisiko[] = 'Terlalu Muda';
            if ($usiaIbu > 35) $faktorRisiko[] = 'Terlalu Tua';
            if ((int)$validated['jumlah_anak_dilahirkan'] > 2) $faktorRisiko[] = 'Terlalu Banyak';

            if (!empty($validated['tanggal_lahir_anak_terakhir'])) {
                $jarakTahun = Carbon::parse($validated['tanggal_lahir_anak_terakhir'])->diffInYears(Carbon::parse($validated['hpl']));
                if ($jarakTahun < 2) $faktorRisiko[] = 'Terlalu Dekat';
            }

            if (in_array($validated['paparan_asap_rokok'], ['Pasif', 'Aktif'])) $faktorRisiko[] = 'Paparan Asap Rokok';
            if ($validated['memiliki_riwayat_penyakit'] === 'Ya') $faktorRisiko[] = 'Riwayat Penyakit';

            if ($request->fasilitas_jamban !== '1. Jamban milik sendiri dengan leher angsa & tangki septik/IPAL') {
                $faktorRisiko[] = 'Sanitasi';
            }

            $airTidakLayak = ['Sumur tidak terlindung', 'Mata air tidak terlindung', 'Air permukaan (sungai/danau/waduk/kolam/irigasi)', 'Air Hujan'];
            if (in_array($request->sumber_air_minum_utama, $airTidakLayak)) {
                $faktorRisiko[] = 'Air Minum';
            }

            if ((int)$validated['usia_kehamilan'] >= 20 && !empty($validated['tfu'])) {
                if (abs((float)$validated['tfu'] - (int)$validated['usia_kehamilan']) > 2) {
                    $faktorRisiko[] = 'TFU tidak sesuai usia kehamilan';
                }
            }

            $statusRisiko = count($faktorRisiko) > 0 ? 'berisiko' : 'tidak_berisiko';

            $master = BumilMaster::updateOrCreate(
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
                    'status_risiko' => $statusRisiko,
                ]
            );

            $pathElsimil = $request->file('unggah_screenshot_elsimil')?->store('bumil/elsimil', 'public');
            $pathRumah = $request->file('unggah_foto_depan_rumah')?->store('bumil/rumah', 'public');
            $pathJamban = $request->file('unggah_foto_jamban')?->store('bumil/jamban', 'public');

            $kunjunganKe = $master->kunjungans()->count() + 1;

            $kunjungan = BumilKunjungan::create([
                'bumil_master_id' => $master->id,
                'user_id' => $request->user()->id,
                'tpk_member_id' => $request->tpk_member_id,
                'bulan_laporan' => $validated['bulan_laporan'],
                'tahun_laporan' => $validated['tahun_laporan'],
                'tanggal_kunjungan' => $validated['tanggal_kunjungan'],
                'kunjungan_ke' => $kunjunganKe,
                'tim_tpk' => $request->tim_tpk,
                'nama_tpk' => $request->nama_tpk,
                'unsur_tpk' => $request->unsur_tpk,

                'jumlah_anak_dilahirkan' => $validated['jumlah_anak_dilahirkan'],
                'tanggal_lahir_anak_terakhir' => $request->tanggal_lahir_anak_terakhir,
                'memiliki_riwayat_penyakit' => $validated['memiliki_riwayat_penyakit'],
                'riwayat_penyakit' => is_array($request->riwayat_penyakit) ? implode(', ', $request->riwayat_penyakit) : $request->riwayat_penyakit,

                'usia_kehamilan' => $validated['usia_kehamilan'],
                'hpl' => $validated['hpl'],
                'kehamilan_kembar' => $validated['kehamilan_kembar'],
                'faskes_tempat_pemeriksaan' => $validated['faskes_tempat_pemeriksaan'],
                'nama_faskes' => $validated['nama_faskes'],
                'berat_badan_saat_ini' => $validated['berat_badan_saat_ini'],
                'berat_badan_sebelum_hamil' => $validated['berat_badan_sebelum_hamil'],
                'tinggi_badan' => $validated['tinggi_badan'],
                'imt' => $imt,
                'kadar_hb' => $validated['kadar_hb'],
                'lila' => $validated['lila'],
                'tfu' => $request->tfu,
                'tbj' => $request->tbj,

                'paparan_asap_rokok' => $validated['paparan_asap_rokok'],
                'sumber_paparan_asap_rokok' => is_array($request->sumber_paparan_asap_rokok) ? implode(', ', $request->sumber_paparan_asap_rokok) : $request->sumber_paparan_asap_rokok,
                'sumber_paparan_lainnya' => $request->sumber_paparan_lainnya,
                'input_elsimil' => $validated['input_elsimil'],
                'hasil_skrining_elsimil' => $request->hasil_skrining_elsimil,
                'unggah_screenshot_elsimil' => $pathElsimil,

                'sumber_air_minum_utama' => $validated['sumber_air_minum_utama'],
                'fasilitas_jamban' => $validated['fasilitas_jamban'],
                'unggah_foto_depan_rumah' => $pathRumah,
                'unggah_foto_jamban' => $pathJamban,

                'mendapatkan_mms' => $validated['mendapatkan_mms'],
                'konsumsi_mms' => $validated['konsumsi_mms'],
                'alasan_tidak_konsumsi_mms' => $request->alasan_tidak_konsumsi_mms,
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

            if ($request->filled('tindak_lanjut_risiko')) {
                foreach ($request->tindak_lanjut_risiko as $tl) {
                    BumilTindakLanjut::create([
                        'bumil_kunjungan_id' => $kunjungan->id,
                        'faktor_risiko' => $tl['faktor_risiko'],
                        'identifikasi_penyebab' => is_array($tl['identifikasi_penyebab'] ?? null) ? implode(', ', $tl['identifikasi_penyebab']) : ($tl['identifikasi_penyebab'] ?? null),
                        'progres' => $tl['progres'] ?? null,
                        'tindak_lanjut' => $tl['tindak_lanjut'] ?? null,
                        'alasan_belum_dilaksanakan' => $tl['alasan_belum_dilaksanakan'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('bumil.index');
    }

    public function show(BumilMaster $bumil)
    {
        $bumil->load(['kelurahan.kemantren', 'kader', 'kunjungans.tindakLanjuts', 'kunjungans.tpkMember']);

        return Inertia::render('Bumil/Show', [
            'bumil' => $bumil,
        ]);
    }

    public function destroy(Request $request, BumilMaster $bumil)
    {
        $user = $request->user();

        if ($user->role === 'kader' && $bumil->created_by !== $user->id) {
            abort(403);
        }
        if ($user->role === 'admin_kemantren' && $bumil->kelurahan->kemantren_id !== $user->kemantren_id) {
            abort(403);
        }

        $bumil->delete();
        return redirect()->back();
    }
}