<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Proja

Proja est une application de gestion de projets agile basée sur Laravel et Inertia.js. Elle permet de gérer des projets, des tâches, des sprints et des équipes de manière efficace et intuitive.

## Configuration de reCAPTCHA

L'application utilise reCAPTCHA v3 pour sécuriser les formulaires sensibles comme l'inscription et la connexion.

### Configuration requise

1. Obtenez vos clés reCAPTCHA v3 sur la [Console d'administration reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Ajoutez ces variables d'environnement à votre fichier `.env` :

```env
RECAPTCHA_SITE_KEY=votre_clé_site
RECAPTCHA_SECRET_KEY=votre_clé_secrète
```

### Configuration avancée

Vous pouvez personnaliser le comportement de reCAPTCHA en modifiant le fichier `config/recaptcha.php` :

- `score_threshold` : Score minimum requis pour valider une action (0.0 à 1.0)
- `action_thresholds` : Scores minimums par type d'action (login, register, etc.)
- `debug` : Active/désactive le mode débogage (utile en développement)

### Désactivation en développement

En mode développement, si aucune clé n'est définie, la validation reCAPTCHA est automatiquement désactivée.

## Fonctionnalités

L'application offre les fonctionnalités suivantes :
- Gestion des projets et des tâches
- Tableaux Kanban
- Suivi des sprints
- Gestion des équipes et des rôles
- Tableaux de bord personnalisés
- Et bien plus encore...

## Technologies utilisées

- Laravel 10.x
- Inertia.js
- React
- Tailwind CSS
- reCAPTCHA v3
- Et d'autres packages essentiels...

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
\"# projetAgile\" 
