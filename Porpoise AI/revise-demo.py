from pathlib import Path
import re,html,hashlib
p=Path('index.html');s=p.read_text(encoding='utf-8'); before={f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in Path('stances').glob('*.yaml')}
responses=[('Archivist','Which spreadsheet was submitted, and which one was intended? Those details will matter if we document what happened.'),('Challenger','Where could this cause trouble downstream? Who might rely on the submitted file before the mistake is caught?'),('Confidante','Oh no. Tell me about the moment you realized it was the wrong one. What happened next?'),('Explorer','What made that spreadsheet seem like the right one at the time? I wonder what that reveals about how you recognize something as ready to send.'),('Panic Room','Damn. I’m here. If you want to talk about what happened, I’ll listen.')]
cards='\n'.join(f'<article class="lens-card"><div class="lens-head"><h3 class="lens-name">{name}</h3><span class="lens-icon" aria-hidden="true">{name[0]}</span></div><div class="convo"><div class="msg msg-stance"><span class="speaker">{name}</span><p>{html.escape(response)}</p></div></div></article>' for name,response in responses)
demo='''<section class="demo" id="demo"><div class="wrap">
<div class="section-head"><span class="eyebrow">In conversation</span><h2>One situation, different approaches.</h2><p>The following are illustrative responses that simulate how each stance might approach the same situation.</p></div>
<div class="prompt-box"><span class="tag">SITUATION</span><span class="text">I accidentally submitted the wrong spreadsheet at work.</span></div>
<div class="lens-grid">'''+cards+'''</div>
<article class="drafter-demo" aria-labelledby="drafter-demo-title">
<div class="lens-head"><h3 id="drafter-demo-title" class="lens-name">The Drafter: a conversation in steps</h3><span class="lens-icon" aria-hidden="true">D</span></div>
<p class="drafter-intro">The Drafter needs a writing assignment and context before it can begin. This separate illustration shows its mandatory intake and how a drafting cycle unfolds. Each step happens in its own assistant response, advanced by you.</p>
<div class="drafter-intake"><h4>Step 0A · Initial Context</h4><p>You attach the YAML and ask the assistant to adopt The Drafter.</p><div class="msg msg-stance"><span class="speaker">The Drafter</span><p>I’ve adopted The Drafter. Send me your drafting request, audience, source material, and any constraints.<br><br>Status: Step 0A — Initial Context. Send me the initial context for this drafting cycle.</p></div><p>You then supply the writing context—for example, a request for a short correction email, with the recipient and the facts it should include.</p></div>
<ol class="drafter-steps">
<li><h4>1 · Draft</h4><p>Produces the complete initial email using the context you supplied. It stops after drafting.</p><span class="step-advance">You ask it to continue to Read.</span></li>
<li><h4>2 · Read</h4><p>Rereads the entire email and reports recurring sentence shapes, rhetorical moves, and explanatory habits. It doesn't revise yet.</p><span class="step-advance">You ask it to continue to Resist.</span></li>
<li><h4>3 · Resist</h4><p>Evaluates which recurring patterns serve the writing and which warrant revision. Repetition isn't automatically a problem; useful constructions can stay.</p><span class="step-advance">You ask it to continue to Redraft.</span></li>
<li><h4>4 · Redraft</h4><p>Identifies the changes worth making and why, then produces the complete revised email. It preserves your meaning and voice. If a genuinely blocking ambiguity remains, it asks the minimum necessary question and stops instead.</p><span class="step-advance">A successful redraft completes the cycle at Iteration 0.</span></li>
</ol>
<p class="drafter-ending">Every response ends with the specification’s required status footer. After Redraft, a generic “continue” doesn't start more work. A specific revision request begins a new iteration at Read, followed by Resist and Redraft.</p>
</article>
</div></section>
'''
s=re.sub(r'<section class="demo" id="demo">.*?</section>',lambda m:demo,s,flags=re.S)
css='''
  .drafter-demo { margin-top: 40px; padding: 28px 26px; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius-lg); }
  .drafter-intro, .drafter-ending { color: var(--ink-soft); max-width: 780px; font-size: 15px; }
  .drafter-intake { margin: 26px 0; padding: 24px; border-radius: var(--radius-md); background: var(--bg-deep); }
  .drafter-demo h4 { font-family: var(--font-display); font-size: 17px; margin-bottom: 10px; }
  .drafter-intake > p { color: var(--ink-soft); font-size: 14px; margin: 12px 0; }
  .drafter-intake .msg { max-width: 100%; }
  .drafter-steps { list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin: 26px 0; }
  .drafter-steps li { padding-top: 20px; border-top: 1px solid var(--line); }
  .drafter-steps p { font-size: 14.5px; color: var(--ink-soft); }
  .step-advance { display: block; margin-top: 12px; font-size: 13px; color: var(--deep-water); }
  @media (max-width: 780px) { .drafter-steps { grid-template-columns: 1fr; } .drafter-demo { padding: 24px 20px; } .drafter-intake { padding: 18px; } }
'''
s=s.replace('</style>',css+'</style>');p.write_text(s,encoding='utf-8')
comparison=demo.split('<article class="drafter-demo"')[0]
assert comparison.count('<article class="lens-card">')==5
assert 'The Drafter' not in comparison
assert not any(x in demo for x in ['With added context','Illustrative response','With a proposed plan'])
assert s.count('data-stance=')==6 and s.count(' download=')==6
assert before=={f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in Path('stances').glob('*.yaml')}
print('Verified: five shared-input cards, separate Drafter intake and four steps, six library downloads preserved, YAML hashes unchanged.')
