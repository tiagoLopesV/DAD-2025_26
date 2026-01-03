<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMatchRequest;
use App\Models\GameMatch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GameMatchController extends Controller
{
    public function index(Request $request)
    {
        $query = GameMatch::query()->with(['player1', 'player2', 'winner']);

        if ($request->has('user_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('player1_user_id', $request->user_id)
                    ->orWhere('player2_user_id', $request->user_id);
            });
        }

        return $query->orderBy('began_at', 'desc')->paginate(10);
    }

    public function store(StoreMatchRequest $request)
    {
        $match = DB::transaction(function () use ($request) {
            $existingMatch = GameMatch::find($request->id);
            $previousStatus = $existingMatch ? $existingMatch->status : null;

            // Regra: Mínimo 3, Máximo 100
            $stake = max(3, min($request->input('stake', 3), 100));

            $match = GameMatch::updateOrCreate(
                ['id' => $request->id],
                array_merge($request->validated(), ['stake' => $stake])
            );

            $match->refresh();

            // --- DÉBITO: Início do Match ---
            if ($match->status === 'Playing' && $previousStatus !== 'Playing') {
                $this->handleCoinMovement($match->player1_user_id, $stake, 'Match stake', $match->id);
                $this->handleCoinMovement($match->player2_user_id, $stake, 'Match stake', $match->id);
            }

            // --- Crédito no fim do Match ---
            if ($match->status === 'Ended' && $previousStatus !== 'Ended') {
                // Se o winner_user_id veio vazio mas alguém tem 4 marcas, força o vencedor
                if (!$match->winner_user_id) {
                    if ($match->player1_marks >= 4)
                        $match->winner_user_id = $match->player1_user_id;
                    elseif ($match->player2_marks >= 4)
                        $match->winner_user_id = $match->player2_user_id;
                }

                if ($match->winner_user_id) {
                    $prize = ($match->stake * 2) - 1;
                    $this->handleCoinMovement($match->winner_user_id, $prize, 'Match payout', $match->id);
                } else {
                    // Devolve o stake original a cada um usando o tipo oficial
                    $this->handleCoinMovement($match->player1_user_id, $match->stake, 'Match payout', $match->id);
                    $this->handleCoinMovement($match->player2_user_id, $match->stake, 'Match payout', $match->id);
                }
            }

            return $match;
        });

        return response()->json($match, 201);
    }

    public function show(GameMatch $gameMatch)
    {
        return $gameMatch->load(['player1', 'player2', 'games']);
    }

    public function update(StoreMatchRequest $request, GameMatch $gameMatch)
    {
        return $this->store($request);
    }

    public function destroy(GameMatch $gameMatch)
    {
        $gameMatch->delete();
        return response()->json(null, 204);
    }

    private function handleCoinMovement($userId, $amount, $typeName, $matchId = null, $gameId = null)
    {
        $type = \App\Models\CoinTransactionType::where('name', $typeName)->first();

        if (!$type) {
            Log::error("ERRO: Tipo de transação '$typeName' não existe na BD!");
            return; // Ou throw Exception
        }

        // Se o tipo for 'D' (Debit), o valor gravado deve ser NEGATIVO
        // Se o tipo for 'C' (Credit), o valor gravado deve ser POSITIVO
        $finalAmount = ($type->type === 'D') ? -abs($amount) : abs($amount);

        \App\Models\CoinTransaction::create([
            'transaction_datetime' => now(),
            'user_id' => $userId,
            'match_id' => $matchId,
            'game_id' => null,
            'coin_transaction_type_id' => $type->id,
            'coins' => $finalAmount,
        ]);

        $user = \App\Models\User::findOrFail($userId);
        $user->increment('coins_balance', $finalAmount);
    }
}
