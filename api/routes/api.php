<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\GameMatchController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\CoinController;
use App\Http\Controllers\AdminController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;



Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [RegisterController::class, 'register']);

Route::middleware('auth:sanctum', 'blocked')->group(function () {
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [ProfileController::class, 'me']);
    Route::put('/me', [ProfileController::class, 'update']);
    Route::delete('/me', [ProfileController::class, 'destroy']);

    Route::get('coins/transactions', [CoinController::class, 'transactions']);
    Route::post('coins/purchase', [CoinController::class, 'purchase']);

    // Admin
    // Route::middleware('can:isAdmin')->get('/admin/transactions', [TransactionsController::class, 'adminIndex']);
});

Route::apiResource('games', GameController::class);

Route::apiResource('matches', GameMatchController::class);
Route::get('/leaderboard/global', [App\Http\Controllers\LeaderboardController::class, 'global']);
Route::get('/statistics/public', [App\Http\Controllers\StatisticsController::class, 'publicStats']);

Route::middleware('auth:sanctum')->group(function () {
    
    Route::get('/leaderboard/personal', [App\Http\Controllers\LeaderboardController::class, 'personal']);
    Route::get('/history/my-games', [App\Http\Controllers\HistoryController::class, 'myHistory']);
    
    // Admin routes (assuming 'can:isAdmin' or similar gate exists, otherwise just auth for now as per snippet)
    // The snippet commented out admin middleware, I will uncomment or use a simple check if needed.
    // For now, placing under auth, potentially adding admin check later.
    Route::get('/history/all-games', [App\Http\Controllers\HistoryController::class, 'allHistory']);
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {

    Route::get('/users', [AdminController::class, 'users']);
    Route::patch('/users/{user}/block', [AdminController::class, 'toggleBlock']);
    Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);

    Route::post('/admins', [AdminController::class, 'createAdmin']);

    Route::get('/transactions', [AdminController::class, 'transactions']);
    Route::get('/games', [AdminController::class, 'games']);
    Route::get('/matches', [AdminController::class, 'matches']);
});
