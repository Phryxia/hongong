import InfoTree from './infotree';
const Lex = {};

/**
	토큰 코드를 아래와 같이 정의합니다.
	$는 입력의 시작을 의미합니다.

	$#####  H5
	$####   H4
	$###    H3
	$##     H2
	$#      H1
	$-      AT
	$\n     LF
	$[ \t]+ WH

	입력받은 문자열 str를 대상으로 어휘
	분석을 한 뒤 [토큰코드, 값]을 반환합니다.
	값은 ST만 가질 수 있습니다.
*/
// define token code
Lex.H1 = 0;
Lex.H2 = 1;
Lex.H3 = 2;
Lex.H4 = 3;
Lex.H5 = 4;
Lex.AT = 5; // attribute
Lex.LF = 6; // line feed
Lex.WH = 7; // white space
Lex.ST = 8; // string

Lex.tokencode = function(code) {
	switch(code) {
		case Lex.H1: return 'H1';
		case Lex.H2: return 'H2';
		case Lex.H3: return 'H3';
		case Lex.H4: return 'H4';
		case Lex.H5: return 'H5';
		case Lex.AT: return 'AT';
		case Lex.LF: return 'LF';
		case Lex.WH: return 'WH';
		case Lex.ST: return 'ST';
		default: return '??';
	}
};

Lex.lex = function(str) {
	let cptr = 0;
	let c = '';
	let token = '';
	let out = [];

	function lex() {
		return c = str.charAt(cptr++);
	}

	function recognize(ch) {
		if(ch === c) {
			lex();
			return true;
		}
		else
			return false;
	}

	function is_whitespace() {
		return c === ' ' || c === '\t';
	}

	lex();
	while(c !== '') {
		if(recognize('#')) {
			if(recognize('#')) {
				if(recognize('#')) {
					if(recognize('#')) {
						if(recognize('#'))
							out.push([Lex.H5, null]);
						else
							out.push([Lex.H4, null]);
					}
					else
						out.push([Lex.H3, null]);
				}
				else
					out.push([Lex.H2, null]);
			}
			else
				out.push([Lex.H1, null]);
		}
		else if(recognize('-'))
			out.push([Lex.AT, null]);
		else if(is_whitespace()) {
			lex();
			while(is_whitespace())
				lex();
			out.push([Lex.WH, null]);
		}
		else if(recognize('\n')) {
			while(recognize('\n'));

			out.push([Lex.LF, null]);
		}
		else {
			// read arbitrary string
			token += c;
			lex();
			while(c !== '\n' && c !== '') {
				token += c;
				lex();
			}
			out.push([Lex.ST, token]);
			token = '';
		}
	}
	return out;
};

/*
	Lex.parse가 소화를 잘 시킬 수 있게 전처리를 합니다.
	
	- 마지막 토큰이 LF가 아니면, LF를 추가해줍니다.
*/
Lex.preprocess = function(lexeme) {
	// last token safety
	if(lexeme.length > 0 && lexeme[lexeme.length - 1][0] != Lex.LF)
		lexeme.push([Lex.LF, null]);
}

/*
	Lex.preprocess로 전처리가 끝난 lexeme 배열을 파싱하여
	InfoTree로 반환합니다.

	중간에 컴파일 에러가 발생할 경우 파싱하다 만 InfoTree를
	반환하며, 이후 정상 작동을 보장할 수 없습니다.
*/
Lex.syntax = function(lexeme) {
	let tree = new InfoTree();
	let tc = -1; // token code
	let tv = null; // token value
	let lptr = 0;

	function next_lex() {
		// skip white space
		let temp = lexeme[lptr++];
		while(temp !== undefined && temp[0] === Lex.WH)
			temp = lexeme[lptr++];
		if(temp === undefined) {
			tc = -1;
			tv = null;
		}
		else {
			tc = temp[0];
			tv = temp[1];
		}
		//console.log(`${Lex.tokencode(tc)}`);
	}

	function token_error(expect) {
		throw new Error(`Invalid token: ${Lex.tokencode(tc)}, expect ${Lex.tokencode(expect)}`);
	}

	// 속성을 파싱한다. 파싱에 성공하면 해당 attr의
	// 내용을 문자열로 반환한다.
	function parse_A() {
		if(tc === Lex.AT) {
			next_lex();
			if(tc === Lex.ST) {
				let attr = tv;
				next_lex();
				if(tc === Lex.LF) {
					next_lex();
					return attr;
				}
				else
					token_error(Lex.LF);
			}
			else
				token_error(Lex.ST);
		}
		else
			token_error(Lex.AT);
	}

	// 주석을 파싱한다. 파싱에 성공하면 해당 주석의
	// 내용을 문자열로 반환한다.
	function parse_C() {
		if(tc === Lex.ST) {
			let comment = tv;
			next_lex();
			if(tc === Lex.LF) {
				next_lex();
				return comment;
			}
			else
				token_error(Lex.LF);
		}
		else
			token_error(Lex.ST);
	}

	// n단계 지식의 이름을 파싱한다. 파싱에 성공하면
	// 해당 이름을 문자열로 반환한다.
	function parse_HD(n) {
		// parameter error
		if(n < 1 || n > 5)
			throw new Error(`Illegal parameter n = ${n}`);
		
		// parse header
		if(Lex.tokencode(tc) === `H${n}`) {
			next_lex();
			if(tc === Lex.ST) {
				let hn = tv;
				next_lex();
				if(tc === Lex.LF) {
					next_lex();
					return hn;
				}
				else
					token_error(Lex.LF);
			}
			else
				token_error(Lex.ST);
		}
		else
			token_error(n - 1);
	}

	// n단계 지식을 파싱한다.
	// n단계 지식은 반드시 Hn으로 시작해야한다.
	function parse_I(n, parent) {
		// parameter error 
		if(n < 1 || n > 5)
			throw new Error(`Illegal parameter n = ${n}`);
		
		// parse info
		if(Lex.tokencode(tc) === `H${n}`) {
			let name = parse_HD(n);
			// console.log(`H${n}: ${name}`);
			
			// comment와 attribute를 파싱
			let attrs = [];
			let comment = '';
			while(tc !== -1) {
				if(tc === Lex.ST) {
					let cmt = parse_C();
					comment += cmt + ' ';
					// console.log(`comment: ${cmt}`);
				}
				else if(tc === Lex.AT) {
					let attr = parse_A();
					attrs.push(attr);
					// console.log(`attr: ${attr}`);
				}
				else
					break;
			}

			// Success
			let info = tree.createInfo(name, parent);
			info.comment = comment;
			attrs.forEach(attr => {
				tree.createAttr(info, attr, '정의');
			});

			// 자식을 파싱
			let has_child = true;
			while(has_child) {
				has_child = false;

				// Hn보다 더 작은 수준이 있는 경우
				// 자식으로 간주
				//
				// 하위 자식에서 에러가 나면 무시하고
				// 자식을 추가하지 않는다.
				for(let k = n + 1; k <= 5; ++k) {
					if(Lex.tokencode(tc) === `H${k}`) {
						has_child = true;
						parse_I(k, info);
						//soup.append(info, parse_I(k));
						// todo: 컴파일러 고쳐서 InfoTree에 맞게 변환
					}
				}
			}

			return info;
		}
		else
			token_error(n - 1);
	}

	next_lex();
	try {
		while(tc != -1) {
			// 첫 헤더가 나올 때까지 모두 생략
			while(tc != -1 && !(Lex.H1 <= tc && tc <= Lex.H5))
				next_lex();

			// 포레스트 파싱 시도
			for(let k = 1; k <= 5; ++k) {
				if(Lex.tokencode(tc) === `H${k}`)
					parse_I(k);
			}
		}
	}
	catch(e) {
		console.log(e);
	}
	return tree;
};

Lex.parse = function(docstr) {
	let lexeme = Lex.lex(docstr);
	Lex.preprocess(lexeme);
	return Lex.syntax(lexeme);
};

export default Lex;