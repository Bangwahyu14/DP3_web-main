<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BadutaTindakLanjut extends Model
{
    use HasFactory;

    protected $fillable = [
        'baduta_kunjungan_id', 'faktor_risiko', 'identifikasi_penyebab',
        'progres', 'tindak_lanjut', 'alasan_belum_dilaksanakan'
    ];
}