<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Système d'évaluation (Quiz)
    |--------------------------------------------------------------------------
    */

    // Note minimale (en %) pour être déclaré « Admis(e) ».
    'pass_mark' => 50,

    // Barème maximum d'une question écrite (la note du correcteur va de 0 à cette valeur).
    'written_max_score' => 10,

    // Durée (minutes) pendant laquelle une copie reste « réservée » par un correcteur.
    // Elle est renouvelée automatiquement tant que le correcteur reste sur la page.
    'lock_ttl_minutes' => 10,

    // Bonus de participation : plafond cumulé (en points de %) ajouté à la note finale
    // et valeur absolue maximale d'une attribution unitaire.
    'participation_cap' => 10,
    'participation_step_max' => 10,
];
