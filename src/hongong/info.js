class Info {
	/*
		String[] names: 지식의 이름들, 반드시 1개 이상
		Attr  [] attrs: 지식의 속성들
	*/
	constructor(names, attrs) {
		console.assert(names instanceof Array && names.length > 0);
		console.assert(attrs instanceof Array);

		this.names = names;
		this.attrs = attrs;
		this.comment = '';

		// parent는 이 Info를 소유한 지식을 레퍼런스로 저장한다.
		// childs는 이 Info가 가진 하위 지식(들)을 레퍼런스로 저장한다.
		this.parent = null;
		this.childs = [];

		this.id = null;
	}
}

export default Info;