<?php

namespace App\Support;

use App\Models\CatalogService;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class HomeServiceCatalog
{
    public const OCCUPATIONS = [
        'private_chef' => 'Private chef',
        'private_massage' => 'Massage specialist',
        'home_laundry' => 'Private dobbi',
        'other' => 'Other',
    ];

    public const EXPERIENCE = [
        'under_6_months' => 'Less than 6 months',
        '6_12_months' => '6–12 months',
        '1_2_years' => '1–2 years',
        '3_5_years' => '3–5 years',
        '6_10_years' => '6–10 years',
        '10_plus' => 'More than 10 years',
    ];

    public const LEARNING = [
        'doing' => 'I learned by doing the work',
        'family' => 'I learned from family/friends',
        'mentor' => 'I trained under another professional',
        'company' => 'I worked for a company/business',
        'short_course' => 'I completed a short course',
        'certificate' => 'I have a certificate',
        'diploma' => 'I have a diploma/degree',
        'other' => 'Other',
    ];

    public const CERTIFICATES = [
        'professional' => 'Professional certificate',
        'vocational' => 'Vocational training',
        'short_course' => 'Short course',
        'diploma' => 'Diploma',
        'degree' => 'Degree',
        'health_safety' => 'Health/safety training',
        'other' => 'Other',
    ];

    public const RELATIONSHIPS = [
        'previous_customer' => 'Previous customer',
        'current_customer' => 'Current customer',
        'former_employer' => 'Former employer',
        'current_employer' => 'Current employer',
        'coworker' => 'Person I worked with',
        'trainer' => 'Trainer/teacher',
        'community' => 'Community member',
        'other' => 'Other',
    ];

    public const LOCATIONS = [
        'client_home' => "Client's home",
        'my_place' => 'My place',
        'either' => 'Either place',
    ];

    public const DAYS = [
        'monday' => 'Monday',
        'tuesday' => 'Tuesday',
        'wednesday' => 'Wednesday',
        'thursday' => 'Thursday',
        'friday' => 'Friday',
        'saturday' => 'Saturday',
        'sunday' => 'Sunday',
    ];

    /**
     * Search options. Extra home services added in the catalog appear after the core list.
     *
     * @return array<string, string>
     */
    public static function searchServices(): array
    {
        $options = [
            'private_chef' => 'Private chef',
            'home_laundry' => 'Home laundry',
            'private_massage' => 'Private massage',
            'other' => 'Other',
        ];

        if (! Schema::hasTable('catalog_services')) {
            return $options;
        }

        foreach (CatalogService::query()->where('group', 'home')->where('is_active', true)->orderBy('name')->get() as $service) {
            $key = str_replace('-', '_', $service->slug);
            $options[$key] ??= $service->name;
        }

        return $options;
    }

    /**
     * @return array<string, string>
     */
    public static function units(string $occupation): array
    {
        return match ($occupation) {
            'private_chef' => [
                'session' => 'Per session',
                'person' => 'Per person',
                'day' => 'Per day',
            ],
            'private_massage' => [
                '60' => '60 minutes',
                '90' => '90 minutes',
                '120' => '120 minutes',
            ],
            'home_laundry' => [
                'kg' => 'Per kilogram',
                'item' => 'Per item',
                'load' => 'Per load',
                'package' => 'Per package',
            ],
            default => [
                'session' => 'Per session',
                'hour' => 'Per hour',
                'day' => 'Per day',
                'quote' => 'Quote',
            ],
        };
    }

    public static function unitLabel(?string $unit): string
    {
        foreach (['private_chef', 'private_massage', 'home_laundry', 'other'] as $occupation) {
            $label = self::units($occupation)[$unit] ?? null;

            if ($label) {
                return $label;
            }
        }

        return (string) $unit;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public static function groups(string $occupation): array
    {
        return match ($occupation) {
            'private_chef' => [
                'Everyday Cooking' => [
                    'Breakfast preparation',
                    'Lunch preparation',
                    'Dinner preparation',
                    'Full-day meal preparation',
                    'Family meal preparation',
                    'Weekly meal preparation',
                    'Meal prep and portioning',
                    'Batch cooking',
                    'Packed meals / lunch boxes',
                    'Grocery shopping and ingredient sourcing',
                ],
                'Specialized Meals' => [
                    'Ugandan/local cuisine',
                    'African cuisine',
                    'International cuisine',
                    'Vegetarian meals',
                    'Vegan meals',
                    'High-protein meals',
                    'Low-carb meals',
                    'Weight-management meal preparation',
                    "Diabetic-friendly meal preparation based on the client's stated dietary requirements",
                    'Allergy-aware meal preparation',
                    "Children's meals",
                    'Elderly-friendly meals',
                ],
                'Events & Special Occasions' => [
                    'Private dinner chef',
                    'Birthday meal preparation',
                    'Romantic dinner preparation',
                    'Family gathering meals',
                    'Small party catering',
                    'BBQ/grill chef',
                    'Buffet preparation',
                    'Cocktail/finger foods',
                    'Holiday/festive meals',
                    'Outdoor cooking',
                ],
                'Additional Chef Services' => [
                    'Menu planning',
                    'Kitchen organization',
                    'Pantry management',
                    'Grocery-list preparation',
                    'Ingredient procurement',
                    'Food plating and presentation',
                    'Cooking lessons',
                    'Kitchen cleanup after cooking',
                    'Weekly/monthly chef arrangements',
                ],
            ],
            'private_massage' => [
                'General Massage' => [
                    'Swedish massage',
                    'Relaxation massage',
                    'Full-body massage',
                    'Back massage',
                    'Neck and shoulder massage',
                    'Foot massage',
                    'Head/scalp massage',
                    'Hand and arm massage',
                    'Leg massage',
                ],
                'Specialized Massage' => [
                    'Deep-tissue massage',
                    'Sports massage',
                    'Stretching-assisted massage',
                    'Trigger-point massage',
                    'Aromatherapy massage',
                    'Hot-stone massage',
                    'Couples massage',
                    'Prenatal massage',
                    'Postnatal massage',
                ],
                'Wellness Sessions' => [
                    'Stress-relief massage',
                    'Muscle-relaxation session',
                    'Post-workout massage',
                    'Mobility/stretching session',
                    'Office/workplace massage',
                    'Home wellness session',
                    'Spa-at-home package',
                ],
                'Add-ons' => [
                    'Aromatherapy oils',
                    'Hot towels',
                    'Hot stones',
                    'Foot soak',
                    'Extended session',
                    'Additional massage time',
                ],
            ],
            'home_laundry' => [
                'Standard Laundry' => [
                    'Washing',
                    'Hand washing',
                    'Machine washing',
                    'Washing and drying',
                    'Drying only',
                    'Ironing',
                    'Folding',
                    'Washing, ironing and folding',
                    'Stain treatment',
                    'Fabric-specific washing',
                ],
                'Clothing' => [
                    'Everyday clothes',
                    'Shirts and blouses',
                    'Trousers',
                    'Dresses',
                    'Suits/formal wear',
                    'School uniforms',
                    'Work uniforms',
                    'Sportswear',
                    'Baby clothes',
                    'Delicate garments',
                    'Traditional clothing',
                ],
                'Household Laundry' => [
                    'Bedsheets',
                    'Duvets',
                    'Duvet covers',
                    'Blankets',
                    'Pillowcases',
                    'Towels',
                    'Curtains',
                    'Tablecloths',
                    'Sofa/cushion covers',
                    'Mosquito nets',
                ],
                'Convenience Services' => [
                    'Home pickup',
                    'Home delivery',
                    'Same-day laundry',
                    'Next-day laundry',
                    'Express laundry',
                    'Scheduled weekly laundry',
                    'Biweekly service',
                    'Monthly laundry package',
                    'Family laundry package',
                ],
                'Special Services' => [
                    'Shoe cleaning',
                    'Sneaker cleaning',
                    'Handbag cleaning',
                    'Carpet/rug cleaning',
                    'Curtain cleaning',
                    'Bedding/deep cleaning',
                    'Stain removal',
                    'Garment steaming',
                ],
            ],
            default => [],
        };
    }

    /**
     * @return array<int, array{key: string, group: string, name: string, addon: bool, note: ?string}>
     */
    public static function items(string $occupation): array
    {
        $items = [];

        foreach (self::groups($occupation) as $group => $names) {
            foreach ($names as $name) {
                $items[] = [
                    'key' => Str::slug($name),
                    'group' => $group,
                    'name' => $name,
                    'addon' => $group === 'Add-ons',
                    'note' => str_contains($name, 'Prenatal') || str_contains($name, 'Postnatal')
                        ? 'Qualified providers only'
                        : null,
                ];
            }
        }

        return $items;
    }

    public static function turnaroundLabel(string $occupation): string
    {
        return match ($occupation) {
            'home_laundry' => 'Turnaround',
            'private_massage' => 'Session note',
            default => 'How long',
        };
    }
}
