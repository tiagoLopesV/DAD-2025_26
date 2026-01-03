<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGameRequest;
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GameController extends Controller
{
    public function index(Request $request)
    {
        $query = Game::query()->with(['winner']);

        if ($request->has('type') && in_array($request->type, ['3', '9'])) {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && in_array($request->status, ['Pending', 'Playing', 'Ended', 'Interrupted'])) {
            $query->where('status', $request->status);
        }

        $sortField = $request->input('sort_by', 'began_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSortFields = ['began_at', 'ended_at', 'total_time', 'type', 'status'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        $perPage = $request->input('per_page', 15);
        $games = $query->paginate($perPage);

        return response()->json([
            'data' => $games->items(),
            'meta' => [
                'current_page' => $games->currentPage(),
                'last_page' => $games->lastPage(),
                'per_page' => $games->perPage(),
                'total' => $games->total()
            ]
        ]);
    }

    public function store(StoreGameRequest $request)
    {
        $game = DB::transaction(function () use ($request) {
            $existingGame = Game::find($request->id);
            $previousStatus = $existingGame ? $existingGame->status : null;

            $game = Game::updateOrCreate(
                ['id' => $request->id],
                $request->validated()
            );

            // --- Debit 2 coins on start ---
            if ($game->status === 'Playing' && $previousStatus !== 'Playing' && !$game->match_id) {
                $this->handleCoinMovement($game->player1_user_id, 2, 'Game fee', null, $game->id);
                $this->handleCoinMovement($game->player2_user_id, 2, 'Game fee', null, $game->id);
            }

            // --- Credit payout at end ---
            if ($game->status === 'Ended' && $previousStatus !== 'Ended' && !$game->match_id) {
                $this->processStandalonePayout($game);
            }

            return $game;
        });

        return response()->json($game, 201);
    }

    public function show(Game $game)
    {
        return $game;
    }

    public function update(StoreGameRequest $request, Game $game)
    {
        return $this->store($request);
    }

    public function destroy(Game $game)
    {
        $game->delete();
        return response()->json(null, 204);
    }

    private function processStandalonePayout($game)
    {
        if ($game->is_draw) {
            // Cada jogador recebe 1 moeda de volta usando o tipo oficial
            $this->handleCoinMovement($game->player1_user_id, 1, 'Game payout', null, $game->id);
            $this->handleCoinMovement($game->player2_user_id, 1, 'Game payout', null, $game->id);
            return;
        }

        if ($game->winner_user_id) {
            $winnerPoints = ($game->winner_user_id == $game->player1_user_id)
                ? $game->player1_points : $game->player2_points;

            $payout = 3;
            if ($winnerPoints >= 120)
                $payout = 6;
            elseif ($winnerPoints >= 91)
                $payout = 4;

            $this->handleCoinMovement($game->winner_user_id, $payout, 'Game payout', null, $game->id);
        }
    }

    private function handleCoinMovement($userId, $amount, $typeName, $matchId = null, $gameId = null)
    {
        // 1️⃣ Find the coin transaction type
        $type = \App\Models\CoinTransactionType::where('name', $typeName)->first();
        if (!$type) {
            throw new \Exception("Coin transaction type not found: $typeName");
        }

        // 2️⃣ Compute the final coins value
        $coins = ($type->type === 'D') ? -$amount : $amount;

        // 3️⃣ Insert the transaction
        \App\Models\CoinTransaction::create([
            'transaction_datetime' => now(),
            'user_id' => $userId,
            'match_id' => $matchId,
            'game_id' => $gameId,
            'coin_transaction_type_id' => $type->id,
            'coins' => $coins,
            'custom' => null, // optional JSON
        ]);

        // 4️⃣ Update user's balance
        $user = \App\Models\User::findOrFail($userId);
        $user->increment('coins_balance', $coins);
    }
}
