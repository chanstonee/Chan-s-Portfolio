import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Exercise the actual static-host adapter without opening a mail app or sending
// a message. Browser checks cover the live form's native required validation.
const source=await readFile(new URL('../src/self-host.js',import.meta.url),'utf8');
const listeners={};
class Element {
  constructor(tag='P'){this.tagName=tag;this.dataset={};this.style={};this.children=[];}
  setAttribute(){}
  append(node){this.children.push(node);}
  replaceChildren(...nodes){this.children=nodes;}
  querySelectorAll(){return [];}
}
class Form extends Element {
  constructor(valid){super('FORM');this.valid=valid;this.inputs=[{tagName:'INPUT',type:'text',value:'찬 & Co.'},{tagName:'INPUT',type:'email',value:'hello+test@example.com'},{tagName:'TEXTAREA',value:'프로젝트\nhttps://example.com/?a=1&b=2'}];}
  reportValidity(){return this.valid;}
  querySelectorAll(){return this.inputs;}
  querySelector(){return this.children.find(n=>'contactStatus' in n.dataset);}
}
const window={CHANSTONE_CONFIG:{email:'chan_stone@naver.com'},location:{href:''}};
const document={addEventListener:(name,fn)=>listeners[name]=fn,createElement:tag=>new Element(tag),createTextNode:text=>({text})};
vm.runInNewContext(source,{window,document,Element,HTMLFormElement:Form,MutationObserver:class{observe(){}},encodeURIComponent});
let prevented=false,stopped=false;
const event=form=>({target:form,preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});
listeners.submit(event(new Form(false)));
assert.equal(window.location.href,'');
assert(prevented&&stopped);
const form=new Form(true);
listeners.submit(event(form));
const draft=new URL(window.location.href);
assert.equal(draft.protocol,'mailto:');assert.equal(draft.pathname,'chan_stone@naver.com');
assert.equal(draft.searchParams.get('subject'),'[Portfolio] 찬 & Co.');
assert.equal(draft.searchParams.get('body'),'Name / Company: 찬 & Co.\nEmail: hello+test@example.com\n\n프로젝트\nhttps://example.com/?a=1&b=2');
assert.match(form.children[0].children[0].text,/자동으로 전송되지는 않습니다/);
listeners.submit(event(form));assert.equal(form.children.length,1);
console.log('PASS: invalid form blocked; Korean, special characters and multiline text encoded; mail draft and truthful status; no messages sent');
