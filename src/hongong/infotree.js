import Info from './info';
import Attr from './attr';

/*
  InfoTree는 지식 트리가 모인 그래프 자료구조이다.
  지식 간의 연결성을 설정하고 탐색할 수 있다.
  한 번 생성된 지식은 삭제할 수 없다.
*/
class InfoTree {
  constructor() {
    // 포레스트로 관리
    this.roots = [];

    // id -> info
    // id는 클라이언트에서 지식이나 속성이 생성되는
    // 순간에 발급된다.
    this.infos = new Map();
  }

  /*
    name을 이름으로 갖는 지식을 parent의 자식으로 만든다.
    parent가 null이면 최상위 루트를 만든다.
	*/
  createInfo(name, parent) {
    let newInfo = this.__allocateInfo(name, `${InfoTree.idcnt++}`);

    if (parent)
      this.__appendInfo(parent, newInfo);
    else
      this.roots.push(newInfo);
    
    return newInfo;
  }

  /*
		info에 새 category타입의 속성 content를 추가한다.
	*/
  createAttr(info, content, category) {
    let aid = `${InfoTree.idcnt++}`;
    let attr = this.__appendAttr(info, content, category, aid);

    return attr;
  }

  /*
		DANGER ZONE
	*/
  __allocateInfo(name, id) {
    let newInfo = new Info([name], []);
    newInfo.id = id;
    this.infos.set(id, newInfo);
    return newInfo;
  }

  __appendInfo(parent, child) {
    parent.childs.push(child);
    child.parent = parent;
  }

  __appendAttr(info, content, category, aid) {
    let newAttr = new Attr(info, content, category);
    newAttr.id = aid;
    info.attrs.push(newAttr);
    return newAttr;
  }
}

InfoTree.idcnt = 0;

export default InfoTree;
