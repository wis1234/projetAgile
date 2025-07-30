<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Exécuter toutes les migrations avant les tests
        Artisan::call('migrate');
        
        // Pour les tests qui utilisent une base de données en mémoire,
        // on s'assure que les tables sont bien créées
        $this->beforeApplicationDestroyed(function () {
            Artisan::call('migrate:rollback');
        });
    }
}
