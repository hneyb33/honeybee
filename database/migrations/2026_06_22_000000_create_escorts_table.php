<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('escorts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('summary_line')->nullable();
            $table->text('description');
            $table->string('tier');
            $table->string('category')->default('rent');
            $table->string('neighborhood');
            $table->string('city')->default('Kampala');
            $table->unsignedInteger('monthly_price');
            $table->decimal('rating', 3, 2)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->unsignedTinyInteger('bedrooms');
            $table->unsignedTinyInteger('bathrooms');
            $table->unsignedInteger('plot_size')->nullable();
            $table->unsignedTinyInteger('parking')->default(0);
            $table->string('whatsapp_number');
            $table->string('cover_image')->nullable();
            $table->json('images')->nullable();
            $table->json('amenities')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escorts');
    }
};
