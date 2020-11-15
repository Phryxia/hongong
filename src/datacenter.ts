import localforage from 'localforage';

export abstract class FileSystemNode {
  private _id: number;
  public name: string = '';
  public parent: FolderNode | null = null;

  static idcnt: number = 0;
  
  public constructor(name: string | any) {
    this._id = FileSystemNode.idcnt++;
    
    if (typeof(name) === 'string')
      this.name = name;
    else {
      // pure object로 주어진 경우.
      // parent-child 관계는 외부에서 잡아줘야 한다.
      this.name = name.name;
      this._id = name._id;
      FileSystemNode.idcnt = Math.max(FileSystemNode.idcnt, this._id + 1);
    }
  }

  public get id(): number {
    return this._id;
  }

  public abstract get isFolder(): boolean;
}

export class FolderNode extends FileSystemNode {
  private _children: FileSystemNode[] = [];

  public constructor(name: string | any) {
    super(name);
  }
  
  public get isFolder() {
    return true;
  }

  public get children(): FileSystemNode[] {
    return this._children;
  }

  appendChild(child: FileSystemNode): void {
    this._children.push(child);
    this._children.sort((a, b) => {
      if (a.isFolder === b.isFolder) {
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
        if (a.isFolder && !b.isFolder)
          return 1;
        else
          return -1;
      }
    });
    child.parent = this;
  }

  removeChild(child: FileSystemNode): void {
    this._children = this._children.filter((c) => {
      return c !== child;
    });
    child.parent = null;
  }
}

export class NoteNode extends FileSystemNode {
  public content: string;

  public constructor(name: string | any, content: string = '') {
    super(name);
    
    if (typeof(name) === 'string')
      this.content = content;
    else
      this.content = name.content;
  }

  public get isFolder() {
    return false;
  }
}

export class DataCenter {
  // note: root가 항상 0이 아닐 수도 있다. (재초기화 등으로)
  private fsnodes: Map <number, FileSystemNode> = new Map <number, FileSystemNode> ();
  private root: FolderNode;
  private currentNode: FileSystemNode;

  public constructor() {
    this.init();
  }

  public getRootFolder(): FolderNode {
    return this.root;
  }

  public getCurrentFolder(): FolderNode {
    if (this.currentNode.isFolder)
      return this.currentNode as FolderNode;
    else
      return this.currentNode.parent;
  }

  public setCurrentNode(id: number): void {
    if (this.fsnodes.has(id))
      this.currentNode = this.fsnodes.get(id);
    else
      console.warn('[DataCenter::setCurrentNode] Invalid id: ' + id);
  }

  public getCurrentNode(): FileSystemNode {
    return this.currentNode;
  }

  public createFolder(name: string): FolderNode {
    const node = new FolderNode(name);
    this.fsnodes.set(node.id, node);
    this.getCurrentFolder().appendChild(node);
    this.setCurrentNode(node.id);
    return node;
  }

  public createNote(name: string, content: string = ''): NoteNode {
    const node = new NoteNode(name, content);
    this.fsnodes.set(node.id, node);
    this.getCurrentFolder().appendChild(node);
    this.setCurrentNode(node.id);
    return node;
  }

  public delete(id: number): void {
    if (!this.fsnodes.has(id))
      return;
    
    const node = this.fsnodes.get(id);

    // 루트 삭제 방지
    if (!node.parent)
      return;

    // 하위에 폴더 또는 필기가 존재할 경우 물어보고 삭제
    if (node.isFolder && (node as FolderNode).children.length > 0
      && !confirm('하위 폴더 및 필기가 모두 삭제됩니다. 정말 삭제하시겠습니까?')) {
      return;
    }
    
    this.currentNode = node.parent;
    this.fsnodes.delete(id);
    node.parent.removeChild(node);
  }

  // 파일시스템을 완전히 초기화시킨다.
  public init(): void {
    this.fsnodes.clear();
    this.currentNode = this.root = new FolderNode('root');
    this.fsnodes.set(this.root.id, this.root);
  }

  public save(): void {
    localforage.setItem('filesystem', this.root)
    .catch((e) => {
      alert('저장 중 에러가 발생하였습니다.');
      console.log(e);
    });
  }

  public load(callback: () => void): void {
    this.init();
    localforage.getItem('filesystem')
    .then((val) => {
      if (val) {
        this.root = this.loadR(val) as FolderNode;
        this.setCurrentNode(this.root.id);
      }
      else
        console.warn('[Datacenter::load] val is \'\' or null');
      callback();
    })
    .catch((e) => {
      alert('불러오기 중 에러가 발생하였습니다.');
      console.log(e);
      this.init();
    });
  }

  // localforage에서 루트를 불러온 상황에서는
  // fsnode에는 등록이 안 돼 있으므로 등록해준다.
  // 또한 Pure Javascript Object화 돼 있기 때문에
  // 원래대로 복원을 해야한다.
  private loadR(obj: any): FileSystemNode {
    let node = null;
    if (obj.hasOwnProperty('_children')) {
      // 폴더임
      node = new FolderNode(obj);

      for (const chobj of obj._children) {
        node.appendChild(this.loadR(chobj));
      }
    } 
    else if (obj.hasOwnProperty('content')) {
      // 필기임... 적어도 아직은.
      node = new NoteNode(obj);
    }
    else {
      console.log(obj);
      throw new Error('[Datacenter::loadR] Invalid object structure detected!');
    }

    // fsnode에 등록도 해줘야 한다.
    this.fsnodes.set(node.id, node);
    
    return node;
  }
}