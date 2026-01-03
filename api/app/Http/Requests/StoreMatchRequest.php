<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['3', '9'])],
            'player1_user_id' => ['required', 'integer', 'exists:users,id'],
            'player2_user_id' => ['required', 'integer', 'exists:users,id', 'different:player1_user_id'],
            'winner_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'loser_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['required', Rule::in(['Pending', 'Playing', 'Ended', 'Interrupted'])],
            
            // Stake é obrigatório em Matches conforme o enunciado
            'stake' => ['required', 'numeric', 'min:0'],
            
            // Marcas (0 a 4+)
            'player1_marks' => ['required', 'integer', 'min:0', 'max:10'],
            'player2_marks' => ['required', 'integer', 'min:0', 'max:10'],
            
            // Pontos acumulados (pode passar de 120 pois é a soma de vários jogos)
            'player1_points' => ['required', 'integer', 'min:0'],
            'player2_points' => ['required', 'integer', 'min:0'],
            
            'began_at' => ['required', 'date'],
            'ended_at' => ['nullable', 'date', 'after_or_equal:began_at'],
            'total_time' => ['nullable', 'integer', 'min:0'],
            'custom' => ['nullable', 'json'],
        ];
    }
}
