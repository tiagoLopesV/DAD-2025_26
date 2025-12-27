<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseCoinsRequest extends FormRequest
{
    public function authorize() {
        return true;
    }

    public function rules() {
        return [
            'payment_type' => 'required|in:MBWAY,PAYPAL,IBAN,MB,VISA',
            'payment_reference' => 'required|string',
            'euros' => 'required|integer|min:1|max:99',
        ];
    }
}
