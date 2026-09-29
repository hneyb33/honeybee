<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('escorts', function (Blueprint $table) {
            $table->string('experience_band')->nullable();
            $table->json('learning_methods')->nullable();
            $table->boolean('has_certificate')->default(false);
            $table->string('certificate_type')->nullable();
            $table->string('certificate_path')->nullable();
            $table->json('weekly_hours')->nullable();
            $table->string('travel_km')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('escorts', function (Blueprint $table) {
            $table->dropColumn([
                'experience_band',
                'learning_methods',
                'has_certificate',
                'certificate_type',
                'certificate_path',
                'weekly_hours',
                'travel_km',
            ]);
        });
    }
};
