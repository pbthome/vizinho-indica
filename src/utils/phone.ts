export type PhoneCountry = {
  id: string;
  flag: string;
  name: string;
  dialCode: string;
  minDigits: number;
  maxDigits: number;
  example: string;
};

export const phoneCountries: PhoneCountry[] = [
  { id: 'BR', flag: '🇧🇷', name: 'Brasil', dialCode: '+55', minDigits: 10, maxDigits: 11, example: '(11) 99999-9999' },
  { id: 'AF', flag: '🇦🇫', name: 'Afeganistao', dialCode: '+93', minDigits: 9, maxDigits: 9, example: '70 123 4567' },
  { id: 'ZA', flag: '🇿🇦', name: 'Africa do Sul', dialCode: '+27', minDigits: 9, maxDigits: 9, example: '82 123 4567' },
  { id: 'AL', flag: '🇦🇱', name: 'Albania', dialCode: '+355', minDigits: 8, maxDigits: 9, example: '67 123 4567' },
  { id: 'DE', flag: '🇩🇪', name: 'Alemanha', dialCode: '+49', minDigits: 10, maxDigits: 11, example: '1512 3456789' },
  { id: 'AD', flag: '🇦🇩', name: 'Andorra', dialCode: '+376', minDigits: 6, maxDigits: 6, example: '312 345' },
  { id: 'AO', flag: '🇦🇴', name: 'Angola', dialCode: '+244', minDigits: 9, maxDigits: 9, example: '923 123 456' },
  { id: 'AI', flag: '🇦🇮', name: 'Anguilla', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(264) 235-1234' },
  { id: 'AG', flag: '🇦🇬', name: 'Antigua e Barbuda', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(268) 464-1234' },
  { id: 'SA', flag: '🇸🇦', name: 'Arabia Saudita', dialCode: '+966', minDigits: 9, maxDigits: 9, example: '50 123 4567' },
  { id: 'DZ', flag: '🇩🇿', name: 'Argelia', dialCode: '+213', minDigits: 9, maxDigits: 9, example: '551 23 45 67' },
  { id: 'AR', flag: '🇦🇷', name: 'Argentina', dialCode: '+54', minDigits: 10, maxDigits: 10, example: '11 2345-6789' },
  { id: 'AM', flag: '🇦🇲', name: 'Armenia', dialCode: '+374', minDigits: 8, maxDigits: 8, example: '77 123456' },
  { id: 'AW', flag: '🇦🇼', name: 'Aruba', dialCode: '+297', minDigits: 7, maxDigits: 7, example: '560 1234' },
  { id: 'AU', flag: '🇦🇺', name: 'Australia', dialCode: '+61', minDigits: 9, maxDigits: 9, example: '412 345 678' },
  { id: 'AT', flag: '🇦🇹', name: 'Austria', dialCode: '+43', minDigits: 10, maxDigits: 11, example: '664 1234567' },
  { id: 'AZ', flag: '🇦🇿', name: 'Azerbaijao', dialCode: '+994', minDigits: 9, maxDigits: 9, example: '50 123 45 67' },
  { id: 'BS', flag: '🇧🇸', name: 'Bahamas', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(242) 359-1234' },
  { id: 'BH', flag: '🇧🇭', name: 'Bahrein', dialCode: '+973', minDigits: 8, maxDigits: 8, example: '3600 1234' },
  { id: 'BD', flag: '🇧🇩', name: 'Bangladesh', dialCode: '+880', minDigits: 10, maxDigits: 10, example: '1812 345678' },
  { id: 'BB', flag: '🇧🇧', name: 'Barbados', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(246) 250-1234' },
  { id: 'BE', flag: '🇧🇪', name: 'Belgica', dialCode: '+32', minDigits: 9, maxDigits: 9, example: '470 12 34 56' },
  { id: 'BZ', flag: '🇧🇿', name: 'Belize', dialCode: '+501', minDigits: 7, maxDigits: 7, example: '622 1234' },
  { id: 'BJ', flag: '🇧🇯', name: 'Benin', dialCode: '+229', minDigits: 8, maxDigits: 8, example: '90 12 34 56' },
  { id: 'BM', flag: '🇧🇲', name: 'Bermudas', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(441) 370-1234' },
  { id: 'BY', flag: '🇧🇾', name: 'Bielorrussia', dialCode: '+375', minDigits: 9, maxDigits: 9, example: '29 123 45 67' },
  { id: 'BO', flag: '🇧🇴', name: 'Bolivia', dialCode: '+591', minDigits: 8, maxDigits: 8, example: '71234567' },
  { id: 'BA', flag: '🇧🇦', name: 'Bosnia e Herzegovina', dialCode: '+387', minDigits: 8, maxDigits: 8, example: '61 123 456' },
  { id: 'BW', flag: '🇧🇼', name: 'Botsuana', dialCode: '+267', minDigits: 7, maxDigits: 8, example: '71 123 456' },
  { id: 'BN', flag: '🇧🇳', name: 'Brunei', dialCode: '+673', minDigits: 7, maxDigits: 7, example: '712 3456' },
  { id: 'BG', flag: '🇧🇬', name: 'Bulgaria', dialCode: '+359', minDigits: 9, maxDigits: 9, example: '87 123 4567' },
  { id: 'BF', flag: '🇧🇫', name: 'Burkina Faso', dialCode: '+226', minDigits: 8, maxDigits: 8, example: '70 12 34 56' },
  { id: 'BI', flag: '🇧🇮', name: 'Burundi', dialCode: '+257', minDigits: 8, maxDigits: 8, example: '79 12 34 56' },
  { id: 'BT', flag: '🇧🇹', name: 'Butao', dialCode: '+975', minDigits: 8, maxDigits: 8, example: '17 123 456' },
  { id: 'CV', flag: '🇨🇻', name: 'Cabo Verde', dialCode: '+238', minDigits: 7, maxDigits: 7, example: '991 12 34' },
  { id: 'CM', flag: '🇨🇲', name: 'Camaroes', dialCode: '+237', minDigits: 9, maxDigits: 9, example: '6 71 23 45 67' },
  { id: 'KH', flag: '🇰🇭', name: 'Camboja', dialCode: '+855', minDigits: 8, maxDigits: 9, example: '12 345 678' },
  { id: 'CA', flag: '🇨🇦', name: 'Canada', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(416) 555-0198' },
  { id: 'QA', flag: '🇶🇦', name: 'Catar', dialCode: '+974', minDigits: 8, maxDigits: 8, example: '3312 3456' },
  { id: 'KZ', flag: '🇰🇿', name: 'Cazaquistao', dialCode: '+7', minDigits: 10, maxDigits: 10, example: '701 123 4567' },
  { id: 'TD', flag: '🇹🇩', name: 'Chade', dialCode: '+235', minDigits: 8, maxDigits: 8, example: '63 01 23 45' },
  { id: 'CL', flag: '🇨🇱', name: 'Chile', dialCode: '+56', minDigits: 9, maxDigits: 9, example: '9 1234 5678' },
  { id: 'CN', flag: '🇨🇳', name: 'China', dialCode: '+86', minDigits: 11, maxDigits: 11, example: '131 2345 6789' },
  { id: 'CY', flag: '🇨🇾', name: 'Chipre', dialCode: '+357', minDigits: 8, maxDigits: 8, example: '96 123456' },
  { id: 'SG', flag: '🇸🇬', name: 'Cingapura', dialCode: '+65', minDigits: 8, maxDigits: 8, example: '8123 4567' },
  { id: 'CO', flag: '🇨🇴', name: 'Colombia', dialCode: '+57', minDigits: 10, maxDigits: 10, example: '300 123 4567' },
  { id: 'KM', flag: '🇰🇲', name: 'Comores', dialCode: '+269', minDigits: 7, maxDigits: 7, example: '321 23 45' },
  { id: 'CG', flag: '🇨🇬', name: 'Congo', dialCode: '+242', minDigits: 9, maxDigits: 9, example: '06 123 4567' },
  { id: 'CD', flag: '🇨🇩', name: 'Congo, Republica Democratica', dialCode: '+243', minDigits: 9, maxDigits: 9, example: '81 234 5678' },
  { id: 'KR', flag: '🇰🇷', name: 'Coreia do Sul', dialCode: '+82', minDigits: 9, maxDigits: 10, example: '10 1234 5678' },
  { id: 'KP', flag: '🇰🇵', name: 'Coreia do Norte', dialCode: '+850', minDigits: 8, maxDigits: 10, example: '191 234 5678' },
  { id: 'CI', flag: '🇨🇮', name: 'Costa do Marfim', dialCode: '+225', minDigits: 10, maxDigits: 10, example: '01 23 45 67 89' },
  { id: 'CR', flag: '🇨🇷', name: 'Costa Rica', dialCode: '+506', minDigits: 8, maxDigits: 8, example: '8312 3456' },
  { id: 'HR', flag: '🇭🇷', name: 'Croacia', dialCode: '+385', minDigits: 8, maxDigits: 9, example: '91 234 5678' },
  { id: 'CU', flag: '🇨🇺', name: 'Cuba', dialCode: '+53', minDigits: 8, maxDigits: 8, example: '5 1234567' },
  { id: 'CW', flag: '🇨🇼', name: 'Curacao', dialCode: '+599', minDigits: 7, maxDigits: 8, example: '9 512 3456' },
  { id: 'DK', flag: '🇩🇰', name: 'Dinamarca', dialCode: '+45', minDigits: 8, maxDigits: 8, example: '20 12 34 56' },
  { id: 'DJ', flag: '🇩🇯', name: 'Djibuti', dialCode: '+253', minDigits: 8, maxDigits: 8, example: '77 83 10 01' },
  { id: 'DM', flag: '🇩🇲', name: 'Dominica', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(767) 225-1234' },
  { id: 'EG', flag: '🇪🇬', name: 'Egito', dialCode: '+20', minDigits: 10, maxDigits: 10, example: '100 123 4567' },
  { id: 'SV', flag: '🇸🇻', name: 'El Salvador', dialCode: '+503', minDigits: 8, maxDigits: 8, example: '7012 3456' },
  { id: 'AE', flag: '🇦🇪', name: 'Emirados Arabes Unidos', dialCode: '+971', minDigits: 9, maxDigits: 9, example: '50 123 4567' },
  { id: 'EC', flag: '🇪🇨', name: 'Equador', dialCode: '+593', minDigits: 9, maxDigits: 9, example: '99 123 4567' },
  { id: 'ER', flag: '🇪🇷', name: 'Eritreia', dialCode: '+291', minDigits: 7, maxDigits: 7, example: '7 123 456' },
  { id: 'SK', flag: '🇸🇰', name: 'Eslovaquia', dialCode: '+421', minDigits: 9, maxDigits: 9, example: '912 123 456' },
  { id: 'SI', flag: '🇸🇮', name: 'Eslovenia', dialCode: '+386', minDigits: 8, maxDigits: 8, example: '31 234 567' },
  { id: 'ES', flag: '🇪🇸', name: 'Espanha', dialCode: '+34', minDigits: 9, maxDigits: 9, example: '612 34 56 78' },
  { id: 'US', flag: '🇺🇸', name: 'Estados Unidos', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(415) 555-0198' },
  { id: 'EE', flag: '🇪🇪', name: 'Estonia', dialCode: '+372', minDigits: 7, maxDigits: 8, example: '5123 4567' },
  { id: 'SZ', flag: '🇸🇿', name: 'Eswatini', dialCode: '+268', minDigits: 8, maxDigits: 8, example: '76 123 456' },
  { id: 'ET', flag: '🇪🇹', name: 'Etiopia', dialCode: '+251', minDigits: 9, maxDigits: 9, example: '91 123 4567' },
  { id: 'FJ', flag: '🇫🇯', name: 'Fiji', dialCode: '+679', minDigits: 7, maxDigits: 7, example: '701 2345' },
  { id: 'PH', flag: '🇵🇭', name: 'Filipinas', dialCode: '+63', minDigits: 10, maxDigits: 10, example: '917 123 4567' },
  { id: 'FI', flag: '🇫🇮', name: 'Finlandia', dialCode: '+358', minDigits: 9, maxDigits: 10, example: '40 123 4567' },
  { id: 'FR', flag: '🇫🇷', name: 'Franca', dialCode: '+33', minDigits: 9, maxDigits: 9, example: '6 12 34 56 78' },
  { id: 'GA', flag: '🇬🇦', name: 'Gabao', dialCode: '+241', minDigits: 8, maxDigits: 8, example: '06 12 34 56' },
  { id: 'GM', flag: '🇬🇲', name: 'Gambia', dialCode: '+220', minDigits: 7, maxDigits: 7, example: '301 2345' },
  { id: 'GH', flag: '🇬🇭', name: 'Gana', dialCode: '+233', minDigits: 9, maxDigits: 9, example: '24 123 4567' },
  { id: 'GE', flag: '🇬🇪', name: 'Georgia', dialCode: '+995', minDigits: 9, maxDigits: 9, example: '555 12 34 56' },
  { id: 'GI', flag: '🇬🇮', name: 'Gibraltar', dialCode: '+350', minDigits: 8, maxDigits: 8, example: '57123456' },
  { id: 'GD', flag: '🇬🇩', name: 'Granada', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(473) 403-1234' },
  { id: 'GR', flag: '🇬🇷', name: 'Grecia', dialCode: '+30', minDigits: 10, maxDigits: 10, example: '691 234 5678' },
  { id: 'GL', flag: '🇬🇱', name: 'Groenlandia', dialCode: '+299', minDigits: 6, maxDigits: 6, example: '22 12 34' },
  { id: 'GP', flag: '🇬🇵', name: 'Guadalupe', dialCode: '+590', minDigits: 9, maxDigits: 9, example: '690 12 34 56' },
  { id: 'GU', flag: '🇬🇺', name: 'Guam', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(671) 300-1234' },
  { id: 'GT', flag: '🇬🇹', name: 'Guatemala', dialCode: '+502', minDigits: 8, maxDigits: 8, example: '5123 4567' },
  { id: 'GY', flag: '🇬🇾', name: 'Guiana', dialCode: '+592', minDigits: 7, maxDigits: 7, example: '609 1234' },
  { id: 'GF', flag: '🇬🇫', name: 'Guiana Francesa', dialCode: '+594', minDigits: 9, maxDigits: 9, example: '694 20 12 34' },
  { id: 'GN', flag: '🇬🇳', name: 'Guine', dialCode: '+224', minDigits: 9, maxDigits: 9, example: '601 12 34 56' },
  { id: 'GW', flag: '🇬🇼', name: 'Guine-Bissau', dialCode: '+245', minDigits: 7, maxDigits: 7, example: '955 012 345' },
  { id: 'GQ', flag: '🇬🇶', name: 'Guine Equatorial', dialCode: '+240', minDigits: 9, maxDigits: 9, example: '222 123 456' },
  { id: 'HT', flag: '🇭🇹', name: 'Haiti', dialCode: '+509', minDigits: 8, maxDigits: 8, example: '34 10 1234' },
  { id: 'HN', flag: '🇭🇳', name: 'Honduras', dialCode: '+504', minDigits: 8, maxDigits: 8, example: '9123 4567' },
  { id: 'HK', flag: '🇭🇰', name: 'Hong Kong', dialCode: '+852', minDigits: 8, maxDigits: 8, example: '5123 4567' },
  { id: 'HU', flag: '🇭🇺', name: 'Hungria', dialCode: '+36', minDigits: 9, maxDigits: 9, example: '20 123 4567' },
  { id: 'YE', flag: '🇾🇪', name: 'Iemen', dialCode: '+967', minDigits: 9, maxDigits: 9, example: '712 345 678' },
  { id: 'BV', flag: '🇧🇻', name: 'Ilha Bouvet', dialCode: '+47', minDigits: 8, maxDigits: 8, example: '412 34 567' },
  { id: 'IM', flag: '🇮🇲', name: 'Ilha de Man', dialCode: '+44', minDigits: 10, maxDigits: 10, example: '7624 123456' },
  { id: 'CX', flag: '🇨🇽', name: 'Ilha Christmas', dialCode: '+61', minDigits: 9, maxDigits: 9, example: '412 345 678' },
  { id: 'NF', flag: '🇳🇫', name: 'Ilha Norfolk', dialCode: '+672', minDigits: 6, maxDigits: 6, example: '3 81234' },
  { id: 'KY', flag: '🇰🇾', name: 'Ilhas Cayman', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(345) 323-1234' },
  { id: 'CC', flag: '🇨🇨', name: 'Ilhas Cocos', dialCode: '+61', minDigits: 9, maxDigits: 9, example: '412 345 678' },
  { id: 'CK', flag: '🇨🇰', name: 'Ilhas Cook', dialCode: '+682', minDigits: 5, maxDigits: 5, example: '71 234' },
  { id: 'FO', flag: '🇫🇴', name: 'Ilhas Faroe', dialCode: '+298', minDigits: 6, maxDigits: 6, example: '211234' },
  { id: 'FK', flag: '🇫🇰', name: 'Ilhas Malvinas', dialCode: '+500', minDigits: 5, maxDigits: 5, example: '51234' },
  { id: 'MP', flag: '🇲🇵', name: 'Ilhas Marianas do Norte', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(670) 234-5678' },
  { id: 'MH', flag: '🇲🇭', name: 'Ilhas Marshall', dialCode: '+692', minDigits: 7, maxDigits: 7, example: '235 1234' },
  { id: 'PN', flag: '🇵🇳', name: 'Ilhas Pitcairn', dialCode: '+64', minDigits: 8, maxDigits: 10, example: '21 123 4567' },
  { id: 'SB', flag: '🇸🇧', name: 'Ilhas Salomao', dialCode: '+677', minDigits: 7, maxDigits: 7, example: '74 12345' },
  { id: 'TC', flag: '🇹🇨', name: 'Ilhas Turks e Caicos', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(649) 231-1234' },
  { id: 'VG', flag: '🇻🇬', name: 'Ilhas Virgens Britanicas', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(284) 300-1234' },
  { id: 'VI', flag: '🇻🇮', name: 'Ilhas Virgens dos EUA', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(340) 642-1234' },
  { id: 'IN', flag: '🇮🇳', name: 'India', dialCode: '+91', minDigits: 10, maxDigits: 10, example: '91234 56789' },
  { id: 'ID', flag: '🇮🇩', name: 'Indonesia', dialCode: '+62', minDigits: 9, maxDigits: 12, example: '812 3456 7890' },
  { id: 'IR', flag: '🇮🇷', name: 'Ira', dialCode: '+98', minDigits: 10, maxDigits: 10, example: '912 345 6789' },
  { id: 'IQ', flag: '🇮🇶', name: 'Iraque', dialCode: '+964', minDigits: 10, maxDigits: 10, example: '790 123 4567' },
  { id: 'IE', flag: '🇮🇪', name: 'Irlanda', dialCode: '+353', minDigits: 9, maxDigits: 9, example: '85 123 4567' },
  { id: 'IS', flag: '🇮🇸', name: 'Islandia', dialCode: '+354', minDigits: 7, maxDigits: 7, example: '611 1234' },
  { id: 'IL', flag: '🇮🇱', name: 'Israel', dialCode: '+972', minDigits: 9, maxDigits: 9, example: '50 123 4567' },
  { id: 'IT', flag: '🇮🇹', name: 'Italia', dialCode: '+39', minDigits: 9, maxDigits: 10, example: '312 345 6789' },
  { id: 'JM', flag: '🇯🇲', name: 'Jamaica', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(876) 210-1234' },
  { id: 'JP', flag: '🇯🇵', name: 'Japao', dialCode: '+81', minDigits: 10, maxDigits: 10, example: '90 1234 5678' },
  { id: 'JE', flag: '🇯🇪', name: 'Jersey', dialCode: '+44', minDigits: 10, maxDigits: 10, example: '7797 123456' },
  { id: 'JO', flag: '🇯🇴', name: 'Jordania', dialCode: '+962', minDigits: 9, maxDigits: 9, example: '7 9012 3456' },
  { id: 'KI', flag: '🇰🇮', name: 'Kiribati', dialCode: '+686', minDigits: 5, maxDigits: 8, example: '72001234' },
  { id: 'KW', flag: '🇰🇼', name: 'Kuwait', dialCode: '+965', minDigits: 8, maxDigits: 8, example: '500 12345' },
  { id: 'LA', flag: '🇱🇦', name: 'Laos', dialCode: '+856', minDigits: 10, maxDigits: 10, example: '20 23 123 456' },
  { id: 'LS', flag: '🇱🇸', name: 'Lesoto', dialCode: '+266', minDigits: 8, maxDigits: 8, example: '5012 3456' },
  { id: 'LV', flag: '🇱🇻', name: 'Letonia', dialCode: '+371', minDigits: 8, maxDigits: 8, example: '21 234 567' },
  { id: 'LB', flag: '🇱🇧', name: 'Libano', dialCode: '+961', minDigits: 7, maxDigits: 8, example: '71 123 456' },
  { id: 'LR', flag: '🇱🇷', name: 'Liberia', dialCode: '+231', minDigits: 8, maxDigits: 9, example: '77 012 3456' },
  { id: 'LY', flag: '🇱🇾', name: 'Libia', dialCode: '+218', minDigits: 9, maxDigits: 9, example: '91 234 5678' },
  { id: 'LI', flag: '🇱🇮', name: 'Liechtenstein', dialCode: '+423', minDigits: 7, maxDigits: 9, example: '660 123 456' },
  { id: 'LT', flag: '🇱🇹', name: 'Lituania', dialCode: '+370', minDigits: 8, maxDigits: 8, example: '612 34567' },
  { id: 'LU', flag: '🇱🇺', name: 'Luxemburgo', dialCode: '+352', minDigits: 9, maxDigits: 9, example: '621 123 456' },
  { id: 'MO', flag: '🇲🇴', name: 'Macau', dialCode: '+853', minDigits: 8, maxDigits: 8, example: '6612 3456' },
  { id: 'MK', flag: '🇲🇰', name: 'Macedonia do Norte', dialCode: '+389', minDigits: 8, maxDigits: 8, example: '70 123 456' },
  { id: 'MG', flag: '🇲🇬', name: 'Madagascar', dialCode: '+261', minDigits: 9, maxDigits: 9, example: '32 12 345 67' },
  { id: 'MY', flag: '🇲🇾', name: 'Malasia', dialCode: '+60', minDigits: 9, maxDigits: 10, example: '12 345 6789' },
  { id: 'MW', flag: '🇲🇼', name: 'Malawi', dialCode: '+265', minDigits: 9, maxDigits: 9, example: '991 23 45 67' },
  { id: 'MV', flag: '🇲🇻', name: 'Maldivas', dialCode: '+960', minDigits: 7, maxDigits: 7, example: '771 2345' },
  { id: 'ML', flag: '🇲🇱', name: 'Mali', dialCode: '+223', minDigits: 8, maxDigits: 8, example: '65 01 23 45' },
  { id: 'MT', flag: '🇲🇹', name: 'Malta', dialCode: '+356', minDigits: 8, maxDigits: 8, example: '9696 1234' },
  { id: 'MA', flag: '🇲🇦', name: 'Marrocos', dialCode: '+212', minDigits: 9, maxDigits: 9, example: '650 123456' },
  { id: 'MQ', flag: '🇲🇶', name: 'Martinica', dialCode: '+596', minDigits: 9, maxDigits: 9, example: '696 20 12 34' },
  { id: 'MU', flag: '🇲🇺', name: 'Mauricio', dialCode: '+230', minDigits: 8, maxDigits: 8, example: '5251 2345' },
  { id: 'MR', flag: '🇲🇷', name: 'Mauritania', dialCode: '+222', minDigits: 8, maxDigits: 8, example: '22 12 34 56' },
  { id: 'YT', flag: '🇾🇹', name: 'Mayotte', dialCode: '+262', minDigits: 9, maxDigits: 9, example: '639 12 34 56' },
  { id: 'MX', flag: '🇲🇽', name: 'Mexico', dialCode: '+52', minDigits: 10, maxDigits: 10, example: '55 1234 5678' },
  { id: 'FM', flag: '🇫🇲', name: 'Micronesia', dialCode: '+691', minDigits: 7, maxDigits: 7, example: '350 1234' },
  { id: 'MZ', flag: '🇲🇿', name: 'Mocambique', dialCode: '+258', minDigits: 9, maxDigits: 9, example: '82 123 4567' },
  { id: 'MD', flag: '🇲🇩', name: 'Moldavia', dialCode: '+373', minDigits: 8, maxDigits: 8, example: '621 12 345' },
  { id: 'MC', flag: '🇲🇨', name: 'Monaco', dialCode: '+377', minDigits: 8, maxDigits: 9, example: '6 12 34 56 78' },
  { id: 'MN', flag: '🇲🇳', name: 'Mongolia', dialCode: '+976', minDigits: 8, maxDigits: 8, example: '8812 3456' },
  { id: 'ME', flag: '🇲🇪', name: 'Montenegro', dialCode: '+382', minDigits: 8, maxDigits: 8, example: '67 123 456' },
  { id: 'MS', flag: '🇲🇸', name: 'Montserrat', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(664) 492-1234' },
  { id: 'MM', flag: '🇲🇲', name: 'Myanmar', dialCode: '+95', minDigits: 8, maxDigits: 10, example: '9 123 456789' },
  { id: 'NA', flag: '🇳🇦', name: 'Namibia', dialCode: '+264', minDigits: 9, maxDigits: 9, example: '81 123 4567' },
  { id: 'NR', flag: '🇳🇷', name: 'Nauru', dialCode: '+674', minDigits: 7, maxDigits: 7, example: '555 1234' },
  { id: 'NP', flag: '🇳🇵', name: 'Nepal', dialCode: '+977', minDigits: 10, maxDigits: 10, example: '984 1234567' },
  { id: 'NI', flag: '🇳🇮', name: 'Nicaragua', dialCode: '+505', minDigits: 8, maxDigits: 8, example: '8123 4567' },
  { id: 'NE', flag: '🇳🇪', name: 'Niger', dialCode: '+227', minDigits: 8, maxDigits: 8, example: '93 12 34 56' },
  { id: 'NG', flag: '🇳🇬', name: 'Nigeria', dialCode: '+234', minDigits: 10, maxDigits: 10, example: '802 123 4567' },
  { id: 'NU', flag: '🇳🇺', name: 'Niue', dialCode: '+683', minDigits: 4, maxDigits: 4, example: '1234' },
  { id: 'NO', flag: '🇳🇴', name: 'Noruega', dialCode: '+47', minDigits: 8, maxDigits: 8, example: '412 34 567' },
  { id: 'NC', flag: '🇳🇨', name: 'Nova Caledonia', dialCode: '+687', minDigits: 6, maxDigits: 6, example: '75 12 34' },
  { id: 'NZ', flag: '🇳🇿', name: 'Nova Zelandia', dialCode: '+64', minDigits: 8, maxDigits: 10, example: '21 123 4567' },
  { id: 'OM', flag: '🇴🇲', name: 'Oma', dialCode: '+968', minDigits: 8, maxDigits: 8, example: '9212 3456' },
  { id: 'NL', flag: '🇳🇱', name: 'Paises Baixos', dialCode: '+31', minDigits: 9, maxDigits: 9, example: '6 12345678' },
  { id: 'PW', flag: '🇵🇼', name: 'Palau', dialCode: '+680', minDigits: 7, maxDigits: 7, example: '620 1234' },
  { id: 'PS', flag: '🇵🇸', name: 'Palestina', dialCode: '+970', minDigits: 9, maxDigits: 9, example: '59 123 4567' },
  { id: 'PA', flag: '🇵🇦', name: 'Panama', dialCode: '+507', minDigits: 8, maxDigits: 8, example: '6123 4567' },
  { id: 'PG', flag: '🇵🇬', name: 'Papua Nova Guine', dialCode: '+675', minDigits: 8, maxDigits: 8, example: '7012 3456' },
  { id: 'PK', flag: '🇵🇰', name: 'Paquistao', dialCode: '+92', minDigits: 10, maxDigits: 10, example: '301 2345678' },
  { id: 'PY', flag: '🇵🇾', name: 'Paraguai', dialCode: '+595', minDigits: 9, maxDigits: 9, example: '981 123456' },
  { id: 'PE', flag: '🇵🇪', name: 'Peru', dialCode: '+51', minDigits: 9, maxDigits: 9, example: '912 345 678' },
  { id: 'PF', flag: '🇵🇫', name: 'Polinesia Francesa', dialCode: '+689', minDigits: 8, maxDigits: 8, example: '87 12 34 56' },
  { id: 'PL', flag: '🇵🇱', name: 'Polonia', dialCode: '+48', minDigits: 9, maxDigits: 9, example: '512 345 678' },
  { id: 'PR', flag: '🇵🇷', name: 'Porto Rico', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(787) 234-5678' },
  { id: 'PT', flag: '🇵🇹', name: 'Portugal', dialCode: '+351', minDigits: 9, maxDigits: 9, example: '912 345 678' },
  { id: 'KE', flag: '🇰🇪', name: 'Quenia', dialCode: '+254', minDigits: 9, maxDigits: 9, example: '712 345678' },
  { id: 'KG', flag: '🇰🇬', name: 'Quirguistao', dialCode: '+996', minDigits: 9, maxDigits: 9, example: '700 123 456' },
  { id: 'GB', flag: '🇬🇧', name: 'Reino Unido', dialCode: '+44', minDigits: 10, maxDigits: 10, example: '7400 123456' },
  { id: 'CF', flag: '🇨🇫', name: 'Republica Centro-Africana', dialCode: '+236', minDigits: 8, maxDigits: 8, example: '70 01 23 45' },
  { id: 'CZ', flag: '🇨🇿', name: 'Republica Tcheca', dialCode: '+420', minDigits: 9, maxDigits: 9, example: '601 123 456' },
  { id: 'DO', flag: '🇩🇴', name: 'Republica Dominicana', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(809) 234-5678' },
  { id: 'RE', flag: '🇷🇪', name: 'Reuniao', dialCode: '+262', minDigits: 9, maxDigits: 9, example: '692 12 34 56' },
  { id: 'RO', flag: '🇷🇴', name: 'Romenia', dialCode: '+40', minDigits: 9, maxDigits: 9, example: '712 345 678' },
  { id: 'RW', flag: '🇷🇼', name: 'Ruanda', dialCode: '+250', minDigits: 9, maxDigits: 9, example: '72 123 4567' },
  { id: 'RU', flag: '🇷🇺', name: 'Russia', dialCode: '+7', minDigits: 10, maxDigits: 10, example: '912 345 6789' },
  { id: 'EH', flag: '🇪🇭', name: 'Saara Ocidental', dialCode: '+212', minDigits: 9, maxDigits: 9, example: '650 123456' },
  { id: 'WS', flag: '🇼🇸', name: 'Samoa', dialCode: '+685', minDigits: 7, maxDigits: 7, example: '72 12345' },
  { id: 'AS', flag: '🇦🇸', name: 'Samoa Americana', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(684) 733-1234' },
  { id: 'SM', flag: '🇸🇲', name: 'San Marino', dialCode: '+378', minDigits: 10, maxDigits: 10, example: '66 66 12 12' },
  { id: 'SH', flag: '🇸🇭', name: 'Santa Helena', dialCode: '+290', minDigits: 5, maxDigits: 5, example: '51234' },
  { id: 'LC', flag: '🇱🇨', name: 'Santa Lucia', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(758) 284-5678' },
  { id: 'BL', flag: '🇧🇱', name: 'Sao Bartolomeu', dialCode: '+590', minDigits: 9, maxDigits: 9, example: '690 12 34 56' },
  { id: 'KN', flag: '🇰🇳', name: 'Sao Cristovao e Nevis', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(869) 765-2917' },
  { id: 'MF', flag: '🇲🇫', name: 'Sao Martinho', dialCode: '+590', minDigits: 9, maxDigits: 9, example: '690 12 34 56' },
  { id: 'PM', flag: '🇵🇲', name: 'Sao Pedro e Miquelon', dialCode: '+508', minDigits: 6, maxDigits: 6, example: '55 12 34' },
  { id: 'ST', flag: '🇸🇹', name: 'Sao Tome e Principe', dialCode: '+239', minDigits: 7, maxDigits: 7, example: '981 2345' },
  { id: 'VC', flag: '🇻🇨', name: 'Sao Vicente e Granadinas', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(784) 430-1234' },
  { id: 'SC', flag: '🇸🇨', name: 'Seicheles', dialCode: '+248', minDigits: 7, maxDigits: 7, example: '2 510 123' },
  { id: 'SN', flag: '🇸🇳', name: 'Senegal', dialCode: '+221', minDigits: 9, maxDigits: 9, example: '70 123 45 67' },
  { id: 'SL', flag: '🇸🇱', name: 'Serra Leoa', dialCode: '+232', minDigits: 8, maxDigits: 8, example: '25 123456' },
  { id: 'RS', flag: '🇷🇸', name: 'Servia', dialCode: '+381', minDigits: 8, maxDigits: 9, example: '60 1234567' },
  { id: 'SY', flag: '🇸🇾', name: 'Siria', dialCode: '+963', minDigits: 9, maxDigits: 9, example: '944 567 890' },
  { id: 'SO', flag: '🇸🇴', name: 'Somalia', dialCode: '+252', minDigits: 8, maxDigits: 8, example: '61 1234567' },
  { id: 'LK', flag: '🇱🇰', name: 'Sri Lanka', dialCode: '+94', minDigits: 9, maxDigits: 9, example: '71 234 5678' },
  { id: 'SD', flag: '🇸🇩', name: 'Sudao', dialCode: '+249', minDigits: 9, maxDigits: 9, example: '91 123 4567' },
  { id: 'SS', flag: '🇸🇸', name: 'Sudao do Sul', dialCode: '+211', minDigits: 9, maxDigits: 9, example: '97 712 3456' },
  { id: 'SE', flag: '🇸🇪', name: 'Suecia', dialCode: '+46', minDigits: 9, maxDigits: 9, example: '70 123 45 67' },
  { id: 'CH', flag: '🇨🇭', name: 'Suica', dialCode: '+41', minDigits: 9, maxDigits: 9, example: '76 123 45 67' },
  { id: 'SR', flag: '🇸🇷', name: 'Suriname', dialCode: '+597', minDigits: 7, maxDigits: 7, example: '741 2345' },
  { id: 'TH', flag: '🇹🇭', name: 'Tailandia', dialCode: '+66', minDigits: 9, maxDigits: 9, example: '81 234 5678' },
  { id: 'TW', flag: '🇹🇼', name: 'Taiwan', dialCode: '+886', minDigits: 9, maxDigits: 9, example: '912 345 678' },
  { id: 'TJ', flag: '🇹🇯', name: 'Tajiquistao', dialCode: '+992', minDigits: 9, maxDigits: 9, example: '917 12 3456' },
  { id: 'TZ', flag: '🇹🇿', name: 'Tanzania', dialCode: '+255', minDigits: 9, maxDigits: 9, example: '621 234 567' },
  { id: 'IO', flag: '🇮🇴', name: 'Territorio Britanico do Oceano Indico', dialCode: '+246', minDigits: 7, maxDigits: 7, example: '380 1234' },
  { id: 'TF', flag: '🇹🇫', name: 'Territorios Franceses do Sul', dialCode: '+262', minDigits: 9, maxDigits: 9, example: '692 12 34 56' },
  { id: 'TL', flag: '🇹🇱', name: 'Timor-Leste', dialCode: '+670', minDigits: 7, maxDigits: 8, example: '7721 2345' },
  { id: 'TG', flag: '🇹🇬', name: 'Togo', dialCode: '+228', minDigits: 8, maxDigits: 8, example: '90 11 23 45' },
  { id: 'TK', flag: '🇹🇰', name: 'Tokelau', dialCode: '+690', minDigits: 4, maxDigits: 4, example: '1234' },
  { id: 'TO', flag: '🇹🇴', name: 'Tonga', dialCode: '+676', minDigits: 5, maxDigits: 7, example: '771 5123' },
  { id: 'TT', flag: '🇹🇹', name: 'Trinidad e Tobago', dialCode: '+1', minDigits: 10, maxDigits: 10, example: '(868) 291-1234' },
  { id: 'TN', flag: '🇹🇳', name: 'Tunisia', dialCode: '+216', minDigits: 8, maxDigits: 8, example: '20 123 456' },
  { id: 'TM', flag: '🇹🇲', name: 'Turcomenistao', dialCode: '+993', minDigits: 8, maxDigits: 8, example: '65 123456' },
  { id: 'TR', flag: '🇹🇷', name: 'Turquia', dialCode: '+90', minDigits: 10, maxDigits: 10, example: '501 234 5678' },
  { id: 'TV', flag: '🇹🇻', name: 'Tuvalu', dialCode: '+688', minDigits: 5, maxDigits: 6, example: '901234' },
  { id: 'UA', flag: '🇺🇦', name: 'Ucrania', dialCode: '+380', minDigits: 9, maxDigits: 9, example: '50 123 4567' },
  { id: 'UG', flag: '🇺🇬', name: 'Uganda', dialCode: '+256', minDigits: 9, maxDigits: 9, example: '712 345678' },
  { id: 'UY', flag: '🇺🇾', name: 'Uruguai', dialCode: '+598', minDigits: 8, maxDigits: 9, example: '99 123 456' },
  { id: 'UZ', flag: '🇺🇿', name: 'Uzbequistao', dialCode: '+998', minDigits: 9, maxDigits: 9, example: '91 234 56 78' },
  { id: 'VU', flag: '🇻🇺', name: 'Vanuatu', dialCode: '+678', minDigits: 5, maxDigits: 7, example: '591 2345' },
  { id: 'VA', flag: '🇻🇦', name: 'Vaticano', dialCode: '+39', minDigits: 9, maxDigits: 10, example: '312 345 6789' },
  { id: 'VE', flag: '🇻🇪', name: 'Venezuela', dialCode: '+58', minDigits: 10, maxDigits: 10, example: '412 123 4567' },
  { id: 'VN', flag: '🇻🇳', name: 'Vietna', dialCode: '+84', minDigits: 9, maxDigits: 10, example: '91 234 56 78' },
  { id: 'WF', flag: '🇼🇫', name: 'Wallis e Futuna', dialCode: '+681', minDigits: 6, maxDigits: 6, example: '50 12 34' },
  { id: 'ZM', flag: '🇿🇲', name: 'Zambia', dialCode: '+260', minDigits: 9, maxDigits: 9, example: '95 5123456' },
  { id: 'ZW', flag: '🇿🇼', name: 'Zimbabue', dialCode: '+263', minDigits: 9, maxDigits: 9, example: '71 234 5678' }
];

export const defaultPhoneCountry = phoneCountries[0];

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function normalizePhoneNumber(phone: string, fallbackCountry = defaultPhoneCountry) {
  const clean = phone.trim();
  const country = findPhoneCountryByDialCode(clean) ?? fallbackCountry;
  const nationalDigits = getNationalPhoneDigits(clean, country, false);
  return nationalDigits ? `${country.dialCode}${nationalDigits}` : '';
}

export function findPhoneCountryByDialCode(phone: string) {
  const clean = phone.trim();
  return [...phoneCountries]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => clean.startsWith(country.dialCode));
}

export function getNationalPhoneDigits(phone: string, country: PhoneCountry, limitToMax = true) {
  const clean = phone.trim();
  const limit = (digits: string) => (limitToMax ? digits.slice(0, country.maxDigits) : digits);
  if (clean.startsWith(country.dialCode)) {
    return limit(onlyDigits(clean.slice(country.dialCode.length)));
  }
  return limit(onlyDigits(clean));
}

export function formatInternationalPhone(country: PhoneCountry, nationalDigits: string) {
  const digits = onlyDigits(nationalDigits).slice(0, country.maxDigits);
  return digits ? `${country.dialCode}${digits}` : country.dialCode;
}

export function formatNationalPhone(country: PhoneCountry, nationalDigits: string) {
  const digits = onlyDigits(nationalDigits).slice(0, country.maxDigits);

  if (country.id === 'BR') {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (country.id === 'US') {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function getPhoneValidation(phone: string, country?: PhoneCountry) {
  const selectedCountry = country ?? findPhoneCountryByDialCode(phone) ?? defaultPhoneCountry;
  const nationalDigits = getNationalPhoneDigits(phone, selectedCountry, false);

  if (nationalDigits.length < selectedCountry.minDigits) {
    const missing = selectedCountry.minDigits - nationalDigits.length;
    return {
      isValid: false,
      country: selectedCountry,
      nationalDigits,
      message: missing === 1 ? 'Falta 1 digito no telefone.' : `Faltam ${missing} digitos no telefone.`
    };
  }

  if (nationalDigits.length > selectedCountry.maxDigits) {
    return {
      isValid: false,
      country: selectedCountry,
      nationalDigits,
      message: `O telefone deve ter no maximo ${selectedCountry.maxDigits} digitos.`
    };
  }

  return {
    isValid: true,
    country: selectedCountry,
    nationalDigits,
    message: ''
  };
}
