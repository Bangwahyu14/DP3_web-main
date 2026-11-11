<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BulinTindakLanjut extends Model
{
    use HasFactory;

    protected $fillable = [
        'bulin_kunjungan_id', 'faktor_risiko', 'progres',
        'tindak_lanjut', 'alasan_belum_dilaksanakan'
    ];
}