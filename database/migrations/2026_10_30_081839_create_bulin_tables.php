<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Data Master Ibu Pascasalin (Identitas Permanen per NIK)
        Schema::create('bulin_masters', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 16)->unique();
            $table->string('nama');
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir');
            $table->text('alamat');
            $table->string('rt', 5);
            $table->string('rw', 5);
            $table->string('nomor_whatsapp', 20)->nullable();
            $table->boolean('domisili_min_6_bulan')->default(true);
            $table->string('kemantren_id', 20);
            $table->string('kelurahan_id', 20);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('status_risiko')->default('tidak_berisiko'); // berisiko / tidak_berisiko
            $table->timestamps();

            $table->foreign('kemantren_id')->references('id')->on('kemantrens')->cascadeOnDelete();
            $table->foreign('kelurahan_id')->references('id')->on('kelurahans')->cascadeOnDelete();
        });

        // 2. Data Kunjungan Pendampingan Bulin
        Schema::create('bulin_kunjungans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulin_master_id')->constrained('bulin_masters')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tpk_member_id')->nullable()->constrained('tpk_members')->nullOnDelete();
            
            // Tahap 1 - Wilayah & Waktu
            $table->string('bulan_laporan');
            $table->string('tahun_laporan');
            $table->date('tanggal_kunjungan');
            $table->integer('kunjungan_ke')->default(1);
            $table->string('tim_tpk')->nullable();
            $table->string('nama_tpk')->nullable();
            $table->string('unsur_tpk')->nullable();

            // Tahap 3 - Persalinan & Kesehatan
            $table->date('tanggal_persalinan');
            $table->string('faskes_tempat_bersalin');
            $table->string('nama_faskes');
            $table->string('metode_persalinan');
            $table->string('komplikasi', 10); // Ya / Tidak
            $table->text('jenis_komplikasi')->nullable();
            $table->string('komplikasi_lainnya')->nullable();
            $table->string('kondisi_bayi', 20); // Sehat / Meninggal

            $table->string('paparan_asap_rokok', 20); // Tidak / Pasif / Aktif
            $table->text('sumber_paparan_asap_rokok')->nullable();
            $table->string('sumber_paparan_lainnya')->nullable();
            $table->string('mendapatkan_ttd', 10);
            $table->string('konsumsi_ttd', 10);
            $table->string('alasan_tidak_konsumsi_ttd')->nullable();
            $table->string('input_elsimil', 10);
            $table->string('hasil_skrining_elsimil')->nullable();
            $table->string('unggah_screenshot_elsimil')->nullable();

            // KB Pascapersalinan
            $table->string('menggunakan_kbpp', 10);
            $table->string('jenis_kbpp')->nullable();
            $table->string('alasan_menggunakan_kbpp')->nullable();
            $table->string('alasan_tidak_kbpp')->nullable();

            // Tahap 4 - Lingkungan & Intervensi
            $table->string('sumber_air_minum_utama');
            $table->string('fasilitas_jamban');
            $table->string('unggah_foto_depan_rumah')->nullable();
            $table->string('unggah_foto_jamban')->nullable();

            $table->string('mendapatkan_mbg_3b', 10);
            $table->string('mendapatkan_pmt', 30);
            $table->string('sumber_pmt')->nullable();
            $table->string('fasilitasi_bantuan_sosial');
            $table->string('memberikan_penyuluhan');
            $table->text('penyuluhan_kie')->nullable();
            $table->string('fasilitasi_rujukan_faskes');
            $table->string('sasaran_mudah_ditemui', 10);
            $table->string('sasaran_kooperatif', 10);
            $table->text('catatan')->nullable();

            // Faktor Risiko Terdeteksi
            $table->json('faktor_risiko')->nullable();
            $table->string('berisiko', 20); // Berisiko / Tidak Berisiko
            $table->timestamps();
        });

        // 3. Tindak Lanjut Per Faktor Risiko
        Schema::create('bulin_tindak_lanjuts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulin_kunjungan_id')->constrained('bulin_kunjungans')->cascadeOnDelete();
            $table->string('faktor_risiko');
            $table->string('progres', 20)->nullable();
            $table->string('tindak_lanjut', 30)->nullable();
            $table->text('alasan_belum_dilaksanakan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulin_tindak_lanjuts');
        Schema::dropIfExists('bulin_kunjungans');
        Schema::dropIfExists('bulin_masters');
    }
};