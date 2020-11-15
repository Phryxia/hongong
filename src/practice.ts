import Parser from './hongong/parser';
import Mocktest from './hongong/mocktest';
import Quest from './hongong/quest';
import { EditorComponent } from './editor';

class PracticeView {
  private dom: HTMLElement = document.getElementById('practice');
  private _mocktest: Mocktest;

  public constructor() {

  }

  public activate(): void {
    document.getElementById('practice-window').style.display = 'block';
  }

  public deactivate(): void {
    document.getElementById('practice-window').style.display = 'none';
  }

  public set mocktest(_mocktest: Mocktest) {
    this._mocktest = _mocktest;
    this.update();
  }

  public update(): void {
    if (!this._mocktest)
      return;

    while (this.dom.firstChild)
      this.dom.removeChild(this.dom.firstChild);
    
    let count = 1;
    for (const quest of this._mocktest.quests) {
      this.dom.append(this.renderQuest(quest, count++));
    }
  }

  private renderQuest(quest: Quest, qid: number): HTMLElement {
    switch (quest.type) {
      case 'binary': return this.renderBinaryQuest(quest, qid);
      case 'selection': return this.renderSelectionQuest(quest, qid);
      case 'short': return this.renderShortQuest(quest, qid);
    }
  }

  private renderBinaryQuest(quest: Quest, qid: number): HTMLElement {
    const root = document.createElement('div');
    
    // 제목
    root.appendChild(this.renderTitle(qid, quest.title));

    // 지문
    root.appendChild(this.renderStatement(quest.statement));

    // 참 거짓 선택지
    const choices = document.createElement('div');
    
    choices.appendChild(this.renderRadio(qid, 0, 'T'));
    choices.appendChild(this.renderLabel(qid, 0, 'T'));
    choices.appendChild(document.createElement('br'));

    choices.appendChild(this.renderRadio(qid, 1, 'F'));
    choices.appendChild(this.renderLabel(qid, 1, 'F'));
    choices.appendChild(document.createElement('br'));

    root.appendChild(choices);

    // 정답유무 창
    root.appendChild(this.renderAnswer(qid));

    return root;
  }

  private renderSelectionQuest(quest: Quest, qid: number): HTMLElement {
    const root = document.createElement('div');
    
    // 제목
    root.appendChild(this.renderTitle(qid, quest.title));

    // 지문
    if (quest.statement)
      root.appendChild(this.renderStatement(quest.statement));

    // 사지선답
    const choices = document.createElement('div');
    
    for (let i = 0; i < 4; ++i) {
      if (!quest.choices[i])
        continue;
      choices.appendChild(this.renderRadio(qid, i, String(i)));
      choices.appendChild(this.renderLabel(qid, i, quest.choices[i]));
      choices.appendChild(document.createElement('br'));
    }

    root.appendChild(choices);

    // 정답유무 창
    root.appendChild(this.renderAnswer(qid));

    return root;
  }

  private renderShortQuest(quest: Quest, qid: number): HTMLElement {
    const root = document.createElement('div');
    
    // 제목
    root.appendChild(this.renderTitle(qid, quest.title));

    // 지문
    root.appendChild(this.renderStatement(quest.statement));

    // 답 적는 곳
    const blank = document.createElement('input');
    blank.type = 'text';
    blank.id = `qudst-${qid}-blank`;
    root.appendChild(blank);

    // 정답유무 창
    root.appendChild(this.renderAnswer(qid));

    return root;
  }

  private renderTitle(qid: number, title: string) {
    const out = document.createElement('b');
    out.innerText = qid + '. ' + title;
    return out;
  }

  private renderStatement(statement: string) {
    const out = document.createElement('p');
    out.innerText = statement;
    return out;
  }

  private renderRadio(qid: number, cid: number, value: string) {
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = `quest-${qid}`;
    radio.id = `quest-${qid}-${cid}`;
    radio.value = value;
    return radio;
  }

  private renderLabel(qid: number, cid: number, value: string) {
    const label = document.createElement('label');
    label.innerText = value;
    label.htmlFor = `quest-${qid}-${cid}`;
    return label;
  }

  private renderAnswer(qid: number) {
    const out = document.createElement('div');
    out.id = `quest-${qid}-answer`;
    return out;
  }
}

export class PracticeController {
  private view: PracticeView = new PracticeView();
  private editor: EditorComponent;

  public constructor(editorComponent: EditorComponent) {
    this.editor = editorComponent;
    this.view.deactivate();
  }

  public createMocktest(): void {
    const markdown = this.editor.toMarkdown();
    if (!markdown)
      return;
    
    const infotree = Parser.parse(markdown);
    
    const mocktest = Mocktest.create_mocktest(infotree.roots[0], 16);

    this.view.mocktest = mocktest;
    this.view.activate();
  }
}