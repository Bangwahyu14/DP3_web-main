<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Kemantren;
use App\Models\Kelurahan;
use App\Models\TpkMember;
use Illuminate\Database\Seeder;

class RoleUserSeeder extends Seeder
{
    public function run(): void
    {
        $kemantren = Kemantren::first();
        $kelurahan = $kemantren 
            ? Kelurahan::where('kemantren_id', $kemantren->id)->first() 
            : Kelurahan::first();

        // 1. SuperAdmin
        User::updateOrCreate(
            ['email' => 'superadmin@jogjakota.go.id'],
            [
                'name' => 'SuperAdmin DP3AP2KB',
                'nik' => '3471010000000001',
                'no_wa' => '081200000001',
                'password' => 'super12377',
                'role' => 'superadmin',
                'is_active' => true,
                'kemantren_id' => null,
                'kelurahan_id' => null,
            ]
        );

        // 2. Admin Kemantren
        User::updateOrCreate(
            ['email' => 'admin.kemantren@jogjakota.go.id'],
            [
                'name' => 'Admin Kemantren ' . ($kemantren ? $kemantren->nama : 'Wilayah'),
                'nik' => '3471010000000002',
                'no_wa' => '081200000002',
                'password' => 'admin12377',
                'role' => 'admin_kemantren',
                'is_active' => true,
                'kemantren_id' => $kemantren?->id,
                'kelurahan_id' => null,
            ]
        );

        // 3. Kader TPK
        $kader = User::updateOrCreate(
            ['email' => 'kader.tpk@jogjakota.go.id'],
            [
                'name' => 'Tim TPK ' . ($kelurahan ? $kelurahan->nama : 'Wilayah') . ' 01',
                'nik' => '3471010000000003',
                'no_wa' => '081200000003',
                'password' => 'kader12377',
                'role' => 'kader',
                'is_active' => true,
                'kemantren_id' => $kemantren?->id,
                'kelurahan_id' => $kelurahan?->id,
            ]
        );

        // 4 Anggota untuk Tim TPK ini
        $members = [
            ['nama_anggota' => 'Bdn. Rina Astuti, S.Tr.Keb', 'unsur' => 'Bidan'],
            ['nama_anggota' => 'Siti Aminah', 'unsur' => 'Kader PKK'],
            ['nama_anggota' => 'Tri Wahyuni', 'unsur' => 'Kader KB'],
            ['nama_anggota' => 'Endang Sulistyo', 'unsur' => 'Kader KB'],
        ];

        foreach ($members as $m) {
            TpkMember::firstOrCreate(
                ['user_id' => $kader->id, 'nama_anggota' => $m['nama_anggota']],
                ['unsur' => $m['unsur']]
            );
        }
    }
}