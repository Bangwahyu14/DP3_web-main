<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Spatie\Permission\Models\Role;

class WilayahAndUserSeeder extends Seeder
{
    public function run(): void
    {
        $wilayah = [
            ['id' => '347101', 'nama' => 'DANUREJAN', 'kelurahan' => [
                ['id' => '3471011001', 'nama' => 'Suryatmajan'],
                ['id' => '3471011002', 'nama' => 'Tegalpanggung'],
                ['id' => '3471011003', 'nama' => 'Bausasran'],
            ]],
            ['id' => '347102', 'nama' => 'GEDONGTENGEN', 'kelurahan' => [
                ['id' => '3471021001', 'nama' => 'Pringgokusuman'],
                ['id' => '3471021002', 'nama' => 'Sosromenduran'],
            ]],
            ['id' => '347103', 'nama' => 'GONDOKUSUMAN', 'kelurahan' => [
                ['id' => '3471031001', 'nama' => 'Baciro'],
                ['id' => '3471031002', 'nama' => 'Demangan'],
                ['id' => '3471031003', 'nama' => 'Klitren'],
                ['id' => '3471031004', 'nama' => 'Kotabaru'],
                ['id' => '3471031005', 'nama' => 'Terban'],
            ]],
            ['id' => '347104', 'nama' => 'GONDOMANAN', 'kelurahan' => [
                ['id' => '3471041001', 'nama' => 'Prawirodirjan'],
                ['id' => '3471041002', 'nama' => 'Ngupasan'],
            ]],
            ['id' => '347105', 'nama' => 'JETIS', 'kelurahan' => [
                ['id' => '3471051001', 'nama' => 'Bumijo'],
                ['id' => '3471051002', 'nama' => 'Gowongan'],
                ['id' => '3471051003', 'nama' => 'Cokrodiningratan'],
            ]],
            ['id' => '347106', 'nama' => 'KOTAGEDE', 'kelurahan' => [
                ['id' => '3471061001', 'nama' => 'Prenggan'],
                ['id' => '3471061002', 'nama' => 'Purbayan'],
                ['id' => '3471061003', 'nama' => 'Rejowinangun'],
            ]],
            ['id' => '347107', 'nama' => 'KRATON', 'kelurahan' => [
                ['id' => '3471071001', 'nama' => 'Patehan'],
                ['id' => '3471071002', 'nama' => 'Panembahan'],
                ['id' => '3471071003', 'nama' => 'Kadipaten'],
            ]],
            ['id' => '347108', 'nama' => 'MANTRIJERON', 'kelurahan' => [
                ['id' => '3471081001', 'nama' => 'Gedongkiwo'],
                ['id' => '3471081002', 'nama' => 'Suryodiningratan'],
                ['id' => '3471081003', 'nama' => 'Mantrijeron'],
            ]],
            ['id' => '347109', 'nama' => 'MERGANGSAN', 'kelurahan' => [
                ['id' => '3471091001', 'nama' => 'Brontokusuman'],
                ['id' => '3471091002', 'nama' => 'Keparakan'],
                ['id' => '3471091003', 'nama' => 'Wirogunan'],
            ]],
            ['id' => '347110', 'nama' => 'NGAMPILAN', 'kelurahan' => [
                ['id' => '3471101001', 'nama' => 'Notoprajan'],
                ['id' => '3471101002', 'nama' => 'Ngampilan'],
            ]],
            ['id' => '347111', 'nama' => 'PAKUALAMAN', 'kelurahan' => [
                ['id' => '3471111001', 'nama' => 'Purwokinanti'],
                ['id' => '3471111002', 'nama' => 'Gunungketur'],
            ]],
            ['id' => '347112', 'nama' => 'TEGALREJO', 'kelurahan' => [
                ['id' => '3471121001', 'nama' => 'Kricak'],
                ['id' => '3471121002', 'nama' => 'Karangwaru'],
                ['id' => '3471121003', 'nama' => 'Tegalrejo'],
                ['id' => '3471121004', 'nama' => 'Bener'],
            ]],
            ['id' => '347113', 'nama' => 'UMBULHARJO', 'kelurahan' => [
                ['id' => '3471131001', 'nama' => 'Giwangan'],
                ['id' => '3471131002', 'nama' => 'Sorosutan'],
                ['id' => '3471131003', 'nama' => 'Pandeyan'],
                ['id' => '3471131004', 'nama' => 'Warungboto'],
                ['id' => '3471131005', 'nama' => 'Tahunan'],
                ['id' => '3471131006', 'nama' => 'Muja Muju'],
                ['id' => '3471131007', 'nama' => 'Semaki'],
            ]],
            ['id' => '347114', 'nama' => 'WIROBRAJAN', 'kelurahan' => [
                ['id' => '3471141001', 'nama' => 'Pakuncen'],
                ['id' => '3471141002', 'nama' => 'Wirobrajan'],
                ['id' => '3471141003', 'nama' => 'Patangpuluhan'],
            ]],
        ];

        foreach ($wilayah as $k) {
            DB::table('kemantrens')->updateOrInsert(
                ['id' => $k['id']],
                ['nama' => $k['nama'], 'created_at' => now(), 'updated_at' => now()]
            );

            foreach ($k['kelurahan'] as $kel) {
                DB::table('kelurahans')->updateOrInsert(
                    ['id' => $kel['id']],
                    ['kemantren_id' => $k['id'], 'nama' => $kel['nama'], 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }

        $roles = ['superadmin', 'admin_kemantren', 'kader'];
        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r, 'guard_name' => 'web']);
        }

        $superAdmin = User::updateOrCreate(
            ['email' => 'superadmin@jogjakota.go.id'],
            [
                'name' => 'Super Administrator DP3AP2KB',
                'password' => Hash::make('password123'),
                'is_active' => true,
            ]
        );
        $superAdmin->syncRoles(['superadmin']);

        $adminDanurejan = User::updateOrCreate(
            ['email' => 'admin.danurejan@jogjakota.go.id'],
            [
                'name' => 'Admin Kemantren Danurejan',
                'password' => Hash::make('password123'),
                'kemantren_id' => '347101',
                'is_active' => true,
            ]
        );
        $adminDanurejan->syncRoles(['admin_kemantren']);

        $kaderSuryatmajan = User::updateOrCreate(
            ['email' => 'kader.suryatmajan@jogjakota.go.id'],
            [
                'name' => 'Siti Aminah, A.Md.Keb',
                'password' => Hash::make('password123'),
                'kemantren_id' => '347101',
                'kelurahan_id' => '3471011001',
                'nomor_wa' => '081234567890',
                'unsur_tpk' => 'Bidan',
                'is_active' => true,
            ]
        );
        $kaderSuryatmajan->syncRoles(['kader']);
    }
}