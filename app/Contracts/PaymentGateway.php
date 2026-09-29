<?php

namespace App\Contracts;

interface PaymentGateway
{
    public function key(): string;

    public function label(): string;

    public function merchantCode(): string;

    public function instructions(): string;
}
