<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseCoinsRequest;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use App\Models\CoinPurchase;
use App\Events\CoinUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class CoinController extends Controller
{
    // Get transaction history
    public function transactions()
    {
        $user = auth()->user();
        $transactions = CoinTransaction::with('type')
            ->where('user_id', $user->id)
            ->orderBy('transaction_datetime', 'desc')
            ->get();

        return response()->json($transactions);
    }

    // Purchase coins
    public function purchase(PurchaseCoinsRequest $request)
    {
        $user = auth()->user();
        $euros = $request->euros;
        $coinsToAdd = $euros * 10;

        // Validate MBWAY reference before proceeding
        if ($request->payment_type === 'MBWAY' && !preg_match('/^\d{9}$/', $request->payment_reference)) {
            return response()->json([
                'error' => 'Invalid MBWAY reference',
                'details' => 'MBWAY reference must be exactly 9 digits.'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Call external payment gateway
            $response = Http::post('https://dad-payments-api.vercel.app/api/debit', [
                'type' => $request->payment_type,
                'reference' => $request->payment_reference,
                'value' => $euros
            ]);

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Payment failed',
                    'details' => $response->json() ?? $response->body()
                ], 422);
            }

            // Create transaction type if not exists
            $type = CoinTransactionType::firstOrCreate([
                'name' => 'Coin purchase',
                'type' => 'C'
            ]);

            // Log coin transaction
            $transaction = CoinTransaction::create([
                'transaction_datetime' => now(),
                'user_id' => $user->id,
                'coin_transaction_type_id' => $type->id,
                'coins' => $coinsToAdd,
            ]);

            // Log coin purchase
            CoinPurchase::create([
                'purchase_datetime' => now(),
                'user_id' => $user->id,
                'coin_transaction_id' => $transaction->id,
                'euros' => $euros,
                'payment_type' => $request->payment_type,
                'payment_reference' => $request->payment_reference,
            ]);

            // Update user's balance
            $user->increment('coins_balance', $coinsToAdd);

            DB::commit();

            // Broadcast balance change only to this user
            broadcast(new CoinUpdated($user->id, $user->coins_balance))->toOthers();

            return response()->json([
                'message' => 'Coins purchased successfully',
                'balance' => $user->coins_balance
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            // Include more detailed info for debugging
            return response()->json([
                'error' => 'Purchase failed',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
