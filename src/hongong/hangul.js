class Hangul {};

Hangul.NUMBER_OF_CHOSEONG  = 19;
Hangul.NUMBER_OF_JUNGSEONG = 21;
Hangul.NUMBER_OF_JONGSEONG = 28; // x ㄱ ㄲ ㄳ ㄴ ...

Hangul.CHOSEONG  = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
Hangul.JUNGSEONG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
Hangul.JONGSEONG = [''  , 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

Hangul.CHOSEONG_GIYEOK = 0x1100;
Hangul.JUNGSEONG_A = 0x1161;
Hangul.JONGSEONG_CHEUM = 0x11A8;

//let jongseong = ['ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ',]

// 호환문자 'ㄱ' 'ㄴ' 'ㄷ'의 초성 인덱스를 반환합니다.
// 초성으로 사용할 수 없는 글자가 들어오면 undefined를 반환합니다.
Hangul.toChoseongIndex = function(c) {
	switch (c) {
		case 'ㄱ': return 0;
		case 'ㄲ': return 1;
		case 'ㄴ': return 2;
		case 'ㄷ': return 3;
		case 'ㄸ': return 4;
		case 'ㄹ': return 5;
		case 'ㅁ': return 6;
		case 'ㅂ': return 7;
		case 'ㅃ': return 8;
		case 'ㅅ': return 9;
		case 'ㅆ': return 10;
		case 'ㅇ': return 11;
		case 'ㅈ': return 12;
		case 'ㅉ': return 13;
		case 'ㅊ': return 14;
		case 'ㅋ': return 15;
		case 'ㅌ': return 16;
		case 'ㅍ': return 17;
		case 'ㅎ': return 18;
	}
	return undefined;
};

Hangul.toJungseongIndex = function(c) {
	switch (c) {
		case 'ㅏ': return 0;
		case 'ㅐ': return 1;
		case 'ㅑ': return 2;
		case 'ㅒ': return 3;
		case 'ㅓ': return 4;
		case 'ㅔ': return 5;
		case 'ㅕ': return 6;
		case 'ㅖ': return 7;
		case 'ㅗ': return 8;
		case 'ㅘ': return 9;
		case 'ㅙ': return 10;
		case 'ㅚ': return 11;
		case 'ㅛ': return 12;
		case 'ㅜ': return 13;
		case 'ㅝ': return 14;
		case 'ㅞ': return 15;
		case 'ㅟ': return 16;
		case 'ㅠ': return 17;
		case 'ㅡ': return 18;
		case 'ㅢ': return 19;
		case 'ㅣ': return 20;
	}
	return undefined;
};

Hangul.toJongseongIndex = function(c) {
	switch (c) {
		case ''  : return 0;
		case 'ㄱ': return 1;
		case 'ㄲ': return 2;
		case 'ㄳ': return 3;
		case 'ㄴ': return 4;
		case 'ㄵ': return 5;
		case 'ㄶ': return 6;
		case 'ㄷ': return 7;
		case 'ㄹ': return 8;
		case 'ㄺ': return 9;
		case 'ㄻ': return 10;
		case 'ㄼ': return 11;
		case 'ㄽ': return 12;
		case 'ㄾ': return 13;
		case 'ㄿ': return 14;
		case 'ㅀ': return 15;
		case 'ㅁ': return 16;
		case 'ㅂ': return 17;
		case 'ㅄ': return 18;
		case 'ㅅ': return 19;
		case 'ㅆ': return 20;
		case 'ㅇ': return 21;
		case 'ㅈ': return 22;
		case 'ㅊ': return 23;
		case 'ㅋ': return 24;
		case 'ㅌ': return 25;
		case 'ㅍ': return 26;
		case 'ㅎ': return 27;
	}
	return undefined;
};

/*
	한 글자를 분해합니다.
*/
Hangul.disassemble = function(c) {
	c = c.charCodeAt(0) - '가'.charCodeAt(0);
	let jongseong = c % Hangul.NUMBER_OF_JONGSEONG;
	c = Math.floor(c / Hangul.NUMBER_OF_JONGSEONG);
	let jungseong = c % Hangul.NUMBER_OF_JUNGSEONG;
	c = Math.floor(c / Hangul.NUMBER_OF_JUNGSEONG);
	let choseong = c;

	return [
		Hangul.CHOSEONG[choseong],
		Hangul.JUNGSEONG[jungseong],
		Hangul.JONGSEONG[jongseong]
	];
};

/*
	보조사 은/는 을 단어 어미에 따라 붙입니다.
*/
Hangul.appendBojosa = function(word) {
	let c = word[word.length - 1];
	// 숫자
	if ('0' <= c && c <= '9') {
		if (c === '0' || 
			c === '1' || 
			c === '3' || 
			c === '6' || 
			c === '7' || 
			c === '8')
			return word + '은';
		else
			return word + '는';
	}
	// 영어 또는 기호
	else if (c <= 'z')
		return word + '은/는';
	
	// 한글
	let jamo = Hangul.disassemble(word[word.length - 1]);
	if (jamo[2] === '')
		return word + '는';
	else
		return word + '은';
};

export default Hangul;