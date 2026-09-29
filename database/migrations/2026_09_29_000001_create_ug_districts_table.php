<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ug_districts', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            if (config('ug-village-locations.use_uuids', false)) {
                $table->uuid('uuid')->unique()->nullable();
            }
            $table->string('name')->index();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('ug_districts');
    }
};
