<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BulinKunjungan extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'faktor_risiko' => 'array',
        'tanggal_kunjungan' => 'date',
        'tanggal_persalinan' => 'date',
    ];

    public function master(): BelongsTo
    {
        return $this->belongsTo(BulinMaster::class, 'bulin_master_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tpkMember(): BelongsTo
    {
        return $this->belongsTo(TpkMember::class, 'tpk_member_id');
    }

    public function tindakLanjuts(): HasMany
    {
        return $this->hasMany(BulinTindakLanjut::class, 'bulin_kunjungan_id');
    }
}