/*
	Attr 클래스는 Info의 속성, 문장을 매끄럽게
	나타낼 수 있는 조사 및 어미를 저장다.
*/
class Attr {
	/*
		Info pinfo
			이 Attr을 소유하는 Info

		String content
			이 Attr의 내용을 서술하는 구
			ex) 사과는 "바보"다

		String category
			pinfo와의 관계가 무엇인지 서술
			ex) '정의', '특징', '사례'
	*/
	constructor(pinfo, content, category) {
		console.assert(pinfo);
		console.assert(typeof(content) === 'string');
		console.assert(typeof(category) === 'string');
		this.pinfo = pinfo;
		this.content = content;
		this.category = category;
		this.id = null;
	}
};

export default Attr;