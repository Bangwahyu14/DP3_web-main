<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bumil_masters', function (Blueprint $table) {
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
            $table->string('status_risiko')->default('tidak_berisiko');
            $table->timestamps();

            $table->foreign('kemantren_id')->references('id')->on('kemantrens')->cascadeOnDelete();
            $table->foreign('kelurahan_id')->references('id')->on('kelurahans')->cascadeOnDelete();
        });

        Schema::create('bumil_kunjungans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bumil_master_id')->constrained('bumil_masters')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tpk_member_id')->nullable()->constrained('tpk_members')->nullOnDelete();

            $table->string('bulan_laporan');
            $table->string('tahun_laporan');
            $table->date('tanggal_kunjungan');
            $table->integer('kunjungan_ke')->default(1);
            $table->string('tim_tpk')->nullable();
            $table->string('nama_tpk')->nullable();
            $table->string('unsur_tpk')->nullable();

            // Riwayat Kehamilan & Penyakit
            $table->integer('jumlah_anak_dilahirkan')->default(0);
            $table->date('tanggal_lahir_anak_terakhir')->nullable();
            $table->string('memiliki_riwayat_penyakit', 10);
            $table->text('riwayat_penyakit')->nullable();

            // Pemeriksaan Kehamilan
            $table->integer('usia_kehamilan'); // minggu
            $table->date('hpl');
            $table->string('kehamilan_kembar', 10);
            $table->string('faskes_tempat_pemeriksaan');
            $table->string('nama_faskes');
            $table->decimal('berat_badan_saat_ini', 5, 2);
            $table->decimal('berat_badan_sebelum_hamil', 5, 2);
            $table->decimal('tinggi_badan', 5, 2);
            $table->decimal('imt', 5, 2);
            $table->decimal('kadar_hb', 4, 1)->nullable();
            $table->decimal('lila', 4, 1);
            $table->decimal('tfu', 4, 1)->nullable();
            $table->integer('tbj')->nullable(); // gram

            // Skrining
            $table->string('paparan_asap_rokok', 20);
            $table->text('sumber_paparan_asap_rokok')->nullable();
            $table->string('sumber_paparan_lainnya')->nullable();
            $table->string('input_elsimil', 10);
            $table->string('hasil_skrining_elsimil')->nullable();
            $table->string('unggah_screenshot_elsimil')->nullable();

            // Lingkungan & Fasilitasi
            $table->string('sumber_air_minum_utama');
            $table->string('fasilitas_jamban');
            $table->string('unggah_foto_depan_rumah')->nullable();
            $table->string('unggah_foto_jamban')->nullable();

            $table->string('mendapatkan_mms', 10);
            $table->string('konsumsi_mms', 10);
            $table->string('alasan_tidak_konsumsi_mms')->nullable();
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

            $table->json('faktor_risiko')->nullable();
            $table->string('berisiko', 20);
            $table->timestamps();
        });

        Schema::create('bumil_tindak_lanjuts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bumil_kunjungan_id')->constrained('bumil_kunjungans')->cascadeOnDelete();
            $table->string('faktor_risiko');
            $table->text('identifikasi_penyebab')->nullable();
            $table->string('progres', 20)->nullable();
            $table->string('tindak_lanjut', 30)->nullable();
            $table->text('alasan_belum_dilaksanakan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bumil_tindak_lanjuts');
        Schema::dropIfExists('bumil_kunjungans');
        Schema::dropIfExists('bumil_masters');
    }
};