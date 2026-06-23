<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('escorts', function (Blueprint $table) {
            $table->unsignedTinyInteger('age')->nullable()->after('title');
            $table->string('gender')->default('female')->after('age');
            $table->string('ethnicity')->nullable()->after('gender');
            $table->string('nationality')->nullable()->after('ethnicity');
            $table->string('height')->nullable()->after('nationality');
            $table->string('weight')->nullable()->after('height');
            $table->string('hair_color')->nullable()->after('weight');
            $table->string('hair_length')->nullable()->after('hair_color');
            $table->string('bust_size')->nullable()->after('hair_length');
            $table->string('build')->nullable()->after('bust_size');
            $table->string('looks')->nullable()->after('build');
            $table->string('smoker')->nullable()->after('looks');
            $table->string('education')->nullable()->after('smoker');
            $table->string('sports')->nullable()->after('education');
            $table->string('zodiac_sign')->nullable()->after('sports');
            $table->string('sexual_orientation')->nullable()->after('zodiac_sign');
            $table->string('occupation')->nullable()->after('sexual_orientation');
            $table->string('availability')->default('Incall, Outcall')->after('occupation');
            $table->string('country')->default('Uganda')->after('availability');
            $table->string('phone')->nullable()->after('country');
            $table->text('about_me')->nullable()->after('description');
            $table->json('services_offered')->nullable()->after('about_me');
            $table->json('languages')->nullable()->after('services_offered');
            $table->json('rates')->nullable()->after('languages');
            $table->boolean('extra_services')->default(false)->after('rates');
        });
    }

    public function down(): void
    {
        Schema::table('escorts', function (Blueprint $table) {
            $table->dropColumn([
                'age',
                'gender',
                'ethnicity',
                'nationality',
                'height',
                'weight',
                'hair_color',
                'hair_length',
                'bust_size',
                'build',
                'looks',
                'smoker',
                'education',
                'sports',
                'zodiac_sign',
                'sexual_orientation',
                'occupation',
                'availability',
                'country',
                'phone',
                'about_me',
                'services_offered',
                'languages',
                'rates',
                'extra_services',
            ]);
        });
    }
};
