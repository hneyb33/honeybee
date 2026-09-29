<?php

use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$connection = (string) config('database.default');
$config = config('database.connections.'.$connection);

echo 'connection='.$connection.PHP_EOL;
echo 'driver='.($config['driver'] ?? '').PHP_EOL;
echo 'host='.($config['host'] ?? '').PHP_EOL;
echo 'database='.($config['database'] ?? '').PHP_EOL;
echo 'url='.(($config['url'] ?? '') !== '' && ($config['url'] ?? null) !== null ? 'set' : 'empty').PHP_EOL;
