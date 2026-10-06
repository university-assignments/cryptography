import type { Matrix } from '@/lib/matrix';

export interface HillPreset
{
	a: Matrix;
	b: number[];
	encrypt: string;
	decrypt: string;
	pad: string;
}

export interface SquarePreset
{

	/** Известные клетки: «12,6,.,.;13,3,.,.;…» */
	grid: string;
	encrypt: string;
	decrypt: string;
	pad: string;
}

export interface VigenerePreset
{
	key: string;
	encrypt: string;
	decrypt: string;
}

export interface VariantPreset
{
	id: number;
	hill: HillPreset;
	square: SquarePreset;
	vigenere: VigenerePreset;
	caesar: { cipher: string };
	playfair: { key: string; decrypt: string };
}

const A1: Matrix = [[ 0, 3, 3 ], [ 11, 1, 1 ], [ 1, 4, 5 ]];
const A2: Matrix = [[ 11, 19, 0 ], [ 4, 19, 25 ], [ 5, 7, 1 ]];
const A3: Matrix = [[ 1, 9, 10 ], [ 3, 6, 9 ], [ 8, 2, 11 ]];
const A4: Matrix = [[ 20, 5, 25 ], [ 13, 7, 25 ], [ 2, 14, 1 ]];
const zero = [ 0, 0, 0 ];

/** Условия с листа заданий; добивка — как в тетради (на листе её нет). */
export const VARIANTS: VariantPreset[] = [
	{
		id: 1,
		hill: { a: A1, b: zero, encrypt: 'DUMSPIROSPERO', decrypt: 'HLSUMCLABAWOMGCSXPLHRMJH', pad: 'A' },
		square: { grid: '12,6,.,.;13,3,.,.;.,.,.,11;.,.,4,14', encrypt: 'КАРАБАС БАРАБАС', decrypt: 'SERSCIIICEMLNHOI', pad: 'А' },
		vigenere: { key: 'DOG', encrypt: 'FORTESFORTUNAADIUVAT', decrypt: 'KISHHGMRLDEIVEJX' },
		caesar: { cipher: 'NKLNL' },
		playfair: { key: 'CANIS', decrypt: 'CDRSKGSCNBHOELNZ' },
	},
	{
		id: 2,
		hill: { a: A2, b: zero, encrypt: 'OSANCTASIMPLICITAS', decrypt: 'NNIDICQICBTHZRYFXADOWHZV', pad: 'X' },
		square: { grid: '.,.,14,4;.,.,11,5;3,13,.,.;.,12,.,.', encrypt: 'МАМА МЫЛА РАМУ', decrypt: 'CSNETANESCCPEMRE', pad: 'Ы' },
		vigenere: { key: 'CAT', encrypt: 'NIHILHABENTINIHILDEEST', decrypt: 'HAEFXDPBUXIUZIJLQ' },
		caesar: { cipher: 'NLYEZC' },
		playfair: { key: 'CORNIX', decrypt: 'TXENBXQIXTXEOE' },
	},
	{
		id: 3,
		hill: { a: A3, b: zero, encrypt: 'INSAECULASAECULORUM', decrypt: 'TGZDKFJEEADCBYIEDCMXFZBH', pad: 'X' },
		square: { grid: '.,16,2,.;.,3,13,.;15,.,.,1;4,.,.,14', encrypt: 'РУКА РУКУ МОЕТ', decrypt: 'ITAMOBNIIANLORVC', pad: 'А' },
		vigenere: { key: 'LEX', encrypt: 'SIMILIASIMILIBUSCURANTUR', decrypt: 'RYQZUVTVCTGAITDTU' },
		caesar: { cipher: 'NDHVYN' },
		playfair: { key: 'AMICUS', decrypt: 'CBKDELUAOCRFMQFAIW' },
	},
	{
		id: 4,
		hill: { a: A4, b: zero, encrypt: 'VOXPOPULIVOXDEI', decrypt: 'ZUDIDQNJUIGMLRWHNRYKC', pad: 'X' },
		square: { grid: '.,.,5,.;.,.,10,3;14,7,.,.;1,12,.,.', encrypt: 'ПЕРВЫЙ БЛИН КОМОМ', decrypt: 'ARTPAPEASADRARES', pad: 'Ы' },
		vigenere: { key: 'HOT', encrypt: 'MEDICUSCURATNATURASANAT', decrypt: 'ZQBWPBMNIWTTBMMNXAT' },
		caesar: { cipher: 'GOMWU' },
		playfair: { key: 'CARAGIUS', decrypt: 'OPCFBABZOPWCMDYP' },
	},
	{
		id: 5,
		hill: { a: A1, b: zero, encrypt: 'CORRUPTIOOPTIMIPESSIMA', decrypt: 'AZTLTILXFPPWKVDHDP', pad: 'X' },
		square: { grid: '.,.,14,1;.,.,.,8;3,16,.,.;6,9,.,.', encrypt: 'ОКО ЗА ОКО ЗУБ ЗА ЗУБ', decrypt: 'LOOADCIUVIDBASTA', pad: 'А' },
		vigenere: { key: 'CAR', encrypt: 'HOMOPROPONITSEDDEUSDISPONIT', decrypt: 'XIEPUIYDWEDJNUAGZSM' },
		caesar: { cipher: 'XTRJG' },
		playfair: { key: 'LYNX', decrypt: 'YFFZZYEDFZZH' },
	},
	{
		id: 6,
		hill: { a: A2, b: zero, encrypt: 'DIESDIEMDOCET', decrypt: 'SLLKUASEGEICBHXCZY', pad: 'X' },
		square: { grid: '15,6,.,.;10,.,.,.;.,.,2,11;.,.,7,14', encrypt: 'ТРЕТЬЕГО НЕ ДАНО', decrypt: 'SOPMOE!!ORTROAME', pad: 'А' },
		vigenere: { key: 'GOD', encrypt: 'INVIAVIRTUTINULLAESTVIA', decrypt: 'VOADPQWBTZQRLQVMF' },
		caesar: { cipher: 'WDGDN' },
		playfair: { key: 'LUPUS', decrypt: 'PFHAANRULTOQPY' },
	},
];

export function findVariant (id: number): VariantPreset | undefined
{
	return VARIANTS.find((v) => v.id === id);
}
