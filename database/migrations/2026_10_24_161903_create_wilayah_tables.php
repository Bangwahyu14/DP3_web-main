<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kemantrens', function (Blueprint $table) {
            $table->string('id', 6)->primary();
            $table->string('nama', 50);
            $table->timestamps();
        });

        Schema::create('kelurahans', function (Blueprint $table) {
            $table->string('id', 10)->primary();
            $table->string('kemantren_id', 6);
            $table->string('nama', 50);
            $table->timestamps();

            $table->foreign('kemantren_id')->references('id')->on('kemantrens')->onDelete('cascade');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('kemantren_id', 6)->nullable()->after('email');
            $table->string('kelurahan_id', 10)->nullable()->after('kemantren_id');
            $table->string('nomor_wa', 15)->nullable()->after('kelurahan_id');
            $table->string('unsur_tpk', 50)->nullable()->after('nomor_wa');
            $table->boolean('is_active')->default(true)->after('unsur_tpk');

            $table->foreign('kemantren_id')->references('id')->on('kemantrens')->nullOnDelete();
            $table->foreign('kelurahan_id')->references('id')->on('kelurahans')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['kemantren_id']);
            $table->dropForeign(['kelurahan_id']);
            $table->dropColumn(['kemantren_id', 'kelurahan_id', 'nomor_wa', 'unsur_tpk', 'is_active']);
        });

        Schema::dropIfExists('kelurahans');
        Schema::dropIfExists('kemantrens');
    }
};