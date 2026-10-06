<?php

namespace App\Support;

class CountryDialCodes
{
    /**
     * Dial code => label. Uganda stays first in the picker.
     *
     * @return array<string, string>
     */
    public static function options(): array
    {
        $options = self::all();
        $uganda = $options['256'] ?? 'Uganda +256';
        unset($options['256']);
        asort($options);

        return ['256' => $uganda] + $options;
    }

    /**
     * @return array<int, string>
     */
    public static function codes(): array
    {
        return array_keys(self::all());
    }

    /**
     * @return array{0: string, 1: string}
     */
    public static function split(?string $phone, ?string $country = null): array
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';
        $country = preg_replace('/\D+/', '', (string) $country) ?? '';

        if ($country !== '' && isset(self::all()[$country])) {
            $national = str_starts_with($digits, $country)
                ? substr($digits, strlen($country))
                : $digits;

            return [$country, ltrim($national, '0')];
        }

        $codes = self::codes();
        usort($codes, fn (string $left, string $right): int => strlen($right) <=> strlen($left));

        foreach ($codes as $code) {
            if (str_starts_with($digits, $code) && strlen($digits) > strlen($code) + 5) {
                return [$code, substr($digits, strlen($code))];
            }
        }

        return ['256', ltrim($digits, '0')];
    }

    /**
     * @return array<string, string>
     */
    public static function all(): array
    {
        return [
            '256' => 'Uganda +256',
            '254' => 'Kenya +254',
            '255' => 'Tanzania +255',
            '250' => 'Rwanda +250',
            '257' => 'Burundi +257',
            '211' => 'South Sudan +211',
            '251' => 'Ethiopia +251',
            '249' => 'Sudan +249',
            '252' => 'Somalia +252',
            '253' => 'Djibouti +253',
            '291' => 'Eritrea +291',
            '243' => 'DR Congo +243',
            '242' => 'Congo +242',
            '260' => 'Zambia +260',
            '265' => 'Malawi +265',
            '258' => 'Mozambique +258',
            '263' => 'Zimbabwe +263',
            '267' => 'Botswana +267',
            '264' => 'Namibia +264',
            '27' => 'South Africa +27',
            '234' => 'Nigeria +234',
            '233' => 'Ghana +233',
            '225' => 'Côte d’Ivoire +225',
            '221' => 'Senegal +221',
            '237' => 'Cameroon +237',
            '20' => 'Egypt +20',
            '212' => 'Morocco +212',
            '213' => 'Algeria +213',
            '216' => 'Tunisia +216',
            '218' => 'Libya +218',
            '1' => 'United States / Canada +1',
            '44' => 'United Kingdom +44',
            '353' => 'Ireland +353',
            '33' => 'France +33',
            '49' => 'Germany +49',
            '39' => 'Italy +39',
            '34' => 'Spain +34',
            '31' => 'Netherlands +31',
            '32' => 'Belgium +32',
            '41' => 'Switzerland +41',
            '46' => 'Sweden +46',
            '47' => 'Norway +47',
            '45' => 'Denmark +45',
            '351' => 'Portugal +351',
            '48' => 'Poland +48',
            '30' => 'Greece +30',
            '90' => 'Turkey +90',
            '7' => 'Russia / Kazakhstan +7',
            '380' => 'Ukraine +380',
            '971' => 'United Arab Emirates +971',
            '966' => 'Saudi Arabia +966',
            '974' => 'Qatar +974',
            '965' => 'Kuwait +965',
            '973' => 'Bahrain +973',
            '968' => 'Oman +968',
            '962' => 'Jordan +962',
            '961' => 'Lebanon +961',
            '972' => 'Israel +972',
            '91' => 'India +91',
            '92' => 'Pakistan +92',
            '880' => 'Bangladesh +880',
            '94' => 'Sri Lanka +94',
            '977' => 'Nepal +977',
            '86' => 'China +86',
            '81' => 'Japan +81',
            '82' => 'South Korea +82',
            '65' => 'Singapore +65',
            '60' => 'Malaysia +60',
            '62' => 'Indonesia +62',
            '63' => 'Philippines +63',
            '66' => 'Thailand +66',
            '84' => 'Vietnam +84',
            '61' => 'Australia +61',
            '64' => 'New Zealand +64',
            '55' => 'Brazil +55',
            '52' => 'Mexico +52',
            '54' => 'Argentina +54',
            '57' => 'Colombia +57',
            '56' => 'Chile +56',
        ];
    }
}
