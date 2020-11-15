import { DataCenter, FileSystemNode, FolderNode, NoteNode } from "./datacenter";
import { EditorComponent } from "./editor";
import { PracticeController } from "./practice";

/*
class BrowserTreeNode {
  public name: string;
  public type: string; // folder  or note
  public parent: BrowserTreeNode | null;
  public child: BrowserTreeNode[];
  public id: number; // 웹 브라우저 구동후 고유값

  public constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
    this.parent = null;
    this.child = [];
  }

  public static connect(np: BrowserTreeNode, nc: BrowserTreeNode): void {
    np.child.push(nc);
    np.child.sort((a, b) => {
      if (a.type === b.type) {
        if (a.name >= b.name)
          return 1;
        else if (a.name === b.name)
          return 0;
        else
          return -1;
      }
      else
      {
        // 폴더가 먼저 오도록
        if (a.type >= b.type)
          return 1;
        else
          return -1;
      }
    });
    nc.parent = np;
  }
}

class BrowserTreeModel {

  private root: BrowserTreeNode;
  private current: BrowserTreeNode;
  private nodes: Map <number, BrowserTreeNode>;

  private static idcnt: number = 0;

  public constructor() {
    this.nodes = new Map <number, BrowserTreeNode> ();
    this.current = this.root = this.createNode('root', 'folder');
  }

  // 루트 노드를 반환한다.
  public getRootNode(): BrowserTreeNode {
    return this.root;
  }

  // 현재 포인터가 가리키고 있는 노드를 id값을 갖는 노드로 지정한다
  public setCurrentNode(id: number): void {
    if (this.nodes.has(id))
      this.current = this.nodes.get(id);
  }

  // 현재 포인터가 가리키고 있는 노드를 반환한다.
  public getCurrentNode(): BrowserTreeNode {
    return this.current;
  }

  // 현재 포인터가 가리키고 있는 노드의 자식에 새 폴더를 만든다.
  public createFolder(name: string): void {
    this.setCurrentAsNearestFolder();

    const node = this.createNode(name, 'folder');
    BrowserTreeNode.connect(this.current, node);
  }

  // 현재 포인터가 가리키고 있는 노드의 자식에 새 필기를 만든다.
  public createNote(name: string): void {
    this.setCurrentAsNearestFolder();

    const node = this.createNode(name, 'note');
    BrowserTreeNode.connect(this.current, node);
  }

  private createNode(name: string, type: string): BrowserTreeNode {
    const node = new BrowserTreeNode(name, type);
    node.id = BrowserTreeModel.idcnt++;
    this.nodes.set(node.id, node);
    return node;
  }

  // 현재 필기에서 가장 가까운 조상 폴더를 찾아서 이동한다.
  private setCurrentAsNearestFolder(): void {
    while (this.current.type !== 'folder')
      this.current = this.current.parent;
  }

  // 현재 포인터가 가리키고 있는 노드와 그 자식을 삭제한다.
  public deleteCurrent(): void {
    // 루트는 지우면 안된다.
    if (this.current === this.root)
      return;

    this.current.parent.child = this.current.parent.child.filter(c => {
      return c !== this.current;
    });
    this.current = this.current.parent;
  }

  // 트리를 [[정점1, 정점2, ...], [[정점i, 정점j], [정점u, 정점v] ...]]로 직렬화한다.
  public serialize(): any[][] {
    let out: any[][] = [[], []];
    this.serializeR(this.root, out);
    console.log(out);
    return out;
  }
  
  private serializeR(node: BrowserTreeNode, out: any[][]): number {
    out[0].push(node);

    const indexOfNode = out[0].length - 1;
    for (const child of node.child) {
      const indexOfChild = this.serializeR(child, out);
      out[1].push([indexOfNode, indexOfChild]);
    }
    
    return indexOfNode;
  }

  // serialize로 만든 직렬화 배열을 적용시킨다.
  // 이 함수를 적용하는 시점은 반드시 트리에 루트가 하나밖에 없을 때이다.
  public deserialize(serial: any[][]): void {
    const nodes: BrowserTreeNode[] = [this.root];
    
    // 루트는 항상 만들어져있으므로 생략
    for (let i = 1; i < serial[0].length; ++i) {
      const nodeinfo = serial[0][i];
      const node = this.createNode(nodeinfo.name, nodeinfo.type);
      node.id = nodeinfo.id;
      BrowserTreeModel.idcnt = Math.max(BrowserTreeModel.idcnt, node.id + 1);
      nodes.push(node);
    }

    // 생성한 정점끼리를 이어준다.
    for (let j = 0; j < serial[1].length; ++j) {
      const u = serial[1][j][0];
      const v = serial[1][j][1];
      BrowserTreeNode.connect(nodes[u], nodes[v]);
    }
  }
}
*/
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

  public onBooting(): void {
    this.view.init();
    this.view.update();
  }
}