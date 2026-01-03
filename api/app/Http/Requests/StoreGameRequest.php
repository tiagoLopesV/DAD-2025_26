<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGameRequest extends FormRequest
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
            // Identificação dos Jogadores
            'player1_user_id' => ['required', 'integer', 'exists:users,id'],
            'player2_user_id' => ['required', 'integer', 'exists:users,id', 'different:player1_user_id'],
            
            // Definições do Jogo
            'type' => ['required', Rule::in(['3', '9'])], // Bisca de 3 ou 9
            'status' => ['required', Rule::in(['Pending', 'Playing', 'Ended', 'Interrupted'])],
            'match_id' => ['nullable', 'integer', 'exists:matches,id'],
            
            // Resultado e Pontuação
            'winner_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'loser_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'is_draw' => ['required', 'boolean'],
            'player1_points' => ['required', 'integer', 'min:0', 'max:120'],
            'player2_points' => ['required', 'integer', 'min:0', 'max:120'],
            
            // Tempos
            'began_at' => ['required', 'date'],
            'ended_at' => ['nullable', 'date', 'after_or_equal:began_at'],
            'total_time' => ['nullable', 'integer', 'min:0'],
            
            // Campo JSON customizado
            'custom' => ['nullable', 'json'],
        ];
    }

    /**
     * Get the validation messages for invalid fields.
     */
    public function messages(): array
    {
        return [
            'type.in' => 'O tipo deve ser 3 (Bisca de 3) ou 9 (Bisca de 9).',
            'status.in' => 'Status inválido. Use: Pending, Playing, Ended ou Interrupted.',
            'winner_user_id.required_if' => 'É necessário indicar um vencedor se não houver empate.',
            'player1_points.max' => 'A pontuação máxima permitida é 120.',
            'player2_user_id.different' => 'O jogador 2 deve ser diferente do jogador 1.',
        ];
    }
}
