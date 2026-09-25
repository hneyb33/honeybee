<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('escorts', function (Blueprint $table) {
            $table->string('kind')->default('escort')->after('category');
            $table->string('escort_tier')->nullable()->after('kind');
            $table->string('service_type')->nullable()->after('escort_tier');
            $table->decimal('latitude', 10, 7)->nullable()->after('city');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('telegram')->nullable()->after('whatsapp_number');
            $table->unsignedInteger('hourly_rate')->nullable()->after('monthly_price');
        });

        DB::table('escorts')->update([
            'kind' => 'escort',
            'escort_tier' => 'premium',
        ]);

        DB::table('escorts')->where('tier', 'vip')->update(['escort_tier' => 'vip']);
        DB::table('escorts')->update(['hourly_rate' => DB::raw('monthly_price')]);

        Schema::table('escorts', function (Blueprint $table) {
            if (Schema::hasColumn('escorts', 'bedrooms')) {
                $table->dropColumn(['bedrooms', 'bathrooms', 'plot_size', 'parking']);
            }
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('plan');
            $table->string('status')->default('active');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('escort_id')->constrained()->cascadeOnDelete();
            $table->dateTime('starts_at');
            $table->unsignedSmallInteger('duration_hours');
            $table->string('experience_type')->nullable();
            $table->text('note')->nullable();
            $table->string('status')->default('requested');
            $table->unsignedInteger('price_amount');
            $table->string('currency', 3)->default('UGX');
            $table->timestamps();
        });

        Schema::create('profile_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('escort_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('kind');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('escort_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('body')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('profile_media');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('subscriptions');

        Schema::table('escorts', function (Blueprint $table) {
            $table->dropColumn([
                'kind',
                'escort_tier',
                'service_type',
                'latitude',
                'longitude',
                'telegram',
                'hourly_rate',
            ]);
        });
    }
};
