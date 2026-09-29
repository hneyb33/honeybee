<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('payments')->where('status', 'approved')->update(['status' => 'verified']);

        Schema::table('payments', function (Blueprint $table) {
            $table->string('plan')->nullable()->after('subscription_id');
            $table->string('period')->nullable()->after('plan');
            $table->string('provider')->nullable()->after('method');
            $table->string('merchant_code')->nullable()->after('provider');
            $table->string('payer_phone')->nullable()->after('merchant_code');
            $table->string('currency', 3)->default('UGX')->after('amount');
            $table->string('transaction_id')->nullable()->after('reference');
            $table->string('proof_path')->nullable()->after('transaction_id');
            $table->timestamp('paid_at')->nullable()->after('proof_path');
            $table->timestamp('submitted_at')->nullable()->after('paid_at');
            $table->timestamp('verified_at')->nullable()->after('submitted_at');
            $table->foreignId('verified_by')->nullable()->after('verified_at')->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable()->after('verified_by');
            $table->text('rejection_reason')->nullable()->after('rejected_at');
            $table->json('metadata')->nullable()->after('rejection_reason');
            $table->unique(['provider', 'transaction_id']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->foreignId('payment_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->foreignId('activated_by')->nullable()->after('ends_at')->constrained('users')->nullOnDelete();
            $table->timestamp('activated_at')->nullable()->after('activated_by');
        });

        Schema::create('payment_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('notes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_audits');

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payment_id');
            $table->dropConstrainedForeignId('activated_by');
            $table->dropColumn('activated_at');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['provider', 'transaction_id']);
            $table->dropConstrainedForeignId('verified_by');
            $table->dropColumn([
                'plan',
                'period',
                'provider',
                'merchant_code',
                'payer_phone',
                'currency',
                'transaction_id',
                'proof_path',
                'paid_at',
                'submitted_at',
                'verified_at',
                'rejected_at',
                'rejection_reason',
                'metadata',
            ]);
        });
    }
};
