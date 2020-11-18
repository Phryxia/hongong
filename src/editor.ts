import { DataCenter, NoteNode } from './datacenter';
import Info from './hongong/info';
import Parser from './hongong/parser';

// Linked List처럼 관리된다.
class EditorElement {
  dom: HTMLElement;
  private suffix: HTMLInputElement;
  private prefix: HTMLElement;

  private innerText: string = '';
  public _type: string; // h1, h2 ..., attr

  public prev: EditorElement | null;
  public next: EditorElement | null;
  public parent: EditorComponent;

  
  public constructor(parent: EditorComponent, type: string) {
    this.parent = parent;
    this._type = type;
    
    this.dom = document.createElement('div');
    this.prefix = document.createElement('span');
    this.prefix.innerText = '- ';
    this.dom.appendChild(this.prefix);

    this.suffix = document.createElement('input');
    this.suffix.type = 'text';
    this.suffix.style.width = '90%';
    this.suffix.placeholder = '내용을 입력해주세요';
    
    // 부모에게 자신이 선택되었다고 알린다.
    this.suffix.onclick = () => {
      this.parent.setCurrentElement(this);
    };
    
    // 이벤트 리스너
    this.suffix.onkeyup = (evt) => {
      // 개행문자 방지용
      this.suffix.value = this.suffix.value.replace(/\n/g, '');
      this.innerText = this.suffix.value = this.trimSentinel(this.suffix.value);

      // 아무것도 없는데 백스페이스를 누르면 삭제한다.
      if (this.suffix.value === '' && evt.key === 'Backspace' && this.prev) {
        const prev = this.prev;
        this.parent.remove(this);
        this.parent.setCurrentElement(prev);
      }
      // 엔터치면 이거랑 똑같은 타입의 노드를 새로 만든다.
      else if (evt.key === 'Enter') {
        const newelem = new EditorElement(this.parent, this.type);
        this.parent.insert(this, newelem);
        this.parent.setCurrentElement(newelem);
      }
      // 위로 키: 뒤로가기
      else if ((evt.key === 'ArrowUp' || evt.key === 'Up') && this.prev)
        this.parent.setCurrentElement(this.prev);
      // 아래로 키: 앞으로 가기
      else if ((evt.key === 'ArrowDown' || evt.key === 'Down') && this.next)
        this.parent.setCurrentElement(this.next);
    };

    this.dom.appendChild(this.suffix);

    this.render();
  }

  public set data(val: string) {
    this.innerText = val;
    this.render();
  }

  public get data() {
    return this.innerText;
  }

  public set type(type: string) {
    this._type = type;
    this.render();
  }

  public get type() {
    return this._type;
  }

  public focus(): void {
    this.suffix.focus();
  }

  public update(): void {
    this.render();
  }

  private render(): void {
    // 속성 타입은 앞에 -를 붙인다.
    this.prefix.style.display = this.type === 'attr' ? 'inline' : 'none';

    this.suffix.value = this.innerText;
    this.suffix.className = `ee-${this.type}`;
    this.suffix.style.fontWeight = this.type === 'attr' ? 'normal' : 'bold';
  }

  // #으로 시작하거나 -로 시작하는 문자열을 파서 에러가 나지 않게
  // 해당 문자를 없앤다. (ex: #123# -> 123#)
  private trimSentinel(s: string): string {
    s = s.trimLeft();
    if (s.charAt(0) === '#' || s.charAt(0) === '-') {
      s = s.slice(1, s.length - 1);
    }
    return s;
  }
}

/*
  다른 모듈과 다르게 에디터는 MVC를 분리하기가 애매해서
  컴포넌트로 뷰와 컨트롤러를 통합시켜놨다.
*/
export class EditorComponent {
  private dom: HTMLElement = document.getElementById('editor');

  // EditorElement를 관리하는 링크드리스트
  private title: EditorElement;
  private head: EditorElement;
  private current: EditorElement | null = null;

  // 현재 편집기가 열고 있는 필기의 FileSystemNode
  private currentNoteNode: NoteNode | null;

  public constructor(dc: DataCenter) {
    this.title = new EditorElement(this, 'h1');
    this.head = new EditorElement(this, 'h2');
    
    // 제목 버튼들
    for (let i = 1; i <= 4; ++i) {
      document.getElementById(`bt-head-${i}`).onclick = () => {
        if (!this.current)
          return;
        
        // 현재 포커싱된 엘레먼트의 타입을 바꾼다.
        this.current.type = `h${i + 1}`;
        this.current.update();
        this.setCurrentElement(this.current);
      };
    };

    // 내용 버튼
    document.getElementById('bt-attr').onclick = () => {
      if (!this.current)
        return;
      
      // 현재 포커싱된 엘레먼트의 타입을 바꾼다.
      this.current.type = 'attr';
      this.current.update();
      this.setCurrentElement(this.current);
    };

    // 저장버튼은 browser_tree.ts에 있다.

    this.deactivate();
  }

  public activate(): void {
    document.getElementById('editor-window').style.display = 'block';
  }

  public deactivate(): void {
    document.getElementById('editor-window').style.display = 'none';
  }

  // 제목을 제외한 에디터 내부 항목을 선택하게 한다.
  // null을 입력시킬 경우 선택을 해제한다. 
  public setCurrentElement(cursor: EditorElement): void {
    // 만약 사용자가 제목을 클릭할 경우, 제목 엘레먼트에서 이
    // 함수가 호출되므로 그 경우엔 포커스를 해제해줘야 한다.
    if (cursor === this.title)
      cursor = null;
    
    this.current = cursor;
    
    if (!cursor)
      return ;
    
    this.current.focus();
  }

  // 해당 엘레먼트의 뒤에 새로운 엘레먼트를 붙인다.
  public insert(cursor: EditorElement, newcomp: EditorElement): void {
    if (!cursor) {
      this.head = newcomp;
      return ;
    }
    
    newcomp.next = cursor.next;
    newcomp.prev = cursor;
    if (cursor.next)
      cursor.next.prev = newcomp;
    cursor.next = newcomp;

    this.update();
  }

  // 해당 엘레먼트를 제거한다.
  public remove(cursor: EditorElement): void {
    // 최소한 하나의 엘레먼트는 남겨둔다.
    if (cursor === this.head && !cursor.next)
      return;
    
    if (cursor === this.head) {
      this.head = cursor.next;
      if (cursor.next)
        cursor.next.prev = null;
    }
    else {
      cursor.prev.next = cursor.next;
      if (cursor.next)
        cursor.next.prev = cursor.prev;
    }

    this.update();
  }

  public init(): void {
    // 제목 초기화
    this.title.data = '';

    // 모든 노드 삭제
    while (this.head.next)
      this.remove(this.head);

    // 첫번째 노드는 삭제가 안되므로 수동으로 초기화해야 한다.
    this.head.type = 'h2';
    this.head.data = '';
    this.setCurrentElement(this.head);
  }

  // 에디터 화면을 업데이트한다.
  public update(): void {
    while (this.dom.firstChild)
      this.dom.removeChild(this.dom.firstChild);

    this.dom.appendChild(this.title.dom);

    let element = this.head;
    while (element) {
      this.dom.appendChild(element.dom);
      element = element.next;
    }
  }

  // 필기를 열어서 에디터에 반영한다.
  public open(node: NoteNode): void {
    this.currentNoteNode = node;
    this.init();
    this.title.data = node.name;
    this.fromMarkdown(node.content);
    this.update();
    this.activate();
  }

  public save(): void {
    if (!this.currentNoteNode)
      return ;
    
    if (!this.title.data) {
      alert('필기 제목을 입력해주세요!');
      return ;
    }

    if (!this.head.next && !this.head.data) {
      alert('빈 문서는 저장할 수 없어요!');
      return ;
    }

    this.currentNoteNode.name = this.title.data;
    this.currentNoteNode.content = this.toMarkdown();
  }

  // 현재 편집 중인 필기를 마크다운으로 변환하여 반환한다.
  public toMarkdown(): string {
    let element = this.head;
    let out = `# ${this.title.data}\n`;
    
    while (element) {
      // 사용자가 아무 것도 입력하지 않은 행의 경우 패스
      if (element.data) {
        if (element.type === 'attr')
          out += '- ' + element.data;
        else {
          // 최상단에 #을 하나 붙이기 위해서 나머지를 2단계부터 적용시킴
          for (let i = 0; i < Number(element.type.charAt(1)); ++i)
            out += '#';
          out += ' ' + element.data;
        }
        out += '\n';
      }
      element = element.next;
    }

    return out;
  }

  // 마크다운을 읽어서 현재 문서에 반영한다.
  // 다만 설계상의 문제로 마크다운의 루트 소제목은 반영되지 않는다.
  private fromMarkdown(markdown: string): void {
    // 처음 만들어진 문서인 경우.
    if (!markdown)
      return;
    
    const infotree = Parser.parse(markdown);
    this.title.data = infotree.roots[0].names[0];
    const cursor = this.serializeTree(infotree.roots[0]);
    this.setCurrentElement(cursor);
  }

  // 트리를 DFS로 순회하면서 링크드리스트로 바꾼다.
  private serializeTree(node: Info, cursor: EditorElement = null, depth: number = 2) {
    // attr first
    for (const attr of node.attrs) {
      const newComp = new EditorElement(this, 'attr');
      newComp.data = attr.content;
      this.insert(cursor, newComp);
      cursor = newComp;
    }

    // 자식의 이름을 먼저 출력하고, 재귀적으로 하위 속성을 출력한다.
    for (const child of node.childs) {
      const newComp = new EditorElement(this, `h${depth}`);
      newComp.data = child.names[0];
      this.insert(cursor, newComp);
      cursor = newComp;
      cursor = this.serializeTree(child, cursor, depth + 1);
    }

    return cursor;
  }
}