<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\CountryDialCodes;
use App\Support\PhoneNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'min:3', 'max:30', 'regex:/^[A-Za-z][A-Za-z0-9_]+$/', Rule::unique(User::class, 'name')->ignore($this->user()->id)],
            'phone_country' => ['required', 'in:'.implode(',', CountryDialCodes::codes())],
            'phone' => [
                'required',
                'string',
                'regex:/^\d{6,12}$/',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $full = PhoneNumber::compose((string) $this->input('phone_country'), (string) $value);
                    $taken = User::query()
                        ->where('phone', $full)
                        ->where('id', '!=', $this->user()->id)
                        ->exists();

                    if ($taken) {
                        $fail('That phone number already has an account.');
                    }
                },
            ],
            'email' => [
                'nullable',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $country = preg_replace('/\D+/', '', (string) $this->input('phone_country', $this->user()->phone_country ?: '256')) ?: '256';

        $this->merge([
            'phone_country' => $country,
            'phone' => PhoneNumber::national($country, $this->input('phone')),
            'username' => trim((string) $this->input('username')),
            'email' => $this->input('email') ?: null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): mixed
    {
        $data = parent::validated();
        $data['name'] = $data['username'];
        unset($data['username']);
        $data['phone'] = PhoneNumber::compose($data['phone_country'], $data['phone']);

        if ($key === null) {
            return $data;
        }

        return $data[$key] ?? $default;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.unique' => 'That username is already taken.',
            'username.regex' => 'Use letters, numbers, and underscores. Start with a letter.',
            'phone.regex' => 'Enter the phone number without the country code.',
        ];
    }
}
