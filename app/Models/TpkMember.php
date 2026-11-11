<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TpkMember extends Model
{
    use HasFactory;

    protected $table = 'tpk_members';

    protected $fillable = [
        'user_id',
        'nama_anggota',
        'unsur',
        'no_wa',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}