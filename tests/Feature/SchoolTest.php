<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\School;
use PHPUnit\Framework\Attributes\Test;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Créer les rôles nécessaires si vous utilisez le système de rôles
        // $this->seed(RoleAndPermissionSeeder::class);
    }

    #[Test]
    public function schools_index_requires_authentication()
    {
        $response = $this->get('/schools');
        $response->assertRedirect('/login');
    }

    #[Test]
    public function admin_can_view_schools_index()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);
        
        $response = $this->get('/schools');
        $response->assertStatus(200);
        $response->assertViewIs('Schools.Index');
    }

    #[Test]
    public function school_admin_can_view_their_school()
    {
        $school = School::factory()->create();
        $admin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id
        ]);
        
        $this->actingAs($admin);
        $response = $this->get('/schools/' . $school->id);
        $response->assertStatus(200);
        $response->assertViewIs('Schools.Show');
    }

    #[Test]
    public function admin_can_create_school()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $schoolData = [
            'name' => 'Test School',
            'code' => 'TS001',
            'type' => 'secondary',
            'address' => '123 Test Street',
            'city' => 'Test City',
            'country' => 'Test Country',
            'email' => 'test@school.com',
            'phone' => '+1234567890',
            'website' => 'https://testschool.com',
        ];

        $response = $this->post('/schools', $schoolData);
        $response->assertRedirect('/schools');
        $this->assertDatabaseHas('schools', ['name' => 'Test School']);
    }

    #[Test]
    public function admin_can_update_school()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $school = School::factory()->create();
        $this->actingAs($admin);

        $updateData = [
            'name' => 'Updated School Name',
            'code' => 'USN001',
            'type' => 'primary',
            'address' => '456 Updated Street',
            'city' => 'Updated City',
            'country' => 'Updated Country',
            'email' => 'updated@school.com',
            'phone' => '+9876543210',
            'website' => 'https://updatedschool.com',
        ];

        $response = $this->put("/schools/{$school->id}", $updateData);
        $response->assertRedirect("/schools/{$school->id}");
        $this->assertDatabaseHas('schools', ['name' => 'Updated School Name']);
    }

    #[Test]
    public function admin_can_delete_school()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $school = School::factory()->create();
        $this->actingAs($admin);

        $response = $this->delete("/schools/{$school->id}");
        $response->assertRedirect('/schools');
        $this->assertSoftDeleted('schools', ['id' => $school->id]);
    }

    #[Test]
    public function school_admin_can_manage_their_school()
    {
        $school = School::factory()->create();
        $admin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id
        ]);
        $this->actingAs($admin);

        // Test view
        $response = $this->get("/schools/{$school->id}/edit");
        $response->assertStatus(200);

        // Test update
        $updateData = [
            'name' => 'Updated by School Admin',
            'code' => $school->code,
            'type' => $school->type,
            'address' => $school->address,
            'city' => $school->city,
            'country' => $school->country,
            'email' => $school->email,
            'phone' => $school->phone,
            'website' => $school->website,
        ];

        $response = $this->put("/schools/{$school->id}", $updateData);
        $response->assertRedirect("/schools/{$school->id}");
        $this->assertDatabaseHas('schools', ['name' => 'Updated by School Admin']);
    }

    #[Test]
    public function school_admin_cannot_manage_other_schools()
    {
        $school1 = School::factory()->create();
        $school2 = School::factory()->create();
        
        $admin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school1->id
        ]);
        $this->actingAs($admin);

        // Try to view other school
        $response = $this->get("/schools/{$school2->id}");
        $response->assertStatus(403);

        // Try to edit other school
        $response = $this->get("/schools/{$school2->id}/edit");
        $response->assertStatus(403);

        // Try to update other school
        $response = $this->put("/schools/{$school2->id}", [
            'name' => 'Unauthorized Update',
            'code' => $school2->code,
            'type' => $school2->type,
            'address' => $school2->address,
            'city' => $school2->city,
            'country' => $school2->country,
            'email' => $school2->email,
            'phone' => $school2->phone,
            'website' => $school2->website,
        ]);
        $response->assertStatus(403);
    }

    #[Test]
    public function admin_can_manage_school_admins()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $school = School::factory()->create();
        $schoolAdmin = User::factory()->create([
            'role' => 'school_admin',
            'school_id' => $school->id
        ]);
        
        $this->actingAs($admin);
        
        // Test viewing school admins
        $response = $this->get("/schools/{$school->id}/admins");
        $response->assertStatus(200);
        
        // Test adding a school admin
        $newAdminData = [
            'name' => 'New School Admin',
            'email' => 'newadmin@school.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'school_admin',
            'school_id' => $school->id
        ];
        
        $response = $this->post("/schools/{$school->id}/admins", $newAdminData);
        $response->assertRedirect("/schools/{$school->id}/admins");
        $this->assertDatabaseHas('users', [
            'email' => 'newadmin@school.com',
            'role' => 'school_admin',
            'school_id' => $school->id
        ]);
    }
}
