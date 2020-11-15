import Info from './info';
import Traveler from './traveler';
import Util from './util';
import Hangul from './hangul';

class Quest {
  /*
    type, title, statement, choices, answers, materials
		type은 {'binary', 'selection', 'short'} 중 하나일 것
	*/
  constructor(obj) {
    console.assert(obj);

    this.type = obj.type ? obj.type : 'undefined';
    this.title = obj.title ? obj.title : '';
    this.statement = obj.statement ? obj.statement : '';
    this.choices = obj.choices ? obj.choices : [];
    this.answers = obj.answers ? obj.answers : [];
    this.materials = obj.materials ? obj.materials : null;
  }
}

Quest.evaluate = function(quest, response) {
  return Quest.evaluator[quest.type](quest, response);
};

Quest.evaluator = {};

// 참/거짓 유형 문제 생성
// material이 루트인 경우, 부정명제를 가져올 수 없다.
// inv: boolean
//   참이면 정답이 'F'인 문제를, 거짓이면 정답이 'T'인 문제를 만든다.
Quest.generate_binary_quest = function(material, inv) {
  let ans;
  let fact;
  if (inv) {
    ans = 'F';
    fact = Hangul.appendBojosa(material.names[0]) + ' '
      + Traveler.selectNegativeAttrs(material, 1)[0].content;
  } else {
    ans = 'T';
    fact = Hangul.appendBojosa(material.names[0]) + ' '
      + Traveler.selectPositiveAttrs(material, 1)[0].content;
  }

  let name = Util.get_randomly(material.names);
  return new Quest({
    type: 'binary',
    title: '다음 문장의 참/거짓을 판별하시오.',
    statement: fact,
    choices: ['T', 'F'],
    answers: [ans],
    materials: [material],
  });
};

// 참거짓 채점기
// 답을 맞춰야 함
// Info g
Quest.evaluator['binary'] = function(quest, response) {
  if (response.length !== 1) return false;
  else return quest.answers[0] === response[0];
};

// n지선다 유형 문제 생성
// material은 반드시 root가 아니어야 한다. root면 무조건 에러난다.
// 문제 생성에 실패할 경우 에러가 발생한다.
//
// material의 속성의 수는 a (inv가 true이면 n - a)개 이상이어야 한다.
// material: 문제를 출제할 지식
// n: 선택지의 수
// a: 정답의 수
// inv: 옳은/옳지 않은
Quest.generate_selection_quest = function(material, n, a, inv) {
  // 옳은 것의 갯수
  let p = inv ? n - a : a;

  // 옳은 선택지
  let pos = Traveler.selectPositiveAttrs(material, p);

  // 옳지 않은 선택지
  let neg = Traveler.selectNegativeAttrs(material, n - p);

  // 선택지 만들기
  // 일단 정답부터 만들고, attr 개체를 string으로 변환한다.
  // 섞고, pos가 있는 위치들을 찾고, pos와 neg를 문장으로 변환.
  let choices = Util.shuffle(pos.concat(neg), false);
  let answers = null;
  if (inv)
    answers = neg.map((attr) => {
      return `${choices.indexOf(attr)}`;
    });
  else
    answers = pos.map((attr) => {
      return `${choices.indexOf(attr)}`;
    });
  let name = Util.get_randomly(material.names);
  choices = choices.map((attr) => {
    if (attr)
      return `${Hangul.appendBojosa(name)} ${attr.content}.`;
    else
      return '<명제를 불러오는데 실패하였습니다>';
  });

  // 표현
  let logic_label = inv ? '옳지 않은 것' : '옳은 것';
  return new Quest({
    type: 'selection',
    title: `다음 중 ${name}에 대한 설명으로 ${logic_label}을 고르시오.`,
    statement: null,
    choices,
    answers,
    materials: [material]
  });
};

// n지선다 채점기
// 답을 모두 맞춰야 함
Quest.evaluator['selection'] = function(quest, response) {
  if (quest.answers.length !== response.length) return false;
  quest.answers.sort();
  response.sort();
  for (let i = 0; i < response.length; ++i)
    if (quest.answers[i] !== response[i]) return false;
  return true;
};

// 단답식 유형 문제 생성
Quest.generate_short_quest = function(material, n) {
  // 속성이 n개보다 적을 경우, n을 조절해줘서 util.js가
  // 뻑나지 않도록 한다.
  if (material.attrs.length < n) 
    n = material.attrs.length;
  let attrs = Traveler.selectPositiveAttrs(material, n);
  let title = '다음이 설명하는 것을 적으시오.';
  let stmt = '';
  let first = true;
  attrs.forEach((attr) => {
    stmt += (first ? '' : '\n') + '* ' + attr.content;
    first = false;
  });

  return new Quest({
    type: 'short', 
    title, 
    statement: stmt, 
    choices: [], 
    answers: material.names, 
    materials: [material]
  });
};

// 단답식 채점기
// 답 중 하나만 맞추면 됨
Quest.evaluator['short'] = function(quest, response) {
  if (response.length != 1) return false;
  for (let i = 0; i < quest.answers.length; ++i)
    if (quest.answers[i] == response[i]) return true;
  return false;
};

// n지선다 유형 II 문제 생성
// 속성을 주고 이름을 고르는 것
// material은 반드시 root가 아니어야 한다. root면 무조건 에러난다.
// 문제 생성에 실패할 경우 에러가 발생한다.
//
// 그래프에 n개 이상의 지식이 존재해야 한다.
//
// material: 문제를 출제할 지식
// n: 선택지의 수
Quest.generate_selection2_quest = function(material, n) {
  // 다른 지식의 이름을 가져올 범위를 찾는다.
  let g = material;

  // 정답 선택지 만들기
  let pos = material;

  let title = '다음이 설명하는 것으로 알맞은 것을 고르시오.';
  let stmt = '';
  let first = true;
  Util.get_randomly_multi(pos.attrs, Math.min(pos.attrs.length, 4)).forEach((attr) => {
    stmt += (first ? '' : '\n') + '* ' + attr.content;
    first = false;
  });

  // 오답 선택지 찾기
  let neg_infos = Traveler.selectNegativeInfos(material);

  // 선택지 합치기
  Util.shuffle(neg_infos, false);
  neg_infos = neg_infos.slice(0, n - 1);
  neg_infos.push(pos);
  Util.shuffle(neg_infos, false);
  let answers = [`${neg_infos.indexOf(material)}`];
  let choices = neg_infos.map((info) => {
    return Util.get_randomly(info.names);
  });

  // 표현
  return new Quest({
    type: 'selection', 
    title, 
    statement: stmt, 
    choices, 
    answers, 
    materials: [material]
  });
};

// T/F 문제의 n지선다형
// 다음 중 ~에 관한 설명으로 옳은 것/옳지 않은 것을 고르시오.
// 
// material의 서브트리에서 소재들을 선택하여 각각의 선택지로
// 출제한다.
//
// material: 문제 출제 대상 지식
// n: 선택지 수
// a: 정답 수
// inv: 옳은 것을 고르시오 => false, 틀린 것을 고르시오 => true
Quest.generate_selection3_quest = function(material, n, a, inv) {
  // 옳은 것의 갯수
  let p = inv ? n - a : a;

  // root
  let root = material;
  while (root.parent)
    root = root.parent;

  // 올바른 명제를 만들 서브 마테리얼 선정
  let submaterials = [];
  Traveler.forEachPre(material, (submaterial => {
    if (submaterial.attrs.length > 0)
      submaterials.push(submaterial);
  }));

  let posSubMat = Util.get_randomly_multi_dup(submaterials, p);
  let negSubMat = Util.get_randomly_multi_dup(submaterials.filter(submaterial => {
    return root != submaterial;
  }), n - p);

  let posStmt = posSubMat.map(pos => {
    let attr = Traveler.selectPositiveAttrs(pos, 1)[0];
    return `${Hangul.appendBojosa(pos.names[0])} ${attr.content}.`;
  });
  let negStmt = negSubMat.map(neg => {
    let attr = Traveler.selectNegativeAttrs(neg, 1)[0];
    return `${Hangul.appendBojosa(neg.names[0])} ${attr.content}.`;
  });

  // 선택지 만들기
  let choices = Util.shuffle(posStmt.concat(negStmt), true);
  let answers = null;
  if (inv)
    answers = negStmt.map((stmt) => {
      return `${choices.indexOf(stmt)}`;
    });
  else
    answers = posStmt.map((stmt) => {
      return `${choices.indexOf(stmt)}`;
    });

  // 표현
  let logic_label = inv ? '옳지 않은 것' : '옳은 것';
  return new Quest({
    type: 'selection',
    title: `다음 중 ${material.names[0]}에 대한 설명으로 ${logic_label}을 고르시오.`,
    statement: null,
    choices,
    answers,
    materials: [material].concat(posSubMat).concat(negSubMat)
  });
};

export default Quest;
