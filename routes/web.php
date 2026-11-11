
<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CatinController;
use App\Http\Controllers\BulinController;
use App\Http\Controllers\BumilController;
use App\Http\Controllers\BadutaController;
use App\Http\Controllers\AnalyticsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {

    // DASHBOARD SETELAH LOGIN
    Route::get('/dashboard', function () {
        $user = auth()->user();

        // Superadmin & Admin Kemantren
        // langsung menuju Progress Analytics Catin
        if ($user->hasAnyRole([
            'superadmin',
            'admin_kemantren'
        ])) {
            return redirect()->route('analytics.index', [
                'module' => 'catin'
            ]);
        }

        // Kader tetap masuk ke dashboard biasa
        return Inertia::render('Dashboard');

    })->name('dashboard');

    // MODUL DATA SASARAN TPK
    Route::resource('catin', CatinController::class)
        ->only(['index', 'create', 'store']);

    Route::resource('bulin', BulinController::class);
    Route::resource('bumil', BumilController::class);
    Route::resource('baduta', BadutaController::class);

    // MODUL DATA ANALYTICS SIM-TPK
    Route::get('/analytics', [
        AnalyticsController::class,
        'index'
    ])->name('analytics.index');

    // PENGECEKAN NIK
    Route::get('/catin/check-nik/{nik}', [
        CatinController::class,
        'checkNik'
    ])->name('catin.checkNik');

    Route::get('/bulin/check-nik', [
        BulinController::class,
        'checkNik'
    ])->name('bulin.check-nik');

    Route::get('/bumil/check-nik', [
        BumilController::class,
        'checkNik'
    ])->name('bumil.check-nik');

    Route::get('/baduta/check-nik', [
        BadutaController::class,
        'checkNik'
    ])->name('baduta.check-nik');

    // PROFIL PENGGUNA
    Route::get('/profile', [
        ProfileController::class,
        'edit'
    ])->name('profile.edit');

    Route::patch('/profile', [
        ProfileController::class,
        'update'
    ])->name('profile.update');

    Route::delete('/profile', [
        ProfileController::class,
        'destroy'
    ])->name('profile.destroy');
});

require __DIR__.'/auth.php';
