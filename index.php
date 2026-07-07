<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Maintenance Mode
if (file_exists($maintenance = __DIR__.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Composer Autoloader
require __DIR__.'/vendor/autoload.php';

// Bootstrap the application
$app = require_once __DIR__.'/bootstrap/app.php';

/** @var Kernel $kernel */
$kernel = $app->make(Kernel::class);

// Handle the request and send the response
$response = $kernel->handle(
    $request = Request::capture()
);

$response->send();
$kernel->terminate($request, $response);