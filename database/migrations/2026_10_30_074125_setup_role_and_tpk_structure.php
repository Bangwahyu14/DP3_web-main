<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah kolom penugasan & role ke tabel users secara selektif
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'nik')) {
                $table->string('nik', 16)->nullable()->after('name');
            }
            if (!Schema::hasColumn('users', 'no_wa')) {
                $table->string('no_wa', 20)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['superadmin', 'admin_kemantren', 'kader'])->default('kader')->after('password');
            }
            if (!Schema::hasColumn('users', 'kemantren_id')) {
                $table->string('kemantren_id')->nullable()->after('role');
                $table->foreign('kemantren_id')->references('id')->on('kemantrens')->nullOnDelete();
            }
            if (!Schema::hasColumn('users', 'kelurahan_id')) {
                $table->string('kelurahan_id')->nullable()->after('kemantren_id');
                $table->foreign('kelurahan_id')->references('id')->on('kelurahans')->nullOnDelete();
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('kelurahan_id');
            }
        });

        // 2. Buat tabel anggota tim TPK jika belum ada
        if (!Schema::hasTable('tpk_members')) {
            Schema::create('tpk_members', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('nama_anggota');
                $table->enum('unsur', ['Bidan', 'Kader PKK', 'Kader KB', 'Tenaga Kesehatan Lain']);
                $table->string('no_wa', 20)->nullable();
                $table->timestamps();
            });
        }

        // 3. Tambah relasi tpk_member_id ke tabel kunjungan jika belum ada
        Schema::table('catin_kunjungans', function (Blueprint $table) {
            if (!Schema::hasColumn('catin_kunjungans', 'tpk_member_id')) {
                $table->foreignId('tpk_member_id')->nullable()->after('user_id')->constrained('tpk_members')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('catin_kunjungans', function (Blueprint $table) {
            if (Schema::hasColumn('catin_kunjungans', 'tpk_member_id')) {
                $table->dropForeign(['tpk_member_id']);
                $table->dropColumn('tpk_member_id');
            }
        });

        Schema::dropIfExists('tpk_members');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_active')) $table->dropColumn('is_active');
            if (Schema::hasColumn('users', 'role')) $table->dropColumn('role');
            if (Schema::hasColumn('users', 'no_wa')) $table->dropColumn('no_wa');
            if (Schema::hasColumn('users', 'nik')) $table->dropColumn('nik');
        });
    }
};