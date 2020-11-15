import { DataCenter, FileSystemNode, FolderNode, NoteNode } from "./datacenter";
import { EditorComponent } from "./editor";
import { PracticeController } from "./practice";

class BrowserTreeView {
  private dom: HTMLElement = document.getElementById('browser-tree');
  private dc: DataCenter;
  private editor: EditorComponent;
  private isOpen: Map <number, boolean> = new Map <number, boolean> ();

  public constructor(dc: DataCenter, editor: EditorComponent) {
    this.dc = dc;
    this.editor = editor;
  }

  public init(): void {
    this.isOpen.set(this.dc.getRootFolder().id, true);
  }

  public update(): void {
    // 브라우저 트리를 다 지우고 다시 만든다
    while (this.dom.firstChild)
      this.dom.removeChild(this.dom.firstChild);

    this.appendNode(this.dc.getRootFolder());
  }

  // 재귀적으로 DFS를 돌며 트리를 표현한다.
  private appendNode(node: FileSystemNode, depth: number = 0): void {
    this.dom.appendChild(this.renderTab(depth));
    this.dom.appendChild(this.renderNode(node));
    this.dom.appendChild(document.createElement('br'));

    if (node.isFolder && this.isOpen.get(node.id)) {
      for (const c of (node as FolderNode).children) {
        this.appendNode(c, depth + 1);
      }
    }
  }

  private renderNode(node: FileSystemNode): HTMLElement {
    const out = document.createElement('a');
    out.innerText = `${(node.isFolder ? '#' : '-')} ${node.name}`;
    
    // 색깔
    if (node === this.dc.getCurrentNode())
      out.style.color = 'red';
    else
      out.style.color = 'black';

    // 이벤트 리스너 등록
    out.onclick = () => {
      // 현재 파일까지의 폴더는 모두 열어둔다.
      this.open(node.parent);

      // 닫힌 폴더는 연다. 열린 폴더는 선택된 경우 닫고, 그렇지 않은 경우 선택한다.
      if (node === this.dc.getCurrentNode()) {
        if (this.isOpen.get(node.id))
          this.close(node);
        else
          this.open(node);
      }
      else {
        this.dc.setCurrentNode(node.id);
        if (!this.isOpen.get(node.id))
          this.open(node);
      }

      if (!node.isFolder) 
        this.editor.open((node as NoteNode));

      this.update();
    };

    return out;
  }

  private renderTab(depth: number): HTMLElement {
    const out = document.createElement('span');
    out.style.width = `${depth * 20}px`;
    out.style.display = 'inline-block';
    return out;
  }

  // id번 파일과 루트까지의 폴더들을 연다.
  public open(node: FileSystemNode): void {
    while (node) {
      this.isOpen.set(node.id, true);
      node = node.parent;
    }
  }

  public close(node: FileSystemNode): void {
    this.isOpen.set(node.id, false);
  }
}

export class BrowserTreeController {
  private dc: DataCenter;
  private editor: EditorComponent;
  private view: BrowserTreeView;

  public constructor(dc: DataCenter, editor: EditorComponent, practiceController: PracticeController) {
    this.dc = dc;
    this.editor = editor;
    this.view = new BrowserTreeView(dc, editor);

    // event listner 등록
    document.getElementById('bt-create-folder').onclick = () => {
      let name = prompt('폴더 이름을 입력하세요.', '');
      
      // null과 (잘라냈을 때) ''를 거른다.
      if (!name)
        return;
      name = name.trim();
      name = this.trimSentinel(name);
      if (!name)
        return;

      const node = this.dc.createFolder(name);
      this.view.open(node);
      this.view.update();
      this.dc.save();
    };

    document.getElementById('bt-create-note').onclick = () => {
      let name = prompt('필기 이름을 입력하세요.', '');
      
      // null과 (잘라냈을 때) ''를 거른다.
      if (!name)
        return;
      name = name.trim();
      name = this.trimSentinel(name);
      if (!name)
        return;

      const node = this.dc.createNote(name);
      this.editor.open(node);
      this.view.open(node);
      this.view.update();
      this.dc.save();
    };

    document.getElementById('bt-problem-solving').onclick = () => {
      practiceController.createMocktest();
    };

    document.getElementById('bt-delete-current').onclick = () => {
      this.dc.delete(this.dc.getCurrentNode().id);
      this.view.update();
      this.dc.save();
    };

    // 저장 버튼
    // 이게 뜬금없이 왜 여기 있냐면....
    // dc와 editor에서 save를 한 뒤, BrowserTreeView를 업데이트 시켜야하기 때문이다.
    // 이러한 의존성 때문에 여기에 배치되었다.
    document.getElementById('bt-save').onclick = () => {
      this.editor.save();
      this.dc.save();
      this.view.update();
    };
  }

  // #으로 시작하거나 -로 시작하는 문자열을 파서 에러가 나지 않게
  // 해당 문자가 포함되면 null을 반환한다.
  // editor.js의 trimSentinel과 비슷한 함수이지만 동작하는게
  // 완전히 다르므로 주의바람.
  private trimSentinel(s: string): string {
    s = s.trimLeft();
    if (s.charAt(0) === '#' || s.charAt(0) === '-') {
      alert('제목은 #나 -로 시작할 수 없습니다.');
      return null;
    }
    return s;
  }

  public onBooting(): void {
    this.view.init();
    this.view.update();
  }
}