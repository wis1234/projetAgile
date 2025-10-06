<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\ZoomMeetingController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Protected API routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Search user by email
    Route::post('/users/search-by-email', [UserController::class, 'searchByEmail'])
        ->name('api.users.search-by-email');
        
    // Zoom Meeting Routes
    Route::prefix('projects/{project}')->group(function () {
        Route::get('/zoom/active', [ZoomMeetingController::class, 'active'])->name('api.zoom.active');
        Route::get('/zoom/recent', [ZoomMeetingController::class, 'recent'])->name('api.zoom.recent');
        Route::post('/zoom/meetings', [ZoomMeetingController::class, 'store'])->name('api.zoom.store');
        Route::get('/zoom/meetings/{meeting}', [ZoomMeetingController::class, 'show'])->name('api.zoom.show');
        Route::put('/zoom/meetings/{meeting}/end', [ZoomMeetingController::class, 'end'])->name('api.zoom.end');
    });
});
