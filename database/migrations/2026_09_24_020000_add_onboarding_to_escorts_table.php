<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('escorts', function (Blueprint $table) {
            $table->string('onboarding_step')->default('personal')->after('verification_notes');
            $table->json('onboarding_data')->nullable()->after('onboarding_step');
        });
    }

    public function down(): void
    {
        Schema::table('escorts', function (Blueprint $table) {
            $table->dropColumn(['onboarding_step', 'onboarding_data']);
        });
    }
};
