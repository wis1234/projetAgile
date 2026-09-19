<?php

namespace App\Http\Requests;

class UpdateQuizRequest extends StoreQuizRequest
{
    // Mêmes règles que la création : les questions existantes sont identifiées par `questions.*.id`.
}
