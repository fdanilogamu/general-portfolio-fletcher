from pathlib import Path
import re, html, hashlib
p=Path('index.html');s=p.read_text(encoding='utf-8');old=s
hashes={f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in Path('stances').glob('*.yaml')}
draft="""When a team makes a decision, it usually feels obvious to everyone in the room. The trouble is that the reasoning doesn't always leave the room with the decision. A few weeks later, people remember what we decided, but not why, what else we considered, or what was true at the time that made it the right call.

That gap causes real problems. A new teammate wonders why a process works the way it does. Someone revisiting an old choice assumes we missed an obvious alternative. People spend hours piecing together conversations that already happened, and sometimes we end up making the same decision twice because nobody can find the original reasoning.

The fix doesn't have to be heavy. We're not asking anyone to record every conversation or write up every meeting. A short note is usually enough: what we decided, why we decided it, and any constraints that shaped it. Write it while the context is still fresh, and put it somewhere people will actually look when they need it."""
redraft="""When a team makes a decision, it makes perfect sense to everyone in the room. A few weeks later, people remember what we decided, but the reasoning has often gone missing: why we chose it, which alternatives we weighed, and what was true at the time.

You can see the cost in small moments. A new teammate wonders why a process works the way it does, and nobody quite knows. Someone revisiting an old choice assumes we overlooked an obvious alternative. Others spend hours piecing together old conversations. Sometimes we make the same decision a second time because nobody can find the original reasoning.

None of this calls for recording every meeting or writing a formal report. A few sentences are enough: what we decided, why, and any constraints that shaped it. Write them while the context is fresh, and put them where the work lives, like the ticket or project doc, so people find them when they need them."""
def article(text,id):return '<div class="test-article" id="'+id+'">'+''.join('<p>'+html.escape(x)+'</p>' for x in text.split('\n\n'))+'</div>'
new='''<article class="drafter-demo" aria-labelledby="drafter-demo-title">
<div class="lens-head"><h3 id="drafter-demo-title" class="lens-name">The Drafter: a conversation in steps</h3><span class="lens-icon" aria-hidden="true">D</span></div>
<p class="drafter-intro">The Drafter needs a writing assignment and context before it can begin. It produces a complete draft, reads the entire piece for recurring patterns, evaluates which patterns warrant revision, then produces a complete revised draft. Each step takes a separate assistant response, advanced by the user.</p>
<div class="drafter-intake"><h4>Step 0A · Initial Context</h4><p>After adoption, the assistant confirms the stance and asks for the drafting request, source material, constraints, or destination. This mandatory intake response contains no draft or analysis. The user supplies the context before Step 1 begins.</p></div>
<div class="drafter-test">
<h4>A real example: documenting workplace decisions</h4>
<p class="drafter-intro">This example comes from an actual Claude conversation using The Drafter v1.5. The five stance responses above are illustrative simulations. Here, the initial and revised articles are reproduced exactly from the supplied test transcript; Read and Resist are summarized.</p>
<p class="test-context"><strong>Context:</strong> The user requested a short internal article explaining why teams should document the reasoning behind decisions while the context is fresh. The audience was coworkers in a growing company, with a conversational, practical, respectful tone, around 150–200 words, and no headings or bullet points.</p>
<p class="test-sequence">Draft → Read → Resist → Redraft</p>
<p class="drafter-intro">The stages were separate assistant responses as the user advanced the workflow. They weren't performed automatically in one response.</p>
<details class="test-stage"><summary>Step 1: Draft <span>Read the complete initial article</span></summary>
'''+article(draft,'claude-initial-article')+'''
</details>
<details class="test-stage"><summary>Step 2: Read <span>Patterns identified across the whole draft</span></summary>
<div class="test-findings"><p>Claude reread the entire draft and identified these recurring patterns without revising it:</p><ul>
<li><strong>Paragraph openers:</strong> the paragraphs announce problem, consequence, and fix before developing them.</li>
<li><strong>Contrast constructions:</strong> remembering what was decided but not why, and naming the heavy documentation approach before offering a short note.</li>
<li><strong>Three-part lists:</strong> the missing reasoning in the opening echoes the decision, reason, and constraints in the closing. The middle paragraph's examples also repeat a subject-plus-verb-plus-clause shape.</li>
<li><strong>Trailing clauses:</strong> endings such as “that made it the right call” and “that already happened” extend already complete ideas.</li>
<li><strong>Vocabulary repetition:</strong> forms of “decide” appear six times; “reasoning” and “room” each appear twice.</li>
<li><strong>Other patterns:</strong> four qualifiers, paragraphs building toward their longest sentence at the end, and generic labels such as “real problems” and “heavy.”</li>
</ul></div></details>
<details class="test-stage"><summary>Step 3: Resist <span>What deserved to change, and what deserved to stay</span></summary>
<div class="test-findings"><p>Claude distinguished repetition that contributed meaning from repetition that mainly supplied rhythm or rhetorical closure.</p><p>It preserved the central contrast between <strong>what was decided and why</strong>. It also preserved the practical distinction between <strong>documenting every meeting and keeping a short decision note</strong>. The decision, reason, and constraints list reflected the source's actual content, and the problem-consequence-fix order helped a reader follow a short internal article.</p><p>It marked the generic paragraph openers, echoing lists, repeated example shapes, and some uses of “decide” as candidates for change. “That made it the right call” and “that already happened” mostly restated established meaning. “Because nobody can find the original reasoning” earned its place by explaining why a decision might be made twice.</p><p>It kept the qualifying “sometimes” where accuracy required it. The claim that a short note can be enough remained as supplied; possible disagreement didn't require the user to defend the premise before redrafting.</p></div></details>
<details class="test-stage"><summary>Step 4: Redraft <span>Read the complete revised article</span></summary>
'''+article(redraft,'claude-revised-article')+'''
</details>
</div>
<p class="drafter-ending">Every workflow response ends with the specification’s required status footer. A successful Redraft completes the cycle at Iteration 0. Afterward, a generic “continue” doesn't start more work. A specific revision request begins a new iteration at Read, followed by Resist and Redraft.</p>
</article>'''
s=re.sub(r'<article class="drafter-demo".*?</article>',lambda m:new,s,flags=re.S)
css='''
  .drafter-test { margin: 26px 0; }
  .test-context { margin: 18px 0; color: var(--ink-soft); font-size: 14.5px; }
  .test-sequence { font-family: var(--font-mono); color: var(--deep-water); font-size: 14px; margin: 18px 0 10px; }
  .test-stage { margin-top: 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden; }
  .test-stage summary { cursor: pointer; padding: 16px 20px; font-family: var(--font-display); font-weight: 600; background: var(--bg-deep); }
  .test-stage summary span { display: block; margin: 4px 0 0 18px; font-family: var(--font-body); font-size: 13px; font-weight: 400; color: var(--ink-soft); }
  .test-stage summary:focus-visible { outline: 2px solid var(--mid-water); outline-offset: -3px; }
  .test-article, .test-findings { padding: 22px; max-width: 760px; font-size: 15px; line-height: 1.7; }
  .test-article p + p, .test-findings p + p { margin-top: 16px; }
  .test-findings { color: var(--ink-soft); }
  .test-findings ul { padding-left: 22px; margin-top: 12px; }
  .test-findings li + li { margin-top: 10px; }
  @media (max-width: 600px) { .test-stage summary { padding: 14px 16px; } .test-article, .test-findings { padding: 18px 16px; } }
'''
s=s.replace('</style>',css+'</style>');p.write_text(s,encoding='utf-8')
from html.parser import HTMLParser
class Extract(HTMLParser):
 def __init__(self):super().__init__();self.active=None;self.articles={}
 def handle_starttag(self,t,a):
  d=dict(a)
  if d.get('id') in ('claude-initial-article','claude-revised-article'):self.active=d['id'];self.articles[self.active]=[]
  if t=='p' and self.active:self.articles[self.active].append('')
 def handle_data(self,d):
  if self.active and self.articles[self.active]:self.articles[self.active][-1]+=d
 def handle_endtag(self,t):
  if t=='div':self.active=None
x=Extract();x.feed(s)
assert '\n\n'.join(x.articles['claude-initial-article'])==draft
assert '\n\n'.join(x.articles['claude-revised-article'])==redraft
assert old.split('<section class="featured"')[1]==s.split('<section class="featured"')[1]
assert hashes=={f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in Path('stances').glob('*.yaml')}
assert '—' not in s
print('PASS: both article texts preserved exactly, library and following sections unchanged, all YAML hashes unchanged, no em dashes.')
