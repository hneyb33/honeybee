<?php

return [

    /*
    | Merchant codes come from the host environment (Railway variables).
    | While both are empty, choosing a plan activates it immediately.
    | When a code is set, that network uses the manual payment flow.
    */

    'mtn' => [
        'merchant_code' => env('MTN_MOMO_MERCHANT_CODE'),
    ],

    'airtel' => [
        'merchant_code' => env('AIRTEL_MONEY_MERCHANT_CODE'),
    ],

];
