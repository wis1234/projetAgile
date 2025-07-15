<?php

namespace App\Exceptions;

use Exception;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;

class Handler extends Exception
{
    public function render($request, Throwable $exception)
    {
        if ($exception instanceof \Symfony\Component\HttpKernel\Exception\HttpException && $exception->getStatusCode() === 403) {
            if ($request->hasHeader('X-Inertia')) {
                return Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
            }
        }
        return parent::render($request, $exception);
    }
}
