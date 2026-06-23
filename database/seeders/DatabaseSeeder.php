<?php

namespace Database\Seeders;

use App\Models\Escort;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $amenities = [
            ['title' => 'Gated and secure', 'body' => '24/7 access control, private compound entry, and verified neighborhood security.'],
            ['title' => 'Verified listing', 'body' => 'Inspected by Real Estates UG before publishing.'],
            ['title' => 'Flexible move-in', 'body' => 'Clear lease terms and responsive agent support from first inquiry.'],
        ];

        $escorts = [
            [
                'title' => 'Dohna',
                'age' => 25,
                'gender' => 'female',
                'ethnicity' => 'Black',
                'nationality' => 'Ugandan',
                'height' => '5\'6"',
                'weight' => '58kg',
                'hair_color' => 'Brunette',
                'hair_length' => 'Long',
                'bust_size' => 'Medium (B)',
                'build' => 'Slim',
                'looks' => 'Sexy',
                'smoker' => 'No',
                'education' => 'College',
                'sports' => 'Yoga',
                'zodiac_sign' => 'Leo',
                'sexual_orientation' => 'Bisexual',
                'occupation' => 'Escort',
                'availability' => 'Incall, Outcall',
                'country' => 'Uganda',
                'phone' => '+256766591964',
                'tier' => 'vip',
                'neighborhood' => 'Kyaliwajjala',
                'city' => 'Kampala',
                'monthly_price' => 150000,
                'rating' => 0,
                'review_count' => 0,
                'bedrooms' => 0,
                'bathrooms' => 0,
                'plot_size' => null,
                'parking' => 0,
                'summary_line' => '25-year-old female escort in Kampala',
                'description' => 'I take pride in creating a relaxed, friendly, and discreet atmosphere where you can truly unwind and feel comfortable. Whether you’re looking for companionship, good conversation, or a soothing moment away from your busy schedule, I’m here to make every meeting special. If you’re in Makindye and searching for a reliable, attractive, and welcoming escort, I’m always available to give you a memorable time.',
                'about_me' => '25 year old Female from Kyaliwajjala, Kampala. I take pride in creating a relaxed, friendly, and discreet atmosphere where you can truly unwind and feel comfortable.',
                'services_offered' => [
                    'Webcam sex',
                    'Body To Body Nuru massage',
                    '69',
                    'Erotic massage',
                    'Golden shower',
                    'Couples',
                    'GFE',
                    'Threesome',
                    'Foot fetish',
                    'Sex toys',
                    'Extraball',
                    'Domination',
                    'LT',
                ],
                'languages' => ['English' => 'Minimal'],
                'rates' => [
                    '30 minutes' => '100 EUR',
                    '1 hour' => '100 EUR',
                    '2 hours' => '100 EUR',
                    '3 hours' => '100 EUR',
                    '6 hours' => '100 EUR',
                    '12 hours' => '100 EUR',
                    '24 hours' => '100 EUR',
                ],
                'extra_services' => true,
                'is_featured' => true,
                'cover_image' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
            ],
            [
                'title' => 'Male Companion',
                'age' => 21,
                'gender' => 'male',
                'ethnicity' => 'White',
                'nationality' => 'Ugandan',
                'height' => '5\'8"',
                'weight' => '58kg',
                'hair_color' => 'Brunette',
                'hair_length' => 'Short',
                'bust_size' => 'Medium (B)',
                'build' => 'Regular',
                'looks' => 'Sexy',
                'smoker' => 'Yes',
                'education' => 'Tt',
                'sports' => 'Tr',
                'zodiac_sign' => 'F',
                'sexual_orientation' => 'Bisexual',
                'occupation' => 'UG',
                'availability' => 'Incall, Outcall',
                'country' => 'Uganda',
                'phone' => '+256787908547',
                'tier' => 'vip',
                'neighborhood' => 'Kampala',
                'city' => 'Kampala',
                'monthly_price' => 150000,
                'rating' => 0,
                'review_count' => 0,
                'bedrooms' => 0,
                'bathrooms' => 0,
                'plot_size' => null,
                'parking' => 0,
                'summary_line' => '21-year-old male companion in Kampala',
                'description' => 'Hey everyone. I provide discreet and welcoming companionship with a focus on comfort, trust, and a memorable time.',
                'about_me' => '21 year old Male from Kampala, Uganda. Hey everyone.',
                'services_offered' => [
                    'OWO',
                    'O-Level',
                    'CIM',
                    'COF',
                    'COB',
                    'Swallow',
                    'DFK',
                    'A-Level',
                    'Anal Rimming',
                    '69',
                    'Striptease/Lapdance',
                    'Erotic massage',
                    'Golden shower',
                    'Couples',
                    'GFE',
                    'Threesome',
                    'Foot fetish',
                    'Sex toys',
                    'Extraball',
                    'Domination',
                    'LT',
                ],
                'languages' => ['English' => 'Minimal'],
                'rates' => [
                    '30 minutes' => '100 EUR',
                    '1 hour' => '100 EUR',
                    '2 hours' => '100 EUR',
                    '3 hours' => '100 EUR',
                    '6 hours' => '100 EUR',
                    '12 hours' => '100 EUR',
                    '24 hours' => '100 EUR',
                ],
                'extra_services' => true,
                'is_featured' => false,
                'cover_image' => 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
            ],
        ];

        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        foreach ($escorts as $escort) {
            Escort::updateOrCreate(
                ['slug' => Str::slug($escort['title'])],
                array_merge([
                    'user_id' => $user->id,
                    'slug' => Str::slug($escort['title']),
                    'city' => 'Kampala',
                    'category' => 'escort',
                    'status' => 'active',
                    'whatsapp_number' => '256700000000',
                    'images' => [
                        $escort['cover_image'],
                        'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1000&q=80',
                        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=80',
                        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80',
                        'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1000&q=80',
                    ],
                    'amenities' => $amenities,
                ], $escort)
            );
        }
    }
}
