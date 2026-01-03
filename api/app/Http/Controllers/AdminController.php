<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CoinTransaction;
//use App\Models\Game;
//use App\Models\Match;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    // 1. List all users
    public function users()
    {
        return User::withTrashed()->get();
    }

    // 2. Block / unblock player
    public function toggleBlock(User $user)
    {
        if ($user->type === 'A') {
            return response()->json(['error' => 'Cannot block admins'], 403);
        }

        $user->blocked = !$user->blocked;
        $user->save();

        return response()->json($user);
    }

    // 3. Create admin
    public function createAdmin(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'nickname' => 'required|unique:users',
            'password' => 'required|min:3'
        ]);

        $admin = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'nickname' => $request->nickname,
            'password' => Hash::make($request->password),
            'type' => 'A',
            'blocked' => false,
            'coins_balance' => 0
        ]);

        return response()->json($admin, 201);
    }

    // 4. Delete user
public function deleteUser(User $user)
{
    if ($user->id === auth()->id()) {
        return response()->json(['error' => 'Cannot delete yourself'], 403);
    }

    // if ($user->type === 'A') {
    //     return response()->json(['error' => 'Cannot delete other admins'], 403);
    // }

    $hasHistory =
        $user->coinTransactions()->exists() ||
        (method_exists($user, 'games') && $user->games()->exists()) ||
        (method_exists($user, 'matches') && $user->matches()->exists());

    if ($hasHistory || $user->isAdmin()) {
        $user->delete(); // soft delete
    } else {
        $user->forceDelete(); // permanent delete
    }

    return response()->json(['success' => true]);
}


    // 5. View all transactions (read-only)
    public function transactions()
    {
        return CoinTransaction::with(['user', 'type'])
            ->orderByDesc('transaction_datetime')
            ->get();
    }

    // 6. View all games & matches
    public function games()
    {
        return Game::with(['player1', 'player2'])->get();
    }

    // public function matches()
    // {
    //     return Match::with(['player1', 'player2'])->get();
    // }
}
