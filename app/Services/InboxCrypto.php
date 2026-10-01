<?php

namespace App\Services;

class InboxCrypto
{
    public static function deriveKey(int $userAId, int $userBId): string
    {
        $participants = [$userAId, $userBId];
        sort($participants, SORT_NUMERIC);

        $seed = implode(':', $participants) . ':' . config('app.key');

        return hash('sha256', $seed);
    }

    public static function encrypt(string $plaintext, int $userAId, int $userBId): array
    {
        $key = self::deriveKey($userAId, $userBId);
        $iv = random_bytes(12);
        $tag = '';

        $ciphertext = openssl_encrypt(
            $plaintext,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($ciphertext === false) {
            throw new \RuntimeException('Impossible de chiffrer le message de l\'inbox.');
        }

        return [
            'ciphertext' => base64_encode($ciphertext),
            'iv' => base64_encode($iv),
            'tag' => base64_encode($tag),
        ];
    }

    public static function decrypt(array $payload, int $userAId, int $userBId): string
    {
        $ciphertext = base64_decode((string) ($payload['ciphertext'] ?? ''), true);
        $iv = base64_decode((string) ($payload['iv'] ?? ''), true);
        $tag = base64_decode((string) ($payload['tag'] ?? ''), true);

        if ($ciphertext === false || $iv === false || $tag === false) {
            throw new \RuntimeException('Payload chiffré invalide pour l\'inbox.');
        }

        $plaintext = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            self::deriveKey($userAId, $userBId),
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($plaintext === false) {
            throw new \RuntimeException('La clé de chiffrement de la conversation ne correspond pas à ce participant.');
        }

        return $plaintext;
    }
}
