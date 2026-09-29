<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('escort_offerings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('escort_id')->constrained()->cascadeOnDelete();
            $table->string('service_key');
            $table->string('group_name')->nullable();
            $table->string('name');
            $table->unsignedInteger('price')->default(0);
            $table->string('pricing_unit');
            $table->string('service_location');
            $table->string('turnaround')->nullable();
            $table->boolean('is_addon')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escort_offerings');
    }
};
